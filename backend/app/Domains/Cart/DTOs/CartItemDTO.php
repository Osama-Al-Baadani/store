<?php

namespace App\Domains\Cart\DTOs;

readonly class CartItemDTO
{
    public function __construct(
        public int $branchId,
        public int $packageId,
        public int $quantity,
    ) {}
}

