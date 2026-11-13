<?php

namespace App\Domains\Cart\Services;

use App\Models\Cart;

class CartCalculationService
{
    /**
     * @return array{items_count: int, total_quantity: int, subtotal: float, vat_rate: float, vat_amount: float, total: float}
     */
    public function calculate(Cart $cart, float $vatRate = 15.00): array
    {
        $itemsCount = 0;
        $totalQuantity = 0;
        $subtotal = 0.0;

        foreach ($cart->items as $item) {
            $package = $item->package;
            if (! $package || ! $package->is_active) {
                continue;
            }

            $itemsCount++;
            $totalQuantity += $item->quantity;
            $subtotal += round((float) $package->unit_price * $item->quantity, 2);
        }

        $subtotal = round($subtotal, 2);
        $vatAmount = round($subtotal * ($vatRate / 100), 2);
        $total = round($subtotal + $vatAmount, 2);

        return [
            'items_count' => $itemsCount,
            'total_quantity' => $totalQuantity,
            'subtotal' => $subtotal,
            'vat_rate' => $vatRate,
            'vat_amount' => $vatAmount,
            'total' => $total,
        ];
    }
}

