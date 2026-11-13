<?php

namespace App\Domains\Order\Resources;

use App\Domains\Catalog\Resources\BranchResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'branch' => new BranchResource($this->whenLoaded('branch')),
            'items_count' => $this->items_count,
            'total_quantity' => $this->total_quantity,
            'total' => (float) $this->total,
            'created_at' => $this->created_at?->toISOString(),
            'created_at_formatted' => $this->created_at?->format('Y/m/d h:i A'),
        ];
    }
}

