<?php

namespace App\Models;

use App\Enums\CustomerStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MerchantProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'company_name',
        'cr_number',
        'vat_number',
        'owner_name',
        'city',
        'address',
        'cr_document_path',
        'status',
        'customer_code',
        'admin_note',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => CustomerStatus::class,
            'approved_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        return $this->status === CustomerStatus::ACTIVE;
    }
}

