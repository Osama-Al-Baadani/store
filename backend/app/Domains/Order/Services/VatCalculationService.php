<?php

namespace App\Domains\Order\Services;

class VatCalculationService
{
    public const DEFAULT_VAT_RATE = 15.00;

    /**
     * @return array{subtotal: float, vat_rate: float, vat_amount: float, total: float}
     */
    public function calculate(float $subtotal, float $vatRate = self::DEFAULT_VAT_RATE): array
    {
        $subtotal = round($subtotal, 2);
        $vatAmount = round($subtotal * ($vatRate / 100), 2);
        $total = round($subtotal + $vatAmount, 2);

        return [
            'subtotal' => $subtotal,
            'vat_rate' => $vatRate,
            'vat_amount' => $vatAmount,
            'total' => $total,
        ];
    }
}

