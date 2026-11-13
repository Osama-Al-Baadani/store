<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductPackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'name',
        'unit',
        'pack_quantity',
        'step_quantity',
        'unit_price',
        'old_price',
        'is_default',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'pack_quantity' => 'integer',
            'step_quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'old_price' => 'decimal:2',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function getDiscountPercentAttribute(): int
    {
        if ($this->old_price && $this->old_price > $this->unit_price) {
            return (int) round((($this->old_price - $this->unit_price) / $this->old_price) * 100);
        }
        return 0;
    }
}

