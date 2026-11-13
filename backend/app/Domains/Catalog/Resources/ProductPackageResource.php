<?php

namespace App\Domains\Catalog\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductPackageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'unit' => $this->unit,
            'pack_quantity' => $this->pack_quantity,
            'step_quantity' => $this->step_quantity,
            'unit_price' => (float) $this->unit_price,
            'old_price' => $this->old_price ? (float) $this->old_price : null,
            'discount_percent' => $this->discount_percent,
            'is_default' => $this->is_default,
        ];
    }
}

