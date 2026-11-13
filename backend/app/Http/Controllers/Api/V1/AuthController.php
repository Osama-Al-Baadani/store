<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Auth\Actions\LoginMerchantAction;
use App\Domains\Auth\Actions\RegisterMerchantAction;
use App\Domains\Auth\Requests\LoginRequest;
use App\Domains\Auth\Requests\RegisterMerchantRequest;
use App\Domains\Auth\Resources\UserAuthResource;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    use ApiResponseTrait;

    public function register(RegisterMerchantRequest $request, RegisterMerchantAction $action): JsonResponse
    {
        $crDocPath = null;
        if ($request->hasFile('cr_document')) {
            $crDocPath = $request->file('cr_document')->store('merchants/cr_docs', 'public');
        }

        $user = $action->execute($request->toDTO($crDocPath));

        return $this->successResponse(
            new UserAuthResource($user),
            'تم تسجيل طلب منشأتكم بنجاح، الحساب بانتظار مراجعة الإدارة وتفعيله.',
            201
        );
    }

    public function login(LoginRequest $request, LoginMerchantAction $action): JsonResponse
    {
        $authData = $action->execute($request->toDTO());

        return $this->successResponse(
            new UserAuthResource($authData['user'], $authData['token']),
            'تم تسجيل الدخول بنجاح.'
        );
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('merchantProfile');

        return $this->successResponse(
            new UserAuthResource($user),
            'بيانات الحساب الحالي.'
        );
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->successResponse(null, 'تم تسجيل الخروج بنجاح.');
    }

    public function simulateApproval(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user || ! $user->merchantProfile) {
            return $this->errorResponse('لا يوجد ملف منشأة مرتبط بهذا الحساب.', null, 404);
        }

        $profile = $user->merchantProfile;
        $profile->status = \App\Enums\CustomerStatus::ACTIVE;
        $profile->approved_at = now();
        $profile->save();

        return $this->successResponse(
            new UserAuthResource($user->fresh(['merchantProfile'])),
            'تم اعتماد وتفعيل منشأتكم بنجاح من قبل إدارة شركة المخازن الاقتصادية.'
        );
    }
}

