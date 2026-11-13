<?php

namespace App\Domains\Auth\Actions;

use App\Domains\Auth\DTOs\LoginDTO;
use App\Enums\CustomerStatus;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginMerchantAction
{
    /**
     * @return array{user: User, token: string, status: CustomerStatus|null}
     */
    public function execute(LoginDTO $dto): array
    {
        $user = User::with('merchantProfile')->where('phone', $dto->phone)->first();

        if (! $user || ! Hash::check($dto->password, $user->password)) {
            throw ValidationException::withMessages([
                'phone' => ['بيانات الدخول غير صحيحة، تأكد من رقم الجوال وكلمة المرور.'],
            ]);
        }

        $profile = $user->merchantProfile;

        if ($user->isMerchant() && $profile) {
            if ($profile->status === CustomerStatus::REJECTED) {
                throw ValidationException::withMessages([
                    'phone' => ['تم رفض طلب تسجيل المنشأة. ' . ($profile->admin_note ? 'السبب: ' . $profile->admin_note : '')],
                ]);
            }

            if ($profile->status === CustomerStatus::SUSPENDED) {
                throw ValidationException::withMessages([
                    'phone' => ['تم إيقاف حساب هذه المنشأة، يرجى التواصل مع الإدارة.'],
                ]);
            }
        }

        // إنشاء التوكن للواجهة الأمامية في Next.js
        $token = $user->createToken($dto->deviceName ?? 'nextjs-token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
            'status' => $profile?->status,
        ];
    }
}

