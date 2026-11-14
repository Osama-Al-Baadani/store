'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Sparkles, Package, Check, Tag, Eye } from 'lucide-react';
import { Product } from '@/types';
import { QuantityInput } from './QuantityInput';

interface ProductCardProps {
  product: Product;
  quantity?: number;
  onQuantityChange?: (packageId: number, newQuantity: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantity = 0,
  onQuantityChange,
}) => {
  const pkg = product.packages?.[0]; // الباقة الافتراضية
  const unitPrice = pkg ? Number(pkg.unit_price) : 0;
  const oldPrice = pkg?.old_price ? Number(pkg.old_price) : null;
  const discountPercent = pkg?.discount_percent ?? 0;
  const isComingSoon = product.is_coming_soon;
  const inCart = quantity > 0;

  const resolvedImageUrl = React.useMemo(() => {
    const raw = (product.image_url || (product as any).image || '').trim();
    if (!raw) return null;
    // Strip accidental "/storage/http..." prefix if returned by an older backend build
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
          ? 'border-brand shadow-lg ring-1 ring-brand/30 bg-gradient-to-b from-white to-amber-50/40'
          : 'border-stone-200/90 hover:border-amber-400/80 shadow-xs hover:shadow-xl hover:-translate-y-1'
      }`}
    >
      {/* مؤشر وجود الصنف في السلة */}
      {inCart && (
        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-[#996515] to-[#c28b38] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm border border-amber-300/40">
          <Check className="w-3 h-3 stroke-[3]" />
          <span>{quantity} بالسلة</span>
        </div>
      )}

      {/* منطقة الصورة والشارات الفاخرة */}
      <Link
        href={`/catalog/${product.id}`}
        className="relative w-full aspect-square bg-gradient-to-b from-stone-50/70 to-white flex items-center justify-center p-4 overflow-hidden border-b border-stone-100 cursor-pointer"
      >
        {resolvedImageUrl ? (
          <img
            src={resolvedImageUrl}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full rounded-2xl bg-stone-50 border border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400">
            <Package className="w-12 h-12 text-stone-300 mb-1" />
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
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#996515] via-[#b47820] to-[#c28b38] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs tracking-wider border border-amber-300/40">
              <Sparkles className="w-3 h-3" /> جديد
            </span>
          )}
          {discountPercent > 0 && !isComingSoon && (
            <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-600 to-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs border border-white/20">
              <Tag className="w-2.5 h-2.5" />
              خصم {discountPercent}%
            </span>
          )}
        </div>
      </Link>

      {/* تفاصيل الصنف الفاخرة */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* كود الصنف وزر التفاصيل */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
              {product.code}
            </span>
            <Link
              href={`/catalog/${product.id}`}
              className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#8f5a13] hover:text-[#b47820] bg-amber-50/80 hover:bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200/80 transition-colors"
            >
              <Eye className="w-3 h-3" />
              <span>التفاصيل</span>
            </Link>
          </div>

          {/* اسم الصنف */}
          <Link href={`/catalog/${product.id}`} className="block">
            <h3 className="font-extrabold text-stone-900 text-sm leading-snug line-clamp-2 group-hover:text-brand transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* لوحة تسعيرة الجملة */}
        <div className="bg-stone-50/80 rounded-2xl p-2.5 border border-stone-200/70">
          {/* سعر الحبة */}
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="text-[10px] text-stone-500 block font-medium">
                سعر الحبة
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-brand-dark tracking-tight">
                  {unitPrice.toFixed(2)}
                </span>
                <span className="text-[11px] font-bold text-brand">ر.س.</span>
              </div>
            </div>

            {oldPrice && oldPrice > unitPrice && (
              <span className="text-[11px] font-medium line-through text-stone-400">
                {oldPrice.toFixed(2)} ر.س
              </span>
            )}
          </div>
        </div>

        {/* أزرار الإضافة والكميات */}
        <div className="pt-1">
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
              unit="حبة"
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
