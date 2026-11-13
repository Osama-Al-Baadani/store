<?php

namespace App\Domains\Order\Resources;

use App\Domains\Auth\Resources\MerchantProfileResource;
use App\Domains\Catalog\Resources\BranchResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Domains\Order\Services\InvoicePdfService;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'merchant' => new MerchantProfileResource($this->whenLoaded('user', fn () => $this->user->merchantProfile)),
            'items_count' => $this->items_count,
            'total_quantity' => $this->total_quantity,
            'subtotal' => (float) $this->subtotal,
            'vat_rate' => (float) $this->vat_rate,
            'vat_amount' => (float) $this->vat_amount,
            'total' => (float) $this->total,
            'notes' => $this->notes,
            'invoice_pdf_url' => app(InvoicePdfService::class)->publicUrl($this->resource),
            'invoice_download_url' => app(InvoicePdfService::class)->publicUrl($this->resource, true),
            'whatsapp_share' => $this->buildWhatsAppShareData(),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toISOString(),
            'created_at_formatted' => $this->created_at?->format('Y/m/d h:i A'),
        ];
    }

    protected function buildWhatsAppShareData(): array
    {
        $merchant = $this->user?->merchantProfile;
        $customerName = $merchant?->company_name ?? $this->user?->name ?? 'عميل جملة';
        $branchName = $this->branch?->name ?? 'المخازن الاقتصادية';
        $pdfUrl = app(InvoicePdfService::class)->publicUrl($this->resource);

        $text = "📦 *طلبية عميل جديدة للتجهيز*\n"
              . "━━━━━━━━━━━━━━━━━━━━\n"
              . "📋 *رقم الطلب:* #{$this->order_number}\n"
              . "👤 *العميل:* {$customerName}\n"
              . "🏬 *المستودع:* {$branchName}\n"
              . "🔢 *إجمالي القطع:* {$this->total_quantity} قطعة\n"
              . "💰 *الصافي شامل الضريبة:* " . number_format((float) $this->total, 2) . " ر.س\n"
              . ($pdfUrl ? "📄 *رابط الفاتورة (PDF):*\n{$pdfUrl}\n" : "")
              . "━━━━━━━━━━━━━━━━━━━━\n"
              . "يرجى بدء تجهيز الطلب في المستودع.";

        return [
            'text' => $text,
            'url' => 'https://api.whatsapp.com/send?text=' . rawurlencode($text),
        ];
    }
}

