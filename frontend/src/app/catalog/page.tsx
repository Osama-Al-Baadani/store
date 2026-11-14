'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CatalogHeader } from '@/features/catalog/components/CatalogHeader';
import { CategoryBar } from '@/features/catalog/components/CategoryBar';
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
import {
  Sparkles,
  Tag,
  TrendingUp,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
  X,
} from 'lucide-react';

export default function CatalogPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { branches, selectedBranch, selectBranch } = useBranches();
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
    products,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    advancedFilters,
    setAdvancedFilters,
    activeFiltersCount,
    hasActiveFilters,
    resetAdvancedFilters,
    isLoading: isCatalogLoading,
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

  // ربط كمية المنتج من السلة لعرضها على بطاقة المنتج
  const getQuantityForProduct = (packageId?: number): number => {
    if (!packageId || !cart?.items) return 0;
    const item = cart.items.find((i) => i.package_id === packageId);
    return item ? item.quantity : 0;
  };

  // تحديث الكمية فوراً (متفائل) مع تمرير بيانات الصنف لإضافته للسلة محلياً
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

  const isFilteredView = selectedCategory !== null || Boolean(searchQuery) || hasActiveFilters;

  // فلترة المنتجات حسب الأقسام المميزة
  const newProducts = products.filter((p) => p.is_new && !p.is_coming_soon);
  const discountedProducts = products.filter(
    (p) => (p.packages?.[0]?.discount_percent ?? 0) > 0 && !p.is_coming_soon
  );
  const otherProducts = products.filter(
    (p) => !p.is_new && (p.packages?.[0]?.discount_percent ?? 0) === 0
  );

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

      {/* شريط التصنيفات الزجاجي */}
      <CategoryBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* محتوى الكتالوج الرئيسي */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-4 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* بانر الإعلانات المتحرك التفاعلي في بداية الكتالوج */}
        {!isFilteredView && (
          <PromoBannerSlider
            branchName={activeBranch?.name || 'شركة المخازن الاقتصادية'}
            newProductsCount={newProducts.length}
            discountedCount={discountedProducts.length}
          />
        )}

        {/* شريط الفلاتر النشطة */}
        {hasActiveFilters && (
          <div className="bg-white rounded-2xl border border-[#eddcc8] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-bold text-stone-600 inline-flex items-center gap-1 ml-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#b47820]" />
                الفرز النشط:
              </span>

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
                  className="inline-flex items-center gap-1 bg-[#fbf3e6] text-[#8f5a13] border border-[#ebd2b0] px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer hover:bg-[#faebd7]"
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
              onClick={resetAdvancedFilters}
              className="text-[11px] font-extrabold text-rose-600 hover:text-rose-700 px-2.5 py-1 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
            >
              إعادة ضبط الكل
            </button>
          </div>
        )}

        {isCatalogLoading && products.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-brand">
            <Loader2 className="w-10 h-10 animate-spin mb-3 text-brand" />
            <span className="text-sm font-bold text-slate-700">
              جاري تجهيز كتالوج الأصناف المعتمدة...
            </span>
          </div>
        ) : catalogError ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-3xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{catalogError}</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-slate-400 bg-white rounded-3xl border border-slate-200/60 p-8 space-y-3">
            <span className="text-5xl block">📦</span>
            <p className="font-extrabold text-base text-slate-800">
              لا توجد أصناف تطابق معايير البحث أو الفرز
            </p>
            <p className="text-xs text-slate-500">
              جرب تغيير كلمات البحث أو تعديل خيارات الفرز والتصفية
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAdvancedFilters}
                className="inline-flex items-center gap-1.5 bg-[#b47820] hover:bg-[#8f5a13] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <span>إعادة ضبط الفرز والتصفية</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* قسم الأصناف الجديدة */}
            {newProducts.length > 0 && !isFilteredView && (
              <section id="new-products-section" className="space-y-4 scroll-mt-20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-100 to-amber-200 text-amber-900 flex items-center justify-center shadow-xs border border-amber-300/60">
                      <Sparkles className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <h2 className="font-black text-base text-stone-900 leading-tight">
                        الأصناف الجديدة
                      </h2>
                      <span className="text-xs text-stone-500 font-medium">
                        أحدث التوريدات التي وصلت للمستودع
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-black text-amber-900 bg-gradient-to-r from-amber-50 to-amber-100/90 px-3 py-1 rounded-full border border-amber-300/80 shadow-xs">
                    {newProducts.length} صنف جديد
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
                  {newProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      quantity={getQuantityForProduct(p.packages?.[0]?.id)}
                      onQuantityChange={handleQuantityChange}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* قسم العروض المختارة */}
            {discountedProducts.length > 0 && !isFilteredView && (
              <section id="discounted-section" className="space-y-4 scroll-mt-20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-xs">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-black text-base text-slate-900 leading-tight">
                        عروض الجملة المميزة
                      </h2>
                      <span className="text-xs text-slate-400 font-medium">
                        خصومات خاصة على أسعار الحبة
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                    توفير بالجملة
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
                  {discountedProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      quantity={getQuantityForProduct(p.packages?.[0]?.id)}
                      onQuantityChange={handleQuantityChange}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* جميع أصناف الكتالوج */}
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-100 to-amber-200 text-amber-900 flex items-center justify-center shadow-xs border border-amber-300/60">
                    <TrendingUp className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h2 className="font-black text-base text-stone-900 leading-tight">
                      {selectedCategory
                        ? categories.find((c) => c.id === selectedCategory)?.name
                        : 'كتالوج الأصناف المعتمدة'}
                    </h2>
                    <span className="text-xs text-stone-500 font-medium">
                      {products.length} صنف مسعر بالحبة
                    </span>
                  </div>
                </div>

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
                  <span>الفرز والتصفية</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-[#b47820] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
                {(isFilteredView ? products : otherProducts).map(
                  (p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      quantity={getQuantityForProduct(p.packages?.[0]?.id)}
                      onQuantityChange={handleQuantityChange}
                    />
                  )
                )}
              </div>
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

