<?php

namespace App\Domains\Order\DTOs;

readonly class CheckoutDTO
{
    public function __construct(
        public int $branchId,
        public ?string $notes = null,
    ) {}
}

