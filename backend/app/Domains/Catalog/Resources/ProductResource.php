<?php

namespace App\Domains\Catalog\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'branch_id' => $this->branch_id,
            'category_id' => $this->category_id,
            'category_name' => $this->category?->name,
            'code' => $this->code,
            'barcode' => $this->barcode,
            'name' => $this->name,
            'description' => $this->description,
            'image_url' => $this->image_url,
            'is_new' => $this->is_new,
            'is_featured' => $this->is_featured,
            'is_coming_soon' => $this->is_coming_soon,
            'packages' => ProductPackageResource::collection($this->whenLoaded('packages')),
        ];
    }
}

