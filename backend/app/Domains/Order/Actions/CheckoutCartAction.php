<?php

namespace App\Domains\Order\Actions;

use App\Domains\Order\DTOs\CheckoutDTO;
use App\Domains\Order\Repositories\Contracts\OrderRepositoryInterface;
use App\Domains\Order\Services\InvoicePdfService;
use App\Domains\Order\Services\VatCalculationService;
use App\Enums\OrderStatus;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutCartAction
{
    public function __construct(
        protected OrderRepositoryInterface $orderRepository,
        protected VatCalculationService $vatService,
        protected InvoicePdfService $pdfService,
    ) {}

    public function execute(User $user, CheckoutDTO $dto): Order
    {
        return DB::transaction(function () use ($user, $dto) {
            $cart = Cart::with(['items.package.product'])
                ->where('user_id', $user->id)
                ->where('branch_id', $dto->branchId)
                ->first();

            if (! $cart || $cart->items->isEmpty()) {
                throw ValidationException::withMessages([
                    'cart' => ['سلة التسوق فارغة، يرجى إضافة أصناف أولاً.'],
                ]);
            }

            $subtotal = 0.0;
            $itemsCount = 0;
            $totalQuantity = 0;
            $orderItemsData = [];

            foreach ($cart->items as $cartItem) {
                $package = $cartItem->package;
                $product = $package?->product;

                if (! $package || ! $package->is_active || ! $product || ! $product->is_active || $product->is_coming_soon) {
                    throw ValidationException::withMessages([
                        'cart' => ['أحد الأصناف في السلة لم يعد متوفراً: ' . ($product?->name ?? 'صنف غير معروف')],
                    ]);
                }

                $qty = $cartItem->quantity;
                $price = (float) $package->unit_price;
                $lineTotal = round($price * $qty, 2);

                $itemsCount++;
                $totalQuantity += $qty;
                $subtotal += $lineTotal;

                // تحضير لقطة الصنف الثابتة (Historical Snapshot)
                $orderItemsData[] = [
                    'product_id' => $product->id,
                    'package_id' => $package->id,
                    'product_name' => $product->name,
                    'product_code' => $product->code,
                    'barcode' => $product->barcode,
                    'package_name' => $package->name,
                    'unit' => $package->unit,
                    'pack_quantity' => $package->pack_quantity,
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'line_total' => $lineTotal,
                ];
            }

            $vatData = $this->vatService->calculate($subtotal);

            // إنشاء رأس الفاتورة
            $order = Order::create([
                'order_number' => $this->orderRepository->generateOrderNumber(),
                'user_id' => $user->id,
                'branch_id' => $dto->branchId,
                'status' => OrderStatus::NEW,
                'items_count' => $itemsCount,
                'total_quantity' => $totalQuantity,
                'subtotal' => $vatData['subtotal'],
                'vat_rate' => $vatData['vat_rate'],
                'vat_amount' => $vatData['vat_amount'],
                'total' => $vatData['total'],
                'notes' => $dto->notes,
            ]);

            // إدراج سطور الفاتورة
            foreach ($orderItemsData as $item) {
                $item['order_id'] = $order->id;
                OrderItem::create($item);
            }

            // تفريغ السلة بعد نجاح إنشاء الطلب
            CartItem::where('cart_id', $cart->id)->delete();

            // توليد ملف الـ PDF الأولي
            try {
                $this->pdfService->generate($order);
            } catch (\Throwable $e) {
                // في حال فشل توليد الـ PDF لا نعطل الطلب الأساسي
            }

            return $order->load(['items', 'branch', 'user.merchantProfile']);
        });
    }
}

