<?php

namespace App\Domains\Cart\Actions;

use App\Models\Cart;
use App\Models\User;

class GetCartAction
{
    public function execute(User $user, int $branchId): Cart
    {
        return Cart::with(['items.package.product'])
            ->firstOrCreate([
                'user_id' => $user->id,
                'branch_id' => $branchId,
            ]);
    }
}

