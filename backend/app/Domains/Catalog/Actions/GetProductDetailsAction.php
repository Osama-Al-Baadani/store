<?php

namespace App\Domains\Catalog\Actions;

use App\Domains\Catalog\Repositories\Contracts\ProductRepositoryInterface;
use App\Models\Product;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class GetProductDetailsAction
{
    public function __construct(
        protected ProductRepositoryInterface $productRepository
    ) {}

    public function execute(int $productId): Product
    {
        $product = $this->productRepository->findByIdWithPackages($productId);

        if (! $product) {
            throw new NotFoundHttpException('الصنف غير متوفر أو غير مفعّل حالياً.');
        }

        return $product;
    }
}

