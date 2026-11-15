'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CatalogHeader } from '@/features/catalog/components/CatalogHeader';
import { CategoryBar } from '@/features/catalog/components/CategoryBar';
import { BrandFilterBar } from '@/features/catalog/components/BrandFilterBar';
import { PromoBannerSlider } from '@/features/catalog/components/PromoBannerSlider';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import { CatalogFilterModal } from '@/features/catalog/components/CatalogFilterModal';
import { CartModal } from '@/features/cart/components/CartModal';
import { BottomNav } from '@/shared/components/layout/BottomNav';
import { useBranches } from '@/features/branches/hooks/useBranches';
import { useCatalog } from '@/features/catalog/hooks/useCatalog';
import { useCart } from '@/features/cart/hooks/useCart';
import { useOrders } from '@/features/orders/hooks/useOrders';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { Category } from '@/types';
import { CatalogSortOption } from '@/features/catalog/types/catalog.types';
import {
  Sparkles,
  Tag,
  TrendingUp,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
  X,
  Award,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react';

function findCategoryNamesPath(nodes: Category[], targetId: number): string[] {
  for (const node of nodes) {
    if (node.id === targetId) {
      return [node.name];
    }
    if (node.children && node.children.length > 0) {
      const childPath = findCategoryNamesPath(node.children, targetId);
      if (childPath.length > 0) {
        return [node.name, ...childPath];
      }
    }
  }
  return [];
}

export default function CatalogPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { branches, selectedBranch } = useBranches();
  const currentBranchId = selectedBranch?.id || branches[0]?.id || 1;
  const activeBranch = selectedBranch || branches[0] || null;
  const { setBrandColor } = useTheme();

  // منع الزوار منعاً باتاً من تصفح الكتالوج
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

  useEffect(() => {
    if (activeBranch?.color) {
      setBrandColor(activeBranch.color);
    }
  }, [activeBranch?.color, setBrandColor]);

  const {
    categories,
    brands,
    offersCount,
    products,
    pagination,
    hasMore,
    loadMore,
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    toggleOffersOnly,
    searchQuery,
    setSearchQuery,
    advancedFilters,
    setAdvancedFilters,
    activeFiltersCount,
    hasActiveFilters,
    resetAdvancedFilters,
    resetAllFilters,
    isLoading: isCatalogLoading,
    isLoadingMore,
    error: catalogError,
  } = useCatalog(currentBranchId);

  const {
    cart,
    itemsCount,
    updateItemQuantity,
    clearCart,
  } = useCart(currentBranchId);

  const { checkout } = useOrders();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'categories' | 'filter' | 'search' | 'cart'>('home');

  const getQuantityForProduct = (packageId?: number): number => {
    if (!packageId || !cart?.items) return 0;
    const item = cart.items.find((i) => i.package_id === packageId);
    return item ? item.quantity : 0;
  };

  const handleQuantityChange = (packageId: number, newQty: number) => {
    const product = products.find((p) => p.packages?.some((pk) => pk.id === packageId));
    const pkg = product?.packages?.find((pk) => pk.id === packageId);
    const meta =
      product && pkg
        ? {
            product_id: product.id,
            product_name: product.name,
            product_code: product.code,
            barcode: product.barcode,
            image_url: product.image_url,
            package_name: pkg.name,
            unit: pkg.unit,
            unit_price: Number(pkg.unit_price),
          }
        : undefined;
    updateItemQuantity(packageId, newQty, meta);
  };

  const handleCheckout = async () => {
    return await checkout({
      branch_id: currentBranchId,
      notes: 'طلب عبر الكتالوج الرقمي',
    });
  };

  const SORT_LABELS: Record<string, string> = {
    price_asc: 'الأقل سعراً',
    price_desc: 'الأعلى سعراً',
    discount_desc: 'أعلى خصم',
    newest: 'الأحدث أولاً',
  };

  const QUICK_FILTER_LABELS: Record<string, string> = {
    new: 'الأصناف الجديدة',
    discounted: 'عروض وتخفيضات',
    featured: 'الأصناف المميزة',
    available: 'متوفر للتوريد الفوري',
  };

  const selectedCategoryPathNames = useMemo(
    () => (selectedCategory !== null ? findCategoryNamesPath(categories, selectedCategory) : []),
    [categories, selectedCategory]
  );

  const isFilteredView =
    selectedCategory !== null || Boolean(searchQuery.trim()) || hasActiveFilters;

  const newProducts = products.filter((p) => p.is_new && !p.is_coming_soon);
  const discountedProducts = products.filter(
    (p) => (p.packages?.[0]?.discount_percent ?? 0) > 0 && !p.is_coming_soon
  );

  const loadedPercent =
    pagination.total > 0
      ? Math.min(100, Math.round((products.length / pagination.total) * 100))
      : 0;

  if (isAuthLoading || !isAuthenticated || (user?.merchant_profile && user.merchant_profile.status !== 'active')) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fdfbf7] via-[#f8f4eb] to-[#f2ecde] flex flex-col items-center justify-center text-stone-900 px-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#dfb76c] via-[#c28b38] to-[#996515] text-white flex items-center justify-center shadow-xl shadow-amber-900/10 mb-4 animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
        <p className="text-base font-black text-stone-900">التحقق من اعتماد المنشأة والتصريح...</p>
        <p className="text-xs text-stone-500 mt-1 font-medium">المنصة مخصصة لقطاع الجملة والشركات المعتمدة فقط</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] pb-32 text-stone-900 font-sans selection:bg-amber-200 selection:text-amber-950">
      {/* رأس الكتالوج الفاخر */}
      <CatalogHeader
        branch={activeBranch}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onChangeBranch={() => router.push('/')}
      />

      {/* شريط التصنيفات الهرمي متعدد المستويات والعروض */}
      <CategoryBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
        offersCount={offersCount}
        isOffersActive={advancedFilters.quickFilter === 'discounted'}
        onToggleOffers={toggleOffersOnly}
      />

      {/* محتوى الكتالوج الرئيسي */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-4 py-4 sm:py-6 space-y-5 sm:space-y-7">
        {/* بانر الإعلانات المتحرك التفاعلي في بداية الكتالوج */}
        {!isFilteredView && (
          <PromoBannerSlider
            branchName={activeBranch?.name || 'شركة المخازن الاقتصادية'}
            newProductsCount={newProducts.length}
            discountedCount={offersCount || discountedProducts.length}
          />
        )}

        {/* شريط الفلترة بالعلامات التجارية */}
        <BrandFilterBar
          brands={brands}
          selectedBrand={selectedBrand}
          onSelectBrand={setSelectedBrand}
        />

        {/* شريط الفلاتر النشطة */}
        {(hasActiveFilters || selectedCategory !== null || Boolean(searchQuery.trim())) && (
          <div className="bg-white rounded-2xl border border-[#eddcc8] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-bold text-stone-600 inline-flex items-center gap-1 ml-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#b47820]" />
                الفلاتر النشطة:
              </span>

              {selectedCategoryPathNames.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="inline-flex items-center gap-1 bg-[#fbf3e6] text-[#8f5a13] border border-[#ebd2b0] px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer hover:bg-[#faebd7]"
                >
                  <span>القسم: {selectedCategoryPathNames.join(' ← ')}</span>
                  <X className="w-3 h-3" />
                </button>
              )}

              {selectedBrand && (
                <button
                  type="button"
                  onClick={() => setSelectedBrand(null)}
                  className="inline-flex items-center gap-1 bg-[#fbf3e6] text-[#8f5a13] border border-[#ebd2b0] px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer hover:bg-[#faebd7]"
                >
                  <Award className="w-3 h-3 text-[#b47820]" />
                  <span>العلامة: {selectedBrand}</span>
                  <X className="w-3 h-3" />
                </button>
              )}

              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-1 bg-[#fbf3e6] text-[#8f5a13] border border-[#ebd2b0] px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer hover:bg-[#faebd7]"
                >
                  <span>بحث: {searchQuery.trim()}</span>
                  <X className="w-3 h-3" />
                </button>
              )}

              {advancedFilters.sort !== 'default' && (
                <button
                  type="button"
                  onClick={() =>
                    setAdvancedFilters((prev) => ({ ...prev, sort: 'default' }))
                  }
                  className="inline-flex items-center gap-1 bg-[#fbf3e6] text-[#8f5a13] border border-[#ebd2b0] px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer hover:bg-[#faebd7]"
                >
                  <span>{SORT_LABELS[advancedFilters.sort]}</span>
                  <X className="w-3 h-3" />
                </button>
              )}

              {advancedFilters.quickFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() =>
                    setAdvancedFilters((prev) => ({ ...prev, quickFilter: 'all' }))
                  }
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer border ${
                    advancedFilters.quickFilter === 'discounted'
                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      : 'bg-[#fbf3e6] text-[#8f5a13] border-[#ebd2b0] hover:bg-[#faebd7]'
                  }`}
                >
                  <span>{QUICK_FILTER_LABELS[advancedFilters.quickFilter]}</span>
                  <X className="w-3 h-3" />
                </button>
              )}

              {(advancedFilters.minPrice !== '' || advancedFilters.maxPrice !== '') && (
                <button
                  type="button"
                  onClick={() =>
                    setAdvancedFilters((prev) => ({ ...prev, minPrice: '', maxPrice: '' }))
                  }
                  className="inline-flex items-center gap-1 bg-[#fbf3e6] text-[#8f5a13] border border-[#ebd2b0] px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer hover:bg-[#faebd7]"
                >
                  <span>
                    السعر: {advancedFilters.minPrice || '0'} - {advancedFilters.maxPrice || '∞'} ر.س
                  </span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[11px] font-extrabold text-rose-600 hover:text-rose-700 px-2.5 py-1 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
            >
              إعادة ضبط الكل
            </button>
          </div>
        )}

        {isCatalogLoading && products.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-brand">
            <Loader2 className="w-10 h-10 animate-spin mb-3 text-[#b47820]" />
            <span className="text-sm font-bold text-stone-700">
              جاري تجهيز كتالوج الأصناف المعتمدة...
            </span>
          </div>
        ) : catalogError ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-3xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{catalogError}</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-stone-400 bg-white rounded-3xl border border-[#eddcc8] p-8 space-y-3 shadow-2xs">
            <span className="text-5xl block">📦</span>
            <p className="font-extrabold text-base text-stone-800">
              لا توجد أصناف تطابق معايير البحث أو التصفية الحالية
            </p>
            <p className="text-xs text-stone-500">
              جرب تغيير القسم، العلامة التجارية، أو تعديل خيارات الفرز والتصفية
            </p>
            {(hasActiveFilters || selectedCategory !== null || Boolean(searchQuery.trim())) && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#8f5a13] to-[#b47820] hover:opacity-95 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <span>عرض جميع الأصناف</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* قسم العروض المختارة في الصفحة الأولى غير المفلترة إذا وُجدت عروض */}
            {!isFilteredView && discountedProducts.length > 0 && (
              <section id="discounted-section" className="space-y-4 scroll-mt-20">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-100 to-amber-100 text-rose-700 flex items-center justify-center shadow-xs border border-rose-200/70">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-black text-base text-stone-900 leading-tight">
                        عروض الجملة والتخفيضات
                      </h2>
                      <span className="text-xs text-stone-500 font-medium">
                        خصومات فورية مقارنة بالسعر الأساسي
                      </span>
                    </div>
                  </div>

                  {offersCount > discountedProducts.length && (
                    <button
                      type="button"
                      onClick={toggleOffersOnly}
                      className="text-xs font-extrabold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full border border-rose-200 transition-colors cursor-pointer"
                    >
                      عرض كل العروض
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
                  {discountedProducts.slice(0, 5).map((p) => (
                    <ProductCard
                      key={`offer-${p.id}`}
                      product={p}
                      quantity={getQuantityForProduct(p.packages?.[0]?.id)}
                      onQuantityChange={handleQuantityChange}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* قسم الأصناف الجديدة المميزة */}
            {!isFilteredView && newProducts.length > 0 && (
              <section id="new-products-section" className="space-y-4 scroll-mt-20">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-100 to-amber-200 text-amber-900 flex items-center justify-center shadow-xs border border-amber-300/60">
                      <Sparkles className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <h2 className="font-black text-base text-stone-900 leading-tight">
                        أحدث التوريدات
                      </h2>
                      <span className="text-xs text-stone-500 font-medium">
                        أصناف وصلت حديثاً للمستودع
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-black text-amber-900 bg-gradient-to-r from-amber-50 to-amber-100/90 px-3 py-1 rounded-full border border-amber-300/80 shadow-xs">
                    {newProducts.length} صنف جديد
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
                  {newProducts.slice(0, 5).map((p) => (
                    <ProductCard
                      key={`new-${p.id}`}
                      product={p}
                      quantity={getQuantityForProduct(p.packages?.[0]?.id)}
                      onQuantityChange={handleQuantityChange}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* شبكة جميع أصناف الكتالوج */}
            <section className="space-y-4">
              {/* ترويسة وشريط التحكم والترتيب */}
              <div className="bg-white/95 rounded-2xl sm:rounded-3xl border border-[#eddcc8] p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#fbf3e6] to-amber-100 text-[#8f5a13] flex items-center justify-center shadow-2xs border border-[#ebd2b0] shrink-0">
                    <TrendingUp className="w-5 h-5 text-[#b47820]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-black text-sm sm:text-base text-stone-900 leading-tight truncate">
                      {selectedCategoryPathNames.length > 0
                        ? selectedCategoryPathNames.join(' ← ')
                        : selectedBrand
                          ? `منتجات ${selectedBrand}`
                          : advancedFilters.quickFilter === 'discounted'
                            ? 'العروض والتخفيضات'
                            : 'كتالوج الأصناف المعتمدة'}
                    </h2>
                    <span className="text-xs text-stone-500 font-medium block mt-0.5">
                      عرض <strong className="text-stone-800 font-mono">{products.length}</strong> من أصل{' '}
                      <strong className="text-[#8f5a13] font-mono">{pagination.total}</strong> صنف
                      {brands.length > 0 ? ` • ${brands.length} علامة تجارية` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* زر تبديل العروض السريع */}
                  {offersCount > 0 && (
                    <button
                      type="button"
                      onClick={toggleOffersOnly}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        advancedFilters.quickFilter === 'discounted'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-rose-50/80 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>العروض</span>
                    </button>
                  )}

                  {/* قائمة الترتيب المباشر */}
                  <div className="relative flex items-center bg-[#fdfbf7] border border-[#eddcc8] rounded-xl px-2.5 py-2">
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#b47820] ml-1.5 shrink-0 pointer-events-none" />
                    <select
                      aria-label="ترتيب الأصناف"
                      value={advancedFilters.sort}
                      onChange={(e) =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          sort: e.target.value as CatalogSortOption,
                        }))
                      }
                      className="bg-transparent text-xs font-bold text-stone-800 focus:outline-hidden cursor-pointer pl-1"
                    >
                      <option value="default">الترتيب الافتراضي</option>
                      <option value="discount_desc">الأكثر توفيراً (أعلى خصم)</option>
                      <option value="price_asc">السعر: من الأقل للأعلى</option>
                      <option value="price_desc">السعر: من الأعلى للأقل</option>
                      <option value="newest">الأحدث وصولاً</option>
                    </select>
                  </div>

                  {/* زر الفرز والتصفية المتقدمة */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('filter');
                      setIsFilterOpen(true);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      hasActiveFilters
                        ? 'bg-[#fbf3e6] text-[#8f5a13] border-[#b47820]'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-amber-300'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#b47820]" />
                    <span>تصفية متقدمة</span>
                    {activeFiltersCount > 0 && (
                      <span className="bg-[#b47820] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* شبكة المنتجات */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    quantity={getQuantityForProduct(p.packages?.[0]?.id)}
                    onQuantityChange={handleQuantityChange}
                  />
                ))}
              </div>

              {/* شريط التقدم وعرض المزيد للكتالوج الكامل */}
              {pagination.total > 0 && (
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eddcc8] p-4 sm:p-5 flex flex-col items-center gap-3 shadow-2xs">
                  <div className="w-full max-w-md space-y-1.5 text-center">
                    <p className="text-xs font-bold text-stone-600">
                      تم عرض <span className="font-mono font-black text-stone-900">{products.length}</span> من إجمالي{' '}
                      <span className="font-mono font-black text-[#8f5a13]">{pagination.total}</span> صنف
                    </p>
                    <div className="w-full h-2 rounded-full bg-[#f5ebdc] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#8f5a13] via-[#b47820] to-[#dfb76c] transition-all duration-500"
                        style={{ width: `${loadedPercent}%` }}
                      />
                    </div>
                  </div>

                  {hasMore && (
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#8f5a13] via-[#b47820] to-[#c28b38] hover:opacity-95 active:scale-[0.99] text-white text-xs sm:text-sm font-black shadow-md transition-all cursor-pointer disabled:opacity-60"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>جاري تحميل المزيد...</span>
                        </>
                      ) : (
                        <>
                          <span>عرض المزيد من الأصناف</span>
                          <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* الشريط السفلي المتنقل */}
      <BottomNav
        activeTab={activeTab}
        cartCount={itemsCount}
        filterCount={activeFiltersCount}
        onCartClick={() => setIsCartOpen(true)}
        onCategoriesClick={() => {
          setActiveTab('categories');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onFilterClick={() => {
          setActiveTab('filter');
          setIsFilterOpen(true);
        }}
      />

      {/* نافذة الفرز والتصفية */}
      <CatalogFilterModal
        isOpen={isFilterOpen}
        onClose={() => {
          setIsFilterOpen(false);
          setActiveTab(hasActiveFilters ? 'filter' : 'home');
        }}
        filters={advancedFilters}
        brands={brands}
        onApply={setAdvancedFilters}
        onReset={resetAdvancedFilters}
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
