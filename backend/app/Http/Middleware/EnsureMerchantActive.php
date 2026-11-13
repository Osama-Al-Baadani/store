<?php

namespace App\Http\Middleware;

use App\Enums\CustomerStatus;
use App\Traits\ApiResponseTrait;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMerchantActive
{
    use ApiResponseTrait;

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $this->errorResponse('غير مصرح، يرجى تسجيل الدخول أولاً.', null, 401);
        }

        if ($user->isAdmin()) {
            return $next($request);
        }

        $profile = $user->merchantProfile;

        if (! $profile) {
            return $this->errorResponse('لا يوجد ملف منشأة تجارية مرتبط بهذا الحساب.', null, 403);
        }

        if ($profile->status !== CustomerStatus::ACTIVE) {
            $msg = match ($profile->status) {
                CustomerStatus::PENDING => 'حساب منشأتك ما زال قيد مراجعة الإدارة والتحقق من السجل التجاري.',
                CustomerStatus::REJECTED => 'تم رفض طلب تسجيل المنشأة. ' . ($profile->admin_note ? 'السبب: ' . $profile->admin_note : ''),
                CustomerStatus::SUSPENDED => 'تم إيقاف حساب هذه المنشأة من قبل الإدارة.',
                default => 'الحساب غير مفعّل للتعاملات التجارية.',
            };

            return $this->errorResponse($msg, [
                'status' => $profile->status->value,
                'status_label' => $profile->status->label(),
            ], 403);
        }

        return $next($request);
    }
}

