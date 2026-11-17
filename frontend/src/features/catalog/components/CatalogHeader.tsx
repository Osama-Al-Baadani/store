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
    <header className="relative bg-white text-[#111827] border-b border-[#eeeeee] shadow-[0_2px_14px_-6px_rgba(72,43,82,0.08)]">
      {/* شريط علوي رفيع بلمسة اللافندر المميزة */}
      <div className="h-1 w-full bg-gradient-to-l from-[#482b52] via-[#a184ab] to-[#c7aad1]" />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-5 pt-3 pb-3.5 sm:pt-3.5 sm:pb-4 space-y-2.5 sm:space-y-3">
        {/* الصف العلوي: الشعار واسم المستودع + أزرار التحكم */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* هوية المستودع */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white p-1 border border-[#eeeeee] flex items-center justify-center shadow-2xs shrink-0 overflow-hidden">
              <img
                src="/logo.png"
                alt="شركة المخازن الاقتصادية"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <h1 className="font-extrabold text-[15px] sm:text-lg leading-tight tracking-tight text-[#111827] truncate">
                {branch?.name || 'شركة المخازن الاقتصادية'}
              </h1>
              <span className="hidden sm:inline-block text-[11px] font-semibold text-[#a184ab]">
                كتالوج التوريد والجملة المعتمد
              </span>
            </div>
          </div>

          {/* زر تبديل المستودع */}
          <Link
            href="/"
            className="h-9 sm:h-10 shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-3.5 rounded-xl bg-[#faf6fc] hover:bg-[#edd0f7]/45 active:scale-95 text-[11px] sm:text-xs font-bold text-[#482b52] transition-all border border-[#c7aad1]/70"
          >
            <Store className="w-3.5 h-3.5 text-[#a184ab] shrink-0" />
            <span className="hidden sm:inline">تبديل المستودع</span>
            <span className="sm:hidden">المستودعات</span>
          </Link>
        </div>

        {/* شريط البحث الموحد */}
        <div className="relative flex items-center bg-[#f9fafb] rounded-xl border border-[#e5e7eb] focus-within:bg-white focus-within:border-[#c7aad1] focus-within:ring-2 focus-within:ring-[#c7aad1]/30 transition-all">
          <Search className="w-4 h-4 text-[#a184ab] mr-3 sm:mr-3.5 shrink-0 pointer-events-none" />
          <input
            id="search"
            type="text"
            placeholder="ابحث باسم الصنف، العلامة التجارية، الكود، أو الباركود..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent text-[#111827] placeholder-gray-400 text-xs sm:text-sm py-2 sm:py-2.5 pr-2 pl-3 focus:outline-hidden font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="ml-2 p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-[#4b5563] transition-colors cursor-pointer"
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
