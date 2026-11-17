'use client';

import React, { Suspense, useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Package,
  Barcode,
  Hash,
  Sparkles,
  Tag,
  Bell,
  Check,
  ShoppingBag,
  Copy,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Truck,
  Loader2,
  AlertCircle,
  ZoomIn,
  X,
} from 'lucide-react';
import { catalogApi } from '@/features/catalog/api/catalog.api';
import { Product } from '@/types';
import { QuantityInput } from '@/features/catalog/components/QuantityInput';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import { CartModal } from '@/features/cart/components/CartModal';
import { BottomNav } from '@/shared/components/layout/BottomNav';
import { useBranches } from '@/features/branches/hooks/useBranches';
import { useCart } from '@/features/cart/hooks/useCart';
import { useOrders } from '@/features/orders/hooks/useOrders';
import { useAuth } from '@/features/auth/hooks/useAuth';

function ProductDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params?.id);

  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { branches, selectedBranch } = useBranches();
  const currentBranchId = selectedBranch?.id || branches[0]?.id || 1;
  const activeBranch = selectedBranch || branches[0] || null;

  const {
    cart,
    itemsCount,
    updateItemQuantity,
    clearCart,
  } = useCart(currentBranchId);

  const { checkout } = useOrders();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'code' | 'barcode' | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);

  // حماية صفحة المنتج لعملاء الجملة المعتمدين فقط
  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated || !user) {
        router.replace('/');
        return;
      }
      if (user.merchant_profile && user.merchant_profile.status !== 'active') {
        router.replace('/');
        return;
      }
    }
  }, [isAuthenticated, user, isAuthLoading, router]);

  // جلب بيانات المنتج والأصناف المشابهة
  useEffect(() => {
    if (!productId || Number.isNaN(productId)) {
      setError('رقم الصنف غير صالح');
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchProductDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await catalogApi.getProductById(productId);
        if (!isMounted) return;
        const productData = res.data;
        setProduct(productData);
        if (productData.packages && productData.packages.length > 0) {
          setSelectedPackageId(productData.packages[0].id);
        }

        // جلب أصناف مشابهة من نفس القسم أو الفرع
        try {
          const branchToFetch = productData.branch_id || currentBranchId;
          const relatedRes = await catalogApi.getProducts({
            branch_id: branchToFetch,
            category_id: productData.category_id ?? undefined,
          });
          if (isMounted && relatedRes.success && relatedRes.data?.items) {
            setRelatedProducts(
              relatedRes.data.items
                .filter((item) => item.id !== productData.id)
                .slice(0, 5)
            );
          }
        } catch {
          // تجاهل خطأ الأصناف المشابهة إن وجد
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(
          err?.response?.data?.message ||
            'تعذر تحميل تفاصيل الصنف حالياً، يرجى المحاولة مرة أخرى.'
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProductDetails();

    return () => {
      isMounted = false;
    };
  }, [productId, currentBranchId]);

  const resolvedImageUrl = useMemo(() => {
    if (!product) return null;
    const raw = (product.image_url || (product as any).image || '').trim();
    if (!raw) return null;
    const embeddedMatch = raw.match(/https?:\/\/(?!localhost\/storage\/https?:\/\/).+$/i);
    let url = embeddedMatch ? embeddedMatch[0] : raw;
    if (
      url.startsWith('http://') &&
      !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url)
    ) {
      url = 'https://' + url.slice(7);
    }
    return url;
  }, [product]);

  const activePackage = useMemo(() => {
    if (!product?.packages || product.packages.length === 0) return null;
    return (
      product.packages.find((pk) => pk.id === selectedPackageId) ||
      product.packages[0]
    );
  }, [product, selectedPackageId]);

  const getQuantityForPackage = (packageId?: number): number => {
    if (!packageId || !cart?.items) return 0;
    const item = cart.items.find((i) => i.package_id === packageId);
    return item ? item.quantity : 0;
  };

  const currentQty = getQuantityForPackage(activePackage?.id);
  const unitPrice = activePackage ? Number(activePackage.unit_price) : 0;
  const oldPrice = activePackage?.old_price ? Number(activePackage.old_price) : null;
  const discountPercent = activePackage?.discount_percent ?? 0;
  const isComingSoon = Boolean(product?.is_coming_soon);

  const handleProductQuantityChange = (newQty: number) => {
    if (!product || !activePackage) return;
    const safeQty = Math.max(0, newQty);
    updateItemQuantity(activePackage.id, safeQty, {
      product_id: product.id,
      product_name: product.name,
      product_code: product.code,
      barcode: product.barcode,
      image_url: product.image_url,
      package_name: activePackage.name,
      unit: activePackage.unit,
      unit_price: Number(activePackage.unit_price),
    });
  };

  const handleRelatedQuantityChange = (packageId: number, newQty: number) => {
    const relProduct = relatedProducts.find((p) =>
      p.packages?.some((pk) => pk.id === packageId)
    );
    const pkg = relProduct?.packages?.find((pk) => pk.id === packageId);
    const meta =
      relProduct && pkg
        ? {
            product_id: relProduct.id,
            product_name: relProduct.name,
            product_code: relProduct.code,
            barcode: relProduct.barcode,
            image_url: relProduct.image_url,
            package_name: pkg.name,
            unit: pkg.unit,
            unit_price: Number(pkg.unit_price),
          }
        : undefined;
    updateItemQuantity(packageId, newQty, meta);
  };

  const handleCopy = (text: string, field: 'code' | 'barcode') => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleCheckout = async () => {
    return await checkout({
      branch_id: currentBranchId,
      notes: 'طلب عبر الكتالوج الرقمي',
    });
  };

  if (
    isAuthLoading ||
    !isAuthenticated ||
    (user?.merchant_profile && user.merchant_profile.status !== 'active')
  ) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-[#111827] px-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#482b52] via-[#8c649c] to-[#c7aad1] text-white flex items-center justify-center shadow-xl shadow-purple-950/10 mb-4 animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
        <p className="text-base font-black text-[#111827]">
          التحقق من اعتماد المنشأة والتصريح...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32 text-[#111827] font-sans selection:bg-[#edd0f7] selection:text-[#482b52]">
      {/* شريط علوي ناصع لصفحة تفاصيل المنتج بهوية دار الأميرات */}
      <header className="sticky top-0 z-30 bg-white text-[#111827] shadow-2xs border-b border-[#eeeeee]">
        <div className="h-1 w-full bg-gradient-to-l from-[#482b52] via-[#a184ab] to-[#c7aad1]" />
        <div className="max-w-7xl mx-auto px-3.5 sm:px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => router.push('/catalog')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold bg-[#faf6fc] hover:bg-[#edd0f7]/45 text-[#482b52] px-3.5 py-2 rounded-xl transition-all border border-[#c7aad1] active:scale-95 shrink-0 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للكتالوج</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-[#4b5563] font-bold truncate">
              <span>/</span>
              <span className="truncate">
                {activeBranch?.name || 'كتالوج الجملة'}
              </span>
              {product?.category_name && (
                <>
                  <span>/</span>
                  <span className="text-[#482b52] font-extrabold truncate">
                    {product.category_name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* زر السلة السريع في الهيدر */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative inline-flex items-center gap-2 text-xs font-extrabold bg-[#482b52] text-white hover:bg-[#5c3969] px-3.5 py-2 rounded-xl transition-all shadow-xs shrink-0 active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#edd0f7]" />
            <span>السلة</span>
            {itemsCount > 0 && (
              <span className="bg-[#c7aad1] text-[#111827] text-[11px] font-black px-2 py-0.5 rounded-full">
                {itemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3.5 sm:px-4 py-5 sm:py-8 space-y-8">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-[#eeeeee] p-12 sm:p-20 flex flex-col items-center justify-center text-center shadow-xs">
            <Loader2 className="w-10 h-10 animate-spin text-[#8c649c] mb-3" />
            <p className="text-base font-extrabold text-[#111827]">
              جاري تحميل بطاقة الصنف التفصيلية...
            </p>
            <p className="text-xs text-[#4b5563] mt-1">
              يتم جلب بيانات التسعير والعبوات المتاحة
            </p>
          </div>
        ) : error || !product ? (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 sm:p-12 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-[#111827]">
                تعذر العثور على الصنف المطلوب
              </h2>
              <p className="text-xs sm:text-sm text-[#4b5563]">
                {error || 'ربما تم نقل الصنف أو تحديث رقمه في الكتالوج.'}
              </p>
            </div>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 bg-[#482b52] hover:bg-[#5c3969] text-white text-xs sm:text-sm font-extrabold px-5 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة لتصفح الكتالوج</span>
            </Link>
          </div>
        ) : (
          <>
            {/* البطاقة الرئيسية لتفاصيل المنتج */}
            <div className="bg-white rounded-2xl border border-[#eeeeee] shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* العمود الأيمن: معرض صورة المنتج */}
                <div className="lg:col-span-5 relative bg-white p-6 sm:p-10 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-l border-[#eeeeee] min-h-[320px] sm:min-h-[440px]">
                  {/* شارات المنتج العلوية */}
                  <div className="absolute top-4 right-4 z-10 flex flex-wrap gap-2">
                    {isComingSoon && (
                      <span className="inline-flex items-center gap-1 bg-[#482b52] text-white text-xs font-black px-3 py-1 rounded-full shadow-xs">
                        <Bell className="w-3.5 h-3.5" /> قريباً
                      </span>
                    )}
                    {product.is_new && !isComingSoon && (
                      <span className="inline-flex items-center gap-1 bg-[#c7aad1] text-[#111827] text-xs font-black px-3 py-1 rounded-full shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 text-[#482b52]" /> صنف جديد
                      </span>
                    )}
                    {discountPercent > 0 && !isComingSoon && (
                      <span className="inline-flex items-center gap-1 bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-xs">
                        <Tag className="w-3.5 h-3.5" /> خصم {discountPercent}%
                      </span>
                    )}
                  </div>

                  {/* مؤشر وجود الصنف في السلة */}
                  {currentQty > 0 && (
                    <div className="absolute top-4 left-4 z-10 bg-[#482b52] text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{currentQty} حبة بالسلة</span>
                    </div>
                  )}

                  {resolvedImageUrl ? (
                    <div className="relative group w-full max-w-[340px] aspect-square flex items-center justify-center">
                      <img
                        src={resolvedImageUrl}
                        alt={product.name}
                        onClick={() => setIsZoomOpen(true)}
                        className="w-full h-full object-contain cursor-zoom-in group-hover:scale-105 transition-transform duration-500"
                      />
                      <button
                        type="button"
                        onClick={() => setIsZoomOpen(true)}
                        className="absolute bottom-2 left-2 bg-white/95 hover:bg-[#faf6fc] text-[#482b52] text-[11px] font-bold px-3 py-1.5 rounded-xl border border-[#c7aad1] shadow-xs inline-flex items-center gap-1.5 transition-all"
                      >
                        <ZoomIn className="w-3.5 h-3.5 text-[#a184ab]" />
                        <span>تكبير الصورة</span>
                      </button>
                    </div>
                  ) : (
                    <div className="w-full max-w-[280px] aspect-square rounded-2xl bg-[#faf6fc] border-2 border-dashed border-[#c7aad1] flex flex-col items-center justify-center text-gray-400 p-6">
                      <Package className="w-16 h-16 text-[#c7aad1] mb-2" />
                      <span className="text-xs font-bold text-[#4b5563]">
                        صورة الصنف غير متوفرة
                      </span>
                      <span className="text-xs font-mono text-gray-400 mt-1">
                        {product.code}
                      </span>
                    </div>
                  )}
                </div>

                {/* العمود الأيسر: كافة تفاصيل الصنف والتسعير والطلب */}
                <div className="lg:col-span-7 p-5 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
                  <div className="space-y-5">
                    {/* التصنيف وحالة التوفر */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 bg-[#faf6fc] text-[#482b52] border border-[#c7aad1] px-3 py-1 rounded-full text-xs font-extrabold">
                          <Layers className="w-3.5 h-3.5 text-[#a184ab]" />
                          <span>{product.category_name || 'الأصناف المعتمدة'}</span>
                        </div>
                        {product.brand && (
                          <div className="inline-flex items-center gap-1 bg-gray-100 text-[#111827] border border-gray-200 px-3 py-1 rounded-full text-xs font-extrabold">
                            <span>{product.brand}</span>
                          </div>
                        )}
                      </div>

                      {isComingSoon ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#482b52] bg-[#faf6fc] px-3 py-1 rounded-full border border-[#c7aad1]">
                          <Bell className="w-3.5 h-3.5" />
                          سيتوفر قريباً في المستودع
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50/80 px-3 py-1 rounded-full border border-emerald-200/80">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          متوفر للتوريد الفوري
                        </span>
                      )}
                    </div>

                    {/* اسم المنتج الكامل */}
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#111827] leading-snug">
                      {product.name}
                    </h1>

                    {/* شبكة البيانات التعريفية (كود الصنف، الباركود، الوحدة، الفرع) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                      {/* كود الصنف */}
                      <div className="bg-[#f9fafb] rounded-xl p-3 border border-[#eeeeee] flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[11px] text-[#4b5563] font-bold mb-1">
                          <span className="inline-flex items-center gap-1">
                            <Hash className="w-3.5 h-3.5 text-[#a184ab]" />
                            كود الصنف
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(product.code, 'code')}
                            className="text-gray-400 hover:text-[#482b52] transition-colors"
                            title="نسخ الكود"
                          >
                            {copiedField === 'code' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="font-mono font-black text-xs sm:text-sm text-[#111827] truncate">
                          {product.code}
                        </span>
                      </div>

                      {/* الباركود */}
                      <div className="bg-[#f9fafb] rounded-xl p-3 border border-[#eeeeee] flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[11px] text-[#4b5563] font-bold mb-1">
                          <span className="inline-flex items-center gap-1">
                            <Barcode className="w-3.5 h-3.5 text-[#a184ab]" />
                            الباركود
                          </span>
                          {product.barcode && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(product.barcode || '', 'barcode')
                              }
                              className="text-gray-400 hover:text-[#482b52] transition-colors"
                              title="نسخ الباركود"
                            >
                              {copiedField === 'barcode' ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                        <span className="font-mono font-bold text-xs sm:text-sm text-[#111827] truncate">
                          {product.barcode || 'غير مسجل'}
                        </span>
                      </div>

                      {/* وحدة التوريد */}
                      <div className="bg-[#f9fafb] rounded-xl p-3 border border-[#eeeeee] flex flex-col justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#4b5563] font-bold mb-1">
                          <Package className="w-3.5 h-3.5 text-[#a184ab]" />
                          وحدة التوريد
                        </span>
                        <span className="font-extrabold text-xs sm:text-sm text-[#111827] truncate">
                          {activePackage?.name || 'حبة'}
                        </span>
                      </div>

                      {/* المستودع */}
                      <div className="bg-[#f9fafb] rounded-xl p-3 border border-[#eeeeee] flex flex-col justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#4b5563] font-bold mb-1">
                          <Truck className="w-3.5 h-3.5 text-[#a184ab]" />
                          المستودع المعتمد
                        </span>
                        <span className="font-extrabold text-xs sm:text-sm text-[#111827] truncate">
                          {activeBranch?.name || 'المستودع الرئيسي'}
                        </span>
                      </div>
                    </div>

                    {/* اختيار الباقة إن تعددت الباقات */}
                    {product.packages && product.packages.length > 1 && (
                      <div className="space-y-2">
                        <span className="text-xs font-extrabold text-[#111827] block">
                          اختر عبوة التوريد:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {product.packages.map((pkg) => {
                            const isSelected = pkg.id === activePackage?.id;
                            return (
                              <button
                                key={pkg.id}
                                type="button"
                                onClick={() => setSelectedPackageId(pkg.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#482b52] text-white border-[#482b52] shadow-xs'
                                    : 'bg-white text-[#111827] border-[#e5e7eb] hover:border-[#c7aad1]'
                                }`}
                              >
                                {pkg.name} ({Number(pkg.unit_price).toFixed(2)} ر.س)
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* بطاقة السعر والإجمالي */}
                    <div className="bg-gradient-to-l from-white via-[#faf6fc] to-[#edd0f7]/35 rounded-2xl p-4 sm:p-5 border border-[#c7aad1]/80 shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <span className="text-xs font-bold text-[#4b5563] block mb-1">
                            سعر الحبة للجملة
                          </span>
                          <div className="flex items-baseline gap-2.5">
                            <span className="text-3xl sm:text-4xl font-black text-[#482b52] tracking-tight">
                              {unitPrice.toFixed(2)}
                            </span>
                            <span className="text-sm font-extrabold text-[#a184ab]">
                              ر.س.
                            </span>

                            {oldPrice && oldPrice > unitPrice && (
                              <span className="text-sm font-bold line-through text-gray-400 mr-1">
                                {oldPrice.toFixed(2)} ر.س
                              </span>
                            )}
                          </div>
                        </div>

                        {/* إجمالي الصنف في السلة إذا تم اختيار كمية */}
                        {currentQty > 0 && (
                          <div className="bg-white px-4 py-2.5 rounded-xl border border-[#c7aad1] text-left">
                            <span className="text-[11px] font-bold text-[#4b5563] block">
                              إجمالي الصنف في السلة ({currentQty} حبة)
                            </span>
                            <span className="text-lg font-black text-[#111827]">
                              {(unitPrice * currentQty).toFixed(2)}{' '}
                              <span className="text-xs text-[#482b52]">ر.س</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* وصف المنتج ومواصفاته */}
                    <div className="bg-[#f9fafb] rounded-xl p-4 border border-[#eeeeee] space-y-1.5">
                      <h2 className="text-xs font-black text-[#111827] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#a184ab]" />
                        <span>تفاصيل ومواصفات الصنف</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-[#4b5563] leading-relaxed">
                        {product.description && product.description.trim().length > 0
                          ? product.description
                          : `${product.name} — صنف جملة معتمد ضمن كتالوج ${
                              activeBranch?.name || 'شركة المخازن الاقتصادية'
                            }، متاح للطلب المباشر والتوريد السريع للمنشآت التجارية.`}
                      </p>
                    </div>
                  </div>

                  {/* منطقة التحكم بالكمية والإضافة للسلة */}
                  <div className="pt-2 border-t border-[#eeeeee] space-y-3">
                    {isComingSoon ? (
                      <button
                        type="button"
                        className="w-full py-3.5 px-4 rounded-xl border border-[#c7aad1] bg-[#faf6fc] text-[#482b52] text-sm font-extrabold flex items-center justify-center gap-2"
                      >
                        <Bell className="w-4 h-4" />
                        <span>نبهني فور توفر الصنف في المستودع</span>
                      </button>
                    ) : activePackage ? (
                      <>
                        {/* أزرار إضافة كميات الجملة السريعة */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#4b5563]">
                            إضافة سريعة للجملة:
                          </span>
                          <div className="flex items-center gap-1.5">
                            {[6, 12, 24, 50].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() =>
                                  handleProductQuantityChange(currentQty + preset)
                                }
                                className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-[#faf6fc] hover:bg-[#edd0f7]/55 text-[#482b52] border border-[#c7aad1] transition-colors active:scale-95 cursor-pointer"
                              >
                                +{preset} حبة
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          <div className="sm:col-span-6">
                            <QuantityInput
                              quantity={currentQty}
                              step={1}
                              unit="حبة"
                              onChange={handleProductQuantityChange}
                            />
                          </div>

                          <div className="sm:col-span-6">
                            <button
                              type="button"
                              onClick={() => setIsCartOpen(true)}
                              className="w-full py-3 px-4 rounded-xl bg-[#482b52] hover:bg-[#5c3969] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
                            >
                              <ShoppingBag className="w-4 h-4" />
                              <span>
                                {currentQty > 0
                                  ? `مراجعة السلة (${itemsCount} صنف)`
                                  : 'عرض سلة الطلبات'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-400 text-center py-3">
                        غير متاح للتسعير حالياً
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* قسم الأصناف المشابهة من نفس القسم */}
            {relatedProducts.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#faf6fc] text-[#482b52] flex items-center justify-center shadow-xs border border-[#c7aad1]">
                      <Sparkles className="w-5 h-5 text-[#a184ab]" />
                    </div>
                    <div>
                      <h2 className="font-black text-base text-[#111827] leading-tight">
                        أصناف مشابهة قد تهمك
                      </h2>
                      <span className="text-xs text-[#4b5563] font-medium">
                        المزيد من منتجات {product.category_name || 'نفس التصنيف'}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/catalog"
                    className="text-xs font-extrabold text-[#482b52] hover:text-[#8c649c] inline-flex items-center gap-1"
                  >
                    <span>عرض كل الكتالوج</span>
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
                  {relatedProducts.map((rel) => (
                    <ProductCard
                      key={rel.id}
                      product={rel}
                      quantity={getQuantityForPackage(rel.packages?.[0]?.id)}
                      onQuantityChange={handleRelatedQuantityChange}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* نافذة تكبير صورة المنتج */}
      {isZoomOpen && resolvedImageUrl && product && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative bg-white rounded-3xl max-w-2xl w-full p-6 flex flex-col items-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-4 left-4 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={resolvedImageUrl}
              alt={product.name}
              className="max-h-[70vh] w-auto object-contain"
            />
            <p className="mt-4 text-sm font-extrabold text-stone-800 text-center">
              {product.name}
            </p>
          </div>
        </div>
      )}

      {/* الشريط السفلي المتنقل */}
      <BottomNav
        activeTab="home"
        cartCount={itemsCount}
        onCartClick={() => setIsCartOpen(true)}
        onCategoriesClick={() => router.push('/catalog')}
        onFilterClick={() => router.push('/catalog')}
      />

      {/* نافذة السلة المنبثقة */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateItemQuantity}
        onClearCart={clearCart}
        onCheckout={handleCheckout}
      />
    </div>
  );
}

export default function ProductDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex flex-col items-center justify-center text-[#111827] px-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#8c649c] mb-3" />
          <p className="text-sm font-extrabold text-[#111827]">
            جاري تحميل تفاصيل الصنف...
          </p>
        </div>
      }
    >
      <ProductDetailsContent />
    </Suspense>
  );
}
