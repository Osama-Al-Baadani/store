<?php

namespace App\Domains\Catalog\Requests;

use App\Domains\Catalog\DTOs\ProductFilterDTO;
use Illuminate\Foundation\Http\FormRequest;

class GetProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'brand' => ['nullable', 'string', 'max:120'],
            'search' => ['nullable', 'string', 'max:100'],
            'is_new' => ['nullable', 'boolean'],
            'is_featured' => ['nullable', 'boolean'],
            'is_coming_soon' => ['nullable', 'boolean'],
            'on_sale' => ['nullable', 'boolean'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0'],
            'sort' => ['nullable', 'in:default,price_asc,price_desc,discount_desc,newest'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function toDTO(): ProductFilterDTO
    {
        return new ProductFilterDTO(
            branchId: (int) $this->input('branch_id'),
            categoryId: $this->input('category_id') ? (int) $this->input('category_id') : null,
            brand: $this->filled('brand') ? trim((string) $this->input('brand')) : null,
            search: $this->input('search') ? (string) $this->input('search') : null,
            isNew: $this->has('is_new') ? $this->boolean('is_new') : null,
            isFeatured: $this->has('is_featured') ? $this->boolean('is_featured') : null,
            isComingSoon: $this->has('is_coming_soon') ? $this->boolean('is_coming_soon') : null,
            onSale: $this->has('on_sale') ? $this->boolean('on_sale') : null,
            minPrice: $this->filled('min_price') ? (float) $this->input('min_price') : null,
            maxPrice: $this->filled('max_price') ? (float) $this->input('max_price') : null,
            sort: (string) $this->input('sort', 'default'),
            perPage: (int) $this->input('per_page', 20),
        );
    }
}

