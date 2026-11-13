<?php

namespace App\Domains\Cart\Actions;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\User;

class ClearCartAction
{
    public function execute(User $user, int $branchId): void
    {
        $cart = Cart::where('user_id', $user->id)
            ->where('branch_id', $branchId)
            ->first();

        if ($cart) {
            CartItem::where('cart_id', $cart->id)->delete();
        }
    }
}

