<?php

namespace App\Domains\Catalog\Repositories\Eloquent;

use App\Domains\Catalog\DTOs\ProductFilterDTO;
use App\Domains\Catalog\Repositories\Contracts\ProductRepositoryInterface;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPackage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProductRepository implements ProductRepositoryInterface
{
    /**
     * جمع معرفات التصنيف وجميع التصنيفات الفرعية تحته (متعدد المستويات).
     *
     * @return array<int, int>
     */
    public static function resolveDescendantCategoryIds(int $categoryId): array
    {
        $allCategories = Category::query()->select(['id', 'parent_id'])->get();
        $childrenMap = [];
        foreach ($allCategories as $cat) {
            if ($cat->parent_id !== null) {
                $childrenMap[(int) $cat->parent_id][] = (int) $cat->id;
            }
        }

        $ids = [$categoryId];
        $queue = [$categoryId];
        while ($queue !== []) {
            $current = array_shift($queue);
            foreach ($childrenMap[$current] ?? [] as $childId) {
                if (! in_array($childId, $ids, true)) {
                    $ids[] = $childId;
                    $queue[] = $childId;
                }
            }
        }

        return $ids;
    }

    public function getFilteredProducts(ProductFilterDTO $filter): LengthAwarePaginator
    {
        $query = Product::with(['category.parent.parent', 'packages'])
            ->where('branch_id', $filter->branchId)
            ->active();

        if ($filter->categoryId !== null) {
            $query->whereIn('category_id', self::resolveDescendantCategoryIds($filter->categoryId));
        }

        if ($filter->brand !== null && $filter->brand !== '') {
            $query->where('brand', $filter->brand);
        }

        if ($filter->search !== null && $filter->search !== '') {
            $search = '%' . $filter->search . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('brand', 'like', $search)
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

        if ($filter->onSale === true) {
            $query->where('is_coming_soon', false)
                ->whereHas('packages', fn ($q) => $q->whereNotNull('old_price')->whereColumn('old_price', '>', 'unit_price'));
        }

        if ($filter->minPrice !== null || $filter->maxPrice !== null) {
            $query->whereHas('packages', function ($q) use ($filter) {
                if ($filter->minPrice !== null) {
                    $q->where('unit_price', '>=', $filter->minPrice);
                }
                if ($filter->maxPrice !== null) {
                    $q->where('unit_price', '<=', $filter->maxPrice);
                }
            });
        }

        if ($filter->sort === 'price_asc' || $filter->sort === 'price_desc') {
            $priceSubquery = ProductPackage::selectRaw('MIN(unit_price)')
                ->whereColumn('product_packages.product_id', 'products.id');
            $query->orderBy($priceSubquery, $filter->sort === 'price_asc' ? 'asc' : 'desc');
        } elseif ($filter->sort === 'discount_desc') {
            $discountSubquery = ProductPackage::selectRaw('COALESCE(MAX(CASE WHEN old_price > unit_price AND old_price > 0 THEN ((old_price - unit_price) / old_price) * 100 ELSE 0 END), 0)')
                ->whereColumn('product_packages.product_id', 'products.id');
            $query->orderBy($discountSubquery, 'desc');
        } elseif ($filter->sort === 'newest') {
            $query->orderByDesc('is_new')->orderByDesc('id');
        } else {
            $query->orderBy('sort')->orderByDesc('id');
        }

        return $query->paginate($filter->perPage);
    }

    public function findByIdWithPackages(int $id): ?Product
    {
        return Product::with(['category', 'packages', 'branch'])
            ->active()
            ->find($id);
    }
}

