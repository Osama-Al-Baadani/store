<?php

namespace App\Domains\Auth\DTOs;

readonly class RegisterMerchantDTO
{
    public function __construct(
        public string $companyName,
        public string $crNumber,
        public ?string $vatNumber,
        public string $ownerName,
        public string $phone,
        public string $password,
        public string $city,
        public ?string $address = null,
        public ?string $email = null,
        public ?string $crDocumentPath = null,
    ) {}
}

