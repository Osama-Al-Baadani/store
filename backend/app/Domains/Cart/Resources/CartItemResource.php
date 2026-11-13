<?php

namespace App\Domains\Cart\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CartItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $package = $this->package;
        $product = $package?->product;

        $unitPrice = (float) ($package?->unit_price ?? 0);
        $lineTotal = round($unitPrice * $this->quantity, 2);

        return [
            'id' => $this->id,
            'package_id' => $this->product_package_id,
            'product_id' => $product?->id,
            'product_name' => $product?->name,
            'product_code' => $product?->code,
            'barcode' => $product?->barcode,
            'image_url' => $product?->image ? Storage::disk('public')->url($product->image) : null,
            'package_name' => $package?->name,
            'unit' => $package?->unit,
            'pack_quantity' => $package?->pack_quantity,
            'step_quantity' => $package?->step_quantity,
            'unit_price' => $unitPrice,
            'quantity' => $this->quantity,
            'line_total' => $lineTotal,
        ];
    }
}

