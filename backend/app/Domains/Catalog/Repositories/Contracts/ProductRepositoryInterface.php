<?php

namespace App\Domains\Catalog\Repositories\Contracts;

use App\Domains\Catalog\DTOs\ProductFilterDTO;
use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ProductRepositoryInterface
{
    public function getFilteredProducts(ProductFilterDTO $filter): LengthAwarePaginator;

    public function findByIdWithPackages(int $id): ?Product;
}

