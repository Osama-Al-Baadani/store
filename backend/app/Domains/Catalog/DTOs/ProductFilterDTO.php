<?php

namespace App\Domains\Catalog\DTOs;

readonly class ProductFilterDTO
{
    public function __construct(
        public int $branchId,
        public ?int $categoryId = null,
        public ?string $search = null,
        public ?bool $isNew = null,
        public ?bool $isFeatured = null,
        public ?bool $isComingSoon = null,
        public int $perPage = 20,
    ) {}
}

