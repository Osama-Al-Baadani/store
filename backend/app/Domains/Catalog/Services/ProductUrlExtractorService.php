<?php

namespace App\Domains\Catalog\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class ProductUrlExtractorService
{
    /**
     * Extract product name, description, unit price, code (SKU), and image from a public product URL.
     * Uses structured metadata (JSON-LD / OpenGraph / HTML) and optionally refines via Gemini/OpenAI if configured.
     *
     * @return array{
     *   name: string,
     *   description: string,
     *   unit_price: string,
     *   code: string,
     *   code_source: 'extracted'|'generated',
     *   image: string,
     *   source_url: string,
     *   ai_enhanced: bool
     * }
     */
    public function extract(string $url): array
    {
        $this->assertSafePublicUrl($url);

        $html = $this->fetchHtml($url);
        $parsed = $this->parseHtmlMetadata($html, $url);
        $visibleText = $this->extractVisibleText($html);

        $aiResult = $this->refineWithAi($parsed, $visibleText, $url);
        $aiEnhanced = $aiResult !== null;

        if ($aiResult !== null) {
            $parsed = array_merge($parsed, array_filter($aiResult, fn ($v) => $v !== null && $v !== ''));
        }

        $name = $this->cleanText((string) ($parsed['name'] ?? ''), 250);
        $description = $this->cleanText((string) ($parsed['description'] ?? ''), 1000);
        $unitPrice = $this->normalizePrice($parsed['unit_price'] ?? null);
        $image = $this->normalizeImageUrl((string) ($parsed['image'] ?? ''), $url);

        [$code, $codeSource] = $this->resolveUniqueCode($parsed['code'] ?? null);

        if ($name === '' && $description === '' && $unitPrice === '') {
            throw new RuntimeException('تعذر استخراج بيانات واضحة للمنتج من هذا الرابط. تأكد أن الرابط لصفحة منتج عامة وليس محمياً بتسجيل دخول أو حماية ضد التصفح الآلي.');
        }

        return [
            'name' => $name,
            'description' => $description,
            'unit_price' => $unitPrice,
            'code' => $code,
            'code_source' => $codeSource,
            'image' => $image,
            'source_url' => $url,
            'ai_enhanced' => $aiEnhanced,
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
            if (! Product::where('code', $candidate)->exists()) {
                return $candidate;
            }
        }

        return $cleanPrefix . '-' . strtoupper(Str::random(6));
    }

    private function assertSafePublicUrl(string $url): void
    {
        $parts = parse_url($url);
        $scheme = strtolower($parts['scheme'] ?? '');
        $host = $parts['host'] ?? '';

        if (! in_array($scheme, ['http', 'https'], true) || $host === '') {
            throw new RuntimeException('صيغة الرابط غير صالحة. يجب أن يبدأ الرابط بـ http:// أو https://');
        }

        if (filter_var($host, FILTER_VALIDATE_IP)) {
            if (! filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                throw new RuntimeException('غير مسموح بجلب روابط من الشبكة الداخلية.');
            }
            return;
        }

        $ips = @gethostbynamel($host);
        if (is_array($ips)) {
            foreach ($ips as $ip) {
                if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    throw new RuntimeException('غير مسموح بالوصول إلى عناوين داخلية أو محجوزة.');
                }
            }
        }
    }

    private function fetchHtml(string $url): string
    {
        $response = Http::withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language' => 'ar,en-US;q=0.9,en;q=0.8',
        ])
            ->timeout(15)
            ->connectTimeout(8)
            ->withOptions(['allow_redirects' => ['max' => 5]])
            ->get($url);

        if (! $response->successful()) {
            throw new RuntimeException('تعذر فتح الرابط (رمز الاستجابة: ' . $response->status() . ').');
        }

        $body = $response->body();
        if (trim($body) === '') {
            throw new RuntimeException('الموقع أعاد صفحة فارغة.');
        }

        return $body;
    }

    /**
     * Extract Product JSON-LD, OpenGraph, meta tags, and common HTML hints.
     */
    private function parseHtmlMetadata(string $html, string $url): array
    {
        $result = [
            'name' => '',
            'description' => '',
            'unit_price' => '',
            'code' => '',
            'image' => '',
        ];

        // 1. JSON-LD (Schema.org Product)
        if (preg_match_all('/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/is', $html, $ldMatches)) {
            foreach ($ldMatches[1] as $rawJson) {
                $decoded = json_decode(html_entity_decode(trim($rawJson), ENT_QUOTES, 'UTF-8'), true);
                if (! is_array($decoded)) {
                    continue;
                }
                $productNode = $this->findProductSchemaNode($decoded);
                if ($productNode !== null) {
                    $result['name'] = $result['name'] ?: (string) ($productNode['name'] ?? '');
                    $result['description'] = $result['description'] ?: (string) ($productNode['description'] ?? '');
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

        // 2. Meta tags & DOM elements
        $meta = $this->extractMetaTags($html);
        $result['name'] = $result['name'] ?: ($meta['og:title'] ?? $meta['twitter:title'] ?? $meta['title'] ?? '');
        $result['description'] = $result['description'] ?: ($meta['og:description'] ?? $meta['twitter:description'] ?? $meta['description'] ?? '');
        $result['image'] = $result['image'] ?: ($meta['og:image'] ?? $meta['twitter:image'] ?? '');
        $result['unit_price'] = $result['unit_price'] ?: (
            $meta['product:price:amount']
            ?? $meta['og:price:amount']
            ?? $meta['twitter:data1']
            ?? ''
        );

        if ($result['name'] === '' && preg_match('/<title[^>]*>(.*?)<\/title>/is', $html, $titleMatch)) {
            $result['name'] = html_entity_decode(strip_tags($titleMatch[1]), ENT_QUOTES, 'UTF-8');
        }

        // 3. Fallback itemprop / retail SKU & price hints from HTML
        if ($result['unit_price'] === '' && preg_match('/itemprop=["\']price["\'][^>]*content=["\']([0-9.,]+)["\']/i', $html, $priceMeta)) {
            $result['unit_price'] = $priceMeta[1];
        }
        if ($result['unit_price'] === '' && preg_match('/(?:ر\.س|ريال|SAR|\$)\s*([0-9]+(?:[.,][0-9]{1,2})?)|([0-9]+(?:[.,][0-9]{1,2})?)\s*(?:ر\.س|ريال|SAR)/u', strip_tags($html), $priceText)) {
            $result['unit_price'] = $priceText[1] ?: ($priceText[2] ?? '');
        }

        if ($result['code'] === '' && preg_match('/(?:SKU|رمز المنتج|كود المنتج|رقم الصنف|Model)\s*[:#\-]?\s*([A-Za-z0-9\-_]{3,32})/iu', strip_tags($html), $skuMatch)) {
            $result['code'] = $skuMatch[1];
        }

        if ($result['image'] === '' && preg_match('/<img[^>]+src=["\']([^"\']+)["\'][^>]*>/i', $html, $imgMatch)) {
            $result['image'] = $imgMatch[1];
        }

        $result['image'] = $this->resolveUrl($result['image'], $url);

        return $result;
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
        $stripped = preg_replace('/<(script|style|noscript|svg)[^>]*>.*?<\/\1>/is', ' ', $html) ?? $html;
        $text = html_entity_decode(strip_tags($stripped), ENT_QUOTES, 'UTF-8');
        $text = preg_replace('/\s+/u', ' ', $text) ?? $text;

        return mb_substr(trim($text), 0, 5000);
    }

    /**
     * Optional AI refinement via Gemini or OpenAI when API key is configured in environment.
     */
    private function refineWithAi(array $parsed, string $visibleText, string $url): ?array
    {
        $geminiKey = (string) (config('services.gemini.key') ?: env('GEMINI_API_KEY', ''));
        $openaiKey = (string) (config('services.openai.key') ?: env('OPENAI_API_KEY', ''));

        if ($geminiKey === '' && $openaiKey === '') {
            return null;
        }

        $prompt = "Extract wholesale B2B product fields from this webpage data and return ONLY valid JSON with keys: name (Arabic or clean product title), description (concise Arabic product description 1-2 sentences), unit_price (numeric decimal string or empty), code (SKU/model code from page if found, else empty), image (direct image URL or empty).\n\n"
            . "URL: {$url}\n"
            . 'Parsed metadata: ' . json_encode($parsed, JSON_UNESCAPED_UNICODE) . "\n"
            . "Page text excerpt:\n{$visibleText}";

        try {
            if ($geminiKey !== '') {
                $res = Http::timeout(15)->post(
                    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . urlencode($geminiKey),
                    [
                        'contents' => [['parts' => [['text' => $prompt]]]],
                        'generationConfig' => ['responseMimeType' => 'application/json'],
                    ]
                );

                if ($res->successful()) {
                    $jsonText = $res->json('candidates.0.content.parts.0.text');
                    $decoded = is_string($jsonText) ? json_decode($jsonText, true) : null;
                    if (is_array($decoded)) {
                        return $decoded;
                    }
                }
            }

            if ($openaiKey !== '') {
                $res = Http::withToken($openaiKey)->timeout(15)->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-4o-mini',
                    'response_format' => ['type' => 'json_object'],
                    'messages' => [
                        ['role' => 'system', 'content' => 'Return only strict JSON with keys: name, description, unit_price, code, image.'],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                ]);

                if ($res->successful()) {
                    $jsonText = $res->json('choices.0.message.content');
                    $decoded = is_string($jsonText) ? json_decode($jsonText, true) : null;
                    if (is_array($decoded)) {
                        return $decoded;
                    }
                }
            }
        } catch (\Throwable) {
            return null;
        }

        return null;
    }

    private function cleanText(string $value, int $maxLength): string
    {
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

        // Keep within DB varchar(255); strip tracking query string if longer
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
        if (strlen($sanitized) >= 3) {
            $candidate = substr($sanitized, 0, 40);
            if (! Product::where('code', $candidate)->exists()) {
                return [$candidate, 'extracted'];
            }

            for ($i = 2; $i <= 20; $i++) {
                $alt = substr($candidate, 0, 35) . '-' . $i;
                if (! Product::where('code', $alt)->exists()) {
                    return [$alt, 'extracted'];
                }
            }
        }

        return [$this->generateUniqueCode(), 'generated'];
    }
}

