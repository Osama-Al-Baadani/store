<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Catalog\Resources\CategoryResource;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
        ]);

        $categories = Category::active()
            ->where('branch_id', $request->input('branch_id'))
            ->whereNull('parent_id')
            ->with(['children' => fn ($q) => $q->active()->orderBy('sort')->orderBy('id')])
            ->orderBy('sort')
            ->orderBy('id')
            ->get();

        return $this->successResponse(
            CategoryResource::collection($categories),
            'تصنيفات الفرع.'
        );
    }
}

