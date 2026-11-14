<?php

namespace App\Domains\Cart\Actions;

use App\Domains\Cart\DTOs\CartItemDTO;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductPackage;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class SyncCartItemAction
{
    public function execute(User $user, CartItemDTO $dto): Cart
    {
        $package = ProductPackage::with('product')->findOrFail($dto->packageId);

        if (! $package->is_active || ! $package->product->is_active || $package->product->is_coming_soon) {
            throw ValidationException::withMessages([
                'package_id' => ['هذا الصنف غير متوفر للطلب حالياً.'],
            ]);
        }

        if ($package->product->branch_id !== $dto->branchId) {
            throw ValidationException::withMessages([
                'package_id' => ['هذا الصنف لا يتبع للفرع المختار.'],
            ]);
        }

        $cart = Cart::firstOrCreate([
            'user_id' => $user->id,
            'branch_id' => $dto->branchId,
        ]);

        if ($dto->quantity <= 0) {
            CartItem::where('cart_id', $cart->id)
                ->where('product_package_id', $dto->packageId)
                ->delete();
        } else {
            CartItem::updateOrCreate(
                [
                    'cart_id' => $cart->id,
                    'product_package_id' => $dto->packageId,
                ],
                [
                    'quantity' => $dto->quantity,
                ]
            );
        }

        $cart->touch();

        return $cart->load(['items.package.product']);
    }
}

