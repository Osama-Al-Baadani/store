<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Advertisement extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'subtitle',
        'badge_text',
        'image_path',
        'placement',
        'link_url',
        'sort',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort' => 'integer',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): string
    {
        $path = trim((string) ($this->image_path ?? ''));
        if ($path === '') {
            return '';
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            if (str_starts_with($path, 'http://') && ! preg_match('/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i', $path)) {
                return 'https://' . substr($path, 7);
            }
            return $path;
        }

        $baseUrl = request() ? request()->getSchemeAndHttpHost() : rtrim((string) config('app.url'), '/');
        if (str_starts_with($baseUrl, 'http://') && ! preg_match('/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i', $baseUrl)) {
            $baseUrl = 'https://' . substr($baseUrl, 7);
        }

        return rtrim($baseUrl, '/') . '/' . ltrim($path, '/');
    }
}

