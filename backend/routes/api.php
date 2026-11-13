<?php

use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\AdvertisementController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BranchController;
    use App\Http\Controllers\Api\V1\CartController;
    use App\Http\Controllers\Api\V1\CategoryController;
    use App\Http\Controllers\Api\V1\OrderController;
    use App\Http\Controllers\Api\V1\ProductController;
    use Illuminate\Support\Facades\Route;

    Route::prefix('v1')->group(function () {

        // ===== مسارات المصادقة العامة (Public Auth) =====
        Route::prefix('auth')->group(function () {
            Route::post('/register', [AuthController::class, 'register']);
            Route::post('/login', [AuthController::class, 'login']);
        });

        // ===== رابط الفاتورة العام الموقّع (للمشاركة عبر واتساب) =====
        Route::get('/invoices/{order}', [OrderController::class, 'publicInvoice'])
            ->middleware('signed')
            ->name('invoice.public');

        // ===== مسارات عامة للتصفح (Public Catalog & Branches) =====
        Route::get('/branches', [BranchController::class, 'index']);
        Route::get('/branches/{id}', [BranchController::class, 'show']);
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/products/{id}', [ProductController::class, 'show']);
        Route::get('/advertisements', [AdvertisementController::class, 'index']);

        // ===== المسارات المحمية بتوكن Sanctum =====
        Route::middleware('auth:sanctum')->group(function () {

            // الملف الشخصي والخروج ومحاكاة الاعتماد التجريبي
            Route::prefix('auth')->group(function () {
                Route::get('/me', [AuthController::class, 'me']);
                Route::post('/logout', [AuthController::class, 'logout']);
                Route::post('/simulate-approval', [AuthController::class, 'simulateApproval']);
            });

            // ===== مسارات التداول والطلب (محمية باشتراط تفعيل حساب المنشأة) =====
            Route::middleware('merchant.active')->group(function () {

                // سلة التسوق
                Route::prefix('cart')->group(function () {
                    Route::get('/', [CartController::class, 'show']);
                    Route::post('/items', [CartController::class, 'updateItem']);
                    Route::delete('/', [CartController::class, 'clear']);
                });

                // الطلبات والفواتير
                Route::prefix('orders')->group(function () {
                    Route::get('/', [OrderController::class, 'index']);
                Route::post('/checkout', [OrderController::class, 'checkout']);
                Route::get('/{id}', [OrderController::class, 'show']);
                Route::get('/{id}/invoice', [OrderController::class, 'downloadInvoice']);
            });
        });

        // ===== مسارات إدارة المنصة ولوحة التحكم (خاص بالـ Admin) =====
        Route::prefix('admin')->middleware('admin')->group(function () {
            Route::get('/stats', [AdminController::class, 'stats']);
            Route::get('/merchants', [AdminController::class, 'merchants']);
            Route::post('/merchants/{id}/approve', [AdminController::class, 'approveMerchant']);
            Route::post('/merchants/{id}/reject', [AdminController::class, 'rejectMerchant']);
            Route::get('/orders', [AdminController::class, 'orders']);
            Route::patch('/orders/{id}/status', [AdminController::class, 'updateOrderStatus']);
            Route::get('/products', [AdminController::class, 'products']);
            Route::post('/products', [AdminController::class, 'storeProduct']);
            Route::match(['patch', 'post'], '/products/{id}', [AdminController::class, 'updateProduct']);
            Route::delete('/products/{id}', [AdminController::class, 'deleteProduct']);

            Route::get('/categories', [AdminController::class, 'categories']);
            Route::post('/categories', [AdminController::class, 'storeCategory']);
            Route::patch('/categories/{id}', [AdminController::class, 'updateCategory']);
            Route::delete('/categories/{id}', [AdminController::class, 'deleteCategory']);

            Route::get('/branches', [AdminController::class, 'branches']);
            Route::post('/branches', [AdminController::class, 'storeBranch']);
            Route::patch('/branches/{id}', [AdminController::class, 'updateBranch']);
            Route::delete('/branches/{id}', [AdminController::class, 'deleteBranch']);
            Route::get('/users', [AdminController::class, 'users']);
            Route::post('/users/{id}/password', [AdminController::class, 'resetUserPassword']);

            Route::get('/advertisements', [AdminController::class, 'advertisements']);
            Route::post('/advertisements', [AdminController::class, 'storeAdvertisement']);
            Route::match(['patch', 'post'], '/advertisements/{id}', [AdminController::class, 'updateAdvertisement']);
            Route::delete('/advertisements/{id}', [AdminController::class, 'deleteAdvertisement']);
        });
    });
});
