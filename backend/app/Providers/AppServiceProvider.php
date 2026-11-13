<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            \App\Domains\Catalog\Repositories\Contracts\ProductRepositoryInterface::class,
            \App\Domains\Catalog\Repositories\Eloquent\ProductRepository::class
        );

        $this->app->bind(
            \App\Domains\Order\Repositories\Contracts\OrderRepositoryInterface::class,
            \App\Domains\Order\Repositories\Eloquent\OrderRepository::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
