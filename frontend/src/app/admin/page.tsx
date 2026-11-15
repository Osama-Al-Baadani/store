'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  adminApi,
  AdminStats,
  MerchantItem,
  AdminOrder,
  AdminActiveCart,
  AdvertisementItem,
} from '@/features/admin/api/admin.api';
import { ProductBulkImportModal } from '@/features/admin/components/ProductBulkImportModal';
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Search,
  Check,
  X,
  FileText,
  FileCheck2,
  ShieldCheck,
  MapPin,
  Phone,
  RefreshCw,
  LogOut,
  Boxes,
  Lock,
  LogIn,
  AlertCircle,
  Store,
  Warehouse,
  FolderTree,
  Edit2,
  KeyRound,
  ChevronLeft,
  ArrowUpRight,
  Package,
  Plus,
  Trash2,
  FolderPlus,
  PackagePlus,
  Filter,
  Zap,
  ImagePlus,
  Megaphone,
  Upload,
  Eye,
  EyeOff,
  MoreHorizontal,
  LayoutDashboard,
  Sparkles,
  Link2,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Download,
} from 'lucide-react';

type TabType = 'merchants' | 'products' | 'categories' | 'branches' | 'advertisements' | 'orders' | 'users';

const ORDER_STATUS_LABELS: Record<string, { label: string; style: string }> = {
  new: { label: 'طلب جديد', style: 'bg-amber-50 text-amber-800 border-amber-200' },
  processing: { label: 'جاري التجهيز', style: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  ready: { label: 'جاهز للاستلام / الشحن', style: 'bg-blue-50 text-blue-800 border-blue-200' },
  delivered: { label: 'تم التسليم', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  cancelled: { label: 'ملغي', style: 'bg-rose-50 text-rose-800 border-rose-200' },
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading: isAuthLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('merchants');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [merchants, setMerchants] = useState<MerchantItem[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [activeCarts, setActiveCarts] = useState<AdminActiveCart[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [adsList, setAdsList] = useState<AdvertisementItem[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [convertingCartId, setConvertingCartId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // النوافذ المنبثقة للإضافة والتعديل (Modals)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isExportingProducts, setIsExportingProducts] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [isAddAdOpen, setIsAddAdOpen] = useState(false);

  // معرفات العناصر قيد التعديل الكامل في النوافذ المنبثقة
  const [editingProductDataId, setEditingProductDataId] = useState<number | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productExtractUrl, setProductExtractUrl] = useState('');
  const [isExtractingProduct, setIsExtractingProduct] = useState(false);
  const [extractFeedback, setExtractFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);
  const [editingAdId, setEditingAdId] = useState<number | null>(null);

  // نموذج رفع وإضافة/تعديل إعلان
  const [adTitle, setAdTitle] = useState('');
  const [adSubtitle, setAdSubtitle] = useState('');
  const [adBadgeText, setAdBadgeText] = useState('');
  const [adPlacement, setAdPlacement] = useState<'all' | 'home' | 'catalog'>('all');
  const [adSort, setAdSort] = useState('0');
  const [adImageFile, setAdImageFile] = useState<File | null>(null);
  const [adImagePreview, setAdImagePreview] = useState<string | null>(null);
  const [adImageUrl, setAdImageUrl] = useState('');
  const [isUploadingAd, setIsUploadingAd] = useState(false);

  // نماذج الإضافة
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    code: '',
    category_id: '',
    branch_id: '',
    unit_price: '',
    old_price: '',
    description: '',
    image: '',
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    branch_id: '',
    parent_id: '',
    sort: '99',
  });

  const [newBranch, setNewBranch] = useState({
    name: '',
    code: '',
    description: '',
    color: '#b47820',
  });

  // تعديل السعر لمنتج
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');

  // تعديل كلمة مرور مستخدم
  const [passwordUserId, setPasswordUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  const hasLoadedMetaRef = useRef(false);
  const metaPromiseRef = useRef<Promise<void> | null>(null);
  const loadSeqRef = useRef(0);
  const isPollInFlightRef = useRef(false);
  const searchQueryRef = useRef(searchQuery);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  const isAdmin = isAuthenticated && user?.role === 'admin';

  // توجيه غير المسجلين مباشرةً إلى بوابة تسجيل الدخول الموحد في البداية
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  const fetchSharedMeta = async (force = false) => {
    if (!force && metaPromiseRef.current) {
      await metaPromiseRef.current;
      return;
    }

    const job = (async () => {
      const [statsRes, cartsRes, catRes, brRes, adsRes] = await Promise.all([
        adminApi.getStats().catch(() => null),
        adminApi.getActiveCarts().catch(() => null),
        adminApi.getCategories().catch(() => null),
        adminApi.getBranches().catch(() => null),
        adminApi.getAdvertisements().catch(() => null),
      ]);

      if (statsRes?.success) setStats(statsRes.data);
      if (cartsRes?.success) setActiveCarts(cartsRes.data);
      if (catRes?.success) setCategories(catRes.data);
      if (brRes?.success) setBranches(brRes.data);
      if (adsRes?.success) setAdsList(adsRes.data);
      hasLoadedMetaRef.current = true;
    })().finally(() => {
      metaPromiseRef.current = null;
    });

    metaPromiseRef.current = job;
    await job;
  };

  // تحميل البيانات (مع منع تكرار الطلبات المتزامنة وتحديث بيانات التبويب النشط فقط عند الفلترة)
  const loadData = useCallback(async (includeMeta: boolean | unknown = true) => {
    if (!isAdmin) return;
    const seq = ++loadSeqRef.current;
    const shouldFetchMeta = includeMeta !== false || !hasLoadedMetaRef.current;

    setIsLoading(true);
    setHasError(null);

    try {
      const fetchActiveTab = async () => {
        const activeSearch = searchQueryRef.current;
        if (activeTab === 'merchants') {
          const res = await adminApi.getMerchants({ status: statusFilter, search: activeSearch });
          if (seq === loadSeqRef.current && res.success) setMerchants(res.data);
        } else if (activeTab === 'products') {
          const res = await adminApi.getProducts({
            search: activeSearch,
            category_id: categoryFilter !== 'all' ? parseInt(categoryFilter) : undefined,
            branch_id: branchFilter !== 'all' ? parseInt(branchFilter) : undefined,
          });
          if (seq === loadSeqRef.current && res.success) setProducts(res.data);
        } else if (activeTab === 'orders') {
          const res = await adminApi.getOrders({
            status: orderStatusFilter !== 'all' ? orderStatusFilter : undefined,
            search: activeSearch || undefined,
          });
          if (seq === loadSeqRef.current && res.success) setOrders(res.data);
        } else if (activeTab === 'users') {
          const res = await adminApi.getUsers();
          if (seq === loadSeqRef.current && res.success) setUsersList(res.data);
        } else if (activeTab === 'categories' && !shouldFetchMeta) {
          const res = await adminApi.getCategories();
          if (seq === loadSeqRef.current && res.success) setCategories(res.data);
        } else if (activeTab === 'branches' && !shouldFetchMeta) {
          const res = await adminApi.getBranches();
          if (seq === loadSeqRef.current && res.success) setBranches(res.data);
        } else if (activeTab === 'advertisements' && !shouldFetchMeta) {
          const res = await adminApi.getAdvertisements();
          if (seq === loadSeqRef.current && res.success) setAdsList(res.data);
        }
      };

      await Promise.all([
        shouldFetchMeta ? fetchSharedMeta(includeMeta !== false) : Promise.resolve(),
        fetchActiveTab(),
      ]);
    } catch (err: unknown) {
      if (seq === loadSeqRef.current) {
        console.error('Failed to load data:', err);
        setHasError('تعذر تحميل البيانات من الخادم، تأكد من تشغيل backend (php artisan serve)');
      }
    } finally {
      if (seq === loadSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, [isAdmin, activeTab, statusFilter, categoryFilter, branchFilter, orderStatusFilter]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) {
        void loadData(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, loadData]);

  // تحديث تلقائي صامت للسلات النشطة والطلبات كل 25 ثانية عندما تكون الصفحة ظاهرة
  useEffect(() => {
    if (!isAdmin) return;

    const timer = setInterval(async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (isPollInFlightRef.current) return;
      isPollInFlightRef.current = true;
      try {
        const [statsRes, cartsRes] = await Promise.all([
          adminApi.getStats().catch(() => null),
          adminApi.getActiveCarts().catch(() => null),
        ]);
        if (statsRes?.success) setStats(statsRes.data);
        if (cartsRes?.success) setActiveCarts(cartsRes.data);

        if (activeTab === 'orders') {
          const ordersRes = await adminApi
            .getOrders({
              status: orderStatusFilter !== 'all' ? orderStatusFilter : undefined,
              search: searchQuery || undefined,
            })
            .catch(() => null);
          if (ordersRes?.success) setOrders(ordersRes.data);
        }
      } catch {
        // تجاهل أخطاء التحديث الخلفي الصامت
      } finally {
        isPollInFlightRef.current = false;
      }
    }, 25000);

    return () => clearInterval(timer);
  }, [isAdmin, activeTab, orderStatusFilter, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // اعتماد منشأة فورياً
  const handleApprove = async (merchantId: number, companyName: string) => {
    try {
      const res = await adminApi.approveMerchant(merchantId);
      if (res.success) {
        setActionMessage({ text: `تم اعتماد وتفعيل منشأة "${companyName}" بنجاح!`, type: 'success' });
        setMerchants((prev) =>
          prev.map((m) => (m.id === merchantId ? { ...m, status: 'active', approved_at: new Date().toISOString() } : m))
        );
        if (stats) {
          setStats({
            ...stats,
            merchants: {
              ...stats.merchants,
              pending: Math.max(0, stats.merchants.pending - 1),
              active: stats.merchants.active + 1,
            },
          });
        }
      }
    } catch (err: any) {
      setActionMessage({ text: err.response?.data?.message || 'فشل اعتماد المنشأة', type: 'error' });
    }
  };

  // رفض أو إيقاف منشأة
  const handleReject = async (merchantId: number, companyName: string) => {
    if (!confirm(`هل أنت متأكد من إيقاف منشأة "${companyName}"؟`)) return;
    try {
      const res = await adminApi.rejectMerchant(merchantId, { action: 'suspended', note: 'تم الإيقاف بقرار إداري' });
      if (res.success) {
        setActionMessage({ text: `تم إيقاف منشأة "${companyName}"`, type: 'success' });
        setMerchants((prev) =>
          prev.map((m) => (m.id === merchantId ? { ...m, status: 'suspended' } : m))
        );
        if (stats) {
          setStats({
            ...stats,
            merchants: {
              ...stats.merchants,
              active: Math.max(0, stats.merchants.active - 1),
              suspended: stats.merchants.suspended + 1,
            },
          });
        }
      }
    } catch (err: any) {
      setActionMessage({ text: err.response?.data?.message || 'فشل إيقاف المنشأة', type: 'error' });
    }
  };

  // تحديث حالة الطلب
  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      const res = await adminApi.updateOrderStatus(orderId, status);
      if (res.success) {
        setActionMessage({ text: 'تم تحديث حالة الطلب بنجاح', type: 'success' });
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...res.data, status } : o)));
        adminApi.getStats().then((s) => s.success && setStats(s.data)).catch(() => { });
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionMessage({ text: message || 'تعذر تحديث حالة الطلب', type: 'error' });
    }
  };

  // تحويل سلة نشطة مباشرة إلى طلب وفاتورة
  const handleConvertCartToOrder = async (cart: AdminActiveCart) => {
    setConvertingCartId(cart.id);
    try {
      const res = await adminApi.convertCartToOrder(cart.id);
      if (res.success) {
        setActionMessage({
          text: `تم اعتماد سلة "${cart.user?.merchant_profile?.company_name || cart.user?.name}" كطلب رقم #${res.data.order_number} وإصدار الفاتورة بنجاح`,
          type: 'success',
        });
        setActiveCarts((prev) => prev.filter((c) => c.id !== cart.id));
        setOrders((prev) => [res.data, ...prev]);
        adminApi.getStats().then((s) => s.success && setStats(s.data)).catch(() => { });
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionMessage({
        text: message || 'تعذر تحويل السلة إلى طلب وفاتورة',
        type: 'error',
      });
    } finally {
      setConvertingCartId(null);
    }
  };

  // 1. فتح نافذة إضافة أو تعديل منتج
  const openAddProductModal = () => {
    setEditingProductDataId(null);
    setProductImageFile(null);
    setProductImagePreview(null);
    setProductExtractUrl('');
    setExtractFeedback(null);
    setNewProduct({
      name: '',
      brand: '',
      code: '',
      category_id: categories[0]?.id?.toString() || '',
      branch_id: branches[0]?.id?.toString() || '',
      unit_price: '',
      old_price: '',
      description: '',
      image: '',
    });
    setIsAddProductOpen(true);
  };

  const openEditProductModal = (product: any) => {
    setEditingProductDataId(product.id);
    setProductImageFile(null);
    setProductImagePreview(product.image || null);
    setProductExtractUrl('');
    setExtractFeedback(null);
    setNewProduct({
      name: product.name || '',
      brand: product.brand || '',
      code: product.code || '',
      category_id: product.category_id?.toString() || product.category?.id?.toString() || '',
      branch_id: product.branch_id?.toString() || product.branch?.id?.toString() || '',
      unit_price: (product.default_package?.unit_price ?? '').toString(),
      old_price: (product.default_package?.old_price ?? '').toString(),
      description: product.description || '',
      image: product.image || '',
    });
    setIsAddProductOpen(true);
  };

  const handleGenerateProductCode = () => {
    const existingCodes = new Set(products.map((p) => String(p.code || '').toUpperCase()));
    let generated = '';
    for (let i = 0; i < 30; i++) {
      const candidate = `PRD-${Math.floor(1000 + Math.random() * 9000)}`;
      if (!existingCodes.has(candidate)) {
        generated = candidate;
        break;
      }
    }
    if (!generated) {
      generated = `PRD-${Date.now().toString().slice(-5)}`;
    }
    setNewProduct((prev) => ({ ...prev, code: generated }));
  };

  const handleExtractProductFromUrl = async () => {
    const trimmedUrl = productExtractUrl.trim();
    if (!trimmedUrl) {
      setExtractFeedback({ text: 'يرجى لصق رابط صفحة المنتج أولاً.', type: 'error' });
      return;
    }

    setIsExtractingProduct(true);
    setExtractFeedback(null);
    try {
      const res = await adminApi.extractProductFromUrl(trimmedUrl);
      if (res.success && res.data) {
        const item = res.data;
        setNewProduct((prev) => ({
          ...prev,
          name: item.name || prev.name,
          code: item.code || prev.code,
          unit_price: item.unit_price || prev.unit_price,
          description: item.description || prev.description,
          image: item.image || prev.image,
        }));
        if (item.image) {
          setProductImageFile(null);
          setProductImagePreview(item.image);
        }
        setExtractFeedback({
          text:
            res.message ||
            (item.code_source === 'extracted'
              ? 'تم استخراج الاسم والسعر والوصف والصورة مع الكود من الرابط.'
              : 'تم استخراج بيانات المنتج وتوليد كود فريد تلقائياً.'),
          type: 'success',
        });
      }
    } catch (err: any) {
      setExtractFeedback({
        text: err.response?.data?.message || 'تعذر استخراج البيانات من هذا الرابط، تأكد من صلاحية الرابط أو أدخل الحقول يدوياً.',
        type: 'error',
      });
    } finally {
      setIsExtractingProduct(false);
    }
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProductImageFile(file);
    setProductImagePreview(URL.createObjectURL(file));
  };

  // حفظ إضافة أو تعديل المنتج بالكامل
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.code || !newProduct.unit_price) {
      alert('يرجى ملء اسم الصنف والكود وسعر الحبة');
      return;
    }

    setIsSavingProduct(true);
    try {
      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('brand', newProduct.brand.trim());
      formData.append('code', newProduct.code);
      formData.append('category_id', (parseInt(newProduct.category_id) || categories[0]?.id || 1).toString());
      formData.append('branch_id', (parseInt(newProduct.branch_id) || branches[0]?.id || 1).toString());
      formData.append('unit_price', parseFloat(newProduct.unit_price).toString());
      formData.append('old_price', newProduct.old_price.trim() ? parseFloat(newProduct.old_price).toString() : '');
      formData.append('description', newProduct.description || '');
      if (productImageFile) {
        formData.append('image_file', productImageFile);
      } else if (newProduct.image.trim()) {
        formData.append('image', newProduct.image.trim());
      }

      const res = editingProductDataId
        ? await adminApi.updateProduct(editingProductDataId, formData)
        : await adminApi.createProduct(formData);

      if (res.success) {
        setActionMessage({
          text: editingProductDataId
            ? `تم تحديث بيانات الصنف "${newProduct.name}" بنجاح!`
            : `تمت إضافة الصنف "${newProduct.name}" بنجاح!`,
          type: 'success',
        });
        setIsAddProductOpen(false);
        setEditingProductDataId(null);
        setProductImageFile(null);
        setProductImagePreview(null);
        setNewProduct({
          name: '',
          brand: '',
          code: '',
          category_id: '',
          branch_id: '',
          unit_price: '',
          old_price: '',
          description: '',
          image: '',
        });
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'تعذر حفظ بيانات المنتج، تأكد من عدم تكرار الكود');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // حذف منتج
  const handleDeleteProduct = async (id: number, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف الصنف "${name}" نهائياً من قاعدة البيانات؟`)) return;
    try {
      const res = await adminApi.deleteProduct(id);
      if (res.success) {
        setActionMessage({ text: `تم حذف الصنف "${name}" بنجاح`, type: 'success' });
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err: any) {
      alert('تعذر حذف المنتج');
    }
  };

  // 2. فتح نافذة إضافة أو تعديل قسم
  const openAddCategoryModal = () => {
    setEditingCategoryId(null);
    setNewCategory({ name: '', branch_id: branches[0]?.id?.toString() || '', parent_id: '', sort: '99' });
    setIsAddCategoryOpen(true);
  };

  const openEditCategoryModal = (cat: any) => {
    setEditingCategoryId(cat.id);
    setNewCategory({
      name: cat.name || '',
      branch_id: cat.branch_id?.toString() || cat.branch?.id?.toString() || '',
      parent_id: cat.parent_id?.toString() || cat.parent?.id?.toString() || '',
      sort: (cat.sort ?? 99).toString(),
    });
    setIsAddCategoryOpen(true);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) {
      alert('يرجى إدخال اسم القسم');
      return;
    }

    try {
      const payload = {
        name: newCategory.name,
        branch_id: parseInt(newCategory.branch_id) || branches[0]?.id || 1,
        parent_id: newCategory.parent_id ? parseInt(newCategory.parent_id) : null,
        sort: parseInt(newCategory.sort) || 99,
      };
      const res = editingCategoryId
        ? await adminApi.updateCategory(editingCategoryId, payload)
        : await adminApi.createCategory(payload);

      if (res.success) {
        setActionMessage({
          text: editingCategoryId
            ? `تم تحديث القسم "${newCategory.name}" بنجاح!`
            : `تمت إضافة القسم "${newCategory.name}" بنجاح!`,
          type: 'success',
        });
        setIsAddCategoryOpen(false);
        setEditingCategoryId(null);
        setNewCategory({ name: '', branch_id: '', parent_id: '', sort: '99' });
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'فشل حفظ القسم');
    }
  };

  // حذف قسم
  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف القسم "${name}"؟`)) return;
    try {
      const res = await adminApi.deleteCategory(id);
      if (res.success) {
        setActionMessage({ text: `تم حذف القسم "${name}"`, type: 'success' });
        setCategories((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err: any) {
      alert('تعذر حذف القسم');
    }
  };

  // 3. فتح نافذة إضافة أو تعديل مستودع
  const openAddBranchModal = () => {
    setEditingBranchId(null);
    setNewBranch({ name: '', code: '', description: '', color: '#b47820' });
    setIsAddBranchOpen(true);
  };

  const openEditBranchModal = (b: any) => {
    setEditingBranchId(b.id);
    setNewBranch({
      name: b.name || '',
      code: b.code || '',
      description: b.description || '',
      color: b.color || '#b47820',
    });
    setIsAddBranchOpen(true);
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name || !newBranch.code) {
      alert('يرجى إدخال اسم المستودع والرمز (الكود)');
      return;
    }

    try {
      const payload = {
        name: newBranch.name,
        code: newBranch.code.toLowerCase().trim(),
        description: newBranch.description,
        color: newBranch.color,
      };
      const res = editingBranchId
        ? await adminApi.updateBranch(editingBranchId, payload)
        : await adminApi.createBranch(payload);

      if (res.success) {
        setActionMessage({
          text: editingBranchId
            ? `تم تحديث بيانات المستودع "${newBranch.name}" بنجاح!`
            : `تمت إضافة المستودع "${newBranch.name}" بنجاح!`,
          type: 'success',
        });
        setIsAddBranchOpen(false);
        setEditingBranchId(null);
        setNewBranch({ name: '', code: '', description: '', color: '#b47820' });
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'تعذر حفظ بيانات المستودع، تأكد أن الكود غير مكرر');
    }
  };

  // حذف مستودع
  const handleDeleteBranch = async (id: number, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف المستودع "${name}"؟`)) return;
    try {
      const res = await adminApi.deleteBranch(id);
      if (res.success) {
        setActionMessage({ text: `تم حذف المستودع "${name}"`, type: 'success' });
        setBranches((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err: any) {
      alert('تعذر حذف المستودع');
    }
  };

  // حفظ سعر الحبة لمنتج
  const handleSaveProductPrice = async (productId: number) => {
    const priceNum = parseFloat(editingPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('يرجى إدخال سعر صحيح أكبر من الصفر');
      return;
    }

    try {
      const res = await adminApi.updateProduct(productId, { unit_price: priceNum });
      if (res.success) {
        setActionMessage({ text: 'تم تحديث سعر الحبة بنجاح في قاعدة البيانات!', type: 'success' });
        setEditingProductId(null);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? { ...p, default_package: { ...p.default_package, unit_price: priceNum } }
              : p
          )
        );
      }
    } catch (err: any) {
      setActionMessage({ text: err.response?.data?.message || 'فشل تحديث السعر', type: 'error' });
    }
  };

  // تفعيل / تعطيل منتج
  const handleToggleProduct = async (product: any) => {
    const nextState = !product.is_active;
    try {
      const res = await adminApi.updateProduct(product.id, { is_active: nextState });
      if (res.success) {
        setActionMessage({ text: `تم ${nextState ? 'تفعيل' : 'تعطيل'} المنتج بنجاح`, type: 'success' });
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, is_active: nextState } : p))
        );
      }
    } catch (err: any) {
      setActionMessage({ text: 'تعذر تغيير حالة المنتج', type: 'error' });
    }
  };

  // تغيير كلمة المرور لمستخدم
  const handleSaveUserPassword = async (userId: number) => {
    if (!newPassword || newPassword.length < 6) {
      alert('كلمة المرور يجب أن لا تقل عن 6 خانات');
      return;
    }

    try {
      const res = await adminApi.resetUserPassword(userId, newPassword);
      if (res.success) {
        setActionMessage({ text: 'تم تغيير كلمة المرور بنجاح!', type: 'success' });
        setPasswordUserId(null);
        setNewPassword('');
      }
    } catch (err: any) {
      setActionMessage({ text: err.response?.data?.message || 'فشل تغيير كلمة المرور', type: 'error' });
    }
  };

  // فتح نافذة إضافة أو تعديل إعلان
  const openAddAdModal = () => {
    setEditingAdId(null);
    setAdTitle('');
    setAdSubtitle('');
    setAdBadgeText('');
    setAdPlacement('all');
    setAdSort('0');
    setAdImageFile(null);
    setAdImagePreview(null);
    setAdImageUrl('');
    setIsAddAdOpen(true);
  };

  const openEditAdModal = (ad: AdvertisementItem) => {
    setEditingAdId(ad.id);
    setAdTitle(ad.title || '');
    setAdSubtitle(ad.subtitle || '');
    setAdBadgeText(ad.badge_text || '');
    setAdPlacement(ad.placement || 'all');
    setAdSort((ad.sort ?? 0).toString());
    setAdImageFile(null);
    setAdImagePreview(ad.image_url || null);
    setAdImageUrl('');
    setIsAddAdOpen(true);
  };

  // معالجة اختيار صورة الإعلان
  const handleAdImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAdImageFile(file);
    setAdImagePreview(URL.createObjectURL(file));
  };

  // رفع وحفظ أو تحديث الإعلان في جدول الإعلانات
  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdId && !adImageFile && !adImageUrl.trim()) {
      alert('يرجى اختيار صورة إعلان للرفع أو إدخال رابط صورة');
      return;
    }

    setIsUploadingAd(true);
    try {
      const formData = new FormData();
      if (adImageFile) formData.append('image', adImageFile);
      if (adImageUrl.trim()) formData.append('image_url', adImageUrl.trim());
      formData.append('title', adTitle.trim());
      formData.append('subtitle', adSubtitle.trim());
      formData.append('badge_text', adBadgeText.trim());
      formData.append('placement', adPlacement);
      formData.append('sort', adSort || '0');
      if (!editingAdId) {
        formData.append('is_active', '1');
      }

      const res = editingAdId
        ? await adminApi.updateAdvertisement(editingAdId, formData)
        : await adminApi.createAdvertisement(formData);

      if (res.success) {
        setActionMessage({
          text: editingAdId ? 'تم تحديث بيانات وصورة الإعلان بنجاح!' : 'تم رفع الصورة وإضافة الإعلان إلى المتجر بنجاح!',
          type: 'success',
        });
        setIsAddAdOpen(false);
        setEditingAdId(null);
        setAdTitle('');
        setAdSubtitle('');
        setAdBadgeText('');
        setAdPlacement('all');
        setAdSort('0');
        setAdImageFile(null);
        setAdImagePreview(null);
        setAdImageUrl('');
        setActiveTab('advertisements');
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'تعذر حفظ الإعلان، تأكد من حجم وصيغة الصورة (jpg, png, webp)');
    } finally {
      setIsUploadingAd(false);
    }
  };

  // تفعيل أو إخفاء إعلان
  const handleToggleAd = async (ad: AdvertisementItem) => {
    const nextState = !ad.is_active;
    try {
      const res = await adminApi.updateAdvertisement(ad.id, { is_active: nextState });
      if (res.success) {
        setActionMessage({ text: `تم ${nextState ? 'تفعيل' : 'إخفاء'} الإعلان بنجاح`, type: 'success' });
        setAdsList((prev) => prev.map((item) => (item.id === ad.id ? { ...item, is_active: nextState } : item)));
      }
    } catch {
      setActionMessage({ text: 'تعذر تحديث حالة الإعلان', type: 'error' });
    }
  };

  // حذف إعلان
  const handleDeleteAd = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    try {
      const res = await adminApi.deleteAdvertisement(id);
      if (res.success) {
        setActionMessage({ text: 'تم حذف الإعلان بنجاح', type: 'success' });
        setAdsList((prev) => prev.filter((item) => item.id !== id));
      }
    } catch {
      alert('تعذر حذف الإعلان');
    }
  };

  // التحقق من الصلاحية أو التوجيه لبوابة الدخول الموحد
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#faf8f5] text-stone-900 flex flex-col justify-center items-center p-4 selection:bg-amber-200">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#eddcc8] shadow-xl shadow-amber-950/5 text-center space-y-4">
          <div className="w-18 h-18 rounded-3xl bg-white border border-[#eddcc8] p-2 mx-auto shadow-md overflow-hidden">
            <img src="/logo.png" alt="شركة المخازن الاقتصادية" className="w-full h-full object-contain" />
          </div>
          {isAuthLoading ? (
            <>
              <div className="inline-flex items-center justify-center gap-2 text-xs font-bold text-[#8f5a13]">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري التحقق السريع من جلسة الإدارة...</span>
              </div>
              <p className="text-xs text-stone-500 font-medium leading-relaxed">
                إذا تأخر الخادم المحلي، تأكد من تشغيل خادم Laravel على المنفذ 8000.
              </p>
            </>
          ) : !isAuthenticated ? (
            <>
              <h1 className="text-lg font-bold text-stone-900">
                جاري التوجيه لبوابة تسجيل الدخول الموحد...
              </h1>
              <p className="text-xs text-stone-500 font-medium leading-relaxed">
                يرجى تسجيل الدخول من البوابة الرئيسية وسيتم فتح لوحة الإدارة تلقائياً لحسابات الإدارة.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8f5a13] to-[#b47820] text-white text-xs font-extrabold shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>الانتقال لبوابة تسجيل الدخول الآن</span>
              </Link>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold">
                <ShieldAlert className="w-4 h-4" />
                <span>صلاحية مخصصة للإدارة فقط</span>
              </div>
              <h1 className="text-lg font-bold text-stone-900">
                هذا الحساب مسجل كشركة شريكة
              </h1>
              <p className="text-xs text-stone-500 font-medium leading-relaxed">
                لوحة التحكم مخصصة لمشرفي إدارة شركة المخازن الاقتصادية فقط. يمكنك متابعة الطلبات وتصفح المستودعات من بوابة الشركة.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/"
                  className="btn-shimmer w-full bg-gradient-to-r from-[#8f5a13] via-[#b47820] to-[#d4973b] text-white font-bold py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <Store className="w-4 h-4" />
                  <span>الانتقال لبوابة الشركة والمتجر</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  تسجيل خروج وتبديل الحساب
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // التبويبات المتاحة ومجموعاتها المنظمة
  const navigationItems = [
    {
      id: 'merchants' as TabType,
      group: 'sales',
      label: 'المنشآت والتجار',
      shortLabel: 'المنشآت',
      subtitle: 'مراجعة السجلات التجارية واعتماد منشآت الجملة',
      icon: Building2,
      count: merchants.length || stats?.merchants.total || 0,
      badgeAlert: (stats?.merchants.pending ?? 0) > 0,
    },
    {
      id: 'orders' as TabType,
      group: 'sales',
      label: 'طلبات الجملة والفواتير',
      shortLabel: 'الطلبات',
      subtitle: 'متابعة السلات النشطة وطلبات التوريد وتحديث الحالات والفواتير',
      icon: FileCheck2,
      count: (stats?.orders.total ?? orders.length) + activeCarts.length,
      badgeAlert: activeCarts.length > 0 || (stats?.orders.active_carts ?? 0) > 0 || (stats?.orders.new ?? 0) > 0,
    },
    {
      id: 'products' as TabType,
      group: 'catalog',
      label: 'المنتجات وأسعار الحبة',
      shortLabel: 'المنتجات',
      subtitle: 'إدارة الأصناف، التسعير بالحبة، الصور، والتوفر',
      icon: Boxes,
      count: products.length || stats?.catalog.products || 31,
    },
    {
      id: 'categories' as TabType,
      group: 'catalog',
      label: 'الأقسام والتصنيفات',
      shortLabel: 'الأقسام',
      subtitle: 'تنظيم الأقسام الرئيسية والأقسام الفرعية تحت كل مستودع',
      icon: FolderTree,
      count: categories.length || 0,
    },
    {
      id: 'branches' as TabType,
      group: 'catalog',
      label: 'المستودعات ومراكز التوريد',
      shortLabel: 'المستودعات',
      subtitle: 'إدارة فروع التوزيع، الأكواد، ونطاق التغطية',
      icon: Warehouse,
      count: branches.length || stats?.catalog.branches || 3,
    },
    {
      id: 'advertisements' as TabType,
      group: 'catalog',
      label: 'الإعلانات والبنرات',
      shortLabel: 'الإعلانات',
      subtitle: 'رفع وتعديل بنرات الصفحة الرئيسية وصفحة الكتالوج',
      icon: Megaphone,
      count: adsList.length,
    },
    {
      id: 'users' as TabType,
      group: 'system',
      label: 'المستخدمين والحسابات',
      shortLabel: 'الحسابات',
      subtitle: 'حسابات المشرفين والتجار وإعادة تعيين كلمات المرور',
      icon: Users,
      count: usersList.length || 0,
    },
  ];

  const navGroups = [
    { id: 'sales', title: 'العملاء والمبيعات' },
    { id: 'catalog', title: 'الكتالوج والمحتوى' },
    { id: 'system', title: 'إدارة النظام' },
  ];

  const currentNavItem = navigationItems.find((item) => item.id === activeTab) || navigationItems[0];
  const CurrentNavIcon = currentNavItem.icon;

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 flex flex-col lg:flex-row font-sans selection:bg-amber-200 pb-24 lg:pb-0">
      {/* 1. القائمة الجانبية التنفيذية (Desktop Sidebar) */}
      <aside className="hidden lg:flex lg:flex-col w-72 shrink-0 bg-white border-l border-[#eddcc8] sticky top-0 h-screen z-30 shadow-[0_0_24px_-8px_rgba(180,120,32,0.1)]">
        {/* شعار المنصة */}
        <div className="px-5 py-4 border-b border-[#eddcc8]/80 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#fdfbf7] border border-[#eddcc8] p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
            <img src="/logo.png" alt="شركة المخازن الاقتصادية" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-stone-900 truncate leading-tight">
              المخازن الاقتصادية
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8f5a13] bg-[#fbf3e6] border border-[#ebd2b0] px-2 py-0.5 rounded-full mt-1">
              <LayoutDashboard className="w-3 h-3" />
              لوحة الإدارة المركزية
            </span>
          </div>
        </div>

        {/* مجموعات التنقل */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.id} className="space-y-1.5">
              <div className="px-3 text-[10px] font-bold text-stone-400 tracking-wide">
                {group.title}
              </div>
              <div className="space-y-1">
                {navigationItems
                  .filter((item) => item.group === group.id)
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${isActive
                          ? 'bg-gradient-to-r from-[#8f5a13] to-[#b47820] text-white shadow-md shadow-amber-950/15'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-[#fdfbf7] border border-transparent hover:border-[#eddcc8]/70'
                          }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-200' : 'text-stone-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeAlert
                              ? 'bg-amber-500 text-white animate-pulse'
                              : 'bg-stone-100 text-stone-600'
                            }`}
                        >
                          {item.count}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        {/* تذييل القائمة الجانبية: الحساب + المتجر + خروج */}
        <div className="p-3.5 border-t border-[#eddcc8]/80 bg-[#fdfbf7]/80 space-y-2.5">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white border border-[#eddcc8]/90">
            <div className="w-8 h-8 rounded-xl bg-[#fbf3e6] text-[#b47820] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-stone-900 truncate">
                {user?.name || 'مدير النظام'}
              </div>
              <div className="text-[10px] text-stone-400 font-medium">صلاحية الإدارة الكاملة</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/?view=store"
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-stone-900 hover:bg-[#b47820] text-white text-[11px] font-bold transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-amber-300" />
              <span>المتجر</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. مساحة العمل الرئيسية */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* الشريط العلوي المرن */}
        <header className="bg-white/95 backdrop-blur-md border-b border-[#eddcc8] px-3.5 sm:px-6 py-3 sticky top-0 z-20 shadow-[0_2px_14px_-4px_rgba(180,120,32,0.06)]">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            {/* عنوان القسم الحالي على الكمبيوتر / الشعار على الجوال */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="lg:hidden w-9 h-9 rounded-xl bg-white border border-[#eddcc8] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                <img src="/logo.png" alt="شركة المخازن الاقتصادية" className="w-full h-full object-contain" />
              </div>
              <div className="hidden lg:flex w-10 h-10 rounded-2xl bg-[#fbf3e6] border border-[#ebd2b0] text-[#b47820] items-center justify-center shrink-0">
                <CurrentNavIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-stone-900 truncate">
                    {currentNavItem.label}
                  </h2>
                  <span className="text-[10px] font-mono font-bold bg-[#fbf3e6] text-[#8f5a13] border border-[#ebd2b0] px-2 py-0.5 rounded-full shrink-0">
                    {currentNavItem.count}
                  </span>
                </div>
                <p className="hidden sm:block text-[11px] text-stone-500 font-medium truncate">
                  {currentNavItem.subtitle}
                </p>
              </div>
            </div>

            {/* أزرار سريعة في الرأس */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={loadData}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-[#eddcc8] bg-[#fdfbf7] hover:bg-[#fbf3e6] text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                title="تحديث البيانات"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#b47820]' : ''}`} />
                <span className="hidden sm:inline">تحديث</span>
              </button>

              <Link
                href="/?view=store"
                className="lg:hidden flex items-center gap-1 px-2.5 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold"
              >
                <Store className="w-3.5 h-3.5 text-amber-300" />
                <span>المتجر</span>
              </Link>

              <button
                type="button"
                onClick={logout}
                className="lg:hidden p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* شريط التبويبات السريع للأجهزة اللوحية والجوال */}
        <div className="lg:hidden bg-white border-b border-[#eddcc8]/80 px-3 py-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${isActive
                    ? 'bg-[#b47820] text-white shadow-xs'
                    : 'bg-stone-50 text-stone-600 border border-stone-200/80'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.shortLabel}</span>
                  <span className={`text-[10px] font-mono ${isActive ? 'text-amber-100' : 'text-stone-400'}`}>
                    ({item.count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. المحتوى المركزي */}
        <main className="max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-6 flex-1 space-y-4 sm:space-y-5">

          {/* رسائل التنبيه الفورية */}
          {actionMessage && (
            <div
              className={`p-3.5 sm:p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-xs animate-in fade-in duration-200 ${actionMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
            >
              <div className="flex items-center gap-2">
                {actionMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="leading-relaxed">{actionMessage.text}</span>
              </div>
              <button
                onClick={() => setActionMessage(null)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {hasError && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{hasError}</span>
              </div>
              <button
                onClick={loadData}
                className="self-end sm:self-auto px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors cursor-pointer shadow-2xs"
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {/* 4. ملخص الأداء والإحصائيات */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => { setActiveTab('merchants'); setStatusFilter('all'); }}
              className="text-right bg-white rounded-2xl border border-[#eddcc8] hover:border-[#b47820]/60 p-3.5 sm:p-4 shadow-2xs transition-all flex items-center justify-between gap-2 cursor-pointer"
            >
              <div className="min-w-0">
                <span className="text-[11px] text-stone-500 font-semibold block truncate">إجمالي المنشآت</span>
                <span className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
                  {stats?.merchants.total ?? '—'}
                </span>
                <span className="text-[10px] text-stone-400 block font-medium truncate">مؤسسات مسجلة</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#fbf3e6] border border-[#ebd2b0] text-[#b47820] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('merchants'); setStatusFilter('pending'); }}
              className="text-right bg-white rounded-2xl border border-amber-300 hover:border-amber-500 p-3.5 sm:p-4 shadow-2xs transition-all flex items-center justify-between gap-2 cursor-pointer"
            >
              <div className="min-w-0">
                <span className="text-[11px] text-amber-800 font-semibold block truncate">بانتظار الاعتماد</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-amber-600 font-mono">
                    {stats?.merchants.pending ?? 0}
                  </span>
                  {(stats?.merchants.pending ?? 0) > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  )}
                </div>
                <span className="text-[10px] text-amber-700 block font-semibold truncate">اضغط للمراجعة</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className="text-right bg-white rounded-2xl border border-[#eddcc8] hover:border-emerald-400 p-3.5 sm:p-4 shadow-2xs transition-all flex items-center justify-between gap-2 cursor-pointer"
            >
              <div className="min-w-0">
                <span className="text-[11px] text-emerald-800 font-semibold block truncate">أصناف الكتالوج</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                  {stats?.catalog.products ?? products.length}
                </span>
                <span className="text-[10px] text-emerald-600 block font-medium truncate">
                  {stats?.catalog.branches ?? branches.length} مستودعات نشطة
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`text-right bg-white rounded-2xl border p-3.5 sm:p-4 shadow-2xs transition-all flex items-center justify-between gap-2 cursor-pointer ${activeCarts.length > 0 || (stats?.orders.active_carts ?? 0) > 0
                ? 'border-amber-400 hover:border-amber-500 ring-1 ring-amber-200/70'
                : 'border-[#eddcc8] hover:border-stone-400'
                }`}
            >
              <div className="min-w-0">
                <span className="text-[11px] text-stone-500 font-semibold block truncate">الطلبات والسلات النشطة</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
                    {stats?.orders.total ?? 0}
                  </span>
                  {(activeCarts.length > 0 || (stats?.orders.active_carts ?? 0) > 0 || (stats?.orders.new ?? 0) > 0) && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  )}
                </div>
                <span className="text-[10px] text-amber-700 block font-semibold truncate">
                  {activeCarts.length > 0 || (stats?.orders.active_carts ?? 0) > 0
                    ? `${activeCarts.length || stats?.orders.active_carts || 0} سلة قيد التجهيز الآن`
                    : (stats?.orders.new ?? 0) > 0
                      ? `${stats?.orders.new} طلب جديد بانتظار التجهيز`
                      : `${stats?.orders.revenue ?? 0} ر.س`}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#fbf3e6] border border-[#ebd2b0] text-[#b47820] flex items-center justify-center shrink-0">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </button>
          </div>

          {activeCarts.length > 0 && activeTab !== 'orders' && (
            <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-[#fbf3e6] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2.5 text-xs font-bold text-amber-950">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                <ShoppingCart className="w-4 h-4 text-[#b47820] shrink-0" />
                <span>
                  يوجد حالياً {activeCarts.length} {activeCarts.length === 1 ? 'تاجر يضيف منتجات إلى السلة' : 'تجار يضيفون منتجات إلى السلة'} الآن
                  {' '}
                  ({activeCarts.reduce((sum, c) => sum + (c.summary?.total_quantity ?? 0), 0)} قطعة بإجمالي{' '}
                  {activeCarts.reduce((sum, c) => sum + (c.summary?.total ?? 0), 0).toFixed(2)} ر.س)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-[#b47820] hover:bg-[#8f5a13] text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                عرض السلات والطلبات
              </button>
            </div>
          )}

          {/* شريط الإضافة السريعة المدمج */}
          <div className="bg-white rounded-2xl border border-[#eddcc8] px-3.5 py-2.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-700 shrink-0">
              <Zap className="w-4 h-4 text-[#b47820]" />
              <span>إضافة سريعة:</span>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openAddProductModal}
                className="flex items-center justify-center gap-1.5 bg-[#b47820] hover:bg-[#8f5a13] active:scale-95 text-white font-bold text-[11px] py-2 px-3 rounded-xl transition-all cursor-pointer"
              >
                <PackagePlus className="w-3.5 h-3.5 shrink-0" />
                <span>+ منتج جديد</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBulkImportOpen(true)}
                className="flex items-center justify-center gap-1.5 bg-[#fbf3e6] hover:bg-[#f5e7cf] border border-[#ebd2b0] active:scale-95 text-[#8f5a13] font-bold text-[11px] py-2 px-3 rounded-xl transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                <span>استيراد Excel / Drive</span>
              </button>

              <button
                type="button"
                onClick={openAddCategoryModal}
                className="flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-[11px] py-2 px-3 rounded-xl transition-all cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 shrink-0" />
                <span>+ قسم جديد</span>
              </button>

              <button
                type="button"
                onClick={openAddBranchModal}
                className="flex items-center justify-center gap-1.5 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white font-bold text-[11px] py-2 px-3 rounded-xl transition-all cursor-pointer"
              >
                <Warehouse className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>+ مستودع</span>
              </button>

              <button
                type="button"
                onClick={openAddAdModal}
                className="flex items-center justify-center gap-1.5 bg-[#fbf3e6] hover:bg-[#faebd7] active:scale-95 text-[#8f5a13] border border-[#ebd2b0] font-bold text-[11px] py-2 px-3 rounded-xl transition-all cursor-pointer"
              >
                <ImagePlus className="w-3.5 h-3.5 shrink-0" />
                <span>+ رفع إعلان</span>
              </button>
            </div>
          </div>

          {/* 5. الجداول الكاملة والبطاقات المتجاوبة حسب التبويب */}

          {/* ================= تبويب 1: المنشآت والتجار ================= */}
          {activeTab === 'merchants' && (
            <div className="bg-white rounded-3xl border border-[#eddcc8] shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#b47820]" />
                    المنشآت والمؤسسات التجارية
                  </h3>
                  <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 font-medium">
                    مراجعة السجل التجاري والرقم الضريبي ZATCA واعتماد المنشآت فورياً
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:flex-initial">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="بحث باسم المنشأة أو السجل..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-56 bg-stone-50 border border-stone-200 rounded-xl pr-8 pl-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-[#b47820]"
                    />
                  </form>

                  <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1.5 sm:py-1 rounded-lg transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                        }`}
                    >
                      الكل
                    </button>
                    <button
                      onClick={() => setStatusFilter('pending')}
                      className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-2xs' : 'text-stone-500'
                        }`}
                    >
                      <span>الانتظار</span>
                      {(stats?.merchants.pending ?? 0) > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      )}
                    </button>
                    <button
                      onClick={() => setStatusFilter('active')}
                      className={`px-3 py-1.5 sm:py-1 rounded-lg transition-all cursor-pointer ${statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-stone-500'
                        }`}
                    >
                      معتمد
                    </button>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-16 text-stone-500 text-sm font-bold flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#b47820]" />
                  <span>جاري تحميل بيانات المنشآت...</span>
                </div>
              ) : merchants.length === 0 ? (
                <div className="text-center py-16 text-stone-500 text-sm font-bold">
                  لا توجد منشآت مطابقة للشروط الحالية
                </div>
              ) : (
                <>
                  {/* عرض الجوال: بطاقات أنيقة مريحة للمس */}
                  <div className="md:hidden divide-y divide-stone-100">
                    {merchants.map((merchant) => (
                      <div key={merchant.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[#fbf3e6] border border-[#ebd2b0] text-[#b47820] flex items-center justify-center shrink-0">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-stone-900 text-sm leading-snug truncate">
                                {merchant.company_name}
                              </h4>
                              <span className="font-mono text-[10px] text-stone-500">
                                كود: <strong className="text-[#b47820]">{merchant.customer_code}</strong>
                              </span>
                            </div>
                          </div>

                          {merchant.status === 'active' ? (
                            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              معتمد
                            </span>
                          ) : merchant.status === 'pending' ? (
                            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full animate-pulse">
                              <Clock className="w-3 h-3 text-amber-600" />
                              قيد الاعتماد
                            </span>
                          ) : (
                            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                              موقوف
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-stone-50/80 p-2.5 rounded-2xl border border-stone-100">
                          <div>
                            <span className="text-stone-400 block">السجل التجاري</span>
                            <span className="font-mono font-bold text-stone-800">{merchant.cr_number}</span>
                          </div>
                          <div>
                            <span className="text-stone-400 block">الرقم الضريبي</span>
                            <span className="font-mono font-bold text-amber-900 truncate block">{merchant.vat_number}</span>
                          </div>
                          <div>
                            <span className="text-stone-400 block">المسؤول</span>
                            <span className="font-semibold text-stone-800 truncate block">{merchant.owner_name}</span>
                          </div>
                          <div>
                            <span className="text-stone-400 block">الجوال</span>
                            <a href={`tel:${merchant.user?.phone || ''}`} className="font-mono font-bold text-[#b47820]" dir="ltr">
                              {merchant.user?.phone || '—'}
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500">
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            {merchant.city} — {merchant.address}
                          </span>
                        </div>

                        <div>
                          {merchant.status !== 'active' ? (
                            <button
                              type="button"
                              onClick={() => handleApprove(merchant.id, merchant.company_name)}
                              className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                              <span>اعتماد وتفعيل المنشأة فورياً</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleReject(merchant.id, merchant.company_name)}
                              className="w-full inline-flex items-center justify-center gap-1.5 bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 font-bold text-xs py-2 px-3 rounded-xl border border-stone-200 transition-colors cursor-pointer"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                              <span>إيقاف المنشأة</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* عرض الديسكتوب: جدول تنفيذي متكامل */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-[#fcfbfa] border-b border-[#eddcc8] text-stone-600 font-bold">
                        <tr>
                          <th className="py-4 px-5">المؤسسة / الشركة</th>
                          <th className="py-4 px-5">السجل التجاري (CR)</th>
                          <th className="py-4 px-5">الرقم الضريبي (ZATCA)</th>
                          <th className="py-4 px-5">المسؤول المفوض</th>
                          <th className="py-4 px-5">المقر والمدينة</th>
                          <th className="py-4 px-5 text-center">الحالة</th>
                          <th className="py-4 px-5 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                        {merchants.map((merchant) => (
                          <tr key={merchant.id} className="hover:bg-stone-50/70 transition-colors">
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#fbf3e6] border border-[#ebd2b0] text-[#b47820] flex items-center justify-center shrink-0 shadow-2xs font-bold">
                                  <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="font-bold text-stone-900 text-sm leading-snug">{merchant.company_name}</div>
                                  <div className="font-mono text-[10px] text-stone-500 mt-0.5">
                                    كود التاجر: <strong className="text-[#b47820]">{merchant.customer_code}</strong>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-5 font-mono font-bold text-stone-900 text-xs">
                              <div className="flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-stone-400" />
                                <span>{merchant.cr_number}</span>
                              </div>
                            </td>
                            <td className="py-4 px-5 font-mono font-bold text-amber-900 text-xs">
                              <div className="flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                                <span>{merchant.vat_number}</span>
                              </div>
                            </td>
                            <td className="py-4 px-5">
                              <div className="font-bold text-stone-900">{merchant.owner_name}</div>
                              <div className="text-stone-500 font-mono text-[11px] mt-0.5" dir="ltr">{merchant.user?.phone || '—'}</div>
                            </td>
                            <td className="py-4 px-5">
                              <div className="font-bold text-stone-900">{merchant.city}</div>
                              <div className="text-[10px] text-stone-500 truncate max-w-xs">{merchant.address}</div>
                            </td>
                            <td className="py-4 px-5 text-center">
                              {merchant.status === 'active' ? (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  معتمد ومفعل
                                </span>
                              ) : merchant.status === 'pending' ? (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full animate-pulse">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  بانتظار الاعتماد
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                                  <X className="w-3.5 h-3.5 text-rose-600" />
                                  موقوف
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {merchant.status !== 'active' && (
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(merchant.id, merchant.company_name)}
                                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                                  >
                                    <Check className="w-4 h-4" />
                                    <span>اعتماد وتفعيل المنشأة</span>
                                  </button>
                                )}
                                {merchant.status === 'active' && (
                                  <button
                                    type="button"
                                    onClick={() => handleReject(merchant.id, merchant.company_name)}
                                    className="inline-flex items-center gap-1 bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 font-bold text-xs py-2 px-3 rounded-xl border border-stone-200 transition-colors cursor-pointer"
                                  >
                                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                    <span>إيقاف</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================= تبويب 2: المنتجات وأسعار الحبة ================= */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-3xl border border-[#eddcc8] shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-[#b47820]" />
                    المنتجات والتسعير بالحبة ({products.length} صنف)
                  </h3>
                  <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 font-medium">
                    تعديل سعر الجملة للحبة، تفعيل أو تعطيل الصنف، وإضافة أصناف جديدة
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
                  <div className="grid grid-cols-2 sm:flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 sm:py-1.5 text-xs">
                      <Warehouse className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <select
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                        className="w-full bg-transparent text-xs text-stone-800 font-bold focus:outline-hidden cursor-pointer"
                      >
                        <option value="all">كل المستودعات</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id.toString()}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 sm:py-1.5 text-xs">
                      <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full bg-transparent text-xs text-stone-800 font-bold focus:outline-hidden cursor-pointer"
                      >
                        <option value="all">كل الأقسام</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id.toString()}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:flex-initial">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="بحث بالصنف أو الكود..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-48 bg-stone-50 border border-stone-200 rounded-xl pr-8 pl-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-[#b47820]"
                      />
                    </form>

                    <button
                      type="button"
                      onClick={() => setIsBulkImportOpen(true)}
                      className="shrink-0 inline-flex items-center gap-1.5 bg-[#fbf3e6] hover:bg-[#f5e7cf] border border-[#ebd2b0] text-[#8f5a13] font-bold text-xs py-2 px-3 rounded-xl cursor-pointer transition-colors"
                      title="استيراد جماعي من Excel / CSV / Google Drive"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="hidden sm:inline">استيراد</span>
                    </button>

                    <button
                      type="button"
                      disabled={isExportingProducts}
                      onClick={async () => {
                        setIsExportingProducts(true);
                        try {
                          await adminApi.exportProductsCsv({
                            search: searchQuery || undefined,
                            category_id: categoryFilter !== 'all' ? parseInt(categoryFilter) : undefined,
                            branch_id: branchFilter !== 'all' ? parseInt(branchFilter) : undefined,
                          });
                        } finally {
                          setIsExportingProducts(false);
                        }
                      }}
                      className="shrink-0 inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 font-bold text-xs py-2 px-3 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
                      title="تصدير المنتجات الحالية إلى ملف CSV"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">{isExportingProducts ? 'جاري...' : 'تصدير'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={openAddProductModal}
                      className="shrink-0 inline-flex items-center gap-1.5 bg-[#b47820] hover:bg-[#8f5a13] text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs cursor-pointer transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة صنف</span>
                    </button>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-16 text-stone-500 text-sm font-bold flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#b47820]" />
                  <span>جاري تحميل الأصناف...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16 text-stone-500 text-sm font-bold space-y-3">
                  <Package className="w-10 h-10 text-stone-300 mx-auto" />
                  <p>لا توجد أصناف مطابقة للشروط المحددة</p>
                  <button
                    onClick={openAddProductModal}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#b47820] underline cursor-pointer"
                  >
                    + أضف أول صنف الآن
                  </button>
                </div>
              ) : (
                <>
                  {/* عرض الجوال: بطاقات منتجات مريحة وواضحة */}
                  <div className="md:hidden divide-y divide-stone-100">
                    {products.map((product) => {
                      const unitPrice = product.default_package?.unit_price || 0;
                      const isEditing = editingProductId === product.id;

                      return (
                        <div key={product.id} className="p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-6 h-6 text-stone-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-stone-900 text-sm leading-snug line-clamp-2">
                                  {product.name}
                                </h4>
                                {product.is_active ? (
                                  <span className="shrink-0 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    متاح
                                  </span>
                                ) : (
                                  <span className="shrink-0 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                    معطل
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px]">
                                <span className="font-mono font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md">
                                  {product.code}
                                </span>
                                {product.brand && (
                                  <span className="bg-amber-50 text-[#8f5a13] border border-[#ebd2b0] px-2 py-0.5 rounded-md font-bold">
                                    {product.brand}
                                  </span>
                                )}
                                <span className="bg-[#fbf3e6] text-[#8f5a13] px-2 py-0.5 rounded-md font-semibold">
                                  {product.category?.name || 'عام'}
                                </span>
                                <span className="text-stone-500">
                                  • {product.branch?.name || 'مستودع مركزي'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* شريط السعر والإجراءات على الجوال */}
                          <div className="flex items-center justify-between gap-2 pt-1">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 w-full">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingPrice}
                                  onChange={(e) => setEditingPrice(e.target.value)}
                                  className="flex-1 bg-white border-2 border-[#b47820] rounded-xl p-2 text-center font-mono font-bold text-sm"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveProductPrice(product.id)}
                                  className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                                >
                                  حفظ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingProductId(null)}
                                  className="p-2 rounded-xl bg-stone-200 text-stone-700 cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="inline-flex items-baseline gap-1 font-mono bg-[#fdfbf7] border border-[#ebd2b0] px-3 py-1.5 rounded-xl">
                                  <span className="text-base font-bold text-stone-900">{unitPrice}</span>
                                  <span className="text-[10px] font-sans text-[#8f5a13] font-semibold">ر.س / حبة</span>
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingProductId(product.id);
                                      setEditingPrice(unitPrice.toString());
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8f5a13] bg-[#fbf3e6] border border-[#ebd2b0] px-2.5 py-2 rounded-xl cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span>السعر</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditProductModal(product)}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-800 bg-white border border-stone-200 px-2.5 py-2 rounded-xl cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-[#b47820]" />
                                    <span>البيانات</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleProduct(product)}
                                    className={`text-[11px] font-bold px-2.5 py-2 rounded-xl border cursor-pointer ${product.is_active
                                      ? 'text-stone-600 bg-stone-100 border-stone-200'
                                      : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                      }`}
                                  >
                                    {product.is_active ? 'تعطيل' : 'تفعيل'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(product.id, product.name)}
                                    className="p-2 rounded-xl text-rose-600 bg-rose-50/70 border border-rose-100 cursor-pointer"
                                    title="حذف"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* عرض الديسكتوب: جدول احترافي */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-[#fcfbfa] border-b border-[#eddcc8] text-stone-600 font-bold">
                        <tr>
                          <th className="py-4 px-5">الصورة واسم الصنف</th>
                          <th className="py-4 px-5">القسم</th>
                          <th className="py-4 px-5">المستودع</th>
                          <th className="py-4 px-5 text-center">سعر الحبة (ر.س)</th>
                          <th className="py-4 px-5 text-center">الحالة</th>
                          <th className="py-4 px-5 text-center">الإجراءات والتحكم</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                        {products.map((product) => {
                          const unitPrice = product.default_package?.unit_price || 0;
                          const isEditing = editingProductId === product.id;

                          return (
                            <tr key={product.id} className="hover:bg-stone-50/70 transition-colors">
                              <td className="py-3.5 px-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                                    {product.image ? (
                                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <Package className="w-5 h-5 text-stone-400" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-bold text-stone-900 leading-snug">{product.name}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="font-mono text-[10px] text-stone-500">كود: {product.code}</span>
                                      {product.brand && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#fbf3e6] text-[#8f5a13] border border-[#ebd2b0]/70">
                                          {product.brand}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-5 font-bold text-stone-700">
                                {product.category?.name || 'عام'}
                              </td>
                              <td className="py-3.5 px-5 text-stone-600 text-xs">
                                {product.branch?.name || 'مستودع مركزي'}
                              </td>
                              <td className="py-3.5 px-5 text-center">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editingPrice}
                                      onChange={(e) => setEditingPrice(e.target.value)}
                                      className="w-24 bg-white border border-[#b47820] rounded-xl p-1.5 text-center font-mono font-bold text-sm shadow-xs"
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveProductPrice(product.id)}
                                      className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-xs"
                                      title="حفظ السعر"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingProductId(null)}
                                      className="p-2 rounded-xl bg-stone-200 text-stone-700 hover:bg-stone-300 cursor-pointer"
                                      title="إلغاء"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-stone-900 bg-stone-50 border border-stone-200 px-3.5 py-1.5 rounded-xl">
                                    <span>{unitPrice}</span>
                                    <span className="text-[10px] font-sans font-normal text-stone-500">ر.س / حبة</span>
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 px-5 text-center">
                                {product.is_active ? (
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                    متاح للطلب
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                                    معطل
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-5 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingProductId(product.id);
                                      setEditingPrice(unitPrice.toString());
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-[#8f5a13] hover:text-[#7a480d] bg-[#fbf3e6] hover:bg-[#faebd7] border border-[#ebd2b0] px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span>السعر</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openEditProductModal(product)}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-stone-800 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 border border-stone-200 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                                    title="تعديل الاسم، الكود، القسم، المستودع، الصورة والوصف"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-[#b47820]" />
                                    <span>تعديل البيانات</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleProduct(product)}
                                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${product.is_active
                                      ? 'text-stone-600 bg-stone-100 hover:bg-rose-50 hover:text-rose-700 border-stone-200'
                                      : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                                      }`}
                                  >
                                    {product.is_active ? 'تعطيل' : 'تفعيل'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(product.id, product.name)}
                                    className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="حذف الصنف"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================= تبويب 3: الأقسام والتصنيفات ================= */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-3xl border border-[#eddcc8] shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
                    <FolderTree className="w-5 h-5 text-[#b47820]" />
                    أقسام وتصنيفات المستودع ({categories.length} قسماً)
                  </h3>
                  <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                    تقسيمات وتصنيفات المنتجات داخل المستودعات
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAddCategoryModal}
                  className="self-start sm:self-auto inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>+ إضافة قسم جديد</span>
                </button>
              </div>

              {/* عرض الجوال: بطاقات الأقسام */}
              <div className="md:hidden p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${cat.parent ? 'border-amber-200/80 bg-white mr-3' : 'border-[#eddcc8] bg-[#fdfbf7]'
                      }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono bg-white border border-stone-200 px-1.5 py-0.5 rounded text-stone-400">
                          #{idx + 1}
                        </span>
                        <h4 className="font-bold text-stone-900 text-sm truncate">
                          {cat.parent ? `↳ ${cat.name}` : cat.name}
                        </h4>
                        {cat.parent && (
                          <span className="text-[10px] font-bold bg-[#fbf3e6] text-[#8f5a13] border border-[#ebd2b0] px-2 py-0.5 rounded-full">
                            فرعي تحت: {cat.parent.name}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-2">
                        <span>{cat.branch?.name || 'مستودع البديعة المركزي'}</span>
                        <span>•</span>
                        <span className="font-mono font-bold text-[#b47820]">{cat.products_count ?? 0} صنف</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditCategoryModal(cat)}
                        className="p-2 text-[#8f5a13] bg-[#fbf3e6] hover:bg-[#faebd7] border border-[#ebd2b0] rounded-xl transition-colors cursor-pointer"
                        title="تعديل القسم"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                        title="حذف القسم"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* عرض الديسكتوب */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#fcfbfa] border-b border-[#eddcc8] text-stone-600 font-bold">
                    <tr>
                      <th className="py-4 px-5">#</th>
                      <th className="py-4 px-5">اسم القسم</th>
                      <th className="py-4 px-5">النوع / القسم الأب</th>
                      <th className="py-4 px-5">المستودع التابع له</th>
                      <th className="py-4 px-5 text-center">عدد الأصناف المتوفرة</th>
                      <th className="py-4 px-5 text-center">الترتيب</th>
                      <th className="py-4 px-5 text-center">الحالة</th>
                      <th className="py-4 px-5 text-center">التحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                    {categories.map((cat, idx) => (
                      <tr key={cat.id} className={`hover:bg-stone-50/70 transition-colors ${cat.parent ? 'bg-[#fdfbf7]/60' : ''}`}>
                        <td className="py-3.5 px-5 font-mono text-stone-400">{idx + 1}</td>
                        <td className="py-3.5 px-5 font-bold text-stone-900 text-sm">
                          {cat.parent ? <span className="pr-4 text-stone-700">↳ {cat.name}</span> : cat.name}
                        </td>
                        <td className="py-3.5 px-5">
                          {cat.parent ? (
                            <span className="text-[11px] font-bold bg-[#fbf3e6] text-[#8f5a13] border border-[#ebd2b0] px-2.5 py-0.5 rounded-full">
                              فرعي ← {cat.parent.name}
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full">
                              قسم رئيسي
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-stone-600 font-medium">{cat.branch?.name || 'مستودع البديعة المركزي'}</td>
                        <td className="py-3.5 px-5 text-center font-bold font-mono text-[#b47820]">
                          {cat.products_count ?? 0} صنف
                        </td>
                        <td className="py-3.5 px-5 text-center font-mono text-stone-500 font-bold">{cat.sort}</td>
                        <td className="py-3.5 px-5 text-center">
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            نشط
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditCategoryModal(cat)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#8f5a13] bg-[#fbf3e6] hover:bg-[#faebd7] border border-[#ebd2b0] px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>تعديل</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="حذف القسم"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= تبويب 4: المستودعات ومراكز التوريد ================= */}
          {activeTab === 'branches' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white rounded-3xl border border-[#eddcc8] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-[#b47820]" />
                    مستودعات ومراكز التوزيع المعتمدة ({branches.length})
                  </h3>
                  <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                    جميع مراكز التوريد المتصلة بنظام الجملة المباشر والشحن الفوري
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAddBranchModal}
                  className="self-start sm:self-auto inline-flex items-center gap-1.5 bg-[#b47820] hover:bg-[#8f5a13] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ إضافة مستودع جديد</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {branches.map((b) => (
                  <div
                    key={b.id}
                    className="relative overflow-hidden rounded-3xl bg-white border border-[#eddcc8] p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fbf3e6] border border-[#ebd2b0] text-[#8f5a13]">
                          <span className="w-2 h-2 rounded-full bg-[#b47820] animate-pulse" />
                          جاهز للتجهيز
                        </span>
                        <div className="w-12 h-12 rounded-2xl bg-[#b47820] text-white flex items-center justify-center shadow-md shadow-amber-950/15">
                          <Warehouse className="w-6 h-6" />
                        </div>
                      </div>

                      <h4 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                        {b.name}
                      </h4>
                      <p className="text-xs text-stone-500 mt-1.5 leading-relaxed line-clamp-2">
                        {b.description || 'مستودع التجهيز السريع والشحن المباشر لكافة مناطق المملكة'}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-stone-100 space-y-3">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-1.5 text-stone-500 font-medium truncate">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">الرياض - {b.name}</span>
                        </div>
                        <span className="shrink-0 font-mono font-bold bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-lg text-xs">
                          كود: {b.code}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 gap-2">
                        <span className="text-[11px] text-stone-400 font-mono">
                          الأصناف: <strong className="text-stone-700">{b.products_count ?? 31}</strong>
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditBranchModal(b)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8f5a13] hover:text-[#7a480d] bg-[#fbf3e6] hover:bg-[#faebd7] border border-[#ebd2b0] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            title="تعديل بيانات المستودع"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>تعديل البيانات</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteBranch(b.id, b.name)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            title="حذف المستودع"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={openAddBranchModal}
                  className="rounded-3xl border-2 border-dashed border-[#ebd2b0] hover:border-[#b47820] bg-[#fbf9f4]/60 hover:bg-[#fbf3e6]/80 p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer min-h-[200px] group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white border border-[#ebd2b0] text-[#b47820] flex items-center justify-center shadow-xs mb-3 group-hover:scale-105 transition-transform">
                    <Plus className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-stone-900 text-sm">
                    + إضافة مستودع توريد جديد
                  </span>
                  <span className="text-[11px] text-stone-500 mt-1 max-w-[210px]">
                    أضف مركز توزيع جديد للمنصة فورياً وتخصيص كوده وأقسامه
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ================= تبويب 4.5: جدول الإعلانات والبنرات ================= */}
          {activeTab === 'advertisements' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white rounded-3xl border border-[#eddcc8] p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-[#b47820]" />
                    جدول الإعلانات والبنرات ({adsList.length} إعلان)
                  </h3>
                  <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                    ارفع صور البنرات الدعائية لتظهر تلقائياً في بداية الصفحة الرئيسية والكتالوج
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAddAdModal}
                  className="self-start sm:self-auto inline-flex items-center gap-1.5 bg-[#b47820] hover:bg-[#8f5a13] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  <ImagePlus className="w-4 h-4" />
                  <span>+ رفع صورة إعلان جديد</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {adsList.map((ad) => {
                  const placementLabel =
                    ad.placement === 'home'
                      ? 'الصفحة الرئيسية'
                      : ad.placement === 'catalog'
                        ? 'صفحة الكتالوج'
                        : 'الرئيسية والكتالوج';

                  return (
                    <div
                      key={ad.id}
                      className={`rounded-3xl bg-white border overflow-hidden shadow-sm transition-all flex flex-col justify-between ${ad.is_active ? 'border-[#eddcc8]' : 'border-stone-200 opacity-75'
                        }`}
                    >
                      <div>
                        <div className="relative h-44 sm:h-48 bg-stone-100 border-b border-stone-100 overflow-hidden flex items-center justify-center">
                          <img
                            src={ad.image_url}
                            alt={ad.title || `إعلان #${ad.id}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/95 text-stone-800 border border-[#eddcc8] shadow-xs">
                              {placementLabel}
                            </span>
                          </div>
                          <div className="absolute top-3 left-3">
                            {ad.is_active ? (
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-xs">
                                مفعّل ✓
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-stone-700 text-white shadow-xs">
                                مخفي
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-4 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-stone-900 text-sm truncate">
                              {ad.title || `بنر إعلاني #${ad.id}`}
                            </h4>
                            <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md shrink-0">
                              ترتيب: {ad.sort}
                            </span>
                          </div>
                          {ad.subtitle && (
                            <p className="text-xs text-stone-500 line-clamp-2">{ad.subtitle}</p>
                          )}
                        </div>
                      </div>

                      <div className="px-4 pb-4 pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => openEditAdModal(ad)}
                          className="inline-flex items-center justify-center gap-1 text-xs font-bold text-[#8f5a13] bg-[#fbf3e6] hover:bg-[#faebd7] border border-[#ebd2b0] py-2 px-3 rounded-xl transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleAd(ad)}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl border transition-colors cursor-pointer ${ad.is_active
                            ? 'text-stone-700 bg-stone-100 hover:bg-amber-50 border-stone-200'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                            }`}
                        >
                          {ad.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{ad.is_active ? 'إخفاء' : 'تفعيل'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteAd(ad.id)}
                          className="p-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 transition-colors cursor-pointer"
                          title="حذف الإعلان"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* كرت سريع لرفع إعلان جديد */}
                <button
                  type="button"
                  onClick={openAddAdModal}
                  className="rounded-3xl border-2 border-dashed border-[#ebd2b0] hover:border-[#b47820] bg-[#fbf9f4]/60 hover:bg-[#fbf3e6]/80 p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer min-h-[250px] group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white border border-[#ebd2b0] text-[#b47820] flex items-center justify-center shadow-xs mb-3 group-hover:scale-105 transition-transform">
                    <Upload className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-stone-900 text-sm">
                    + رفع صورة بنر إعلاني جديد
                  </span>
                  <span className="text-[11px] text-stone-500 mt-1 max-w-[220px]">
                    اختر صورة من جهازك أو الجوال لعرضها في أعلى المتجر والكتالوج
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ================= تبويب 5: طلبات الجملة والسلات النشطة والفواتير ================= */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* القسم الأول: مراقبة السلات النشطة الآن */}
              <div className="bg-white rounded-3xl border border-[#eddcc8] shadow-xs overflow-hidden">
                <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-[#eddcc8]/60 flex items-center justify-between gap-2 bg-gradient-to-l from-[#fdfbf7] to-white">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#fbf3e6] to-amber-100/70 border border-[#ebd2b0] text-[#b47820] flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-extrabold text-stone-900 truncate">
                          السلات النشطة الآن
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${activeCarts.length > 0
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-stone-100 text-stone-600 border-stone-200'
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${activeCarts.length > 0 ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
                              }`}
                          />
                          {activeCarts.length}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 truncate hidden sm:block">
                        متابعة فورية لإضافات التجار (تحديث تلقائي كل 10 ثوانٍ)
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={loadData}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#fbf3e6] hover:bg-[#f5e7cf] border border-[#ebd2b0]/80 text-[#8f5a13] text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>تحديث</span>
                  </button>
                </div>

                {activeCarts.length === 0 ? (
                  <div className="px-4 py-3.5 bg-[#fdfbf7]/60 flex items-center justify-center gap-2 text-[11px] text-stone-500 font-medium text-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-500/80 shrink-0" />
                    <span>لا توجد سلات مفتوحة حالياً — ستظهر إضافات التجار هنا تلقائياً</span>
                  </div>
                ) : (
                  <div className="p-3.5 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {activeCarts.map((cart) => {
                      const companyName = cart.user?.merchant_profile?.company_name || cart.user?.name || 'عميل';
                      const isConverting = convertingCartId === cart.id;

                      return (
                        <div
                          key={cart.id}
                          className="rounded-2xl border border-[#ebd2b0] bg-gradient-to-b from-[#fdfbf7] to-white p-3.5 sm:p-4 flex flex-col justify-between gap-3 shadow-2xs"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                  <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm truncate">{companyName}</h4>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-stone-500 mt-1">
                                  <span>{cart.branch?.name || 'مستودع رئيسي'}</span>
                                  {cart.user?.phone && (
                                    <a
                                      href={`tel:${cart.user.phone}`}
                                      className="font-mono text-[#8f5a13] hover:underline"
                                    >
                                      {cart.user.phone}
                                    </a>
                                  )}
                                  <span className="font-mono text-stone-400">
                                    {new Date(cart.updated_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#fbf3e6] text-[#8f5a13] border border-[#ebd2b0] shrink-0 font-mono">
                                {cart.summary.items_count} صنف · {cart.summary.total_quantity} قطعة
                              </span>
                            </div>

                            <div className="bg-white rounded-xl border border-[#eddcc8]/80 divide-y divide-stone-100 max-h-40 overflow-y-auto">
                              {cart.items.map((item) => (
                                <div key={item.id} className="px-3 py-2 flex items-center justify-between gap-2 text-xs">
                                  <div className="min-w-0">
                                    <div className="font-bold text-stone-800 truncate">{item.product_name}</div>
                                    <div className="text-[10px] text-stone-400">
                                      {item.quantity} × {item.unit_price} ر.س {item.unit_name ? `(${item.unit_name})` : ''}
                                    </div>
                                  </div>
                                  <span className="font-mono font-bold text-stone-900 shrink-0">
                                    {Number(item.total_price).toFixed(2)} ر.س
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-[#eddcc8]/70 flex items-center justify-between gap-2.5">
                            <div>
                              <span className="text-[10px] text-stone-400 block">الإجمالي شامل الضريبة</span>
                              <span className="font-mono font-black text-sm sm:text-base text-[#8f5a13]">
                                {Number(cart.summary.total).toFixed(2)} <span className="text-[11px] font-bold">ر.س</span>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleConvertCartToOrder(cart)}
                              disabled={isConverting}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#8f5a13] to-[#b47820] hover:opacity-95 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-60 shadow-xs shrink-0"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                              <span>{isConverting ? 'جاري الإصدار...' : 'اعتماد كطلب وفاتورة'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* القسم الثاني: طلبات الجملة والفواتير الضريبية */}
              <div className="bg-white rounded-3xl border border-[#eddcc8] shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-[#eddcc8]/60 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#fbf3e6] border border-[#ebd2b0] text-[#b47820] flex items-center justify-center shrink-0">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-extrabold text-stone-900 truncate">
                            الطلبات والفواتير
                          </h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-stone-100 text-stone-700 border border-stone-200">
                            {orders.length}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 truncate hidden sm:block">
                          تحديث حالة التجهيز وإصدار الفواتير الضريبية
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#fbf3e6] text-[#8f5a13] border border-[#ebd2b0]/80 shrink-0">
                      فوترة مباشرة
                    </span>
                  </div>

                  {/* شريط فلاتر الحالة الأنيق */}
                  <div className="bg-[#faf7f2] p-1 rounded-2xl border border-[#eddcc8]/80 flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {[
                      { key: 'all', label: 'الكل' },
                      { key: 'new', label: 'جديد' },
                      { key: 'processing', label: 'قيد التجهيز' },
                      { key: 'ready', label: 'جاهز' },
                      { key: 'delivered', label: 'تم التسليم' },
                      { key: 'cancelled', label: 'ملغي' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setOrderStatusFilter(tab.key)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${orderStatusFilter === tab.key
                          ? 'bg-gradient-to-r from-[#8f5a13] to-[#b47820] text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#fbf3e6] border border-[#ebd2b0]/70 text-[#b47820] flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-bold text-stone-800">
                        لا توجد طلبات في هذا التصنيف حالياً
                      </p>
                      <p className="text-[11px] text-stone-400">
                        ستظهر الطلبات والفواتير هنا بمجرد إتمام أي طلب من السلة
                      </p>
                    </div>
                    {orderStatusFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setOrderStatusFilter('all')}
                        className="mt-1 px-3.5 py-1.5 rounded-xl bg-[#fbf3e6] hover:bg-[#f5e7cf] border border-[#ebd2b0] text-[#8f5a13] text-xs font-bold transition-colors cursor-pointer"
                      >
                        عرض جميع الطلبات
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* عرض الجوال */}
                    <div className="md:hidden divide-y divide-[#eddcc8]/50">
                      {orders.map((order) => {
                        const statusInfo = ORDER_STATUS_LABELS[order.status] || {
                          label: order.status_label || order.status,
                          style: 'bg-stone-100 text-stone-700 border-stone-200',
                        };
                        const isExpanded = expandedOrderId === order.id;

                        return (
                          <div key={order.id} className="p-4 space-y-3 hover:bg-[#fdfbf7]/60 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-extrabold text-stone-900 text-sm">#{order.order_number}</span>
                                <span className="text-[10px] text-stone-400 font-mono">
                                  {new Date(order.created_at).toLocaleDateString('ar-SA')}
                                </span>
                              </div>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.style}`}>
                                {statusInfo.label}
                              </span>
                            </div>

                            <div className="bg-[#fdfbf7] rounded-2xl p-3 border border-[#eddcc8]/70 space-y-2 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-extrabold text-stone-900 truncate">
                                  {order.user?.merchant_profile?.company_name || order.user?.name}
                                </span>
                                <span className="text-[10px] text-stone-500 bg-white px-2 py-0.5 rounded-lg border border-stone-200/70 shrink-0">
                                  {order.branch?.name || 'مستودع رئيسي'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-[#eddcc8]/60">
                                <span className="text-[11px] text-stone-500">الإجمالي شامل الضريبة</span>
                                <span className="font-mono font-black text-[#8f5a13] text-sm">{order.total} ر.س</span>
                              </div>
                            </div>

                            {order.items && order.items.length > 0 && (
                              <div>
                                <button
                                  type="button"
                                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8f5a13] hover:underline cursor-pointer"
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  <span>تفاصيل الأصناف ({order.items.length})</span>
                                </button>

                                {isExpanded && (
                                  <div className="mt-2 bg-[#fdfbf7] rounded-xl border border-[#eddcc8] divide-y divide-stone-100">
                                    {order.items.map((item) => (
                                      <div key={item.id} className="px-3 py-2 flex items-center justify-between text-[11px]">
                                        <span className="font-semibold text-stone-800">
                                          {item.product_name} ({item.quantity} {item.unit_name || 'وحدة'})
                                        </span>
                                        <span className="font-mono font-bold text-stone-900">{item.total_price} ر.س</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <select
                                value={order.status}
                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                className="flex-1 bg-white border border-[#eddcc8] rounded-xl py-2 px-3 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-[#b47820]"
                              >
                                <option value="new">طلب جديد</option>
                                <option value="processing">جاري التجهيز</option>
                                <option value="ready">جاهز للاستلام / الشحن</option>
                                <option value="delivered">تم التسليم</option>
                                <option value="cancelled">ملغي</option>
                              </select>

                              {order.invoice_pdf_url && (
                                <a
                                  href={order.invoice_pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#8f5a13] to-[#b47820] px-3.5 py-2 rounded-xl shadow-2xs shrink-0"
                                >
                                  <FileCheck2 className="w-3.5 h-3.5" />
                                  <span>الفاتورة</span>
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* عرض الديسكتوب */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-[#faf7f2] border-b border-[#eddcc8] text-stone-600 font-bold">
                          <tr>
                            <th className="py-3.5 px-5">رقم الطلب</th>
                            <th className="py-3.5 px-5">المؤسسة / العميل</th>
                            <th className="py-3.5 px-5">المستودع والأصناف</th>
                            <th className="py-3.5 px-5">الإجمالي شامل الضريبة</th>
                            <th className="py-3.5 px-5">تاريخ الطلب</th>
                            <th className="py-3.5 px-5 text-center">تحديث الحالة</th>
                            <th className="py-3.5 px-5 text-center">الفاتورة الضريبية</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                          {orders.map((order) => {
                            const isExpanded = expandedOrderId === order.id;

                            return (
                              <React.Fragment key={order.id}>
                                <tr className="hover:bg-[#fdfbf7]/80 transition-colors">
                                  <td className="py-3.5 px-5 font-mono font-extrabold text-stone-900">#{order.order_number}</td>
                                  <td className="py-3.5 px-5">
                                    <div className="font-bold text-stone-900">{order.user?.merchant_profile?.company_name || order.user?.name}</div>
                                    <div className="text-[10px] text-stone-500 font-mono">{order.user?.phone}</div>
                                  </td>
                                  <td className="py-3.5 px-5">
                                    <div className="font-bold text-stone-700">{order.branch?.name || 'مستودع رئيسي'}</div>
                                    {order.items && order.items.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#8f5a13] hover:underline cursor-pointer"
                                      >
                                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        <span>{order.items.length} أصناف</span>
                                      </button>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-5 font-mono font-black text-[#8f5a13]">{order.total} ر.س</td>
                                  <td className="py-3.5 px-5 text-stone-500 font-mono text-[11px]">
                                    {new Date(order.created_at).toLocaleDateString('ar-SA')}
                                  </td>
                                  <td className="py-3.5 px-5 text-center">
                                    <select
                                      value={order.status}
                                      onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                      className="bg-white border border-[#eddcc8] rounded-xl py-1.5 px-2.5 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-[#b47820] cursor-pointer"
                                    >
                                      <option value="new">طلب جديد</option>
                                      <option value="processing">جاري التجهيز</option>
                                      <option value="ready">جاهز للاستلام / الشحن</option>
                                      <option value="delivered">تم التسليم</option>
                                      <option value="cancelled">ملغي</option>
                                    </select>
                                  </td>
                                  <td className="py-3.5 px-5 text-center">
                                    {order.invoice_pdf_url ? (
                                      <a
                                        href={order.invoice_pdf_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8f5a13] bg-[#fbf3e6] hover:bg-[#f5e7cf] border border-[#ebd2b0] px-3 py-1.5 rounded-xl transition-colors shadow-2xs"
                                      >
                                        <FileCheck2 className="w-3.5 h-3.5" />
                                        <span>PDF الفاتورة</span>
                                      </a>
                                    ) : (
                                      <span className="text-[11px] text-stone-400">غير متاح</span>
                                    )}
                                  </td>
                                </tr>
                                {isExpanded && order.items && order.items.length > 0 && (
                                  <tr className="bg-[#fdfbf7]">
                                    <td colSpan={7} className="px-6 py-3">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {order.items.map((item) => (
                                          <div
                                            key={item.id}
                                            className="bg-white rounded-xl border border-[#eddcc8] px-3 py-2 flex items-center justify-between gap-2 text-xs"
                                          >
                                            <div className="min-w-0">
                                              <div className="font-bold text-stone-800 truncate">{item.product_name}</div>
                                              <div className="text-[10px] text-stone-400">
                                                {item.quantity} × {item.unit_price} ر.س {item.unit_name ? `(${item.unit_name})` : ''}
                                              </div>
                                            </div>
                                            <span className="font-mono font-bold text-stone-900 shrink-0">
                                              {item.total_price} ر.س
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ================= تبويب 6: المستخدمين والحسابات ================= */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-3xl border border-[#eddcc8] shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-stone-100">
                <h3 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#b47820]" />
                  حسابات المستخدمين والمدراء
                </h3>
              </div>

              {/* عرض الجوال */}
              <div className="md:hidden divide-y divide-stone-100">
                {usersList.map((u) => {
                  const isEditingPass = passwordUserId === u.id;

                  return (
                    <div key={u.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-stone-900 text-sm">{u.name}</div>
                          <div className="font-mono text-xs text-stone-500 mt-0.5" dir="ltr">{u.phone}</div>
                        </div>
                        {u.role === 'admin' ? (
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-lg">
                            مدير نظام
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                            تاجر جملة
                          </span>
                        )}
                      </div>

                      {u.merchant_profile?.company_name && (
                        <div className="text-xs text-stone-600 bg-stone-50 px-3 py-2 rounded-xl border border-stone-100">
                          المنشأة: <strong className="text-stone-900">{u.merchant_profile.company_name}</strong>
                        </div>
                      )}

                      {isEditingPass ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="كلمة المرور الجديدة"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="flex-1 bg-white border-2 border-[#b47820] rounded-xl p-2 text-center font-mono text-xs"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveUserPassword(u.id)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                          >
                            حفظ
                          </button>
                          <button
                            type="button"
                            onClick={() => setPasswordUserId(null)}
                            className="p-2 rounded-xl bg-stone-200 text-stone-700 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordUserId(u.id);
                            setNewPassword('');
                          }}
                          className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-stone-500" />
                          <span>إعادة تعيين كلمة المرور</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* عرض الديسكتوب */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#fcfbfa] border-b border-[#eddcc8] text-stone-600 font-bold">
                    <tr>
                      <th className="py-4 px-5">#</th>
                      <th className="py-4 px-5">اسم المستخدم</th>
                      <th className="py-4 px-5">رقم الجوال</th>
                      <th className="py-4 px-5">الدور / الصلاحية</th>
                      <th className="py-4 px-5">المنشأة المرتبطة</th>
                      <th className="py-4 px-5 text-center">إعادة تعيين كلمة المرور</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                    {usersList.map((u) => {
                      const isEditingPass = passwordUserId === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3.5 px-5 font-mono text-stone-400">{u.id}</td>
                          <td className="py-3.5 px-5 font-bold text-stone-900 text-sm">{u.name}</td>
                          <td className="py-3.5 px-5 font-mono font-bold text-stone-700" dir="ltr">{u.phone}</td>
                          <td className="py-3.5 px-5">
                            {u.role === 'admin' ? (
                              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-lg">
                                مدير نظام (Admin)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                                تاجر جملة (Merchant)
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-stone-600 font-medium">
                            {u.merchant_profile?.company_name || '—'}
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            {isEditingPass ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <input
                                  type="text"
                                  placeholder="كلمة المرور الجديدة"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  className="w-36 bg-white border border-[#b47820] rounded-xl p-1.5 text-center font-mono text-xs shadow-xs"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveUserPassword(u.id)}
                                  className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-xs"
                                  title="حفظ"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPasswordUserId(null)}
                                  className="p-2 rounded-xl bg-stone-200 text-stone-700 hover:bg-stone-300 cursor-pointer"
                                  title="إلغاء"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setPasswordUserId(u.id);
                                  setNewPassword('');
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shadow-2xs"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-stone-500" />
                                <span>تغيير كلمة المرور</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* شريط التنقل السفلي الاحترافي للجوال (5 أزرار متوازنة بدون زحام) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#eddcc8] shadow-[0_-4px_20px_-4px_rgba(180,120,32,0.12)] safe-pb">
        <div className="grid grid-cols-5 items-center px-1.5 pt-1.5 pb-1">
          {(['merchants', 'products', 'advertisements', 'orders'] as TabType[]).map((tabId) => {
            const item = navigationItems.find((n) => n.id === tabId)!;
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMoreOpen(false);
                }}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-2xl transition-all cursor-pointer ${isActive ? 'text-[#8f5a13]' : 'text-stone-400 hover:text-stone-700'
                  }`}
              >
                <div className={`relative p-1.5 rounded-xl transition-colors ${isActive ? 'bg-[#fbf3e6]' : ''}`}>
                  <Icon className="w-4.5 h-4.5" />
                  {item.badgeAlert && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
                  )}
                </div>
                <span className={`text-[10px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.shortLabel}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsMobileMoreOpen((prev) => !prev)}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-2xl transition-all cursor-pointer ${isMobileMoreOpen || ['categories', 'branches', 'users'].includes(activeTab)
              ? 'text-[#8f5a13]'
              : 'text-stone-400 hover:text-stone-700'
              }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-colors ${isMobileMoreOpen || ['categories', 'branches', 'users'].includes(activeTab) ? 'bg-[#fbf3e6]' : ''
                }`}
            >
              <MoreHorizontal className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] leading-none font-bold">المزيد</span>
          </button>
        </div>
      </nav>

      {/* قائمة المزيد للجوال (الأقسام، المستودعات، الحسابات، المتجر) */}
      {isMobileMoreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-xs flex items-end"
          onClick={() => setIsMobileMoreOpen(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl border-t border-[#eddcc8] p-5 pb-24 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 rounded-full bg-stone-200 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-stone-500 px-1">الأقسام وإدارة النظام</h3>
            <div className="grid grid-cols-3 gap-2.5">
              {(['categories', 'branches', 'users'] as TabType[]).map((tabId) => {
                const item = navigationItems.find((n) => n.id === tabId)!;
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMoreOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-center cursor-pointer ${isActive
                      ? 'bg-[#fbf3e6] border-[#b47820] text-[#8f5a13] font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 font-semibold'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[11px]">{item.shortLabel}</span>
                    <span className="text-[10px] font-mono text-stone-400">({item.count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. النوافذ المنبثقة التفاعلية (Bottom Sheet على الجوال)   */}
      {/* ========================================================= */}

      {/* نافذة إضافة / تعديل صنف أو منتج جديد */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 max-w-lg w-full max-h-[92vh] overflow-y-auto border-t sm:border border-[#eddcc8] shadow-2xl space-y-4">
            <div className="w-12 h-1.5 rounded-full bg-stone-200 mx-auto sm:hidden" />
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-[#b47820]" />
                {editingProductDataId ? 'تعديل بيانات الصنف / المنتج' : 'إضافة صنف / منتج جديد بالجملة'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              {/* صندوق الاستخراج الذكي من رابط منتج */}
              <div className="rounded-2xl bg-gradient-to-br from-[#fdfbf7] to-[#faf2e3] border border-[#ebd2b0] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-[#8f5a13] flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4 text-[#b47820]" />
                    استخراج تلقائي من رابط المنتج (بالذكاء الاصطناعي)
                  </span>
                  <span className="text-[10px] font-bold bg-white/80 text-[#8f5a13] border border-[#ebd2b0] px-2 py-0.5 rounded-full">
                    الاسم + السعر + الوصف + الكود + الصورة
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Link2 className="w-4 h-4 text-[#b47820] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="https://example.com/product/..."
                      value={productExtractUrl}
                      onChange={(e) => setProductExtractUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleExtractProductFromUrl();
                        }
                      }}
                      className="w-full bg-white border border-[#e3cba6] rounded-xl pr-9 pl-3 py-2.5 text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-[#b47820]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleExtractProductFromUrl}
                    disabled={isExtractingProduct}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#b47820] hover:bg-[#8f5a13] text-white font-bold shadow-xs cursor-pointer disabled:opacity-60 shrink-0"
                  >
                    <Sparkles className={`w-4 h-4 ${isExtractingProduct ? 'animate-spin' : ''}`} />
                    <span>{isExtractingProduct ? 'جاري الاستخراج...' : 'استخراج البيانات'}</span>
                  </button>
                </div>
                {extractFeedback && (
                  <p
                    className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border ${extractFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                  >
                    {extractFeedback.text}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">اسم الصنف بالكامل *</label>
                <input
                  type="text"
                  placeholder="مثال: مناديل مبللة معقمة 80 منديل"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-hidden focus:border-[#b47820] focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">العلامة التجارية (اختياري)</label>
                  <input
                    type="text"
                    placeholder="مثال: Silva / Rasasi / Lux"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-hidden focus:border-[#b47820] focus:bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-stone-700">كود الصنف / SKU *</label>
                    <button
                      type="button"
                      onClick={handleGenerateProductCode}
                      className="text-[10px] font-bold text-[#8f5a13] hover:text-[#b47820] underline cursor-pointer"
                    >
                      توليد كود تلقائي
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="مثال: PRD-105"
                    value={newProduct.code}
                    onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 font-mono text-stone-900 focus:outline-hidden focus:border-[#b47820] focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">سعر البيع / العرض (ر.س) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="مثال: 4.90"
                    value={newProduct.unit_price}
                    onChange={(e) => setNewProduct({ ...newProduct, unit_price: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 font-mono font-bold text-stone-900 focus:outline-hidden focus:border-[#b47820] focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">السعر الأساسي قبل العرض (اختياري)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="مثال: 9.00"
                    value={newProduct.old_price}
                    onChange={(e) => setNewProduct({ ...newProduct, old_price: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 font-mono text-stone-900 focus:outline-hidden focus:border-[#b47820] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">القسم والتصنيف *</label>
                  <select
                    value={newProduct.category_id}
                    onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-hidden focus:border-[#b47820] focus:bg-white"
                    required
                  >
                    <option value="">اختر القسم...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.parent ? `${c.parent.name} ← ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">المستودع المتوفر به *</label>
                  <select
                    value={newProduct.branch_id}
                    onChange={(e) => setNewProduct({ ...newProduct, branch_id: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-hidden focus:border-[#b47820] focus:bg-white"
                    required
                  >
                    <option value="">اختر المستودع...</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">رفع صورة الصنف (اختياري)</label>
                <label className="block rounded-2xl border-2 border-dashed border-[#ebd2b0] hover:border-[#b47820] bg-[#fdfbf7] p-3 text-center cursor-pointer transition-colors mb-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProductImageChange}
                    className="hidden"
                  />
                  {productImagePreview ? (
                    <div className="flex items-center justify-center gap-3">
                      <img
                        src={productImagePreview}
                        alt="معاينة الصنف"
                        className="w-16 h-16 rounded-xl object-cover border border-[#eddcc8] bg-white"
                      />
                      <span className="text-[11px] font-bold text-[#8f5a13] underline">
                        تغيير صورة المنتج
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-stone-600 inline-flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-[#b47820]" />
                      اضغط لاختيار صورة من جهازك
                    </span>
                  )}
                </label>

                <label className="block font-bold text-stone-700 mb-1">أو رابط صورة المنتج (URL)</label>
                <input
                  type="text"
                  placeholder="https://... أو مسار الصورة"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-hidden focus:border-[#b47820] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">الوصف والمواصفات</label>
                <textarea
                  rows={2}
                  placeholder="وصف مختصر للمنتج وعدد القطع أو الاستخدام..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-hidden focus:border-[#b47820] focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100 safe-pb">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-3 sm:py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="flex-1 sm:flex-initial px-6 py-3 sm:py-2.5 rounded-xl bg-[#b47820] hover:bg-[#8f5a13] text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSavingProduct
                    ? 'جاري الحفظ...'
                    : editingProductDataId
                      ? 'حفظ التعديلات'
                      : 'حفظ وإضافة الصنف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة الاستيراد الجماعي للمنتجات من Excel / CSV / Google Drive */}
      <ProductBulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        branches={branches}
        categories={categories}
        onImported={async () => {
          setActionMessage({ text: 'تم استيراد المنتجات وتحديث القائمة بنجاح', type: 'success' });
          await loadData();
        }}
      />

      {/* نافذة إضافة / تعديل قسم */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 max-w-md w-full max-h-[92vh] overflow-y-auto border-t sm:border border-[#eddcc8] shadow-2xl space-y-4">
            <div className="w-12 h-1.5 rounded-full bg-stone-200 mx-auto sm:hidden" />
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-emerald-700" />
                {editingCategoryId ? 'تعديل بيانات القسم' : 'إضافة قسم / تصنيف جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">اسم القسم *</label>
                <input
                  type="text"
                  placeholder="مثال: مستلزمات الحلاقة والتصفيف"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">المستودع التابع له *</label>
                <select
                  value={newCategory.branch_id}
                  onChange={(e) => setNewCategory({ ...newCategory, branch_id: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  required
                >
                  <option value="">اختر المستودع...</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">القسم الرئيسي الأب (اختياري)</label>
                <select
                  value={newCategory.parent_id}
                  onChange={(e) => setNewCategory({ ...newCategory, parent_id: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                >
                  <option value="">— قسم رئيسي مستقل —</option>
                  {categories
                    .filter((c) => !c.parent_id && c.id !== editingCategoryId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        فرعي تحت: {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">ترتيب العرض</label>
                <input
                  type="number"
                  placeholder="99"
                  value={newCategory.sort}
                  onChange={(e) => setNewCategory({ ...newCategory, sort: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100 safe-pb">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-4 py-3 sm:py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-6 py-3 sm:py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs cursor-pointer"
                >
                  {editingCategoryId ? 'حفظ تعديلات القسم' : 'حفظ وإضافة القسم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة إضافة / تعديل مستودع */}
      {isAddBranchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 max-w-md w-full max-h-[92vh] overflow-y-auto border-t sm:border border-[#eddcc8] shadow-2xl space-y-4">
            <div className="w-12 h-1.5 rounded-full bg-stone-200 mx-auto sm:hidden" />
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-stone-900" />
                {editingBranchId ? 'تعديل بيانات المستودع' : 'إضافة مستودع / مركز توزيع جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddBranchOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">اسم المستودع بالكامل *</label>
                <input
                  type="text"
                  placeholder="مثال: مستودع الشفا للتوريد السريع"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-hidden focus:border-stone-900 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">كود المستودع (code) *</label>
                  <input
                    type="text"
                    placeholder="مثال: shifa أو kharj"
                    value={newBranch.code}
                    onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 font-mono text-stone-900 focus:outline-hidden focus:border-stone-900 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">لون هوية المستودع</label>
                  <input
                    type="color"
                    value={newBranch.color || '#b47820'}
                    onChange={(e) => setNewBranch({ ...newBranch, color: e.target.value })}
                    className="w-full h-[42px] bg-stone-50 border border-stone-200 rounded-xl p-1 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">الوصف والنطاق الجغرافي</label>
                <textarea
                  rows={2}
                  placeholder="مثال: توريد فوري بالحبة لمنطقة جنوب الرياض ومحافظة الخرج..."
                  value={newBranch.description}
                  onChange={(e) => setNewBranch({ ...newBranch, description: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-hidden focus:border-stone-900 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100 safe-pb">
                <button
                  type="button"
                  onClick={() => setIsAddBranchOpen(false)}
                  className="px-4 py-3 sm:py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-6 py-3 sm:py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-xs cursor-pointer"
                >
                  {editingBranchId ? 'حفظ تعديلات المستودع' : 'حفظ وإضافة المستودع'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة رفع صورة وإضافة أو تعديل إعلان / بنر */}
      {isAddAdOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 max-w-lg w-full max-h-[92vh] overflow-y-auto border-t sm:border border-[#eddcc8] shadow-2xl space-y-4">
            <div className="w-12 h-1.5 rounded-full bg-stone-200 mx-auto sm:hidden" />
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <ImagePlus className="w-5 h-5 text-[#b47820]" />
                {editingAdId ? 'تعديل بيانات وصورة الإعلان' : 'رفع صورة وإضافة إعلان جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddAdOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAd} className="space-y-3.5 text-xs">
              {/* منطقة اختيار ورفع الصورة من الجهاز */}
              <div>
                <label className="block font-bold text-stone-700 mb-1.5">
                  صورة الإعلان {editingAdId ? '(اتركها كما هي أو اختر صورة جديدة)' : '*'}
                </label>
                <label className="block rounded-2xl border-2 border-dashed border-[#ebd2b0] hover:border-[#b47820] bg-[#fdfbf7] p-4 text-center cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAdImageChange}
                    className="hidden"
                  />
                  {adImagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={adImagePreview}
                        alt="معاينة الإعلان"
                        className="max-h-44 mx-auto rounded-xl object-contain border border-[#eddcc8] bg-white"
                      />
                      <span className="inline-block text-[11px] font-bold text-[#8f5a13] underline">
                        تغيير الصورة المختارة
                      </span>
                    </div>
                  ) : (
                    <div className="py-4 space-y-1.5">
                      <Upload className="w-8 h-8 text-[#b47820] mx-auto" />
                      <p className="font-bold text-stone-800">اضغط هنا لاختيار صورة الإعلان</p>
                      <p className="text-[10px] text-stone-400">PNG, JPG, WEBP — الحد الأقصى 5 ميجابايت</p>
                    </div>
                  )}
                </label>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">أو رابط صورة خارجي (اختياري)</label>
                <input
                  type="text"
                  placeholder="https://... (اتركه فارغاً عند رفع ملف)"
                  value={adImageUrl}
                  onChange={(e) => setAdImageUrl(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-hidden focus:border-[#b47820] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">مكان ظهور الإعلان</label>
                  <select
                    value={adPlacement}
                    onChange={(e) => setAdPlacement(e.target.value as 'all' | 'home' | 'catalog')}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-hidden focus:border-[#b47820] focus:bg-white font-bold"
                  >
                    <option value="all">الرئيسية + الكتالوج معاً</option>
                    <option value="catalog">صفحة الكتالوج فقط</option>
                    <option value="home">الصفحة الرئيسية فقط</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">ترتيب العرض</label>
                  <input
                    type="number"
                    value={adSort}
                    onChange={(e) => setAdSort(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-mono text-stone-900 focus:outline-hidden focus:border-[#b47820] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">عنوان الإعلان (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: أقوى عروض الجملة لهذا الأسبوع"
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-hidden focus:border-[#b47820] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">نص الشارة (اختياري)</label>
                  <input
                    type="text"
                    placeholder="مثال: عرض حصري"
                    value={adBadgeText}
                    onChange={(e) => setAdBadgeText(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-hidden focus:border-[#b47820] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">وصف مختصر (اختياري)</label>
                  <input
                    type="text"
                    placeholder="تفاصيل إضافية تظهر مع البنر..."
                    value={adSubtitle}
                    onChange={(e) => setAdSubtitle(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-hidden focus:border-[#b47820] focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100 safe-pb">
                <button
                  type="button"
                  onClick={() => setIsAddAdOpen(false)}
                  className="px-4 py-3 sm:py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isUploadingAd}
                  className="flex-1 sm:flex-initial px-6 py-3 sm:py-2.5 rounded-xl bg-[#b47820] hover:bg-[#8f5a13] text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isUploadingAd
                    ? 'جاري الحفظ...'
                    : editingAdId
                      ? 'حفظ تعديلات الإعلان'
                      : 'رفع ونشر الإعلان'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
