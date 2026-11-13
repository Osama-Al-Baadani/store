<?php

namespace App\Domains\Order\Repositories\Eloquent;

use App\Domains\Order\Repositories\Contracts\OrderRepositoryInterface;
use App\Models\Order;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class OrderRepository implements OrderRepositoryInterface
{
    public function getOrdersForUser(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return Order::with(['branch'])
            ->where('user_id', $user->id)
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    public function findByIdForUser(int $orderId, User $user): ?Order
    {
        return Order::with(['items', 'branch', 'user.merchantProfile'])
            ->where('id', $orderId)
            ->where('user_id', $user->id)
            ->first();
    }

    public function generateOrderNumber(): string
    {
        $lastId = (int) (Order::max('id') ?? 3639);
        return (string) ($lastId + 1);
    }
}

