<?php

namespace App\Domains\Catalog\Actions;

use App\Domains\Catalog\DTOs\ProductFilterDTO;
use App\Domains\Catalog\Repositories\Contracts\ProductRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class GetBranchCatalogAction
{
    public function __construct(
        protected ProductRepositoryInterface $productRepository
    ) {}

    public function execute(ProductFilterDTO $filter): LengthAwarePaginator
    {
        return $this->productRepository->getFilteredProducts($filter);
    }
}

