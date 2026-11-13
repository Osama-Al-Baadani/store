<?php

namespace App\Domains\Cart\Requests;

use App\Domains\Cart\DTOs\CartItemDTO;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'package_id' => ['required', 'integer', 'exists:product_packages,id'],
            'quantity' => ['required', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'branch_id.required' => 'الفرع مطلوب',
            'package_id.required' => 'باقة التعبئة / الشد مطلوبة',
            'quantity.required' => 'الكمية مطلوبة',
            'quantity.min' => 'الكمية لا يمكن أن تكون سالبة',
        ];
    }

    public function toDTO(): CartItemDTO
    {
        return new CartItemDTO(
            branchId: (int) $this->input('branch_id'),
            packageId: (int) $this->input('package_id'),
            quantity: (int) $this->input('quantity'),
        );
    }
}

