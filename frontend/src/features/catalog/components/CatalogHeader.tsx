'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Store, Search, Sparkles, X } from 'lucide-react';
import { Branch } from '@/types';

interface CatalogHeaderProps {
  branch?: Branch | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onChangeBranch?: () => void;
}

export const CatalogHeader: React.FC<CatalogHeaderProps> = ({
  branch,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className="relative bg-gradient-to-r from-[#8f5a13] via-[#b47820] to-[#d4973b] text-white shadow-xl overflow-hidden border-b border-amber-300/40">
      {/* لمسات إضاءة خلفية ناعمة (Ambient Gold Lights) */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-white/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-10 w-80 h-80 bg-yellow-200/25 rounded-full blur-2xl pointer-events-none" />

      {/* الشريط العلوي: هوية الشركة والمستودع */}
      <div className="relative max-w-7xl mx-auto px-3.5 sm:px-4 pt-3.5 pb-2.5 flex items-center justify-between gap-2.5 sm:gap-4">
        {/* معلومات الفرع / الشركة */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white p-1 border border-white/80 flex items-center justify-center shadow-lg shadow-black/15 overflow-hidden">
              <img src="/logo.png" alt="شركة المخازن الاقتصادية" className="w-full h-full object-contain" />
            </div>
            <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 bg-amber-300 border-2 border-[#8f5a13] rounded-full flex items-center justify-center" title="مباشر">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-black text-[15px] sm:text-lg leading-snug tracking-tight text-white drop-shadow-xs truncate">
              {branch?.name || 'شركة المخازن الاقتصادية'}
            </h1>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-100/95 mt-0.5">
              <Sparkles className="w-3 h-3 text-amber-200 shrink-0" />
              <span>توريد الجملة المباشر</span>
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات السريعة (تغيير الفرع وهاتف المبيعات) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 text-[11px] sm:text-xs font-bold text-white backdrop-blur-md transition-all border border-white/30 shadow-xs"
          >
            <Store className="w-3.5 h-3.5 text-white shrink-0" />
            <span className="hidden sm:inline">تبديل المستودع</span>
            <span className="sm:hidden">المستودعات</span>
          </Link>

          <a
            href="tel:0553841319"
            className="flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:h-auto sm:px-3.5 sm:py-2 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 text-white border border-white/30 text-xs font-bold backdrop-blur-md transition-all shadow-xs"
            title="الاتصال المباشر بإدارة التجهيز"
          >
            <Phone className="w-3.5 h-3.5 text-amber-200 shrink-0" />
            <span className="hidden sm:inline">0553841319</span>
          </a>
        </div>
      </div>

      {/* حقل البحث العصري الفاخر */}
      <div className="relative max-w-7xl mx-auto px-3.5 sm:px-4 pt-1.5 pb-3.5">
        <div className="relative group">
          <div className="relative flex items-center bg-white/95 backdrop-blur-md rounded-2xl border border-amber-200/80 focus-within:border-white focus-within:ring-2 focus-within:ring-white/30 transition-all shadow-md">
            <Search className="w-4 h-4 text-amber-700 mr-3.5 shrink-0" />
            <input
              type="text"
              placeholder="ابحث باسم الصنف، الكود، أو الباركود..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-transparent text-stone-900 placeholder-stone-400 text-xs sm:text-sm py-2.5 sm:py-3 px-3 focus:outline-hidden font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="ml-3 p-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                aria-label="مسح البحث"
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
