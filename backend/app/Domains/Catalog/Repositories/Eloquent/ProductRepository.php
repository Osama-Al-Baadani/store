<?php

namespace App\Domains\Catalog\Repositories\Eloquent;

use App\Domains\Catalog\DTOs\ProductFilterDTO;
use App\Domains\Catalog\Repositories\Contracts\ProductRepositoryInterface;
use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProductRepository implements ProductRepositoryInterface
{
    public function getFilteredProducts(ProductFilterDTO $filter): LengthAwarePaginator
    {
        $query = Product::with(['category', 'packages'])
            ->where('branch_id', $filter->branchId)
            ->active();

        if ($filter->categoryId !== null) {
            $childIds = \App\Models\Category::where('parent_id', $filter->categoryId)->pluck('id')->all();
            $categoryIds = array_merge([$filter->categoryId], $childIds);
            $query->whereIn('category_id', $categoryIds);
        }

        if ($filter->search !== null && $filter->search !== '') {
            $search = '%' . $filter->search . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('code', 'like', $search)
                  ->orWhere('barcode', 'like', $search);
            });
        }

        if ($filter->isNew !== null) {
            $query->where('is_new', $filter->isNew);
        }

        if ($filter->isFeatured !== null) {
            $query->where('is_featured', $filter->isFeatured);
        }

        if ($filter->isComingSoon !== null) {
            $query->where('is_coming_soon', $filter->isComingSoon);
        }

        return $query->orderBy('sort')->orderByDesc('id')->paginate($filter->perPage);
    }

    public function findByIdWithPackages(int $id): ?Product
    {
        return Product::with(['category', 'packages', 'branch'])
            ->active()
            ->find($id);
    }
}

