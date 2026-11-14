<?php

namespace App\Domains\Catalog\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class ProductUrlExtractorService
{
    /**
     * Extract product name, description, unit price, code (SKU), and image from a product URL
     * OR a direct product image URL (e.g. cdn.salla.sa/*.jpg) using HTML/DOM/JSON-LD + Gemini Vision.
     *
     * @return array{
     *   name: string,
     *   description: string,
     *   unit_price: string,
     *   code: string,
     *   code_source: 'extracted'|'generated',
     *   image: string,
     *   source_url: string,
     *   ai_enhanced: bool,
     *   gemini_configured: bool
     * }
     */
    public function extract(string $rawInput): array
    {
        $url = $this->normalizeInputUrl($rawInput);
        $this->assertSafePublicUrl($url);

        $slugHints = $this->extractHintsFromUrl($url);
        $geminiConfigured = $this->getGeminiKey() !== '';
        $fetched = $this->fetchResource($url);

        // Case 1: The URL itself is a direct image (e.g. https://cdn.salla.sa/.../xxx.jpg)
        if ($fetched['is_image'] || $this->looksLikeImageUrl($url)) {
            if ($fetched['body'] === '' && $slugHints['name'] === '' && ! $geminiConfigured) {
                throw new RuntimeException('تعذر تحميل الصورة من الرابط، ومفتاح الذكاء الاصطناعي (GEMINI_API_KEY) غير مفعّل على الخادم.');
            }

            $parsed = [
                'name' => $slugHints['name'],
                'description' => '',
                'unit_price' => '',
                'code' => $slugHints['code'],
                'image' => $url,
            ];

            $preparedImage = $this->prepareImageForGemini($fetched['body'], $fetched['mime_type'] ?: 'image/jpeg');

            $aiResult = $this->analyzeWithGemini(
                parsed: $parsed,
                visibleText: '',
                decodedUrl: $slugHints['decoded_url'],
                imageBytes: $preparedImage['bytes'],
                imageMime: $preparedImage['mime']
            );

            $aiEnhanced = $aiResult !== null;
            if ($aiResult !== null) {
                foreach (['name', 'description', 'unit_price', 'code'] as $field) {
                    $val = isset($aiResult[$field]) && is_scalar($aiResult[$field]) ? trim((string) $aiResult[$field]) : '';
                    if ($val !== '') {
                        $parsed[$field] = $val;
                    }
                }
            } elseif ($parsed['name'] === '' || $this->isLikelyRandomFilename($parsed['name'])) {
                throw new RuntimeException(
                    $geminiConfigured
                        ? 'تعذر تحليل صورة المنتج بالذكاء الاصطناعي من هذا الرابط، تأكد من أن الرابط مباشر لصورة صالحة أو أعد المحاولة.'
                        : 'رابط الصورة لا يحتوي على اسم نصي، ومفتاح الذكاء الاصطناعي (GEMINI_API_KEY) غير مضاف في إعدادات الخادم لقراءة الصورة.'
                );
            }

            return $this->buildFinalPayload($parsed, $url, $slugHints['decoded_url'], $aiEnhanced, $geminiConfigured);
        }

        // Case 2: Standard product webpage URL
        $html = $fetched['body'];
        $parsed = $html !== '' ? $this->parseHtmlMetadata($html, $url) : [
            'name' => '',
            'description' => '',
            'unit_price' => '',
            'code' => '',
            'image' => '',
        ];

        // Clean store name suffixes from title if present (e.g. "Product Name | Store Name")
        if ($parsed['name'] !== '') {
            $parsed['name'] = $this->cleanTitleFromStoreSuffix($parsed['name']);
        }

        if ($parsed['name'] === '' && $slugHints['name'] !== '') {
            $parsed['name'] = $slugHints['name'];
        }
        if ($parsed['code'] === '' && $slugHints['code'] !== '') {
            $parsed['code'] = $slugHints['code'];
        }

        $visibleText = $html !== '' ? $this->extractVisibleText($html) : '';

        // Download product image for Gemini Vision whenever name, description, or page text is sparse/missing
        $imageBytes = '';
        $imageMime = 'image/jpeg';
        if (
            $parsed['image'] !== ''
            && (
                $parsed['name'] === ''
                || $parsed['description'] === ''
                || mb_strlen($parsed['description']) < 30
                || $visibleText === ''
            )
        ) {
            $imgFetch = $this->fetchResource($parsed['image'], preferImage: true);
            if ($imgFetch['is_image'] && $imgFetch['body'] !== '') {
                $prepared = $this->prepareImageForGemini($imgFetch['body'], $imgFetch['mime_type'] ?: 'image/jpeg');
                $imageBytes = $prepared['bytes'];
                $imageMime = $prepared['mime'];
            }
        }

        $aiResult = $this->analyzeWithGemini(
            parsed: $parsed,
            visibleText: $visibleText,
            decodedUrl: $slugHints['decoded_url'],
            imageBytes: $imageBytes,
            imageMime: $imageMime
        );
        $aiEnhanced = $aiResult !== null;

        if ($aiResult !== null) {
            foreach (['name', 'description', 'unit_price', 'code', 'image'] as $field) {
                $val = isset($aiResult[$field]) && is_scalar($aiResult[$field]) ? trim((string) $aiResult[$field]) : '';
                if ($val !== '') {
                    if ($field === 'image' && ! preg_match('/^https?:\/\//i', $val) && $parsed['image'] !== '') {
                        continue;
                    }
                    if (($field === 'name' || $field === 'description') && $this->isCloudflareOrPlaceholder($val)) {
                        continue;
                    }
                    $parsed[$field] = $val;
                }
            }
        }

        if (trim($parsed['name']) === '' || $this->isLikelyRandomFilename($parsed['name']) || $this->isCloudflareOrPlaceholder($parsed['name'])) {
            throw new RuntimeException(
                $html === ''
                    ? 'المتجر الخارجي حظر قراءة الصفحة تلقائياً، ولم يتوفر اسم واضح في الرابط.'
                    : 'تعذر استخراج اسم الصنف من هذه الصفحة. جرب نسخ رابط الصورة المباشر للصنف أو رابط صفحة منتج واضحة.'
            );
        }

        return $this->buildFinalPayload($parsed, $url, $slugHints['decoded_url'], $aiEnhanced, $geminiConfigured);
    }

    private function buildFinalPayload(
        array $parsed,
        string $url,
        string $decodedUrl,
        bool $aiEnhanced,
        bool $geminiConfigured
    ): array {
        $name = $this->cleanText((string) ($parsed['name'] ?? ''), 250);
        if ($this->isLikelyRandomFilename($name) || $this->isCloudflareOrPlaceholder($name)) {
            $name = '';
        }

        $description = $this->cleanText((string) ($parsed['description'] ?? ''), 1200);
        if ($this->isCloudflareOrPlaceholder($description)) {
            $description = '';
        }
        if ($description === '' && $name !== '') {
            $description = "صنف جملة معتمد بالحبة - {$name}";
        }

        $unitPrice = $this->normalizePrice($parsed['unit_price'] ?? null);
        $image = $this->normalizeImageUrl((string) ($parsed['image'] ?? ''), $url);

        [$code, $codeSource] = $this->resolveUniqueCode($parsed['code'] ?? null);

        return [
            'name' => $name,
            'description' => $description,
            'unit_price' => $unitPrice,
            'code' => $code,
            'code_source' => $codeSource,
            'image' => $image,
            'source_url' => $decodedUrl,
            'ai_enhanced' => $aiEnhanced,
            'gemini_configured' => $geminiConfigured,
        ];
    }

    /**
     * Generate a guaranteed unique product SKU code.
     */
    public function generateUniqueCode(string $prefix = 'PRD'): string
    {
        $cleanPrefix = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $prefix) ?: 'PRD');

        for ($i = 0; $i < 25; $i++) {
            $candidate = $cleanPrefix . '-' . random_int(1000, 99999);
            if (! $this->codeExistsInDb($candidate)) {
                return $candidate;
            }
        }

        return $cleanPrefix . '-' . strtoupper(Str::random(6));
    }

    private function getGeminiKey(): string
    {
        return trim((string) (config('services.gemini.key') ?: env('GEMINI_API_KEY', '')));
    }

    private function normalizeInputUrl(string $rawInput): string
    {
        $trimmed = trim($rawInput);
        if ($trimmed === '') {
            throw new RuntimeException('يرجى لصق رابط المنتج أو رابط صورته أولاً.');
        }

        if (preg_match('/https?:\/\/[^\s"\'<>]+/iu', $trimmed, $m)) {
            $trimmed = $m[0];
        } elseif (! preg_match('/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//', $trimmed)) {
            $trimmed = 'https://' . ltrim($trimmed, '/');
        }

        return preg_replace_callback('/[^\x21-\x7e]/u', fn (array $m) => rawurlencode($m[0]), $trimmed) ?? $trimmed;
    }

    private function looksLikeImageUrl(string $url): bool
    {
        $path = (string) parse_url($url, PHP_URL_PATH);
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));

        if (preg_match('/\.(?:jpe?g|png|webp|gif|avif|bmp)$/i', $path)) {
            return true;
        }

        return str_starts_with($host, 'cdn.salla.sa') || str_starts_with($host, 'media.zid.store');
    }

    private function isLikelyRandomFilename(string $text): bool
    {
        $trimmed = trim($text);
        if ($trimmed === '') {
            return true;
        }
        if (preg_match('/\.(?:jpe?g|png|webp|gif|avif|html?|php)$/i', $trimmed)) {
            return true;
        }
        // Single token >= 10 chars without spaces and mostly alphanumeric/random hash (e.g. UqDwu1rjdJJhHJyeg or img_123456)
        if (! str_contains($trimmed, ' ') && preg_match('/^[A-Za-z0-9_\-]{10,}$/', $trimmed) && preg_match('/\d/', $trimmed)) {
            return true;
        }
        // Storefront ID segments like p123456, c98765, dp, B08XYZ1234
        if (preg_match('/^(?:p|c|cat|prd|sku|item|id)[-_]?\d+$/i', $trimmed)) {
            return true;
        }

        return false;
    }

    private function isCloudflareOrPlaceholder(string $text): bool
    {
        $lower = mb_strtolower(trim($text));
        if ($lower === '') {
            return true;
        }

        $blockedPhrases = [
            'just a moment',
            'attention required',
            'checking your browser',
            'enable javascript',
            'access denied',
            '403 forbidden',
            '404 not found',
            'cloudflare',
            'captcha',
            'verify you are human',
            'صنف جملة مستخرج',
        ];

        foreach ($blockedPhrases as $phrase) {
            if (str_contains($lower, $phrase)) {
                return true;
            }
        }

        return false;
    }

    private function cleanTitleFromStoreSuffix(string $title): string
    {
        $cleaned = $this->cleanText($title, 250);
        if ($this->isCloudflareOrPlaceholder($cleaned)) {
            return '';
        }

        // Remove common trailing store separators like "Product Name | Store" or "Product Name - متجر كذا"
        $parts = preg_split('/\s+(?:\||—|–|::)\s+/u', $cleaned);
        if (is_array($parts) && count($parts) >= 2 && mb_strlen(trim($parts[0])) >= 4) {
            return trim($parts[0]);
        }

        return $cleaned;
    }

    private function extractHintsFromUrl(string $encodedUrl): array
    {
        $decodedUrl = rawurldecode($encodedUrl);
        $path = (string) parse_url($encodedUrl, PHP_URL_PATH);
        $decodedPath = rawurldecode($path);

        $segments = array_values(array_filter(explode('/', $decodedPath), fn ($s) => trim($s) !== ''));
        $nameCandidate = '';
        $codeCandidate = '';

        foreach (array_reverse($segments) as $seg) {
            // Capture product ID/code if present in URL (like p123456 or SKU)
            if ($codeCandidate === '' && preg_match('/^(?:p|sku|id|item)?[-_]?([A-Za-z0-9]{4,14})$/i', $seg, $cm)) {
                if (preg_match('/\d/', $cm[1]) && ! preg_match('/\.(?:jpe?g|png|webp|gif)$/i', $seg)) {
                    $codeCandidate = strtoupper($cm[1]);
                }
            }

            if ($this->isLikelyRandomFilename($seg)) {
                continue;
            }

            $cleaned = preg_replace('/\.(html?|php|aspx?|jpe?g|png|webp)$/i', '', $seg) ?? $seg;
            $cleaned = str_replace(['-', '_', '+'], ' ', $cleaned);
            $cleaned = trim(preg_replace('/\s+/u', ' ', $cleaned) ?? $cleaned);

            if (
                $nameCandidate === ''
                && mb_strlen($cleaned) >= 4
                && ! $this->isLikelyRandomFilename($cleaned)
                && ! preg_match('/^(products?|items?|catalog|shop|store|categories|category|p|dp|gp|ar|en|\d+)$/iu', $cleaned)
                && ! preg_match('/^[a-z]{2}-[a-z]{2}$/i', $cleaned)
            ) {
                $nameCandidate = $cleaned;
            }
        }

        return [
            'decoded_url' => $decodedUrl,
            'name' => $this->cleanText($nameCandidate, 200),
            'code' => $codeCandidate,
        ];
    }

    private function assertSafePublicUrl(string $url): void
    {
        $parts = parse_url($url);
        $scheme = strtolower($parts['scheme'] ?? '');
        $host = $parts['host'] ?? '';

        if (! in_array($scheme, ['http', 'https'], true) || $host === '') {
            throw new RuntimeException('صيغة الرابط غير صالحة. تأكد من إدخال رابط يبدأ بـ https://');
        }

        if (in_array(strtolower($host), ['localhost', '127.0.0.1', '0.0.0.0', '::1'], true)) {
            throw new RuntimeException('غير مسموح بجلب روابط من الشبكة المحلية.');
        }

        if (filter_var($host, FILTER_VALIDATE_IP)) {
            if (! filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                throw new RuntimeException('غير مسموح بجلب روابط من الشبكة الداخلية.');
            }
        }
    }

    /**
     * Fetch URL resource and detect whether it is an image or HTML document.
     * Falls back to social link-preview crawler User-Agent if blocked by Cloudflare/anti-bot.
     *
     * @return array{body: string, mime_type: string, is_image: bool}
     */
    private function fetchResource(string $url, bool $preferImage = false): array
    {
        // Note: intentionally omit image/avif so CDNs serve JPEG/PNG/WebP directly supported by Gemini Vision
        $acceptHeader = $preferImage
            ? 'image/jpeg,image/png,image/webp,image/*;q=0.8'
            : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/jpeg,image/png,image/webp,*/*;q=0.8';

        $userAgents = $preferImage
            ? [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            ]
            : [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'WhatsApp/2.23.20.0 A',
                'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            ];

        foreach ($userAgents as $ua) {
            try {
                $response = Http::withoutVerifying()
                    ->withHeaders([
                        'User-Agent' => $ua,
                        'Accept' => $acceptHeader,
                        'Accept-Language' => 'ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7',
                    ])
                    ->timeout(15)
                    ->connectTimeout(6)
                    ->withOptions(['allow_redirects' => ['max' => 5]])
                    ->get($url);

                if (! $response->successful()) {
                    continue;
                }

                $contentType = strtolower((string) $response->header('Content-Type'));
                $mime = trim(explode(';', $contentType)[0] ?? '');
                $body = (string) $response->body();

                $isImage = str_starts_with($mime, 'image/')
                    || ($mime === '' && $this->looksLikeImageUrl($url));

                if ($isImage && $mime === '') {
                    $mime = 'image/jpeg';
                }

                // If HTML returned a Cloudflare/bot-protection page, try next crawler User-Agent
                if (! $isImage && $this->looksLikeBotChallengeHtml($body)) {
                    continue;
                }

                return [
                    'body' => $body,
                    'mime_type' => $mime,
                    'is_image' => $isImage,
                ];
            } catch (\Throwable) {
                continue;
            }
        }

        return ['body' => '', 'mime_type' => '', 'is_image' => false];
    }

    private function looksLikeBotChallengeHtml(string $html): bool
    {
        if ($html === '') {
            return true;
        }
        $head = mb_strtolower(mb_substr($html, 0, 4000));

        return str_contains($head, '<title>just a moment')
            || str_contains($head, 'cf-browser-verification')
            || str_contains($head, 'challenge-platform')
            || str_contains($head, 'attention required! | cloudflare');
    }

    /**
     * Convert unsupported image types (like AVIF/GIF/BMP) to JPEG via GD for Gemini Vision compatibility.
     *
     * @return array{bytes: string, mime: string}
     */
    private function prepareImageForGemini(string $bytes, string $mime): array
    {
        if ($bytes === '') {
            return ['bytes' => '', 'mime' => 'image/jpeg'];
        }

        $supported = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
        $cleanMime = strtolower(trim($mime));
        if ($cleanMime === 'image/jpg') {
            $cleanMime = 'image/jpeg';
        }
        if (in_array($cleanMime, $supported, true)) {
            return ['bytes' => $bytes, 'mime' => $cleanMime];
        }

        try {
            $gdImage = null;
            if ($cleanMime === 'image/avif' && function_exists('imagecreatefromavif')) {
                $gdImage = @imagecreatefromavif('data://image/avif;base64,' . base64_encode($bytes));
            }
            if (! $gdImage && function_exists('imagecreatefromstring')) {
                $gdImage = @imagecreatefromstring($bytes);
            }
            if ($gdImage && function_exists('imagejpeg')) {
                ob_start();
                imagejpeg($gdImage, null, 88);
                $jpegBytes = (string) ob_get_clean();
                imagedestroy($gdImage);
                if ($jpegBytes !== '') {
                    return ['bytes' => $jpegBytes, 'mime' => 'image/jpeg'];
                }
            }
        } catch (\Throwable) {
            // Fall through and omit incompatible image bytes rather than failing the Gemini request
        }

        return ['bytes' => '', 'mime' => 'image/jpeg'];
    }

    private function parseHtmlMetadata(string $html, string $url): array
    {
        $html = $this->sanitizeUtf8($html);

        $result = [
            'name' => '',
            'description' => '',
            'unit_price' => '',
            'code' => '',
            'image' => '',
        ];

        // 1. JSON-LD (Schema.org Product) — decode raw JSON first before entity decoding!
        if (preg_match_all('/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/is', $html, $ldMatches)) {
            foreach ($ldMatches[1] as $rawJson) {
                $trimmedJson = trim($rawJson);
                $decoded = json_decode($trimmedJson, true);
                if (! is_array($decoded)) {
                    $decoded = json_decode(html_entity_decode($trimmedJson, ENT_QUOTES, 'UTF-8'), true);
                }
                if (! is_array($decoded)) {
                    continue;
                }
                $productNode = $this->findProductSchemaNode($decoded);
                if ($productNode !== null) {
                    $result['name'] = $result['name'] ?: $this->cleanText((string) ($productNode['name'] ?? ''), 250);
                    $result['description'] = $result['description'] ?: $this->cleanText((string) ($productNode['description'] ?? ''), 1200);
                    $result['code'] = $result['code'] ?: $this->pickFirstString([
                        $productNode['sku'] ?? null,
                        $productNode['mpn'] ?? null,
                        $productNode['gtin13'] ?? null,
                        $productNode['gtin'] ?? null,
                        $productNode['productID'] ?? null,
                    ]);
                    $result['image'] = $result['image'] ?: $this->extractImageFromSchema($productNode['image'] ?? null);
                    $result['unit_price'] = $result['unit_price'] ?: $this->extractPriceFromSchemaOffers($productNode['offers'] ?? null);
                }
            }
        }

        // 2. Meta tags (OpenGraph, Twitter, standard meta)
        $meta = $this->extractMetaTags($html);
        $result['name'] = $result['name'] ?: ($meta['og:title'] ?? $meta['twitter:title'] ?? $meta['title'] ?? '');
        $result['description'] = $result['description'] ?: ($meta['og:description'] ?? $meta['twitter:description'] ?? $meta['description'] ?? '');
        $result['image'] = $result['image'] ?: ($meta['og:image:secure_url'] ?? $meta['og:image'] ?? $meta['twitter:image'] ?? '');
        $result['unit_price'] = $result['unit_price'] ?: (
            $meta['product:price:amount']
            ?? $meta['og:price:amount']
            ?? $meta['price']
            ?? $meta['twitter:data1']
            ?? ''
        );

        // 3. DOM extraction via DOMDocument / DOMXPath for product title & description blocks
        $domParsed = $this->extractFromDom($html);
        if ($result['name'] === '' && $domParsed['name'] !== '') {
            $result['name'] = $domParsed['name'];
        }
        if ($domParsed['description'] !== '' && mb_strlen($domParsed['description']) > mb_strlen($result['description'])) {
            $result['description'] = $domParsed['description'];
        }

        if ($result['name'] === '' && preg_match('/<h1[^>]*>(.*?)<\/h1>/is', $html, $h1Match)) {
            $result['name'] = $this->cleanText($h1Match[1], 250);
        }

        if ($result['name'] === '' && preg_match('/<title[^>]*>(.*?)<\/title>/is', $html, $titleMatch)) {
            $result['name'] = $this->cleanText($titleMatch[1], 250);
        }

        // 4. Fallback itemprop / retail SKU & price hints from HTML
        if ($result['unit_price'] === '' && preg_match('/itemprop=["\']price["\'][^>]*content=["\']([0-9.,]+)["\']/i', $html, $priceMeta)) {
            $result['unit_price'] = $priceMeta[1];
        }
        if ($result['unit_price'] === '' && preg_match('/(?:ر\.س|ريال|SAR)\s*([0-9]+(?:[.,][0-9]{1,2})?)|([0-9]+(?:[.,][0-9]{1,2})?)\s*(?:ر\.س|ريال|SAR)/u', strip_tags($html), $priceText)) {
            $result['unit_price'] = $priceText[1] ?: ($priceText[2] ?? '');
        }

        if ($result['code'] === '' && preg_match('/(?:SKU|رمز المنتج|كود المنتج|رقم الصنف|Model)\s*[:#\-]?\s*([A-Za-z0-9\-_]{3,32})/iu', strip_tags($html), $skuMatch)) {
            $result['code'] = $skuMatch[1];
        }

        if ($result['image'] === '' && preg_match('/(?:src|data-src)=["\'](https?:\/\/[^"\']+\.(?:jpg|jpeg|png|webp)[^"\']*)["\']/i', $html, $imgMatch)) {
            $result['image'] = $imgMatch[1];
        }

        $result['image'] = $this->resolveUrl($result['image'], $url);

        return $result;
    }

    /**
     * Extract product heading and full description blocks directly from DOM.
     *
     * @return array{name: string, description: string}
     */
    private function extractFromDom(string $html): array
    {
        $out = ['name' => '', 'description' => ''];
        if (! class_exists(\DOMDocument::class)) {
            return $out;
        }

        try {
            $dom = new \DOMDocument();
            $prev = libxml_use_internal_errors(true);
            $dom->loadHTML('<?xml encoding="utf-8" ?>' . $html, LIBXML_NOERROR | LIBXML_NOWARNING);
            libxml_clear_errors();
            libxml_use_internal_errors($prev);

            $xpath = new \DOMXPath($dom);

            foreach (['//h1', '//*[@itemprop="name"]'] as $query) {
                $nodes = $xpath->query($query);
                if ($nodes && $nodes->length > 0) {
                    $candidate = $this->cleanText((string) $nodes->item(0)?->textContent, 250);
                    if ($candidate !== '' && ! $this->isCloudflareOrPlaceholder($candidate)) {
                        $out['name'] = $candidate;
                        break;
                    }
                }
            }

            $descQueries = [
                '//*[@itemprop="description"]',
                '//*[contains(@class,"product-description")]',
                '//*[contains(@class,"product__description")]',
                '//*[contains(@class,"s-product-description")]',
                '//*[@id="product-description" or @id="description" or @id="feature-bullets"]',
                '//*[contains(@class,"woocommerce-product-details__short-description")]',
            ];

            foreach ($descQueries as $query) {
                $nodes = $xpath->query($query);
                if ($nodes && $nodes->length > 0) {
                    $candidate = $this->cleanText((string) $nodes->item(0)?->textContent, 1200);
                    if (mb_strlen($candidate) > mb_strlen($out['description'])) {
                        $out['description'] = $candidate;
                    }
                }
            }
        } catch (\Throwable) {
            return $out;
        }

        return $out;
    }

    private function findProductSchemaNode(array $data): ?array
    {
        $type = $data['@type'] ?? null;
        if ($type === 'Product' || $type === 'ProductGroup' || (is_array($type) && (in_array('Product', $type, true) || in_array('ProductGroup', $type, true)))) {
            return $data;
        }

        foreach ($data as $value) {
            if (is_array($value)) {
                $found = $this->findProductSchemaNode($value);
                if ($found !== null) {
                    return $found;
                }
            }
        }

        return null;
    }

    private function pickFirstString(array $candidates): string
    {
        foreach ($candidates as $item) {
            if (is_scalar($item) && trim((string) $item) !== '') {
                return trim((string) $item);
            }
        }

        return '';
    }

    private function extractImageFromSchema(mixed $image): string
    {
        if (is_string($image)) {
            return $image;
        }
        if (is_array($image)) {
            if (isset($image['url']) && is_string($image['url'])) {
                return $image['url'];
            }
            foreach ($image as $entry) {
                $picked = $this->extractImageFromSchema($entry);
                if ($picked !== '') {
                    return $picked;
                }
            }
        }

        return '';
    }

    private function extractPriceFromSchemaOffers(mixed $offers): string
    {
        if (! is_array($offers)) {
            return '';
        }

        foreach (['price', 'lowPrice', 'highPrice'] as $key) {
            if (isset($offers[$key]) && is_scalar($offers[$key]) && trim((string) $offers[$key]) !== '') {
                return (string) $offers[$key];
            }
        }

        foreach ($offers as $nested) {
            if (is_array($nested)) {
                $price = $this->extractPriceFromSchemaOffers($nested);
                if ($price !== '') {
                    return $price;
                }
            }
        }

        return '';
    }

    private function extractMetaTags(string $html): array
    {
        $meta = [];
        if (! preg_match_all('/<meta\b[^>]*>/is', $html, $tags)) {
            return $meta;
        }

        foreach ($tags[0] as $tag) {
            $name = '';
            $content = '';

            if (preg_match('/(?:property|name|itemprop)=["\']([^"\']+)["\']/i', $tag, $m)) {
                $name = strtolower(trim($m[1]));
            }
            if (preg_match('/content=["\']([^"\']*)["\']/i', $tag, $c)) {
                $content = html_entity_decode($c[1], ENT_QUOTES, 'UTF-8');
            }

            if ($name !== '' && $content !== '' && ! isset($meta[$name])) {
                $meta[$name] = trim($content);
            }
        }

        return $meta;
    }

    private function extractVisibleText(string $html): string
    {
        $html = $this->sanitizeUtf8($html);
        // Remove non-product boilerplate (scripts, styles, headers, nav menus, footers) so product text stays in window
        $stripped = preg_replace('/<(script|style|noscript|svg|header|nav|footer|aside)\b[^>]*>.*?<\/\1>/is', ' ', $html) ?? $html;
        $text = html_entity_decode(strip_tags($stripped), ENT_QUOTES, 'UTF-8');
        $text = preg_replace('/\s+/u', ' ', $text) ?? $text;

        return mb_substr(trim($text), 0, 8000);
    }

    /**
     * Call Gemini (supports both text AND multimodal Vision when an image is provided).
     */
    private function analyzeWithGemini(
        array $parsed,
        string $visibleText,
        string $decodedUrl,
        string $imageBytes = '',
        string $imageMime = 'image/jpeg'
    ): ?array {
        $geminiKey = $this->getGeminiKey();
        if ($geminiKey === '') {
            return null;
        }

        $safeParsedJson = json_encode($parsed, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE) ?: '{}';
        $safeVisibleText = $this->sanitizeUtf8($visibleText);

        $prompt = "أنت خبير كتالوج منتجات جملة (B2B) في السعودية. قم بتحليل بيانات أو صورة المنتج المرفقة وأعد كائن JSON فقط يحتوي على الحقول التالية:\n"
            . "- name: اسم الصنف الكامل والدقيق باللغة العربية (اذكر نوع المنتج والماركة والحجم أو الوزن أو العدد إن وجد، واحذف اسم المتجر مثل | متجر كذا، ولا تضع اسم ملف عشوائي أبداً).\n"
            . "- description: وصف احترافي واضح ومفيد للمنتج ومواصفاته ومكوناته أو استخدامه باللغة العربية (جملتان إلى ثلاث جمل منسقة بدون حشو أو عبارات تسويقية للمتجر).\n"
            . "- unit_price: سعر الحبة بالريال السعودي كرقم عشري فقط مثل \"18.50\" (إذا لم يظهر سعر صريح في النص أو الصورة ضع تقديراً مناسباً للجملة بالريال).\n"
            . "- code: كود الصنف (SKU) إن وجد في البيانات، أو أنشئ كوداً مختصراً مناسباً بالإنجليزية والأرقام مثل \"SHM-500\".\n"
            . "- image: رابط الصورة المباشر إن وجد في البيانات الأولية.\n\n"
            . "الرابط: {$decodedUrl}\n"
            . "البيانات الأولية المستخرجة: {$safeParsedJson}\n";

        if ($safeVisibleText !== '') {
            $prompt .= "نص محتوى صفحة المنتج:\n{$safeVisibleText}\n";
        }

        $parts = [['text' => $prompt]];
        if ($imageBytes !== '' && strlen($imageBytes) <= 6 * 1024 * 1024) {
            $parts[] = [
                'inline_data' => [
                    'mime_type' => $imageMime ?: 'image/jpeg',
                    'data' => base64_encode($imageBytes),
                ],
            ];
        }

        foreach (['gemini-2.5-flash', 'gemini-2.0-flash'] as $model) {
            try {
                $res = Http::withoutVerifying()
                    ->timeout(25)
                    ->post(
                        "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . urlencode($geminiKey),
                        [
                            'contents' => [['parts' => $parts]],
                            'generationConfig' => [
                                'responseMimeType' => 'application/json',
                                'responseSchema' => [
                                    'type' => 'OBJECT',
                                    'properties' => [
                                        'name' => ['type' => 'STRING'],
                                        'description' => ['type' => 'STRING'],
                                        'unit_price' => ['type' => 'STRING'],
                                        'code' => ['type' => 'STRING'],
                                        'image' => ['type' => 'STRING'],
                                    ],
                                    'required' => ['name', 'description'],
                                ],
                                'temperature' => 0.2,
                            ],
                        ]
                    );

                if ($res->successful()) {
                    $jsonText = (string) $res->json('candidates.0.content.parts.0.text', '');
                    $decoded = $this->decodeJsonObject($jsonText);
                    if ($decoded !== null) {
                        return $decoded;
                    }
                } else {
                    Log::warning('Gemini product extraction non-2xx response', [
                        'model' => $model,
                        'status' => $res->status(),
                        'body' => mb_substr($res->body(), 0, 500),
                    ]);
                }
            } catch (\Throwable $e) {
                Log::warning('Gemini product extraction exception', [
                    'model' => $model,
                    'error' => $e->getMessage(),
                ]);
                continue;
            }
        }

        return null;
    }

    private function sanitizeUtf8(string $input): string
    {
        if ($input === '') {
            return '';
        }
        $clean = @mb_convert_encoding($input, 'UTF-8', 'UTF-8');

        return is_string($clean) ? $clean : '';
    }

    private function decodeJsonObject(string $raw): ?array
    {
        $trimmed = trim($raw);
        if ($trimmed === '') {
            return null;
        }

        $trimmed = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', $trimmed) ?? $trimmed;
        $decoded = json_decode(trim($trimmed), true);
        if (is_array($decoded)) {
            if (array_is_list($decoded) && isset($decoded[0]) && is_array($decoded[0])) {
                return $decoded[0];
            }
            return $decoded;
        }

        if (preg_match('/\{.*\}/s', $trimmed, $m)) {
            $fallback = json_decode($m[0], true);
            if (is_array($fallback)) {
                return $fallback;
            }
        }

        return null;
    }

    private function cleanText(string $value, int $maxLength): string
    {
        $value = $this->sanitizeUtf8($value);
        $decoded = html_entity_decode(strip_tags($value), ENT_QUOTES, 'UTF-8');
        $normalized = preg_replace('/\s+/u', ' ', $decoded) ?? $decoded;

        return mb_substr(trim($normalized), 0, $maxLength);
    }

    private function normalizePrice(mixed $raw): string
    {
        if (! is_scalar($raw)) {
            return '';
        }

        $str = str_replace(',', '', (string) $raw);
        if (preg_match('/([0-9]+(?:\.[0-9]{1,2})?)/', $str, $m)) {
            $num = (float) $m[1];
            return $num > 0 ? number_format($num, 2, '.', '') : '';
        }

        return '';
    }

    private function normalizeImageUrl(string $image, string $pageUrl): string
    {
        $resolved = $this->resolveUrl(trim($image), $pageUrl);
        if ($resolved === '') {
            return '';
        }

        if (strlen($resolved) > 255) {
            $noQuery = strtok($resolved, '?') ?: $resolved;
            return strlen($noQuery) <= 255 ? $noQuery : '';
        }

        return $resolved;
    }

    private function resolveUrl(string $target, string $baseUrl): string
    {
        if ($target === '') {
            return '';
        }
        if (preg_match('/^https?:\/\//i', $target)) {
            return $target;
        }
        if (str_starts_with($target, '//')) {
            $scheme = parse_url($baseUrl, PHP_URL_SCHEME) ?: 'https';
            return $scheme . ':' . $target;
        }

        $parts = parse_url($baseUrl);
        $scheme = $parts['scheme'] ?? 'https';
        $host = $parts['host'] ?? '';
        $port = isset($parts['port']) ? ':' . $parts['port'] : '';

        if ($host === '') {
            return '';
        }

        $origin = "{$scheme}://{$host}{$port}";
        if (str_starts_with($target, '/')) {
            return $origin . $target;
        }

        $basePath = $parts['path'] ?? '/';
        $dir = rtrim(dirname($basePath), '/\\');

        return $origin . ($dir !== '' ? $dir . '/' : '/') . $target;
    }

    /**
     * @return array{0: string, 1: 'extracted'|'generated'}
     */
    private function resolveUniqueCode(?string $rawCode): array
    {
        $sanitized = strtoupper(preg_replace('/[^A-Za-z0-9\-_]/', '', (string) $rawCode));
        if (strlen($sanitized) >= 3 && ! $this->isLikelyRandomFilename($sanitized)) {
            $candidate = substr($sanitized, 0, 40);
            if (! $this->codeExistsInDb($candidate)) {
                return [$candidate, 'extracted'];
            }

            for ($i = 2; $i <= 20; $i++) {
                $alt = substr($candidate, 0, 35) . '-' . $i;
                if (! $this->codeExistsInDb($alt)) {
                    return [$alt, 'extracted'];
                }
            }
        }

        return [$this->generateUniqueCode(), 'generated'];
    }

    private function codeExistsInDb(string $code): bool
    {
        try {
            return Product::where('code', $code)->exists();
        } catch (\Throwable) {
            return false;
        }
    }
}
