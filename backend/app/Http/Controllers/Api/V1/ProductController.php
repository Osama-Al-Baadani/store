<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Catalog\Actions\GetBranchCatalogAction;
use App\Domains\Catalog\Actions\GetProductDetailsAction;
use App\Domains\Catalog\Repositories\Eloquent\ProductRepository;
use App\Domains\Catalog\Requests\GetProductsRequest;
use App\Domains\Catalog\Resources\ProductResource;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    use ApiResponseTrait;

    public function index(GetProductsRequest $request, GetBranchCatalogAction $action): JsonResponse
    {
        $products = $action->execute($request->toDTO());

        return $this->successResponse([
            'items' => ProductResource::collection($products),
            'pagination' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ], 'قائمة المنتجات.');
    }

    public function brands(Request $request): JsonResponse
    {
        $request->validate([
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
        ]);

        $branchId = (int) $request->input('branch_id');
        $categoryIds = $request->filled('category_id')
            ? ProductRepository::resolveDescendantCategoryIds((int) $request->input('category_id'))
            : null;

        $baseQuery = Product::query()
            ->where('branch_id', $branchId)
            ->active()
            ->when($categoryIds !== null, fn ($q) => $q->whereIn('category_id', $categoryIds));

        $brands = (clone $baseQuery)
            ->whereNotNull('brand')
            ->where('brand', '!=', '')
            ->selectRaw('brand, COUNT(*) as products_count')
            ->groupBy('brand')
            ->orderByDesc('products_count')
            ->orderBy('brand')
            ->get()
            ->map(fn ($row) => [
                'brand' => (string) $row->brand,
                'count' => (int) $row->products_count,
            ])
            ->values();

        $offersCount = (clone $baseQuery)
            ->where('is_coming_soon', false)
            ->whereHas('packages', fn ($q) => $q->whereNotNull('old_price')->whereColumn('old_price', '>', 'unit_price'))
            ->count();

        $totalCount = (clone $baseQuery)->count();

        return $this->successResponse([
            'brands' => $brands,
            'offers_count' => $offersCount,
            'total_count' => $totalCount,
        ], 'العلامات التجارية وإحصائيات العروض.');
    }

    public function show(int $id, GetProductDetailsAction $action): JsonResponse
    {
        $product = $action->execute($id);

        return $this->successResponse(
            new ProductResource($product),
            'تفاصيل الصنف.'
        );
    }
}

