<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'category_id',
        'code',
        'barcode',
        'name',
        'brand',
        'description',
        'image',
        'is_new',
        'is_featured',
        'is_coming_soon',
        'is_active',
        'sort',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        $raw = trim((string) ($this->image ?? ''));
        if ($raw === '') {
            return null;
        }

        // Strip accidental "/storage/http..." prefix if ever stored
        if (preg_match('/\/storage\/(https?:\/\/.+)$/i', $raw, $m)) {
            return $this->upgradeHttpsIfRemote($m[1]);
        }

        if (preg_match('/^https?:\/\/.+$/i', $raw)) {
            return $this->upgradeHttpsIfRemote($raw);
        }

        $baseUrl = request() ? request()->getSchemeAndHttpHost() : rtrim((string) config('app.url'), '/');
        $baseUrl = $this->upgradeHttpsIfRemote($baseUrl);

        if (str_starts_with(ltrim($raw, '/'), 'uploads/')) {
            return rtrim($baseUrl, '/') . '/' . ltrim($raw, '/');
        }

        return rtrim($baseUrl, '/') . '/storage/' . ltrim($raw, '/');
    }

    private function upgradeHttpsIfRemote(string $url): string
    {
        if (str_starts_with($url, 'http://') && ! preg_match('/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i', $url)) {
            return 'https://' . substr($url, 7);
        }

        return $url;
    }

    protected function casts(): array
    {
        return [
            'is_new' => 'boolean',
            'is_featured' => 'boolean',
            'is_coming_soon' => 'boolean',
            'is_active' => 'boolean',
            'sort' => 'integer',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function packages(): HasMany
    {
        return $this->hasMany(ProductPackage::class)->where('is_active', true);
    }

    public function defaultPackage(): HasOne
    {
        return $this->hasOne(ProductPackage::class)->ofMany([
            'is_default' => 'max',
            'id' => 'min',
        ]);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('is_active', true)->where('is_coming_soon', false);
    }
}

