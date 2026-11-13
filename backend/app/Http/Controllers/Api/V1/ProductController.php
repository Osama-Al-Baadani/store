<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Catalog\Actions\GetBranchCatalogAction;
use App\Domains\Catalog\Actions\GetProductDetailsAction;
use App\Domains\Catalog\Requests\GetProductsRequest;
use App\Domains\Catalog\Resources\ProductResource;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;

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

    public function show(int $id, GetProductDetailsAction $action): JsonResponse
    {
        $product = $action->execute($id);

        return $this->successResponse(
            new ProductResource($product),
            'تفاصيل الصنف.'
        );
    }
}

