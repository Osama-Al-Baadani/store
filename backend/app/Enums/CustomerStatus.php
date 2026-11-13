<?php

namespace App\Enums;

enum CustomerStatus: string
{
    case PENDING = 'pending';
    case ACTIVE = 'active';
    case REJECTED = 'rejected';
    case SUSPENDED = 'suspended';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'بانتظار المراجعة والتفعيل',
            self::ACTIVE => 'مفعّل',
            self::REJECTED => 'مرفوض',
            self::SUSPENDED => 'موقوف',
        };
    }

    public function isAllowedToTrade(): bool
    {
        return $this === self::ACTIVE;
    }
}

