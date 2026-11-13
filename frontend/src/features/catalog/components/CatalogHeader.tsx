'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Store, User as UserIcon, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Branch } from '@/types';

interface CatalogHeaderProps {
  branch?: Branch | null;
  customerName?: string;
  customerPhone?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onChangeBranch?: () => void;
}

export const CatalogHeader: React.FC<CatalogHeaderProps> = ({
  branch,
  customerName = 'لمسه للتجارة',
  customerPhone = '0579621870',
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className="relative bg-gradient-to-r from-[#8f5a13] via-[#b47820] to-[#d4973b] text-white shadow-xl overflow-hidden border-b border-amber-300/40">
      {/* لمسات إضاءة خلفية ناعمة (Ambient Gold Lights) */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-white/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-10 w-80 h-80 bg-yellow-200/25 rounded-full blur-2xl pointer-events-none" />

      {/* الشريط العلوي: هوية الشركة ومعلومات المنشأة */}
      <div className="relative max-w-7xl mx-auto px-4 pt-4 pb-3 flex items-center justify-between gap-4">
        {/* معلومات الفرع / الشركة */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-white/80 flex items-center justify-center shadow-lg shadow-black/15 overflow-hidden">
              <img src="/logo.png" alt="شركة المخازن الاقتصادية" className="w-full h-full object-contain" />
            </div>
            <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 bg-amber-300 border-2 border-[#8f5a13] rounded-full flex items-center justify-center" title="مباشر">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base sm:text-lg leading-tight tracking-tight text-white drop-shadow-xs">
                {branch?.name || 'شركة المخازن الاقتصادية'}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-amber-100 bg-black/15 border border-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                <Sparkles className="w-3 h-3 text-amber-200" />
                توريد مباشر
              </span>
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات السريعة (تغيير الفرع وهاتف المبيعات) */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 text-xs font-bold text-white backdrop-blur-md transition-all border border-white/30 shadow-xs"
          >
            <Store className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">تبديل المستودع</span>
            <span className="sm:hidden">المستودعات</span>
          </Link>

          <a
            href="tel:0553841319"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 text-xs font-bold backdrop-blur-md transition-all shadow-xs"
            title="الاتصال المباشر بإدارة التجهيز"
          >
            <Phone className="w-3.5 h-3.5 text-amber-200" />
            <span className="hidden sm:inline">0553841319</span>
          </a>
        </div>
      </div>

      {/* الشريط الثاني: بطاقة حساب التاجر المعتمد */}
      <div className="relative border-t border-white/20 bg-black/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-white/95">
            <div className="w-6 h-6 rounded-full bg-white/25 border border-white/30 flex items-center justify-center text-white">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold text-white text-xs">
              {customerName}
            </span>
            <span className="text-[11px] text-white/80 font-mono hidden sm:inline">
              ({customerPhone})
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-100 bg-white/20 border border-white/30 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3 text-amber-200" />
              منشأة معتمدة
            </span>
          </div>

          <span className="text-[11px] text-white/85 hidden md:block font-medium">
            الأسعار المعروضة خاصة بقطاع الجملة (بالحبة)
          </span>
        </div>
      </div>

      {/* حقل البحث العصري الفاخر */}
      <div className="relative max-w-7xl mx-auto px-4 pt-3 pb-4">
        <div className="relative group">
          <div className="absolute inset-0 bg-white/10 rounded-2xl blur-xs group-focus-within:bg-white/20 transition-all" />
          <div className="relative flex items-center bg-white/15 backdrop-blur-md rounded-2xl border border-white/25 focus-within:border-white/50 focus-within:bg-white/20 transition-all shadow-inner">
            <Search className="w-4 h-4 text-white/70 mr-4 shrink-0" />
            <input
              type="text"
              placeholder="ابحث باسم المنتج، كود الصنف (مثلاً AM-3640)، أو الباركود..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-transparent text-white placeholder-white/50 text-xs sm:text-sm py-3 px-3 focus:outline-hidden font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="ml-3 p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
