'use client';

import React from 'react';
import Link from 'next/link';
import { Store, Search, X } from 'lucide-react';
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
    <header className="relative bg-gradient-to-l from-[#8f5a13] via-[#b47820] to-[#d4973b] text-white shadow-md overflow-hidden border-b border-amber-300/35">
      {/* إضاءات خلفية ناعمة */}
      <div className="absolute -top-16 right-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-8 w-64 h-64 bg-amber-200/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-5 pt-3 pb-3.5 sm:pt-3.5 sm:pb-4 space-y-2.5 sm:space-y-3">
        {/* الصف العلوي: الشعار واسم المستودع + أزرار التحكم */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* هوية المستودع */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white p-1 border border-white/85 flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
              <img
                src="/logo.png"
                alt="شركة المخازن الاقتصادية"
                className="w-full h-full object-contain"
              />
            </div>

            <h1 className="font-extrabold text-[15px] sm:text-lg leading-tight tracking-tight text-white drop-shadow-2xs">
              {branch?.name || 'شركة المخازن الاقتصادية'}
            </h1>
          </div>

          {/* زر تبديل المستودع */}
          <Link
            href="/"
            className="h-9 sm:h-10 shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-3.5 rounded-xl bg-white/16 hover:bg-white/26 active:scale-95 text-[11px] sm:text-xs font-bold text-white backdrop-blur-md transition-all border border-white/25"
          >
            <Store className="w-3.5 h-3.5 text-amber-100 shrink-0" />
            <span className="hidden sm:inline">تبديل المستودع</span>
            <span className="sm:hidden">المستودعات</span>
          </Link>
        </div>

        {/* شريط البحث الموحد */}
        <div className="relative flex items-center bg-white rounded-xl sm:rounded-2xl border border-amber-100/90 focus-within:ring-2 focus-within:ring-white/40 transition-all shadow-sm">
          <Search className="w-4 h-4 text-[#b47820] mr-3 sm:mr-3.5 shrink-0 pointer-events-none" />
          <input
            id="search"
            type="text"
            placeholder="ابحث باسم الصنف، العلامة التجارية، الكود، أو الباركود..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent text-stone-900 placeholder-stone-400 text-xs sm:text-sm py-2 sm:py-2.5 pr-2 pl-3 focus:outline-hidden font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="ml-2 p-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
              aria-label="مسح البحث"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
