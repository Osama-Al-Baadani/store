<?php

namespace App\Domains\Order\Requests;

use App\Domains\Order\DTOs\CheckoutDTO;
use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'branch_id.required' => 'الفرع مطلوب لإتمام الطلب',
            'notes.max' => 'الملاحظات يجب ألا تتجاوز 500 حرف',
        ];
    }

    public function toDTO(): CheckoutDTO
    {
        return new CheckoutDTO(
            branchId: (int) $this->input('branch_id'),
            notes: $this->input('notes') ? (string) $this->input('notes') : null,
        );
    }
}

