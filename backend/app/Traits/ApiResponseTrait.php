<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponseTrait
{
    /**
     * إرجاع رد نجاح موحد للواجهة الأمامية
     */
    protected function successResponse(mixed $data = null, string $message = 'تمت العملية بنجاح', int $statusCode = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'errors' => null,
        ], $statusCode);
    }

    /**
     * إرجاع رد خطأ موحد للواجهة الأمامية
     */
    protected function errorResponse(string $message = 'حدث خطأ أثناء معالجة الطلب', mixed $errors = null, int $statusCode = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => null,
            'errors' => $errors,
        ], $statusCode);
    }
}

