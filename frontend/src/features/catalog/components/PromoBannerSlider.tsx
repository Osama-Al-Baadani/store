'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Truck,
  ShieldCheck,
  FileCheck2,
  Tag,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { AdvertisementItem, getPublicAdvertisements } from '@/features/admin/api/admin.api';

interface PromoBannerSliderProps {
  branchName?: string;
  newProductsCount?: number;
  discountedCount?: number;
}

export const PromoBannerSlider: React.FC<PromoBannerSliderProps> = ({
  branchName = 'شركة المخازن الاقتصادية',
  newProductsCount = 8,
  discountedCount = 6,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [customAds, setCustomAds] = useState<AdvertisementItem[]>([]);

  useEffect(() => {
    getPublicAdvertisements('catalog')
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setCustomAds(res.data);
          setActiveSlide(0);
        }
      })
      .catch(() => {
        // استخدام الشرائح الافتراضية تلقائياً عند عدم توفر إعلانات مخصصة
      });
  }, []);

  const hasCustomAds = customAds.length > 0;
  const totalSlides = hasCustomAds ? customAds.length : 3;

  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % totalSlides);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused, totalSlides]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const currentCustomAd = hasCustomAds ? customAds[activeSlide % customAds.length] : null;

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-[#ebd2b0] shadow-[0_10px_35px_-10px_rgba(180,120,32,0.18)] bg-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="بنر العروض والإعلانات"
    >
      {/* حاوية الشرائح */}
      <div className="relative w-full">
        {currentCustomAd ? (
          currentCustomAd.title || currentCustomAd.subtitle ? (
            /* إعلان مرفوع مع عنوان أو وصف */
            <div className="relative overflow-hidden bg-gradient-to-l from-[#fffdf9] via-white to-[#fbf3e6] p-4 sm:p-7 animate-in fade-in duration-500">
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-7">
                <div className="w-full sm:w-64 md:w-80 h-40 sm:h-44 rounded-2xl bg-white border border-[#eddcc8] overflow-hidden shadow-md shrink-0">
                  <img
                    src={currentCustomAd.image_url}
                    alt={currentCustomAd.title || 'إعلان المتجر'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 text-center sm:text-right space-y-2">
                  {currentCustomAd.badge_text && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fbf3e6] text-[#8f5a13] text-[11px] font-bold border border-[#ebd2b0]">
                      <Sparkles className="w-3.5 h-3.5 text-[#b47820]" />
                      <span>{currentCustomAd.badge_text}</span>
                    </span>
                  )}
                  {currentCustomAd.title && (
                    <h2 className="text-lg sm:text-2xl font-bold text-stone-900 leading-snug">
                      {currentCustomAd.title}
                    </h2>
                  )}
                  {currentCustomAd.subtitle && (
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                      {currentCustomAd.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* صورة بنر إعلاني مرفوعة كاملة بدون نصوص إضافية */
            <div className="relative w-full bg-[#fdfbf7] animate-in fade-in duration-500">
              <img
                src={currentCustomAd.image_url}
                alt="إعلان المتجر"
                className="w-full h-44 sm:h-64 md:h-72 object-cover"
              />
              {currentCustomAd.badge_text && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/95 text-[#8f5a13] text-[11px] font-bold border border-[#ebd2b0] shadow-md">
                  <Sparkles className="w-3.5 h-3.5 text-[#b47820]" />
                  <span>{currentCustomAd.badge_text}</span>
                </span>
              )}
            </div>
          )
        ) : (
          <>
            {/* ================= الشريحة 1: الإعلان الرسمي بالصورة ================= */}
            {activeSlide === 0 && (
              <div className="relative overflow-hidden bg-gradient-to-l from-[#fffdf9] via-white to-[#fbf3e6] p-4 sm:p-7 animate-in fade-in duration-500">
                <div className="absolute -top-16 -left-16 w-60 h-60 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 right-1/3 w-64 h-64 bg-amber-200/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-right">
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 bg-[#dfb76c]/30 rounded-2xl blur-lg" />
                      <div className="relative w-28 h-24 sm:w-36 sm:h-32 rounded-2xl bg-white border-2 border-[#eddcc8] p-2.5 shadow-md flex items-center justify-center overflow-hidden">
                        <img
                          src="/banner-promo.png"
                          alt="شركة المخازن الاقتصادية"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 max-w-xl">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fbf3e6] text-[#8f5a13] text-[11px] font-bold border border-[#ebd2b0]">
                        <Sparkles className="w-3.5 h-3.5 text-[#b47820]" />
                        <span>إعلان التوريد المباشر • قطاع الجملة B2B</span>
                      </div>
                      <h2 className="text-lg sm:text-2xl font-bold text-stone-900 leading-snug">
                        عروض <span className="text-[#8f5a13]">{branchName}</span> الحصرية للتجار
                      </h2>
                      <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                        تسعير رسمي مباشر بالحبة مع احتساب الضريبة تلقائياً وتجهيز فوري للطلبيات مع فاتورة ضريبية معتمدة.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
                    <div className="bg-white/95 rounded-2xl p-2.5 sm:p-3.5 border border-[#eddcc8] text-center shadow-2xs">
                      <div className="w-8 h-8 mx-auto mb-1 rounded-xl bg-[#fbf3e6] flex items-center justify-center text-[#b47820]">
                        <Truck className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] sm:text-xs font-bold block text-stone-900">تجهيز فوري</span>
                      <span className="text-[10px] text-stone-500">خلال ساعات</span>
                    </div>

                    <div className="bg-white/95 rounded-2xl p-2.5 sm:p-3.5 border border-[#eddcc8] text-center shadow-2xs">
                      <div className="w-8 h-8 mx-auto mb-1 rounded-xl bg-[#fbf3e6] flex items-center justify-center text-[#b47820]">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] sm:text-xs font-bold block text-stone-900">سجل معتمد</span>
                      <span className="text-[10px] text-stone-500">تجار الجملة</span>
                    </div>

                    <div className="bg-white/95 rounded-2xl p-2.5 sm:p-3.5 border border-[#eddcc8] text-center shadow-2xs">
                      <div className="w-8 h-8 mx-auto mb-1 rounded-xl bg-[#fbf3e6] flex items-center justify-center text-[#b47820]">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] sm:text-xs font-bold block text-stone-900">فاتورة PDF</span>
                      <span className="text-[10px] text-stone-500">ضريبية 100%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= الشريحة 2: عروض الخصومات المميزة ================= */}
            {activeSlide === 1 && (
              <div className="relative overflow-hidden bg-gradient-to-l from-[#1c1917] via-[#292524] to-[#442c10] text-white p-5 sm:p-8 animate-in fade-in duration-500">
                <div className="absolute top-0 left-0 w-72 h-72 bg-[#d4973b]/25 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 right-10 w-56 h-56 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5">
                  <div className="flex items-center gap-4 text-center sm:text-right flex-col sm:flex-row">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 backdrop-blur-md border border-amber-300/30 p-2.5 flex items-center justify-center shrink-0">
                      <img
                        src="/banner-promo.png"
                        alt="عروض الجملة"
                        className="w-full h-full object-contain drop-shadow"
                      />
                    </div>
                    <div className="space-y-2 max-w-xl">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-200 text-[11px] font-bold">
                        <Tag className="w-3.5 h-3.5 text-rose-300" />
                        <span>تخفيضات جملة حصرية • خصم يصل إلى 23%</span>
                      </div>
                      <h2 className="text-lg sm:text-2xl font-bold leading-snug text-white">
                        وفر أكثر على مشتريات منشأتك مع <span className="text-[#dfb76c]">عروض الجملة المميزة</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                        أسعار مخفضة بالحبة على {discountedCount > 0 ? `${discountedCount} أصناف مختارة` : 'مختارات المستودع'} لفترة محدودة — اطلب الآن قبل نفاذ الكمية.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => scrollToSection('discounted-section')}
                    className="btn-shimmer shrink-0 inline-flex items-center gap-2 bg-gradient-to-r from-[#b47820] to-[#dfb76c] text-stone-950 font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg cursor-pointer hover:opacity-95 active:scale-95 transition-all"
                  >
                    <span>عرض الأصناف المخفضة</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= الشريحة 3: وصل حديثاً للمستودع ================= */}
            {activeSlide === 2 && (
              <div className="relative overflow-hidden bg-gradient-to-l from-emerald-950 via-emerald-900 to-[#14532d] text-white p-5 sm:p-8 animate-in fade-in duration-500">
                <div className="absolute -top-12 right-1/4 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 left-8 w-56 h-56 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5">
                  <div className="flex items-center gap-4 text-center sm:text-right flex-col sm:flex-row">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-2.5 border border-emerald-200/50 shadow-lg flex items-center justify-center shrink-0">
                      <img
                        src="/banner-promo.png"
                        alt="وصل حديثاً"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="space-y-2 max-w-xl">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[11px] font-bold">
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>وصل حديثاً • دفعات توريد جديدة</span>
                      </div>
                      <h2 className="text-lg sm:text-2xl font-bold leading-snug text-white">
                        تشكيلة جديدة من <span className="text-amber-300">{newProductsCount} أصناف</span> وصلت إلى {branchName}
                      </h2>
                      <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                        تصفح أحدث المنتجات المضافة حديثاً للمستودع واضمن توفرها لمنشأتك بأسعار الجملة المباشرة.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => scrollToSection('new-products-section')}
                    className="shrink-0 inline-flex items-center gap-2 bg-white text-emerald-950 font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg cursor-pointer hover:bg-amber-50 active:scale-95 transition-all"
                  >
                    <span>تصفح الأصناف الجديدة</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* أزرار التنقل الجانبية */}
      {totalSlides > 1 && (
        <>
          <button
            type="button"
            onClick={() => setActiveSlide((prev) => (prev - 1 + totalSlides) % totalSlides)}
            aria-label="الشريحة السابقة"
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-stone-800 border border-stone-200/80 shadow-md items-center justify-center cursor-pointer transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setActiveSlide((prev) => (prev + 1) % totalSlides)}
            aria-label="الشريحة التالية"
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-stone-800 border border-stone-200/80 shadow-md items-center justify-center cursor-pointer transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* مؤشرات الشرائح (Dots) */}
          <div className="bg-[#fdfbf7]/90 border-t border-[#eddcc8]/60 py-2 px-4 flex items-center justify-center gap-2">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlide(idx)}
                aria-label={`الانتقال للإعلان ${idx + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  activeSlide === idx
                    ? 'w-7 bg-[#b47820]'
                    : 'w-2 bg-stone-300 hover:bg-stone-400'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
