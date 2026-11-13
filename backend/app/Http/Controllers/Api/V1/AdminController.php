<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\CustomerStatus;
use App\Http\Controllers\Controller;
use App\Models\Advertisement;
use App\Models\Branch;
use App\Models\MerchantProfile;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * الإحصائيات العامة للمنصة
     */
    public function stats(): JsonResponse
    {
        $totalMerchants = MerchantProfile::count();
        $pendingMerchants = MerchantProfile::where('status', CustomerStatus::PENDING)->count();
        $activeMerchants = MerchantProfile::where('status', CustomerStatus::ACTIVE)->count();
        $suspendedMerchants = MerchantProfile::whereIn('status', [CustomerStatus::SUSPENDED, CustomerStatus::REJECTED])->count();

        $totalOrders = Order::count();
        $totalRevenue = (float) Order::where('status', '!=', 'cancelled')->sum('total');
        $totalProducts = Product::where('is_active', true)->count();
        $totalBranches = Branch::where('is_active', true)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'merchants' => [
                    'total' => $totalMerchants,
                    'pending' => $pendingMerchants,
                    'active' => $activeMerchants,
                    'suspended' => $suspendedMerchants,
                ],
                'orders' => [
                    'total' => $totalOrders,
                    'revenue' => round($totalRevenue, 2),
                ],
                'catalog' => [
                    'products' => $totalProducts,
                    'branches' => $totalBranches,
                ],
            ],
        ]);
    }

    /**
     * قائمة المنشآت والتجار
     */
    public function merchants(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $search = $request->query('search');

        $query = MerchantProfile::with('user')->orderBy('created_at', 'desc');

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                  ->orWhere('owner_name', 'like', "%{$search}%")
                  ->orWhere('cr_number', 'like', "%{$search}%")
                  ->orWhere('vat_number', 'like', "%{$search}%")
                  ->orWhere('customer_code', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('phone', 'like', "%{$search}%")
                         ->orWhere('name', 'like', "%{$search}%");
                  });
            });
        }

        $merchants = $query->paginate($request->query('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $merchants->items(),
            'meta' => [
                'current_page' => $merchants->currentPage(),
                'last_page' => $merchants->lastPage(),
                'total' => $merchants->total(),
            ],
        ]);
    }

    /**
     * اعتماد منشأة وفتح صلاحية الشراء والتوريد فوراً
     */
    public function approveMerchant(int $id): JsonResponse
    {
        $profile = MerchantProfile::with('user')->findOrFail($id);

        $profile->update([
            'status' => CustomerStatus::ACTIVE,
            'approved_at' => now(),
            'admin_note' => 'تم الاعتماد الرسمي من لوحة تحكم الإدارة',
        ]);

        return response()->json([
            'success' => true,
            'message' => "تم اعتماد المنشأة ({$profile->company_name}) بنجاح وتم تفعيل صلاحيات التوريد والطلب.",
            'data' => $profile->fresh(),
        ]);
    }

    /**
     * رفض أو إيقاف منشأة
     */
    public function rejectMerchant(Request $request, int $id): JsonResponse
    {
        $profile = MerchantProfile::with('user')->findOrFail($id);
        $action = $request->input('action', 'suspended'); // suspended or rejected
        $note = $request->input('note', 'تم تغيير الحالة من قبل إدارة المنصة');

        $newStatus = $action === 'rejected' ? CustomerStatus::REJECTED : CustomerStatus::SUSPENDED;

        $profile->update([
            'status' => $newStatus,
            'admin_note' => $note,
        ]);

        return response()->json([
            'success' => true,
            'message' => "تم تغيير حالة المنشأة ({$profile->company_name}) إلى: " . $newStatus->label(),
            'data' => $profile->fresh(),
        ]);
    }

    /**
     * قائمة طلبات الجملة والفواتير
     */
    public function orders(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $branchId = $request->query('branch_id');

        $query = Order::with(['user.merchantProfile', 'branch', 'items.product'])
            ->orderBy('created_at', 'desc');

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $orders = $query->paginate($request->query('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $orders->items(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    /**
     * تحديث حالة طلب جملة
     */
    public function updateOrderStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|string',
        ]);

        $order = Order::findOrFail($id);
        $order->update([
            'status' => $request->input('status'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث حالة الطلب بنجاح.',
            'data' => $order->fresh(['user.merchantProfile', 'branch', 'items']),
        ]);
    }

    /**
     * جدول المنتجات بالكامل
     */
    public function products(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $categoryId = $request->query('category_id');
        $branchId = $request->query('branch_id');

        $query = Product::with(['category', 'branch', 'defaultPackage', 'packages'])
            ->orderBy('sort', 'asc')
            ->orderBy('id', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $products = $query->paginate($request->query('per_page', 50));

        return response()->json([
            'success' => true,
            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    /**
     * حفظ صورة مرفوعة داخل مجلد public/uploads وإرجاع المسار النسبي
     */
    private function saveUploadedImage(Request $request, string $field, string $folder, string $prefix): ?string
    {
        if (!$request->hasFile($field)) {
            return null;
        }

        $file = $request->file($field);
        $dir = public_path($folder);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $filename = $prefix . '_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $file->move($dir, $filename);

        return trim($folder, '/') . '/' . $filename;
    }

    /**
     * إضافة صنف / منتج جديد
     */
    public function storeProduct(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:100|unique:products,code',
            'category_id' => 'required|exists:categories,id',
            'branch_id' => 'required|exists:branches,id',
            'unit_price' => 'required|numeric|min:0.01',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'image_file' => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:5120',
        ]);

        $imagePath = $validated['image'] ?? null;
        if ($uploaded = $this->saveUploadedImage($request, 'image_file', 'uploads/products', 'prd')) {
            $imagePath = rtrim($request->getSchemeAndHttpHost(), '/') . '/' . $uploaded;
        }

        $product = Product::create([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'category_id' => $validated['category_id'],
            'branch_id' => $validated['branch_id'],
            'description' => $validated['description'] ?? 'صنف جملة معتمد بالحبة',
            'image' => $imagePath,
            'is_active' => true,
            'sort' => 99,
        ]);

        // إنشاء حزمة التسعير بالحبة الافتراضية
        \App\Models\ProductPackage::create([
            'product_id' => $product->id,
            'name' => 'حبة',
            'unit' => 'حبة',
            'pack_quantity' => 1,
            'step_quantity' => 1,
            'unit_price' => $validated['unit_price'],
            'old_price' => null,
            'is_default' => true,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تمت إضافة المنتج الجديد وتسعير الحبة بنجاح.',
            'data' => $product->load(['category', 'branch', 'defaultPackage']),
        ], 201);
    }

    /**
     * حذف منتج
     */
    public function deleteProduct(int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->packages()->delete();
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف المنتج بنجاح.',
        ]);
    }

    /**
     * تحديث بيانات وسعر منتج
     */
    public function updateProduct(Request $request, int $id): JsonResponse
    {
        $product = Product::with('defaultPackage')->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:100|unique:products,code,' . $id,
            'category_id' => 'sometimes|required|exists:categories,id',
            'branch_id' => 'sometimes|required|exists:branches,id',
            'unit_price' => 'sometimes|required|numeric|min:0.01',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'image_file' => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:5120',
            'is_active' => 'nullable|boolean',
        ]);

        $updates = $request->only(['name', 'code', 'description', 'category_id', 'branch_id', 'image']);
        if ($request->has('is_active')) {
            $updates['is_active'] = $request->boolean('is_active');
        }
        if ($uploaded = $this->saveUploadedImage($request, 'image_file', 'uploads/products', 'prd')) {
            $updates['image'] = rtrim($request->getSchemeAndHttpHost(), '/') . '/' . $uploaded;
        }

        $product->update($updates);

        if ($request->has('unit_price') && $product->defaultPackage) {
            $product->defaultPackage->update([
                'unit_price' => $request->input('unit_price'),
                'old_price' => $request->input('old_price', $product->defaultPackage->old_price),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث بيانات الصنف وسعر الحبة بنجاح.',
            'data' => $product->fresh(['category', 'branch', 'defaultPackage']),
        ]);
    }

    /**
     * جدول الأقسام
     */
    public function categories(Request $request): JsonResponse
    {
        $categories = \App\Models\Category::with(['branch', 'parent'])
            ->withCount('products')
            ->orderByRaw('COALESCE(parent_id, id) asc')
            ->orderByRaw('CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END asc')
            ->orderBy('sort')
            ->orderBy('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * إضافة قسم جديد (رئيسي أو فرعي)
     */
    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'branch_id' => 'required|exists:branches,id',
            'parent_id' => 'nullable|exists:categories,id',
            'sort' => 'nullable|integer',
        ]);

        $category = \App\Models\Category::create([
            'name' => $validated['name'],
            'branch_id' => $validated['branch_id'],
            'parent_id' => $validated['parent_id'] ?? null,
            'sort' => $validated['sort'] ?? 99,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تمت إضافة القسم الجديد بنجاح.',
            'data' => $category->load(['branch', 'parent']),
        ], 201);
    }

    /**
     * حذف قسم
     */
    public function deleteCategory(int $id): JsonResponse
    {
        $category = \App\Models\Category::findOrFail($id);
        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف القسم بنجاح.',
        ]);
    }

    /**
     * تحديث قسم
     */
    public function updateCategory(Request $request, int $id): JsonResponse
    {
        $category = \App\Models\Category::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'branch_id' => 'sometimes|required|exists:branches,id',
            'parent_id' => 'nullable|exists:categories,id',
            'sort' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $updates = $request->only(['name', 'sort', 'is_active', 'branch_id', 'parent_id']);
        if (isset($updates['parent_id']) && (int) $updates['parent_id'] === $id) {
            unset($updates['parent_id']);
        }
        $category->update($updates);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث القسم بنجاح.',
            'data' => $category->fresh(['branch', 'parent']),
        ]);
    }

    /**
     * جدول المستودعات والفروع
     */
    public function branches(Request $request): JsonResponse
    {
        $branches = Branch::withCount(['categories', 'products', 'orders'])
            ->orderBy('sort')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $branches,
        ]);
    }

    /**
     * إضافة مستودع جديد
     */
    public function storeBranch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:branches,code',
            'description' => 'nullable|string',
            'color' => 'nullable|string',
        ]);

        $branch = Branch::create([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'description' => $validated['description'] ?? 'مستودع توريد مباشر',
            'color' => $validated['color'] ?? '#b47820',
            'is_active' => true,
            'sort' => 99,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تمت إضافة المستودع الجديد بنجاح.',
            'data' => $branch,
        ], 201);
    }

    /**
     * حذف مستودع
     */
    public function deleteBranch(int $id): JsonResponse
    {
        $branch = Branch::findOrFail($id);
        $branch->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف المستودع بنجاح.',
        ]);
    }

    /**
     * تحديث مستودع
     */
    public function updateBranch(Request $request, int $id): JsonResponse
    {
        $branch = Branch::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:50|unique:branches,code,' . $id,
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:30',
            'is_active' => 'nullable|boolean',
        ]);

        $updates = $request->only(['name', 'code', 'description', 'color']);
        if ($request->has('is_active')) {
            $updates['is_active'] = $request->boolean('is_active');
        }
        $branch->update($updates);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث بيانات المستودع بنجاح.',
            'data' => $branch->fresh(),
        ]);
    }

    /**
     * جدول المستخدمين كاملاً
     */
    public function users(Request $request): JsonResponse
    {
        $users = User::with('merchantProfile')->orderBy('id', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * تغيير كلمة مرور مستخدم من الإدارة
     */
    public function resetUserPassword(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'password' => 'required|string|min:6',
        ]);

        $user = User::findOrFail($id);
        $user->update([
            'password' => bcrypt($request->input('password')),
        ]);

        return response()->json([
            'success' => true,
            'message' => "تم تغيير كلمة المرور للمستخدم ({$user->name}) بنجاح.",
        ]);
    }

    /**
     * جدول الإعلانات والبنرات بالكامل
     */
    public function advertisements(): JsonResponse
    {
        $ads = Advertisement::orderBy('sort', 'asc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $ads,
        ]);
    }

    /**
     * رفع صورة وإضافة إعلان / بنر جديد
     */
    public function storeAdvertisement(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'nullable|string|max:255',
            'subtitle' => 'nullable|string|max:500',
            'badge_text' => 'nullable|string|max:100',
            'placement' => 'nullable|in:all,home,catalog',
            'link_url' => 'nullable|string|max:500',
            'sort' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:5120',
            'image_url' => 'nullable|string|max:1000',
        ]);

        if (!$request->hasFile('image') && !$request->filled('image_url')) {
            return response()->json([
                'success' => false,
                'message' => 'يرجى اختيار صورة للرفع أو إدخال رابط صورة صحيح.',
            ], 422);
        }

        $imagePath = $request->input('image_url');

        if ($uploaded = $this->saveUploadedImage($request, 'image', 'uploads/ads', 'ad')) {
            $imagePath = $uploaded;
        }

        $ad = Advertisement::create([
            'title' => $request->input('title'),
            'subtitle' => $request->input('subtitle'),
            'badge_text' => $request->input('badge_text'),
            'image_path' => $imagePath,
            'placement' => $request->input('placement', 'all'),
            'link_url' => $request->input('link_url'),
            'sort' => (int) $request->input('sort', 0),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم رفع الصورة وإضافة الإعلان بنجاح!',
            'data' => $ad,
        ], 201);
    }

    /**
     * تحديث إعلان / بنر
     */
    public function updateAdvertisement(Request $request, int $id): JsonResponse
    {
        $ad = Advertisement::findOrFail($id);

        $request->validate([
            'title' => 'nullable|string|max:255',
            'subtitle' => 'nullable|string|max:500',
            'badge_text' => 'nullable|string|max:100',
            'placement' => 'nullable|in:all,home,catalog',
            'link_url' => 'nullable|string|max:500',
            'sort' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:5120',
            'image_url' => 'nullable|string|max:1000',
        ]);

        if ($request->hasFile('image')) {
            $oldFullPath = $ad->image_path ? public_path($ad->image_path) : null;
            if ($oldFullPath && str_starts_with($ad->image_path, 'uploads/ads/') && file_exists($oldFullPath)) {
                @unlink($oldFullPath);
            }

            if ($uploaded = $this->saveUploadedImage($request, 'image', 'uploads/ads', 'ad')) {
                $ad->image_path = $uploaded;
            }
        } elseif ($request->filled('image_url')) {
            $ad->image_path = $request->input('image_url');
        }

        foreach (['title', 'subtitle', 'badge_text', 'placement', 'link_url'] as $field) {
            if ($request->has($field)) {
                $ad->{$field} = $request->input($field);
            }
        }
        if ($request->has('sort')) {
            $ad->sort = (int) $request->input('sort');
        }
        if ($request->has('is_active')) {
            $ad->is_active = $request->boolean('is_active');
        }

        $ad->save();

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الإعلان بنجاح.',
            'data' => $ad->fresh(),
        ]);
    }

    /**
     * حذف إعلان / بنر
     */
    public function deleteAdvertisement(int $id): JsonResponse
    {
        $ad = Advertisement::findOrFail($id);

        if ($ad->image_path && str_starts_with($ad->image_path, 'uploads/ads/')) {
            $fullPath = public_path($ad->image_path);
            if (file_exists($fullPath)) {
                @unlink($fullPath);
            }
        }

        $ad->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الإعلان بنجاح.',
        ]);
    }
}

