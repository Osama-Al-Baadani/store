<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Advertisement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdvertisementController extends Controller
{
    /**
     * عرض الإعلانات النشطة للواجهة الرئيسية والكتالوج
     */
    public function index(Request $request): JsonResponse
    {
        $placement = $request->query('placement');

        $query = Advertisement::where('is_active', true)
            ->orderBy('sort', 'asc')
            ->orderBy('id', 'desc');

        if ($placement && in_array($placement, ['home', 'catalog'], true)) {
            $query->whereIn('placement', ['all', $placement]);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }
}

