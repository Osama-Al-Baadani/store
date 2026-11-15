<?php

namespace App\Domains\Catalog\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'parent_id' => $this->parent_id,
            'name' => $this->name,
            'icon_url' => $this->icon ? Storage::disk('public')->url($this->icon) : null,
            'sort' => $this->sort,
            'products_count' => $this->when(
                isset($this->recursive_products_count) || isset($this->products_count),
                fn () => (int) ($this->recursive_products_count ?? $this->products_count ?? 0)
            ),
            'children' => CategoryResource::collection($this->whenLoaded('children')),
        ];
    }
}

