<?php

namespace App\Domains\Order\Repositories\Contracts;

use App\Models\Order;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface OrderRepositoryInterface
{
    public function getOrdersForUser(User $user, int $perPage = 15): LengthAwarePaginator;

    public function findByIdForUser(int $orderId, User $user): ?Order;

    public function generateOrderNumber(): string;
}

