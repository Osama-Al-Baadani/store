'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Layers, SlidersHorizontal, Search, ShoppingBag } from 'lucide-react';

interface BottomNavProps {
  activeTab?: 'home' | 'categories' | 'filter' | 'search' | 'cart';
  cartCount?: number;
  onCartClick?: () => void;
  onFilterClick?: () => void;
  onCategoriesClick?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab = 'home',
  cartCount = 0,
  onCartClick,
  onFilterClick,
  onCategoriesClick,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-[#eddcc8] shadow-[0_-4px_20px_-4px_rgba(180,120,32,0.1)] z-30 py-1.5 px-3 safe-pb">
      <div className="max-w-md mx-auto flex items-center justify-around text-slate-500">
        {/* الرئيسية */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
            activeTab === 'home'
              ? 'text-brand font-bold'
              : 'hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[11px]">الرئيسية</span>
        </Link>

        {/* الأقسام */}
        <button
          type="button"
          onClick={onCategoriesClick}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
            activeTab === 'categories'
              ? 'text-brand font-bold'
              : 'hover:text-slate-800'
          }`}
        >
          <Layers className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[11px]">الأقسام</span>
        </button>

        {/* الفرز */}
        <button
          type="button"
          onClick={onFilterClick}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
            activeTab === 'filter'
              ? 'text-brand font-bold'
              : 'hover:text-slate-800'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[11px]">الفرز</span>
        </button>

        {/* بحث */}
        <Link
          href="#search"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
            activeTab === 'search'
              ? 'text-brand font-bold'
              : 'hover:text-slate-800'
          }`}
        >
          <Search className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[11px]">بحث</span>
        </Link>

        {/* السلة */}
        <button
          type="button"
          onClick={onCartClick}
          className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
            activeTab === 'cart'
              ? 'text-brand font-bold'
              : 'hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
          <span className="text-[11px]">السلة</span>
        </button>
      </div>
    </nav>
  );
};

