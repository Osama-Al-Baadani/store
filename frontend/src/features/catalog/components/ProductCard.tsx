'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Sparkles, Package, Check, Tag, Eye, Award } from 'lucide-react';
import { Product } from '@/types';
import { QuantityInput } from './QuantityInput';

interface ProductCardProps {
  product: Product;
  quantity?: number;
  onQuantityChange?: (packageId: number, newQuantity: number) => void;
}

type ProductWithLegacyImage = Product & { image?: string | null };

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantity = 0,
  onQuantityChange,
}) => {
  const pkg = product.packages?.[0]; // الباقة الافتراضية
  const unitPrice = pkg ? Number(pkg.unit_price) : 0;
  const oldPrice = pkg?.old_price ? Number(pkg.old_price) : null;
  const discountPercent = pkg?.discount_percent ?? 0;
  const hasDiscount = Boolean(oldPrice && oldPrice > unitPrice);
  const savingsAmount = hasDiscount && oldPrice ? oldPrice - unitPrice : 0;
  const isComingSoon = product.is_coming_soon;
  const inCart = quantity > 0;

  const resolvedImageUrl = React.useMemo(() => {
    const raw = (product.image_url || (product as ProductWithLegacyImage).image || '').trim();
    if (!raw) return null;
    const embeddedMatch = raw.match(/https?:\/\/(?!localhost\/storage\/https?:\/\/).+$/i);
    let url = embeddedMatch ? embeddedMatch[0] : raw;
    if (url.startsWith('http://') && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url)) {
      url = 'https://' + url.slice(7);
    }
    return url;
  }, [product]);

  return (
    <article
      className={`group relative flex flex-col bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${
        inCart
          ? 'border-[#b47820] shadow-lg ring-1 ring-[#c28b38]/35 bg-gradient-to-b from-white to-[#fbf3e6]/45'
          : 'border-[#eddcc8]/90 hover:border-[#c28b38] shadow-xs hover:shadow-[0_14px_34px_-12px_rgba(180,120,32,0.26)] hover:-translate-y-1'
      }`}
    >
      {/* مؤشر وجود الصنف في السلة */}
      {inCart && (
        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-[#8f5a13] to-[#c28b38] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm border border-amber-300/40">
          <Check className="w-3 h-3 stroke-[3]" />
          <span>{quantity} بالسلة</span>
        </div>
      )}

      {/* منطقة الصورة والشارات الفاخرة */}
      <Link
        href={`/catalog/${product.id}`}
        className="relative w-full aspect-square bg-gradient-to-b from-[#fdfbf7] to-white flex items-center justify-center p-3.5 sm:p-4 overflow-hidden border-b border-[#f3e6d3] cursor-pointer"
      >
        {resolvedImageUrl ? (
          <img
            src={resolvedImageUrl}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full rounded-2xl bg-[#faf7f2] border border-dashed border-[#ebd2b0] flex flex-col items-center justify-center text-stone-400">
            <Package className="w-11 h-11 text-[#d9b683] mb-1" />
            <span className="text-[10px] font-mono text-stone-400">
              {product.code}
            </span>
          </div>
        )}

        {/* الشارات العلوية */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          {isComingSoon && (
            <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
              <Bell className="w-3 h-3" /> قريباً
            </span>
          )}
          {product.is_new && !isComingSoon && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#8f5a13] via-[#b47820] to-[#c28b38] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs tracking-wider border border-amber-300/40">
              <Sparkles className="w-3 h-3" /> جديد
            </span>
          )}
          {discountPercent > 0 && !isComingSoon && (
            <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-rose-600 to-amber-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs border border-white/25">
              <Tag className="w-2.5 h-2.5" />
              خصم {discountPercent}%
            </span>
          )}
        </div>

        {/* شارة التصنيف السفلية */}
        {product.category_name && (
          <span className="absolute bottom-2 right-2.5 max-w-[80%] truncate bg-white/92 backdrop-blur-xs text-[10px] font-bold text-stone-600 px-2 py-0.5 rounded-lg border border-[#eddcc8]/80 shadow-2xs">
            {product.category_name}
          </span>
        )}
      </Link>

      {/* تفاصيل الصنف الفاخرة */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-2.5 sm:gap-3">
        <div>
          {/* كود الصنف وزر التفاصيل */}
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-stone-600 bg-stone-100 px-1.5 sm:px-2 py-0.5 rounded-md truncate">
              {product.code}
            </span>
            <Link
              href={`/catalog/${product.id}`}
              className="shrink-0 inline-flex items-center gap-1 text-[10px] font-extrabold text-[#8f5a13] hover:text-[#b47820] bg-[#fbf3e6] hover:bg-[#f5e6cd] px-1.5 sm:px-2 py-0.5 rounded-md border border-[#ebd2b0] transition-colors"
            >
              <Eye className="w-3 h-3" />
              <span>التفاصيل</span>
            </Link>
          </div>

          {/* العلامة التجارية + اسم الصنف */}
          <Link href={`/catalog/${product.id}`} className="block space-y-1">
            {product.brand && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#8f5a13] bg-[#fbf3e6] border border-[#ebd2b0]/90 px-2 py-0.5 rounded-md">
                <Award className="w-2.5 h-2.5 text-[#b47820]" />
                <span>{product.brand}</span>
              </span>
            )}
            <h3 className="font-extrabold text-stone-900 text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.4em] group-hover:text-[#8f5a13] transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* لوحة تسعيرة الجملة */}
        <div
          className={`rounded-2xl p-2 sm:p-2.5 border ${
            hasDiscount
              ? 'bg-gradient-to-br from-[#fffaf3] to-[#fbf3e6]/80 border-[#ebd2b0]'
              : 'bg-[#faf8f5] border-[#eddcc8]/80'
          }`}
        >
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="text-[10px] text-stone-500 block font-semibold">
                {hasDiscount ? 'سعر العرض للحبة' : 'سعر الحبة'}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-black text-[#8f5a13] tracking-tight">
                  {unitPrice.toFixed(2)}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#b47820]">ر.س</span>
              </div>
            </div>

            {hasDiscount && oldPrice && (
              <div className="text-left">
                <span className="text-[11px] font-semibold line-through text-stone-400 block">
                  {oldPrice.toFixed(2)} ر.س
                </span>
                {savingsAmount > 0 && (
                  <span className="text-[9px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200/80 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                    وفّر {savingsAmount.toFixed(2)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* أزرار الإضافة والكميات */}
        <div className="pt-0.5">
          {isComingSoon ? (
            <button
              type="button"
              className="w-full py-2.5 px-3 rounded-2xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Bell className="w-3.5 h-3.5" /> نبهني عند توفر المخزون
            </button>
          ) : pkg ? (
            <QuantityInput
              quantity={quantity}
              step={1}
              unit={pkg.unit || 'حبة'}
              onChange={(newQty) => onQuantityChange?.(pkg.id, newQty)}
            />
          ) : (
            <div className="text-xs text-slate-400 text-center py-2">
              غير متاح للتسعير
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
