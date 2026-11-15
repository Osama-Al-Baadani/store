<?php

namespace App\Domains\Catalog\Services;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPackage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;
use SimpleXMLElement;
use ZipArchive;

class ProductBulkImportService
{
    public const SUPPORTED_FIELDS = [
        'name',
        'brand',
        'code',
        'barcode',
        'unit_price',
        'sale_price',
        'old_price',
        'unit',
        'description',
        'category',
        'branch',
        'image',
    ];

    private const HEADER_ALIASES = [
        'name' => ['name', 'product_name', 'product name', 'title', 'اسم المنتج', 'الاسم', 'الصنف', 'اسم الصنف', 'اسم', 'المسمى'],
        'brand' => ['brand', 'brand_name', 'manufacturer', 'vendor', 'العلامة التجارية', 'العلامه التجاريه', 'العلامة', 'الماركة', 'براند', 'الشركة المصنعة'],
        'code' => ['code', 'sku', 'product_code', 'product code', 'item_code', 'كود', 'الكود', 'رمز الصنف', 'رقم الصنف', 'كود الصنف'],
        'barcode' => ['barcode', 'ean', 'upc', 'باركود', 'الباركود', 'رقم الباركود'],
        'unit_price' => ['unit_price', 'regular_price', 'base_price', 'price', 'unit price', 'wholesale_price', 'السعر الأساسي', 'السعر الاساسي', 'سعر الحبة', 'السعر', 'سعر', 'السعر للحبة', 'سعر الجملة', 'السعر بالجملة'],
        'sale_price' => ['sale_price', 'offer_price', 'discount_price', 'special_price', 'سعر العرض', 'السعر بعد الخصم', 'سعر الخصم', 'عرض'],
        'old_price' => ['old_price', 'old price', 'compare_price', 'original_price', 'السعر القديم', 'قبل الخصم', 'سعر قبل الخصم'],
        'unit' => ['unit', 'unit_name', 'الوحدة', 'وحدة البيع', 'وحدة'],
        'description' => ['description', 'short_description', 'short description', 'desc', 'details', 'notes', 'وصف مختصر', 'الوصف المختصر', 'الوصف', 'وصف', 'تفاصيل', 'وصف المنتج', 'الوصف التفصيلي'],
        'category' => ['category', 'categories', 'category_name', 'category_id', 'cat', 'التصنيفات', 'تصنيفات', 'التصنيف', 'القسم', 'الفئة', 'الفئات', 'اسم القسم'],
        'branch' => ['branch', 'branch_name', 'branch_id', 'warehouse', 'المستودع', 'الفرع', 'اسم المستودع'],
        'image' => ['image', 'images', 'image_url', 'image url', 'photo', 'img', 'pic', 'picture', 'thumbnail', 'الصورة', 'الصور', 'صورة', 'رابط الصورة', 'روابط الصور', 'ملف الصورة', 'اسم الصورة'],
    ];

    public function __construct(
        private readonly ProductUrlExtractorService $urlExtractor
    ) {
    }

    /**
     * تحليل ومعاينة ملف أو رابط Google Sheet/Drive قبل الحفظ في قاعدة البيانات.
     *
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    public function preview(
        ?UploadedFile $file,
        ?string $sourceUrl,
        ?UploadedFile $imagesZip = null,
        array $options = []
    ): array {
        $parsed = $this->loadTabularSource($file, $sourceUrl);
        $zipIndex = $this->indexImagesZip($imagesZip);

        $headers = $parsed['headers'];
        $rawRows = $parsed['rows'];
        $embeddedImages = $parsed['embedded_images']; // keyed by 0-based worksheet row index

        $mapping = $this->resolveMapping($headers, $options['column_mapping'] ?? null);
        $prepared = $this->evaluateRows(
            rawRows: $rawRows,
            mapping: $mapping,
            embeddedImages: $embeddedImages,
            zipMap: $zipIndex['map'],
            options: $options,
            includeSampleLimit: 60
        );

        $this->closeZip($zipIndex['zip']);

        return [
            'headers' => $headers,
            'mapping' => $mapping,
            'rows_count' => $prepared['total_rows'],
            'embedded_images_count' => count($embeddedImages),
            'zip_images_count' => count($zipIndex['map']),
            'summary' => $prepared['summary'],
            'rows' => $prepared['preview_rows'],
        ];
    }

    /**
     * تنفيذ الاستيراد الفعلي داخل Transaction مع حفظ الصور وإنشاء/تحديث المنتجات.
     *
     * @param  array<string, mixed>  $options
     * @return array<string, mixed>
     */
    public function import(
        ?UploadedFile $file,
        ?string $sourceUrl,
        ?UploadedFile $imagesZip,
        array $options,
        string $baseHost
    ): array {
        $parsed = $this->loadTabularSource($file, $sourceUrl);
        $zipIndex = $this->indexImagesZip($imagesZip);

        $headers = $parsed['headers'];
        $rawRows = $parsed['rows'];
        $embeddedImages = $parsed['embedded_images'];
        $mapping = $this->resolveMapping($headers, $options['column_mapping'] ?? null);

        $duplicateMode = ($options['duplicate_mode'] ?? 'update') === 'skip' ? 'skip' : 'update';
        $defaultBranchId = ! empty($options['default_branch_id']) ? (int) $options['default_branch_id'] : null;
        $defaultCategoryId = ! empty($options['default_category_id']) ? (int) $options['default_category_id'] : null;
        $createMissingCategories = ! empty($options['create_missing_categories']);
        $downloadRemoteImages = $options['download_remote_images'] ?? true;

        $branches = Branch::query()->get();
        $categories = Category::query()->get();

        $created = 0;
        $updated = 0;
        $skipped = 0;
        $failed = 0;
        $imagesSaved = 0;
        $errors = [];

        $existingCodes = Product::query()
            ->pluck('id', 'code')
            ->mapWithKeys(fn ($id, $code) => [mb_strtolower(trim((string) $code)) => (int) $id])
            ->all();

        try {
            DB::transaction(function () use (
                $rawRows,
                $mapping,
                $embeddedImages,
                $zipIndex,
                $duplicateMode,
                $defaultBranchId,
                $defaultCategoryId,
                $createMissingCategories,
                $downloadRemoteImages,
                $branches,
                $categories,
                $baseHost,
                &$existingCodes,
                &$created,
                &$updated,
                &$skipped,
                &$failed,
                &$imagesSaved,
                &$errors
            ) {
                foreach ($rawRows as $entry) {
                    $rowNumber = (int) $entry['row_number'];
                    $xmlRowIndex = (int) $entry['xml_row_index'];
                    $cells = $entry['cells'];

                    $record = $this->extractRowValues($cells, $mapping);
                    if ($this->isEmptyRecord($record)) {
                        continue;
                    }

                    $name = $this->cleanText($record['name'] ?? '', 150);
                    if ($name === '') {
                        $failed++;
                        $errors[] = "الصف {$rowNumber}: اسم المنتج مفقود.";
                        continue;
                    }

                    $pricing = $this->resolveRowPricing(
                        $record['unit_price'] ?? '',
                        $record['sale_price'] ?? '',
                        $record['old_price'] ?? ''
                    );
                    $unitPrice = $pricing['unit_price'];
                    $oldPrice = $pricing['old_price'];

                    if ($unitPrice === null || $unitPrice <= 0) {
                        $failed++;
                        $errors[] = "الصف {$rowNumber} ({$name}): السعر الأساسي / سعر الحبة غير صالح.";
                        continue;
                    }

                    $branch = $this->matchBranch($record['branch'] ?? '', $branches, $defaultBranchId);
                    if (! $branch) {
                        $failed++;
                        $errors[] = "الصف {$rowNumber} ({$name}): تعذر تحديد المستودع.";
                        continue;
                    }

                    $category = $this->matchOrCreateCategory(
                        $record['category'] ?? '',
                        $branch->id,
                        $categories,
                        $defaultCategoryId,
                        $createMissingCategories
                    );
                    if (! $category) {
                        $failed++;
                        $errors[] = "الصف {$rowNumber} ({$name}): القسم غير موجود ولم يتم اختيار قسم افتراضي.";
                        continue;
                    }

                    $rawCode = $this->cleanText($record['code'] ?? '', 50);
                    $codeKey = mb_strtolower($rawCode);
                    $existingProductId = $rawCode !== '' ? ($existingCodes[$codeKey] ?? null) : null;

                    if ($existingProductId !== null && $duplicateMode === 'skip') {
                        $skipped++;
                        continue;
                    }

                    $imageResult = $this->resolveRowImage(
                        rawImage: trim((string) ($record['image'] ?? '')),
                        code: $rawCode,
                        embeddedImage: $embeddedImages[$xmlRowIndex] ?? null,
                        zip: $zipIndex['zip'],
                        zipMap: $zipIndex['map'],
                        downloadRemote: (bool) $downloadRemoteImages,
                        baseHost: $baseHost
                    );

                    if ($imageResult['saved_locally']) {
                        $imagesSaved++;
                    }

                    $brand = $this->cleanText($record['brand'] ?? '', 120);
                    $description = $this->cleanText($record['description'] ?? '', 2000);
                    $barcode = $this->cleanText($record['barcode'] ?? '', 50);
                    if ($barcode === '' && $rawCode !== '' && preg_match('/^\d{8,14}$/', $rawCode)) {
                        $barcode = $rawCode;
                    }
                    $unitName = $this->cleanText($record['unit'] ?? '', 50) ?: 'حبة';

                    if ($existingProductId !== null) {
                        $product = Product::find($existingProductId);
                        if ($product) {
                            $updatePayload = [
                                'name' => $name,
                                'category_id' => $category->id,
                                'branch_id' => $branch->id,
                            ];
                            if ($brand !== '') {
                                $updatePayload['brand'] = $brand;
                            }
                            if ($description !== '') {
                                $updatePayload['description'] = $description;
                            }
                            if ($barcode !== '') {
                                $updatePayload['barcode'] = $barcode;
                            }
                            if ($imageResult['url'] !== null) {
                                $updatePayload['image'] = $imageResult['url'];
                            }

                            $product->update($updatePayload);

                            $defaultPkg = $product->defaultPackage()->first();
                            if ($defaultPkg) {
                                $defaultPkg->update([
                                    'unit' => $unitName,
                                    'name' => $unitName,
                                    'unit_price' => $unitPrice,
                                    'old_price' => $oldPrice,
                                ]);
                            } else {
                                ProductPackage::create([
                                    'product_id' => $product->id,
                                    'name' => $unitName,
                                    'unit' => $unitName,
                                    'pack_quantity' => 1,
                                    'step_quantity' => 1,
                                    'unit_price' => $unitPrice,
                                    'old_price' => $oldPrice,
                                    'is_default' => true,
                                    'is_active' => true,
                                ]);
                            }

                            $updated++;
                            continue;
                        }
                    }

                    $finalCode = $rawCode;
                    if ($finalCode === '' || isset($existingCodes[mb_strtolower($finalCode)])) {
                        $finalCode = $this->urlExtractor->generateUniqueCode('DRV');
                    }

                    $product = Product::create([
                        'branch_id' => $branch->id,
                        'category_id' => $category->id,
                        'code' => $finalCode,
                        'barcode' => $barcode !== '' ? $barcode : null,
                        'name' => $name,
                        'brand' => $brand !== '' ? $brand : null,
                        'description' => $description !== '' ? $description : "صنف جملة معتمد بالحبة - {$name}",
                        'image' => $imageResult['url'],
                        'is_active' => true,
                        'sort' => 99,
                    ]);

                    ProductPackage::create([
                        'product_id' => $product->id,
                        'name' => $unitName,
                        'unit' => $unitName,
                        'pack_quantity' => 1,
                        'step_quantity' => 1,
                        'unit_price' => $unitPrice,
                        'old_price' => $oldPrice,
                        'is_default' => true,
                        'is_active' => true,
                    ]);

                    $existingCodes[mb_strtolower($finalCode)] = $product->id;
                    $created++;
                }
            });
        } finally {
            $this->closeZip($zipIndex['zip']);
        }

        return [
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
            'failed' => $failed,
            'images_saved' => $imagesSaved,
            'errors' => array_slice($errors, 0, 30),
        ];
    }

    /**
     * بناء محتوى CSV للتصدير أو لقالب الاستيراد الجاهز.
     */
    public function buildCsvExport(?int $branchId = null, ?int $categoryId = null, ?string $search = null, bool $templateOnly = false): string
    {
        $handle = fopen('php://temp', 'r+');
        if ($handle === false) {
            throw new RuntimeException('تعذر إنشاء ملف التصدير.');
        }

        // UTF-8 BOM لضمان قراءة الحروف العربية في Excel و Google Sheets بشكل سليم
        fwrite($handle, "\xEF\xBB\xBF");

        fputcsv($handle, [
            'SKU',
            'الاسم',
            'التصنيفات',
            'السعر الأساسي',
            'سعر العرض',
            'العلامة التجارية',
            'وصف مختصر',
            'المستودع',
            'الصورة',
        ]);

        if ($templateOnly) {
            fputcsv($handle, [
                '6217000480372',
                'سيلفا ضماد طبي لاصق',
                'العناية ← العناية الشخصية ← مستلزمات طبية',
                '25.30',
                '',
                'Silva',
                'ضماد طبي لاصق لتغطية الجروح والخدوش البسيطة',
                'المستودع الرئيسي',
                'https://example.com/images/silva.jpg',
            ]);
            fputcsv($handle, [
                '033200191223',
                'أرم آند هامر مزيل عرق',
                'العناية ← العناية الشخصية ← مزيلات العرق',
                '9.00',
                '4.90',
                'Arm & Hammer',
                'مزيل عرق مضاد للتعرق يوفر حماية فعالة طوال اليوم',
                'المستودع الرئيسي',
                '033200191223.jpg',
            ]);
        } else {
            $query = Product::with(['branch', 'category.parent.parent', 'defaultPackage'])
                ->orderBy('sort')
                ->orderByDesc('id');

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }
            if ($categoryId) {
                $query->where('category_id', $categoryId);
            }
            if ($search && trim($search) !== '') {
                $term = '%' . trim($search) . '%';
                $query->where(function ($q) use ($term) {
                    $q->where('name', 'like', $term)
                        ->orWhere('brand', 'like', $term)
                        ->orWhere('code', 'like', $term)
                        ->orWhere('barcode', 'like', $term);
                });
            }

            foreach ($query->cursor() as $product) {
                $pkgUnit = $product->defaultPackage?->unit_price;
                $pkgOld = $product->defaultPackage?->old_price;
                $regularPrice = ($pkgOld && (float) $pkgOld > (float) $pkgUnit) ? $pkgOld : ($pkgUnit ?? '0');
                $salePrice = ($pkgOld && (float) $pkgOld > (float) $pkgUnit) ? $pkgUnit : '';

                $catPath = $product->category?->name ?? '';
                if ($product->category?->parent) {
                    $catPath = $product->category->parent->name . ' ← ' . $catPath;
                    if ($product->category->parent->parent) {
                        $catPath = $product->category->parent->parent->name . ' ← ' . $catPath;
                    }
                }

                fputcsv($handle, [
                    $product->code,
                    $product->name,
                    $catPath,
                    $regularPrice,
                    $salePrice,
                    $product->brand ?? '',
                    $product->description ?? '',
                    $product->branch?->name ?? '',
                    $product->image_url ?? ($product->image ?? ''),
                ]);
            }
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return $csv === false ? '' : $csv;
    }

    /**
     * قراءة مصدر البيانات (ملف مرفوع أو رابط Google Sheets / Google Drive).
     *
     * @return array{headers: array<int, string>, rows: array<int, array<string, mixed>>, embedded_images: array<int, array{data: string, ext: string}>}
     */
    private function loadTabularSource(?UploadedFile $file, ?string $sourceUrl): array
    {
        if ($file) {
            $ext = strtolower($file->getClientOriginalExtension() ?: '');
            $path = $file->getRealPath();
            if (! $path || ! is_file($path)) {
                throw new RuntimeException('تعذر قراءة الملف المرفوع.');
            }

            $bytes = file_get_contents($path);
            if ($bytes === false || $bytes === '') {
                throw new RuntimeException('الملف المرفوع فارغ.');
            }

            if ($ext === 'xlsx' || str_starts_with($bytes, "PK\x03\x04")) {
                return $this->parseXlsxFile($path);
            }

            return $this->parseCsvContent($bytes);
        }

        $trimmedUrl = trim((string) $sourceUrl);
        if ($trimmedUrl === '') {
            throw new RuntimeException('يرجى رفع ملف (Excel أو CSV) أو إدخال رابط Google Sheet / Drive.');
        }

        $downloadUrl = $this->normalizeGoogleOrPublicUrl($trimmedUrl);
        $this->assertSafePublicUrl($downloadUrl);

        $response = Http::timeout(25)
            ->withOptions(['allow_redirects' => ['max' => 5]])
            ->withHeaders([
                'User-Agent' => 'Mozilla/5.0 (compatible; B2BStoreImporter/1.0)',
            ])
            ->get($downloadUrl);

        if (! $response->successful()) {
            throw new RuntimeException('تعذر تحميل الملف من الرابط (رمز الاستجابة ' . $response->status() . '). تأكد أن الرابط متاح للجميع (Anyone with the link).');
        }

        $body = $response->body();
        $contentType = strtolower((string) $response->header('Content-Type'));

        if ($body === '') {
            throw new RuntimeException('الملف المحمّل من الرابط فارغ.');
        }

        if (str_contains($contentType, 'text/html') && ! str_starts_with($body, "PK\x03\x04")) {
            throw new RuntimeException('الرابط يعرض صفحة HTML أو يطلب تسجيل دخول Google. اجعل مشاركة الملف على Drive/Sheets متاحة لـ «أي شخص لديه الرابط» (عارض) أو نزّل الملف وارفعه هنا.');
        }

        if (str_starts_with($body, "PK\x03\x04")) {
            $tmpPath = tempnam(sys_get_temp_dir(), 'imp_xlsx_');
            if ($tmpPath === false) {
                throw new RuntimeException('تعذر إنشاء ملف مؤقت لمعالجة جدول Excel.');
            }
            file_put_contents($tmpPath, $body);
            try {
                return $this->parseXlsxFile($tmpPath);
            } finally {
                @unlink($tmpPath);
            }
        }

        return $this->parseCsvContent($body);
    }

    /**
     * تحويل روابط Google Sheets و Google Drive تلقائياً إلى روابط تنزيل مباشرة.
     */
    private function normalizeGoogleOrPublicUrl(string $rawUrl): string
    {
        $url = trim($rawUrl);
        if (! preg_match('/^https?:\/\//i', $url)) {
            $url = 'https://' . ltrim($url, '/');
        }

        // Google Sheets: https://docs.google.com/spreadsheets/d/{ID}/edit...
        if (preg_match('/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/i', $url, $m)) {
            $sheetId = $m[1];
            $gid = null;
            if (preg_match('/[?#&]gid=(\d+)/i', $url, $g)) {
                $gid = $g[1];
            }

            // نستخدم xlsx للحفاظ على الصور المدمجة إن وجدت
            $export = "https://docs.google.com/spreadsheets/d/{$sheetId}/export?format=xlsx";
            if ($gid !== null) {
                $export .= "&gid={$gid}";
            }

            return $export;
        }

        // Google Drive file link: https://drive.google.com/file/d/{ID}/view
        if (preg_match('/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i', $url, $m)) {
            return "https://drive.google.com/uc?export=download&id={$m[1]}";
        }

        // Google Drive open?id={ID}
        if (preg_match('/drive\.google\.com\/open\?[^#]*id=([a-zA-Z0-9_-]+)/i', $url, $m)) {
            return "https://drive.google.com/uc?export=download&id={$m[1]}";
        }

        return $url;
    }

    /**
     * قراءة ملف CSV / TSV مع معالجة UTF-8 BOM واكتشاف الفاصل تلقائياً.
     *
     * @return array{headers: array<int, string>, rows: array<int, array<string, mixed>>, embedded_images: array<int, array{data: string, ext: string}>}
     */
    private function parseCsvContent(string $content): array
    {
        // إزالة UTF-8 BOM إن وجد
        $content = preg_replace('/^\xEF\xBB\xBF/', '', $content) ?? $content;
        $content = str_replace(["\r\n", "\r"], "\n", $content);

        $firstLine = strtok($content, "\n") ?: '';
        $delimiter = ',';
        $counts = [
            ',' => substr_count($firstLine, ','),
            ';' => substr_count($firstLine, ';'),
            "\t" => substr_count($firstLine, "\t"),
        ];
        arsort($counts);
        $topDelim = array_key_first($counts);
        if ($topDelim !== null && $counts[$topDelim] > 0) {
            $delimiter = $topDelim;
        }

        $handle = fopen('php://temp', 'r+');
        if ($handle === false) {
            throw new RuntimeException('تعذر فتح تدفق قراءة CSV.');
        }
        fwrite($handle, $content);
        rewind($handle);

        $rawMatrix = [];
        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            if ($row === [null] || $row === []) {
                continue;
            }
            $rawMatrix[] = array_map(fn ($v) => trim((string) $v), $row);
        }
        fclose($handle);

        return $this->matrixToParsedResult($rawMatrix, []);
    }

    /**
     * قراءة ملف XLSX أصلي عبر ZipArchive + SimpleXML واستخراج الصور المدمجة إن وجدت.
     *
     * @return array{headers: array<int, string>, rows: array<int, array<string, mixed>>, embedded_images: array<int, array{data: string, ext: string}>}
     */
    private function parseXlsxFile(string $path): array
    {
        $zip = new ZipArchive();
        if ($zip->open($path) !== true) {
            throw new RuntimeException('تعذر فتح ملف Excel (.xlsx). تأكد أنه غير تالف أو محمي بكلمة مرور.');
        }

        try {
            $sharedStrings = $this->readXlsxSharedStrings($zip);
            $sheetPath = $this->resolveFirstWorksheetPath($zip);
            $sheetXmlStr = $zip->getFromName($sheetPath);
            if ($sheetXmlStr === false) {
                throw new RuntimeException('لم يتم العثور على ورقة بيانات داخل ملف Excel.');
            }

            $sheetXml = @simplexml_load_string($sheetXmlStr);
            if (! $sheetXml instanceof SimpleXMLElement) {
                throw new RuntimeException('تعذر تحليل محتوى XML لملف Excel.');
            }

            $embeddedImages = $this->extractXlsxEmbeddedImages($zip, $sheetPath);

            $rawMatrix = [];
            $rowIndices = [];
            $sheetData = $sheetXml->sheetData ?? null;
            if ($sheetData) {
                foreach ($sheetData->row as $rowNode) {
                    $rowNumAttr = (int) ($rowNode['r'] ?? (count($rawMatrix) + 1));
                    $xmlRowIndex = max(0, $rowNumAttr - 1);
                    $cells = [];
                    $maxCol = -1;

                    foreach ($rowNode->c as $cellNode) {
                        $ref = (string) ($cellNode['r'] ?? '');
                        $colIdx = $ref !== '' ? $this->columnLettersToIndex($ref) : ($maxCol + 1);
                        if ($colIdx > $maxCol) {
                            $maxCol = $colIdx;
                        }
                        $cells[$colIdx] = $this->extractXlsxCellValue($cellNode, $sharedStrings);
                    }

                    if ($maxCol < 0) {
                        continue;
                    }

                    $denseRow = [];
                    for ($i = 0; $i <= $maxCol; $i++) {
                        $denseRow[$i] = trim((string) ($cells[$i] ?? ''));
                    }

                    if (implode('', $denseRow) === '') {
                        continue;
                    }

                    $rawMatrix[] = $denseRow;
                    $rowIndices[] = $xmlRowIndex;
                }
            }

            return $this->matrixToParsedResult($rawMatrix, $embeddedImages, $rowIndices);
        } finally {
            $zip->close();
        }
    }

    /**
     * @param  array<int, array<int, string>>  $matrix
     * @param  array<int, array{data: string, ext: string}>  $embeddedImages
     * @param  array<int, int>|null  $xmlRowIndices
     * @return array{headers: array<int, string>, rows: array<int, array<string, mixed>>, embedded_images: array<int, array{data: string, ext: string}>}
     */
    private function matrixToParsedResult(array $matrix, array $embeddedImages, ?array $xmlRowIndices = null): array
    {
        if (count($matrix) < 2) {
            throw new RuntimeException('الملف لا يحتوي على صفوف بيانات كافية (يجب وجود صف عناوين وصف منتج واحد على الأقل).');
        }

        $headers = array_values(array_map(fn ($h) => trim((string) $h), $matrix[0]));
        while (! empty($headers) && end($headers) === '') {
            array_pop($headers);
        }

        if (empty($headers)) {
            throw new RuntimeException('صف العناوين (الصف الأول) فارغ في الملف.');
        }

        $colCount = count($headers);
        $rows = [];

        for ($i = 1; $i < count($matrix); $i++) {
            $rawRow = $matrix[$i];
            $assoc = [];
            for ($c = 0; $c < $colCount; $c++) {
                $assoc[$c] = trim((string) ($rawRow[$c] ?? ''));
            }
            $rows[] = [
                'row_number' => ($xmlRowIndices !== null && isset($xmlRowIndices[$i])) ? ($xmlRowIndices[$i] + 1) : ($i + 1),
                'xml_row_index' => ($xmlRowIndices !== null && isset($xmlRowIndices[$i])) ? $xmlRowIndices[$i] : $i,
                'cells' => $assoc,
            ];
        }

        return [
            'headers' => $headers,
            'rows' => $rows,
            'embedded_images' => $embeddedImages,
        ];
    }

    /**
     * @return array<int, string>
     */
    private function readXlsxSharedStrings(ZipArchive $zip): array
    {
        $xmlStr = $zip->getFromName('xl/sharedStrings.xml');
        if ($xmlStr === false) {
            return [];
        }

        $xml = @simplexml_load_string($xmlStr);
        if (! $xml instanceof SimpleXMLElement) {
            return [];
        }

        $strings = [];
        foreach ($xml->si as $si) {
            if (isset($si->t)) {
                $strings[] = (string) $si->t;
            } elseif (isset($si->r)) {
                $text = '';
                foreach ($si->r as $run) {
                    $text .= (string) ($run->t ?? '');
                }
                $strings[] = $text;
            } else {
                $strings[] = '';
            }
        }

        return $strings;
    }

    private function resolveFirstWorksheetPath(ZipArchive $zip): string
    {
        $wbStr = $zip->getFromName('xl/workbook.xml');
        $relsStr = $zip->getFromName('xl/_rels/workbook.xml.rels');

        if ($wbStr !== false && $relsStr !== false) {
            $wb = @simplexml_load_string($wbStr);
            $rels = @simplexml_load_string($relsStr);

            if ($wb instanceof SimpleXMLElement && $rels instanceof SimpleXMLElement) {
                $firstSheet = $wb->sheets->sheet[0] ?? null;
                if ($firstSheet) {
                    $rNs = $firstSheet->attributes('http://schemas.openxmlformats.org/officeDocument/2006/relationships');
                    $rid = (string) ($rNs['id'] ?? '');
                    foreach ($rels->Relationship as $rel) {
                        if ((string) $rel['Id'] === $rid) {
                            $target = ltrim((string) $rel['Target'], '/');
                            if (! str_starts_with($target, 'xl/')) {
                                $target = 'xl/' . $target;
                            }
                            if ($zip->locateName($target) !== false) {
                                return $target;
                            }
                        }
                    }
                }
            }
        }

        return 'xl/worksheets/sheet1.xml';
    }

    /**
     * استخراج الصور المدمجة في ملف Excel وربط كل صورة برقم الصف (0-based).
     *
     * @return array<int, array{data: string, ext: string}>
     */
    private function extractXlsxEmbeddedImages(ZipArchive $zip, string $sheetPath): array
    {
        $sheetDir = dirname($sheetPath);
        $sheetBase = basename($sheetPath);
        $sheetRelsPath = "{$sheetDir}/_rels/{$sheetBase}.rels";
        $sheetRelsStr = $zip->getFromName($sheetRelsPath);
        if ($sheetRelsStr === false) {
            return [];
        }

        $sheetRels = @simplexml_load_string($sheetRelsStr);
        if (! $sheetRels instanceof SimpleXMLElement) {
            return [];
        }

        $drawingPaths = [];
        foreach ($sheetRels->Relationship as $rel) {
            $type = (string) ($rel['Type'] ?? '');
            if (str_ends_with($type, '/drawing')) {
                $target = (string) ($rel['Target'] ?? '');
                $drawingPaths[] = $this->resolveZipRelativePath($sheetDir, $target);
            }
        }

        $imagesByRow = [];
        foreach ($drawingPaths as $drawingPath) {
            $drawingStr = $zip->getFromName($drawingPath);
            if ($drawingStr === false) {
                continue;
            }

            $drawingDir = dirname($drawingPath);
            $drawingBase = basename($drawingPath);
            $drawingRelsStr = $zip->getFromName("{$drawingDir}/_rels/{$drawingBase}.rels");
            if ($drawingRelsStr === false) {
                continue;
            }

            $relsMap = [];
            $drawingRels = @simplexml_load_string($drawingRelsStr);
            if ($drawingRels instanceof SimpleXMLElement) {
                foreach ($drawingRels->Relationship as $rel) {
                    $relsMap[(string) $rel['Id']] = $this->resolveZipRelativePath($drawingDir, (string) $rel['Target']);
                }
            }

            $drawingXml = @simplexml_load_string($drawingStr);
            if (! $drawingXml instanceof SimpleXMLElement) {
                continue;
            }

            $xdrNs = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing';
            $aNs = 'http://schemas.openxmlformats.org/drawingml/2006/main';
            $rNs = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

            $anchors = [];
            foreach ($drawingXml->children($xdrNs) as $tag => $node) {
                if ($tag === 'twoCellAnchor' || $tag === 'oneCellAnchor') {
                    $anchors[] = $node;
                }
            }

            foreach ($anchors as $anchor) {
                $from = $anchor->children($xdrNs)->from ?? null;
                $pic = $anchor->children($xdrNs)->pic ?? null;
                if (! $from || ! $pic) {
                    continue;
                }

                $rowIdx = (int) ($from->children($xdrNs)->row ?? -1);
                $blipFill = $pic->children($xdrNs)->blipFill ?? null;
                $blip = $blipFill ? ($blipFill->children($aNs)->blip ?? null) : null;
                if ($rowIdx < 0 || ! $blip) {
                    continue;
                }

                $embedId = (string) ($blip->attributes($rNs)['embed'] ?? '');
                if ($embedId === '' || ! isset($relsMap[$embedId])) {
                    continue;
                }

                $mediaPath = $relsMap[$embedId];
                $mediaBytes = $zip->getFromName($mediaPath);
                if ($mediaBytes === false || $mediaBytes === '') {
                    continue;
                }

                $ext = strtolower(pathinfo($mediaPath, PATHINFO_EXTENSION) ?: 'png');
                if (! in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'], true)) {
                    $ext = 'png';
                }

                if (! isset($imagesByRow[$rowIdx])) {
                    $imagesByRow[$rowIdx] = [
                        'data' => $mediaBytes,
                        'ext' => $ext,
                    ];
                }
            }
        }

        return $imagesByRow;
    }

    private function resolveZipRelativePath(string $baseDir, string $target): string
    {
        if (str_starts_with($target, '/')) {
            return ltrim($target, '/');
        }

        $parts = explode('/', str_replace('\\', '/', $baseDir . '/' . $target));
        $resolved = [];
        foreach ($parts as $part) {
            if ($part === '' || $part === '.') {
                continue;
            }
            if ($part === '..') {
                array_pop($resolved);
                continue;
            }
            $resolved[] = $part;
        }

        return implode('/', $resolved);
    }

    /**
     * @param  array<int, string>  $sharedStrings
     */
    private function extractXlsxCellValue(SimpleXMLElement $cellNode, array $sharedStrings): string
    {
        $type = (string) ($cellNode['t'] ?? '');

        // دعم صيغة =IMAGE("https://...") في Excel و Google Sheets
        if (isset($cellNode->f)) {
            $formula = (string) $cellNode->f;
            if (preg_match('/IMAGE\(\s*["\']([^"\']+)["\']/i', $formula, $m)) {
                return trim($m[1]);
            }
        }

        if ($type === 's') {
            $idx = (int) ($cellNode->v ?? -1);

            return $sharedStrings[$idx] ?? '';
        }

        if ($type === 'inlineStr') {
            if (isset($cellNode->is->t)) {
                return (string) $cellNode->is->t;
            }
            if (isset($cellNode->is->r)) {
                $text = '';
                foreach ($cellNode->is->r as $run) {
                    $text .= (string) ($run->t ?? '');
                }

                return $text;
            }
        }

        if ($type === 'b') {
            return ((string) ($cellNode->v ?? '')) === '1' ? 'true' : 'false';
        }

        return (string) ($cellNode->v ?? '');
    }

    private function columnLettersToIndex(string $cellRef): int
    {
        if (! preg_match('/^([A-Z]+)/i', $cellRef, $m)) {
            return 0;
        }
        $letters = strtoupper($m[1]);
        $index = 0;
        for ($i = 0; $i < strlen($letters); $i++) {
            $index = $index * 26 + (ord($letters[$i]) - ord('A') + 1);
        }

        return max(0, $index - 1);
    }

    /**
     * @param  array<int, string>  $headers
     * @param  mixed  $override
     * @return array<string, int|null>
     */
    private function resolveMapping(array $headers, mixed $override): array
    {
        $mapping = array_fill_keys(self::SUPPORTED_FIELDS, null);

        foreach ($headers as $idx => $header) {
            $normalized = $this->normalizeHeader($header);
            foreach (self::HEADER_ALIASES as $field => $aliases) {
                if ($mapping[$field] !== null) {
                    continue;
                }
                foreach ($aliases as $alias) {
                    if ($normalized === $this->normalizeHeader($alias)) {
                        $mapping[$field] = $idx;
                        break 2;
                    }
                }
            }
        }

        if (is_string($override) && $override !== '') {
            $decoded = json_decode($override, true);
            if (is_array($decoded)) {
                $override = $decoded;
            }
        }

        if (is_array($override)) {
            foreach (self::SUPPORTED_FIELDS as $field) {
                if (array_key_exists($field, $override)) {
                    $val = $override[$field];
                    if ($val === null || $val === '' || (int) $val < 0) {
                        $mapping[$field] = null;
                    } elseif (isset($headers[(int) $val])) {
                        $mapping[$field] = (int) $val;
                    }
                }
            }
        }

        return $mapping;
    }

    private function normalizeHeader(string $value): string
    {
        $lower = mb_strtolower(trim($value));

        return preg_replace('/[\s_\-]+/u', ' ', $lower) ?? $lower;
    }

    /**
     * @param  array<int, array<string, mixed>>  $rawRows
     * @param  array<string, int|null>  $mapping
     * @param  array<int, array{data: string, ext: string}>  $embeddedImages
     * @param  array<string, string>  $zipMap
     * @param  array<string, mixed>  $options
     * @return array{total_rows: int, summary: array<string, int>, preview_rows: array<int, array<string, mixed>>}
     */
    private function evaluateRows(
        array $rawRows,
        array $mapping,
        array $embeddedImages,
        array $zipMap,
        array $options,
        int $includeSampleLimit = 60
    ): array {
        $duplicateMode = ($options['duplicate_mode'] ?? 'update') === 'skip' ? 'skip' : 'update';
        $defaultBranchId = ! empty($options['default_branch_id']) ? (int) $options['default_branch_id'] : null;
        $defaultCategoryId = ! empty($options['default_category_id']) ? (int) $options['default_category_id'] : null;
        $createMissingCategories = ! empty($options['create_missing_categories']);

        $branches = Branch::query()->get();
        $categories = Category::query()->get();
        $existingCodes = Product::query()
            ->pluck('id', 'code')
            ->mapWithKeys(fn ($id, $code) => [mb_strtolower(trim((string) $code)) => (int) $id])
            ->all();

        $summary = [
            'will_create' => 0,
            'will_update' => 0,
            'will_skip' => 0,
            'errors' => 0,
        ];
        $previewRows = [];
        $seenCodesInFile = [];
        $totalNonEmpty = 0;

        foreach ($rawRows as $entry) {
            $rowNumber = (int) $entry['row_number'];
            $xmlRowIndex = (int) $entry['xml_row_index'];
            $record = $this->extractRowValues($entry['cells'], $mapping);
            if ($this->isEmptyRecord($record)) {
                continue;
            }
            $totalNonEmpty++;

            $name = $this->cleanText($record['name'] ?? '', 150);
            $brand = $this->cleanText($record['brand'] ?? '', 120);
            $rawCode = $this->cleanText($record['code'] ?? '', 50);
            $pricing = $this->resolveRowPricing(
                $record['unit_price'] ?? '',
                $record['sale_price'] ?? '',
                $record['old_price'] ?? ''
            );
            $price = $pricing['unit_price'];
            $oldPrice = $pricing['old_price'];
            $branch = $this->matchBranch($record['branch'] ?? '', $branches, $defaultBranchId);
            $category = $branch
                ? $this->matchOrCreateCategory($record['category'] ?? '', $branch->id, $categories, $defaultCategoryId, false)
                : null;

            $error = null;
            if ($name === '') {
                $error = 'اسم المنتج مفقود';
            } elseif ($price === null || $price <= 0) {
                $error = 'السعر الأساسي / سعر الحبة غير صالح';
            } elseif (! $branch) {
                $error = 'تعذر تحديد المستودع';
            } elseif (! $category && ! ($createMissingCategories && trim((string) ($record['category'] ?? '')) !== '')) {
                $error = 'القسم غير موجود (اختر قسماً افتراضياً أو فعّل إنشاء الأقسام الجديدة)';
            }

            $status = 'create';
            $codeLower = mb_strtolower($rawCode);
            if ($error !== null) {
                $status = 'error';
                $summary['errors']++;
            } elseif ($rawCode !== '' && (isset($existingCodes[$codeLower]) || isset($seenCodesInFile[$codeLower]))) {
                if ($duplicateMode === 'skip') {
                    $status = 'skip';
                    $summary['will_skip']++;
                } else {
                    $status = 'update';
                    $summary['will_update']++;
                }
            } else {
                $status = 'create';
                $summary['will_create']++;
            }

            if ($rawCode !== '') {
                $seenCodesInFile[$codeLower] = true;
            }

            $rawImage = trim((string) ($record['image'] ?? ''));
            $hasEmbedded = isset($embeddedImages[$xmlRowIndex]);
            $hasZipMatch = $this->findZipEntry($zipMap, $rawImage, $rawCode) !== null;

            if (count($previewRows) < $includeSampleLimit) {
                $previewRows[] = [
                    'row_number' => $rowNumber,
                    'status' => $status,
                    'error' => $error,
                    'name' => $name,
                    'brand' => $brand !== '' ? $brand : null,
                    'code' => $rawCode !== '' ? $rawCode : '(توليد تلقائي)',
                    'unit_price' => $price,
                    'old_price' => $oldPrice,
                    'category' => $category?->name ?? ($record['category'] ?: '—'),
                    'branch' => $branch?->name ?? ($record['branch'] ?: '—'),
                    'image_source' => $hasEmbedded ? 'embedded' : ($hasZipMatch ? 'zip' : ($rawImage !== '' ? 'url' : 'none')),
                ];
            }
        }

        return [
            'total_rows' => $totalNonEmpty,
            'summary' => $summary,
            'preview_rows' => $previewRows,
        ];
    }

    /**
     * @param  array<int, string>  $cells
     * @param  array<string, int|null>  $mapping
     * @return array<string, string>
     */
    private function extractRowValues(array $cells, array $mapping): array
    {
        $out = [];
        foreach (self::SUPPORTED_FIELDS as $field) {
            $idx = $mapping[$field] ?? null;
            $out[$field] = ($idx !== null && isset($cells[$idx])) ? trim((string) $cells[$idx]) : '';
        }

        return $out;
    }

    /**
     * @param  array<string, string>  $record
     */
    private function isEmptyRecord(array $record): bool
    {
        foreach ($record as $val) {
            if (trim((string) $val) !== '') {
                return false;
            }
        }

        return true;
    }

    /**
     * حساب السعر الفعلي (سعر العرض إن وجد، وإلا السعر الأساسي) والسعر قبل الخصم.
     *
     * @return array{unit_price: float|null, old_price: float|null}
     */
    private function resolveRowPricing(string $baseRaw, string $saleRaw, string $oldRaw): array
    {
        $base = $this->parsePrice($baseRaw);
        $sale = $this->parsePrice($saleRaw);
        $old = $this->parsePrice($oldRaw);

        if ($sale !== null && $sale > 0 && ($base === null || $sale < $base)) {
            return [
                'unit_price' => $sale,
                'old_price' => ($base !== null && $base > $sale) ? $base : null,
            ];
        }

        if ($base !== null && $base > 0) {
            return [
                'unit_price' => $base,
                'old_price' => ($old !== null && $old > $base) ? $old : null,
            ];
        }

        return ['unit_price' => null, 'old_price' => null];
    }

    private function parsePrice(string $raw): ?float
    {
        $clean = $this->toAsciiDigits(trim($raw));
        if ($clean === '') {
            return null;
        }

        $clean = str_replace([',', '٬', '٫'], ['', '', '.'], $clean);
        if (! preg_match('/(\d+(?:\.\d+)?)/', $clean, $m)) {
            return null;
        }

        $val = round((float) $m[1], 2);

        return $val > 0 ? $val : null;
    }

    private function toAsciiDigits(string $text): string
    {
        $arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        $ascii = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

        return str_replace($arabic, $ascii, $text);
    }

    private function cleanText(string $value, int $maxLength): string
    {
        $clean = trim(preg_replace('/\s+/u', ' ', $value) ?? $value);

        return mb_substr($clean, 0, $maxLength);
    }

    private function matchBranch(string $rawBranch, $branches, ?int $defaultBranchId): ?Branch
    {
        $val = trim($rawBranch);
        if ($val !== '') {
            if (is_numeric($val)) {
                $byId = $branches->firstWhere('id', (int) $val);
                if ($byId) {
                    return $byId;
                }
            }
            $lower = mb_strtolower($val);
            $byName = $branches->first(fn (Branch $b) => mb_strtolower(trim($b->name)) === $lower);
            if ($byName) {
                return $byName;
            }
        }

        if ($defaultBranchId) {
            return $branches->firstWhere('id', $defaultBranchId);
        }

        return $branches->first();
    }

    private function matchOrCreateCategory(
        string $rawCategory,
        int $branchId,
        &$categories,
        ?int $defaultCategoryId,
        bool $createIfMissing
    ): ?Category {
        $val = trim($rawCategory);
        if ($val !== '') {
            if (is_numeric($val)) {
                $byId = $categories->firstWhere('id', (int) $val);
                if ($byId) {
                    return $byId;
                }
            }

            // دعم مسار التصنيفات الهرمي مثل: "العناية ← العناية الشخصية ← مستلزمات طبية"
            $segments = $this->parseCategoryHierarchy($val);
            if (! empty($segments)) {
                $parentId = null;
                $current = null;

                foreach ($segments as $segmentName) {
                    $segLower = mb_strtolower($segmentName);
                    $matched = $categories->first(function (Category $c) use ($branchId, $parentId, $segLower) {
                        if ((int) $c->branch_id !== $branchId) {
                            return false;
                        }
                        if ($parentId !== null && (int) $c->parent_id !== $parentId) {
                            return false;
                        }

                        return mb_strtolower(trim($c->name)) === $segLower;
                    });

                    if (! $matched) {
                        $matched = $categories->first(function (Category $c) use ($parentId, $segLower) {
                            if ($parentId !== null && (int) $c->parent_id !== $parentId) {
                                return false;
                            }

                            return mb_strtolower(trim($c->name)) === $segLower;
                        });
                    }

                    if (! $matched && $createIfMissing) {
                        $matched = Category::create([
                            'name' => mb_substr($segmentName, 0, 255),
                            'branch_id' => $branchId,
                            'parent_id' => $parentId,
                            'sort' => 99,
                            'is_active' => true,
                        ]);
                        $categories->push($matched);
                    }

                    if (! $matched) {
                        // عند عدم التفعيل للإنشاء التلقائي، ابحث بأدق اسم فرعي موجود (من آخر مستوى لأول مستوى)
                        foreach (array_reverse($segments) as $fallbackName) {
                            $fbLower = mb_strtolower($fallbackName);
                            $found = $categories->first(
                                fn (Category $c) => (int) $c->branch_id === $branchId && mb_strtolower(trim($c->name)) === $fbLower
                            ) ?? $categories->first(
                                fn (Category $c) => mb_strtolower(trim($c->name)) === $fbLower
                            );
                            if ($found) {
                                return $found;
                            }
                        }

                        break;
                    }

                    $current = $matched;
                    $parentId = $matched->id;
                }

                if ($current) {
                    return $current;
                }
            }
        }

        if ($defaultCategoryId) {
            return $categories->firstWhere('id', $defaultCategoryId);
        }

        return null;
    }

    /**
     * تفكيك مسار التصنيفات الهرمي (يدعم ← ، -> ، > ، › ، /).
     *
     * @return array<int, string>
     */
    private function parseCategoryHierarchy(string $rawCategory): array
    {
        // إذا احتوى على أكثر من مسار مفصول بفاصلة، نأخذ المسار الأول الرئيسي
        $primaryPath = preg_split('/[,،]+/u', $rawCategory)[0] ?? $rawCategory;
        $parts = preg_split('/\s*(?:←|→|<-|->|=>|>|›|»|\/)\s*/u', trim($primaryPath));
        if (! is_array($parts)) {
            return [];
        }

        return array_values(array_filter(array_map('trim', $parts), fn ($p) => $p !== ''));
    }

    /**
     * @return array{zip: ZipArchive|null, map: array<string, string>}
     */
    private function indexImagesZip(?UploadedFile $imagesZip): array
    {
        if (! $imagesZip) {
            return ['zip' => null, 'map' => []];
        }

        $path = $imagesZip->getRealPath();
        if (! $path || ! is_file($path)) {
            return ['zip' => null, 'map' => []];
        }

        $zip = new ZipArchive();
        if ($zip->open($path) !== true) {
            throw new RuntimeException('تعذر فتح ملف الصور المضغوط (.zip).');
        }

        $map = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $statName = $zip->getNameIndex($i);
            if ($statName === false || str_ends_with($statName, '/')) {
                continue;
            }
            $ext = strtolower(pathinfo($statName, PATHINFO_EXTENSION) ?: '');
            if (! in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'], true)) {
                continue;
            }

            $base = mb_strtolower(basename($statName));
            $stem = mb_strtolower(pathinfo($statName, PATHINFO_FILENAME));
            $map[$base] = $statName;
            if (! isset($map[$stem])) {
                $map[$stem] = $statName;
            }
        }

        return ['zip' => $zip, 'map' => $map];
    }

    private function closeZip(?ZipArchive $zip): void
    {
        if ($zip) {
            @$zip->close();
        }
    }

    /**
     * @param  array<string, string>  $zipMap
     */
    private function findZipEntry(array $zipMap, string $rawImage, string $code): ?string
    {
        if (empty($zipMap)) {
            return null;
        }

        if ($rawImage !== '') {
            $base = mb_strtolower(basename($rawImage));
            $stem = mb_strtolower(pathinfo($rawImage, PATHINFO_FILENAME));
            if (isset($zipMap[$base])) {
                return $zipMap[$base];
            }
            if ($stem !== '' && isset($zipMap[$stem])) {
                return $zipMap[$stem];
            }
        }

        if ($code !== '') {
            $codeKey = mb_strtolower(trim($code));
            if (isset($zipMap[$codeKey])) {
                return $zipMap[$codeKey];
            }
        }

        return null;
    }

    /**
     * @param  array{data: string, ext: string}|null  $embeddedImage
     * @param  array<string, string>  $zipMap
     * @return array{url: string|null, saved_locally: bool}
     */
    private function resolveRowImage(
        string $rawImage,
        string $code,
        ?array $embeddedImage,
        ?ZipArchive $zip,
        array $zipMap,
        bool $downloadRemote,
        string $baseHost
    ): array {
        // 1. صورة مدمجة داخل ملف Excel
        if ($embeddedImage !== null && $embeddedImage['data'] !== '') {
            $saved = $this->saveBinaryImage($embeddedImage['data'], $embeddedImage['ext'], $baseHost);
            if ($saved !== null) {
                return ['url' => $saved, 'saved_locally' => true];
            }
        }

        // 2. صورة مطابقة داخل أرشيف ZIP
        if ($zip && ! empty($zipMap)) {
            $zipEntry = $this->findZipEntry($zipMap, $rawImage, $code);
            if ($zipEntry !== null) {
                $bytes = $zip->getFromName($zipEntry);
                if ($bytes !== false && $bytes !== '') {
                    $ext = strtolower(pathinfo($zipEntry, PATHINFO_EXTENSION) ?: 'jpg');
                    $saved = $this->saveBinaryImage($bytes, $ext, $baseHost);
                    if ($saved !== null) {
                        return ['url' => $saved, 'saved_locally' => true];
                    }
                }
            }
        }

        // 3. رابط صورة (أو رابط Google Drive لصورة — وإذا كانت عدة روابط مفصولة بفاصلة نأخذ الأولى)
        $firstImageCandidate = $rawImage !== '' ? trim(explode(',', $rawImage)[0]) : '';
        if ($firstImageCandidate !== '' && preg_match('/^https?:\/\/.+/i', $firstImageCandidate)) {
            $normalizedUrl = $this->normalizeGoogleImageUrl($firstImageCandidate);
            if ($downloadRemote) {
                try {
                    $this->assertSafePublicUrl($normalizedUrl);
                    $res = Http::timeout(12)
                        ->withOptions(['allow_redirects' => ['max' => 4]])
                        ->withHeaders(['User-Agent' => 'Mozilla/5.0 (compatible; B2BStoreImporter/1.0)'])
                        ->get($normalizedUrl);

                    if ($res->successful() && strlen($res->body()) > 100 && strlen($res->body()) <= 5 * 1024 * 1024) {
                        $saved = $this->saveBinaryImage($res->body(), 'jpg', $baseHost);
                        if ($saved !== null) {
                            return ['url' => $saved, 'saved_locally' => true];
                        }
                    }
                } catch (\Throwable) {
                    // نسقط بهدوء إلى حفظ الرابط المباشر إذا تعذر التحميل
                }
            }

            return ['url' => $normalizedUrl, 'saved_locally' => false];
        }

        return ['url' => null, 'saved_locally' => false];
    }

    private function normalizeGoogleImageUrl(string $url): string
    {
        if (preg_match('/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i', $url, $m)) {
            return "https://drive.google.com/uc?export=download&id={$m[1]}";
        }
        if (preg_match('/drive\.google\.com\/open\?[^#]*id=([a-zA-Z0-9_-]+)/i', $url, $m)) {
            return "https://drive.google.com/uc?export=download&id={$m[1]}";
        }

        return $url;
    }

    private function saveBinaryImage(string $bytes, string $fallbackExt, string $baseHost): ?string
    {
        if (strlen($bytes) > 5 * 1024 * 1024) {
            return null;
        }

        $info = @getimagesizefromstring($bytes);
        if (! is_array($info) || empty($info['mime'])) {
            return null;
        }

        $mimeMap = [
            'image/jpeg' => 'jpg',
            'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
        ];
        $ext = $mimeMap[strtolower($info['mime'])] ?? $fallbackExt;
        if (! in_array($ext, ['jpg', 'png', 'webp', 'gif'], true)) {
            return null;
        }

        $dir = public_path('uploads/products');
        if (! is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }

        $filename = 'prd_' . Str::random(14) . '_' . time() . '.' . $ext;
        if (file_put_contents($dir . DIRECTORY_SEPARATOR . $filename, $bytes) === false) {
            return null;
        }

        $cleanHost = rtrim($baseHost, '/');
        if (str_starts_with($cleanHost, 'http://') && ! preg_match('/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i', $cleanHost)) {
            $cleanHost = 'https://' . substr($cleanHost, 7);
        }

        return $cleanHost . '/uploads/products/' . $filename;
    }

    private function assertSafePublicUrl(string $url): void
    {
        $parts = parse_url($url);
        if (! is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
            throw new RuntimeException('الرابط المدخل غير صالح.');
        }

        $scheme = strtolower($parts['scheme']);
        if (! in_array($scheme, ['http', 'https'], true)) {
            throw new RuntimeException('يُسمح فقط بروابط http و https.');
        }

        $host = strtolower($parts['host']);
        if (in_array($host, ['localhost', '127.0.0.1', '::1', '0.0.0.0'], true)) {
            throw new RuntimeException('غير مسموح بالوصول إلى عناوين الخادم المحلية.');
        }

        $ips = @gethostbynamel($host);
        if (is_array($ips)) {
            foreach ($ips as $ip) {
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
                    throw new RuntimeException('غير مسموح باستيراد روابط من شبكات خاصة أو محلية.');
                }
            }
        }
    }
}
