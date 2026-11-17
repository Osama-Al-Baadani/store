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
      className={`group relative flex flex-col bg-white rounded-xl sm:rounded-2xl border transition-all duration-300 overflow-hidden ${
        inCart
          ? 'border-[#a184ab] shadow-md ring-1 ring-[#c7aad1]/50 bg-gradient-to-b from-white to-[#faf6fc]'
          : 'border-[#eeeeee] hover:border-[#c7aad1] shadow-2xs hover:shadow-[0_12px_28px_-10px_rgba(72,43,82,0.16)] hover:-translate-y-0.5'
      }`}
    >
      {/* مؤشر وجود الصنف في السلة */}
      {inCart && (
        <div className="absolute top-2.5 left-2.5 z-10 bg-[#482b52] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
          <Check className="w-3 h-3 stroke-[3]" />
          <span>{quantity} بالسلة</span>
        </div>
      )}

      {/* منطقة الصورة والشارات */}
      <Link
        href={`/catalog/${product.id}`}
        className="relative w-full aspect-square bg-white flex items-center justify-center p-3.5 sm:p-4 overflow-hidden border-b border-[#f3f4f6] cursor-pointer"
      >
        {resolvedImageUrl ? (
          <img
            src={resolvedImageUrl}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full rounded-xl bg-[#faf6fc] border border-dashed border-[#c7aad1] flex flex-col items-center justify-center text-gray-400">
            <Package className="w-11 h-11 text-[#c7aad1] mb-1" />
            <span className="text-[10px] font-mono text-gray-400">
              {product.code}
            </span>
          </div>
        )}

        {/* الشارات العلوية */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end">
          {isComingSoon && (
            <span className="inline-flex items-center gap-1 bg-[#482b52] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
              <Bell className="w-3 h-3" /> قريباً
            </span>
          )}
          {product.is_new && !isComingSoon && (
            <span className="inline-flex items-center gap-1 bg-[#c7aad1] text-[#111827] text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
              <Sparkles className="w-3 h-3 text-[#482b52]" /> جديد
            </span>
          )}
          {discountPercent > 0 && !isComingSoon && (
            <span className="inline-flex items-center gap-0.5 bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
              <Tag className="w-2.5 h-2.5" />
              خصم {discountPercent}%
            </span>
          )}
        </div>

        {/* شارة التصنيف السفلية */}
        {product.category_name && (
          <span className="absolute bottom-2 right-2.5 max-w-[80%] truncate bg-white/95 backdrop-blur-xs text-[10px] font-bold text-[#4b5563] px-2 py-0.5 rounded-lg border border-[#eeeeee] shadow-2xs">
            {product.category_name}
          </span>
        )}
      </Link>

      {/* تفاصيل الصنف */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-2.5 sm:gap-3">
        <div>
          {/* كود الصنف وزر التفاصيل */}
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#4b5563] bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded-md truncate">
              {product.code}
            </span>
            <Link
              href={`/catalog/${product.id}`}
              className="shrink-0 inline-flex items-center gap-1 text-[10px] font-extrabold text-[#482b52] hover:bg-[#edd0f7]/45 bg-[#faf6fc] px-1.5 sm:px-2 py-0.5 rounded-md border border-[#c7aad1]/70 transition-colors"
            >
              <Eye className="w-3 h-3" />
              <span>التفاصيل</span>
            </Link>
          </div>

          {/* العلامة التجارية + اسم الصنف */}
          <Link href={`/catalog/${product.id}`} className="block space-y-1">
            {product.brand && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#482b52] bg-[#faf6fc] border border-[#c7aad1]/70 px-2 py-0.5 rounded-md">
                <Award className="w-2.5 h-2.5 text-[#a184ab]" />
                <span>{product.brand}</span>
              </span>
            )}
            <h3 className="font-extrabold text-[#111827] text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.4em] group-hover:text-[#482b52] transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* لوحة تسعيرة الجملة */}
        <div
          className={`rounded-xl p-2 sm:p-2.5 border ${
            hasDiscount
              ? 'bg-[#faf6fc] border-[#c7aad1]/80'
              : 'bg-[#f9fafb] border-[#eeeeee]'
          }`}
        >
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="text-[10px] text-[#4b5563] block font-semibold">
                {hasDiscount ? 'سعر العرض للحبة' : 'سعر الحبة'}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-black text-[#482b52] tracking-tight">
                  {unitPrice.toFixed(2)}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#a184ab]">ر.س</span>
              </div>
            </div>

            {hasDiscount && oldPrice && (
              <div className="text-left">
                <span className="text-[11px] font-semibold line-through text-gray-400 block">
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
              className="w-full py-2.5 px-3 rounded-xl border border-[#c7aad1] bg-[#faf6fc] text-[#482b52] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
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
