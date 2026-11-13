<?php

namespace App\Enums;

enum UserRole: string
{
    case MERCHANT = 'merchant';
    case ADMIN = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::MERCHANT => 'تاجر / منشأة',
            self::ADMIN => 'إدارة النظام',
        };
    }
}

