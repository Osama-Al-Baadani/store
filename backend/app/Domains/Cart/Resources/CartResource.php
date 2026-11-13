<?php

namespace App\Domains\Cart\Resources;

use App\Domains\Cart\Services\CartCalculationService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $calculationService = app(CartCalculationService::class);
        $summary = $calculationService->calculate($this->resource);

        return [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'items' => CartItemResource::collection($this->whenLoaded('items')),
            'summary' => $summary,
        ];
    }
}

