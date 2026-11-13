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
            'children' => CategoryResource::collection($this->whenLoaded('children')),
        ];
    }
}

