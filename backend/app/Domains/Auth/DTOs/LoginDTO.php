<?php

namespace App\Domains\Auth\DTOs;

readonly class LoginDTO
{
    public function __construct(
        public string $phone,
        public string $password,
        public ?string $deviceName = 'nextjs-client',
    ) {}
}

