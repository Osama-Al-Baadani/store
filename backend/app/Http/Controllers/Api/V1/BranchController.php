<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Catalog\Resources\BranchResource;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;

class BranchController extends Controller
{
    use ApiResponseTrait;

    public function index(): JsonResponse
    {
        $branches = Branch::active()->orderBy('sort')->get();

        return $this->successResponse(
            BranchResource::collection($branches),
            'قائمة الفروع المتاحة.'
        );
    }

    public function show(int $id): JsonResponse
    {
        $branch = Branch::active()->findOrFail($id);

        return $this->successResponse(
            new BranchResource($branch),
            'تفاصيل الفرع.'
        );
    }
}

