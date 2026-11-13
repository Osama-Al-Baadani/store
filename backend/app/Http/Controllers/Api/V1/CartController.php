<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Cart\Actions\ClearCartAction;
use App\Domains\Cart\Actions\GetCartAction;
use App\Domains\Cart\Actions\SyncCartItemAction;
use App\Domains\Cart\Requests\UpdateCartItemRequest;
use App\Domains\Cart\Resources\CartResource;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    use ApiResponseTrait;

    public function show(Request $request, GetCartAction $action): JsonResponse
    {
        $request->validate([
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
        ]);

        $cart = $action->execute($request->user(), (int) $request->input('branch_id'));

        return $this->successResponse(
            new CartResource($cart),
            'سلة التسوق الحالية.'
        );
    }

    public function updateItem(UpdateCartItemRequest $request, SyncCartItemAction $action): JsonResponse
    {
        $cart = $action->execute($request->user(), $request->toDTO());

        return $this->successResponse(
            new CartResource($cart),
            'تم تحديث السلة بنجاح.'
        );
    }

    public function clear(Request $request, ClearCartAction $action): JsonResponse
    {
        $request->validate([
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
        ]);

        $action->execute($request->user(), (int) $request->input('branch_id'));

        return $this->successResponse(null, 'تم تفريغ السلة بنجاح.');
    }
}

