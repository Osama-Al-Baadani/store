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
        $request->validate([
            'placement' => 'nullable|in:all,home,catalog',
            'branch_id' => 'nullable|integer|exists:branches,id',
        ]);

        $placement = $request->query('placement');
        $branchId = $request->filled('branch_id') ? (int) $request->query('branch_id') : null;

        $query = Advertisement::with('branch:id,name,code')
            ->where('is_active', true)
            ->orderBy('sort', 'asc')
            ->orderBy('id', 'desc');

        if ($placement && in_array($placement, ['home', 'catalog'], true)) {
            $query->whereIn('placement', ['all', $placement]);
        }

        if ($branchId !== null) {
            $query->where(function ($q) use ($branchId) {
                $q->whereNull('branch_id')->orWhere('branch_id', $branchId);
            });
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }
}

