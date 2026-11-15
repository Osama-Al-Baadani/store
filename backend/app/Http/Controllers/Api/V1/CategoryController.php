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

        $all = Category::active()
            ->where('branch_id', $request->input('branch_id'))
            ->withCount(['products' => fn ($q) => $q->active()])
            ->orderBy('sort')
            ->orderBy('id')
            ->get();

        $byParent = $all->groupBy(fn ($cat) => $cat->parent_id ?? 0);

        $attachTree = function ($node) use (&$attachTree, $byParent): int {
            $children = ($byParent->get($node->id) ?? collect())->values();
            $totalProducts = (int) ($node->products_count ?? 0);
            foreach ($children as $child) {
                $totalProducts += $attachTree($child);
            }
            $node->setRelation('children', $children);
            $node->setAttribute('recursive_products_count', $totalProducts);

            return $totalProducts;
        };

        $roots = ($byParent->get(0) ?? collect())->values();
        foreach ($roots as $root) {
            $attachTree($root);
        }

        return $this->successResponse(
            CategoryResource::collection($roots),
            'تصنيفات الفرع.'
        );
    }
}

