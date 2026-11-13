<?php

namespace App\Domains\Auth\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class MerchantProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_name' => $this->company_name,
            'cr_number' => $this->cr_number,
            'vat_number' => $this->vat_number,
            'owner_name' => $this->owner_name,
            'city' => $this->city,
            'address' => $this->address,
            'customer_code' => $this->customer_code,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'is_active' => $this->isActive(),
            'cr_document_url' => $this->cr_document_path ? Storage::disk('public')->url($this->cr_document_path) : null,
            'approved_at' => $this->approved_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}

