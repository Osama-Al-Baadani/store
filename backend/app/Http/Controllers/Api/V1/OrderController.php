<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Order\Actions\CheckoutCartAction;
use App\Domains\Order\Actions\GetOrderDetailsAction;
use App\Domains\Order\Repositories\Contracts\OrderRepositoryInterface;
use App\Domains\Order\Requests\CheckoutRequest;
use App\Domains\Order\Resources\OrderListResource;
use App\Domains\Order\Resources\OrderResource;
use App\Domains\Order\Services\InvoicePdfService;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class OrderController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request, OrderRepositoryInterface $orderRepository): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 15);
        $orders = $orderRepository->getOrdersForUser($request->user(), $perPage);

        return $this->successResponse([
            'items' => OrderListResource::collection($orders),
            'pagination' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ], 'قائمة طلباتي.');
    }

    public function show(int $id, Request $request, GetOrderDetailsAction $action): JsonResponse
    {
        $order = $action->execute($id, $request->user());

        return $this->successResponse(
            new OrderResource($order),
            'تفاصيل الطلبية.'
        );
    }

    public function checkout(CheckoutRequest $request, CheckoutCartAction $action): JsonResponse
    {
        $order = $action->execute($request->user(), $request->toDTO());

        return $this->successResponse(
            new OrderResource($order),
            'تم إرسال طلبكم للتجهيز بنجاح.',
            201
        );
    }

    /**
     * فاتورة PDF للطلب (للتاجر المسجل) - تُبث مباشرة: عرض للطباعة أو تنزيل
     */
    public function downloadInvoice(int $id, Request $request, GetOrderDetailsAction $action, InvoicePdfService $pdfService)
    {
        $order = $action->execute($id, $request->user());

        return $this->pdfResponse($order, $pdfService, $request->boolean('download'));
    }

    /**
     * رابط عام موقّع للفاتورة (لمشاركته مع المستودع عبر واتساب بدون تسجيل دخول)
     */
    public function publicInvoice(int $order, Request $request, InvoicePdfService $pdfService)
    {
        $orderModel = \App\Models\Order::findOrFail($order);

        return $this->pdfResponse($orderModel, $pdfService, $request->boolean('download'));
    }

    protected function pdfResponse($order, InvoicePdfService $pdfService, bool $download)
    {
        $pdf = $pdfService->render($order);
        $fileName = 'invoice-' . $order->order_number . '.pdf';
        $disposition = $download ? 'attachment' : 'inline';

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition . '; filename="' . $fileName . '"; filename*=UTF-8\'\'' . rawurlencode('فاتورة-طلب-' . $order->order_number . '.pdf'),
            'Content-Length' => strlen($pdf),
            'Cache-Control' => 'private, max-age=0, must-revalidate',
        ]);
    }
}