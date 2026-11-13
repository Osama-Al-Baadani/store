<?php

namespace App\Domains\Order\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;
use Mpdf\Mpdf;

class InvoicePdfService
{
    /**
     * توليد محتوى PDF للفاتورة (يدعم العربية والاتجاه RTL عبر mPDF)
     */
    public function render(Order $order): string
    {
        $order->loadMissing(['items', 'branch', 'user.merchantProfile']);

        $html = view('invoices.order-receipt', [
            'order' => $order,
            'merchant' => $order->user->merchantProfile,
            'branch' => $order->branch,
        ])->render();

        $defaultConfig = (new ConfigVariables())->getDefaults();
        $defaultFontConfig = (new FontVariables())->getDefaults();

        $tempDir = storage_path('app/mpdf');
        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0775, true);
        }

        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'orientation' => 'P',
            'margin_left' => 12,
            'margin_right' => 12,
            'margin_top' => 12,
            'margin_bottom' => 12,
            'tempDir' => $tempDir,
            'default_font' => 'dejavusans',
            'default_font_size' => 10,
            'autoScriptToLang' => true,
            'autoLangToFont' => true,
            'useOTL' => 0xFF,
            'useKerning' => true,
            'fontDir' => $defaultConfig['fontDir'],
            'fontdata' => $defaultFontConfig['fontdata'],
        ]);

        $mpdf->SetDirectionality('rtl');
        $mpdf->SetTitle('طلبية عميل #' . $order->order_number);
        $mpdf->SetAuthor('شركة المخازن الاقتصادية');
        $mpdf->WriteHTML($html);

        return $mpdf->Output('', 'S');
    }

    /**
     * توليد الملف وتخزينه (لاستخدامه في الأرشفة)
     */
    public function generate(Order $order): string
    {
        $fileName = 'invoices/order-' . $order->order_number . '.pdf';
        Storage::disk('public')->put($fileName, $this->render($order));
        $order->update(['invoice_pdf_path' => $fileName]);

        return $fileName;
    }

    /**
     * رابط عام موقّع للفاتورة (بدون تسجيل دخول) لمشاركته مع المستودع عبر واتساب
     */
    public function publicUrl(Order $order, bool $download = false): string
    {
        return URL::temporarySignedRoute(
            'invoice.public',
            now()->addDays(60),
            ['order' => $order->id, 'download' => $download ? 1 : 0]
        );
    }
}
