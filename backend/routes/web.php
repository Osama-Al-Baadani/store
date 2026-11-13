<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => config('app.name', 'كتالوج الجملة'),
        'environment' => config('app.env'),
        'api_version' => 'v1',
        'status' => 'online',
        'endpoints' => [
            'auth' => '/api/v1/auth',
            'branches' => '/api/v1/branches',
            'categories' => '/api/v1/categories',
            'products' => '/api/v1/products',
            'cart' => '/api/v1/cart',
            'orders' => '/api/v1/orders',
        ],
        'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),
    ]);
});
