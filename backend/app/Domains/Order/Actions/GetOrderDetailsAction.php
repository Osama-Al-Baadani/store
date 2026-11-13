<?php

namespace App\Domains\Order\Actions;

use App\Domains\Order\Repositories\Contracts\OrderRepositoryInterface;
use App\Models\Order;
use App\Models\User;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class GetOrderDetailsAction
{
    public function __construct(
        protected OrderRepositoryInterface $orderRepository
    ) {}

    public function execute(int $orderId, User $user): Order
    {
        $order = $this->orderRepository->findByIdForUser($orderId, $user);

        if (! $order) {
            throw new NotFoundHttpException('طلب الشراء غير موجود أو ليس لديك صلاحية الوصول إليه.');
        }

        return $order;
    }
}

