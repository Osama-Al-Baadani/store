'use client';

import React, { useState } from 'react';
import { Category } from '@/types';
import { ChevronDown, Layers, LayoutGrid } from 'lucide-react';

interface CategoryBarProps {
  categories: Category[];
  selectedCategory: number | null;
  onSelect: (id: number | null) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategory,
  onSelect,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // إيجاد القسم الرئيسي النشط (سواءً تم اختيار القسم نفسه أو أحد أقسامه الفرعية)
  const activeParent = categories.find(
    (cat) =>
      cat.id === selectedCategory ||
      cat.children?.some((sub) => sub.id === selectedCategory)
  );

  const hasSubcategories = Boolean(activeParent?.children && activeParent.children.length > 0);
  const categoriesWithChildren = categories.filter((c) => c.children && c.children.length > 0);

  return (
    <div className="w-full bg-white/95 backdrop-blur-md border-b border-amber-200/80 sticky top-0 z-20 shadow-2xs">
      {/* شريط الأقسام الرئيسية */}
      <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-3 px-4 no-scrollbar scroll-smooth">
        {/* زر الكل */}
        <button
          type="button"
          onClick={() => {
            onSelect(null);
            setIsMenuOpen(false);
          }}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedCategory === null
              ? 'bg-gradient-to-r from-[#996515] via-[#c28b38] to-[#dfb76c] text-white shadow-md shadow-amber-950/20 scale-105 border border-amber-300/40'
              : 'bg-white hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300/80 text-stone-700 border border-stone-200 shadow-2xs'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>كل الأصناف</span>
        </button>

        {/* زر قائمة الأقسام والفروع العمودية */}
        {categoriesWithChildren.length > 0 && (
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              isMenuOpen
                ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                : 'bg-[#fdfbf7] hover:bg-amber-50 text-[#8f5a13] border-[#ebd2b0]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>الأقسام الفرعية</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        )}

        {/* تصنيفات المستودع الرئيسية */}
        {categories.map((cat) => {
          const isParentSelected = cat.id === selectedCategory;
          const isChildSelected = Boolean(cat.children?.some((sub) => sub.id === selectedCategory));
          const isActive = isParentSelected || isChildSelected;
          const subCount = cat.children?.length ?? 0;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                onSelect(cat.id);
                setIsMenuOpen(false);
              }}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#996515] via-[#c28b38] to-[#dfb76c] text-white shadow-md shadow-amber-950/20 scale-105 border border-amber-300/40'
                  : 'bg-white hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300/80 text-stone-700 border border-stone-200 shadow-2xs'
              }`}
            >
              <span>{cat.name}</span>
              {subCount > 0 && (
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive ? 'text-amber-100 rotate-180' : 'text-stone-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* قائمة الأقسام الرئيسية وتحتها الأقسام الفرعية بشكل مرتب عند فتح القائمة */}
      {isMenuOpen && categoriesWithChildren.length > 0 && (
        <div className="border-t border-amber-100 bg-[#fdfbf7] px-4 py-4 shadow-md">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {categoriesWithChildren.map((parentCat) => (
              <div
                key={parentCat.id}
                className="bg-white rounded-2xl border border-[#eddcc8] p-4 shadow-2xs space-y-2"
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelect(parentCat.id);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-right text-sm font-black pb-2 border-b border-stone-100 transition-colors cursor-pointer flex items-center justify-between ${
                    selectedCategory === parentCat.id ? 'text-[#8f5a13]' : 'text-slate-900 hover:text-[#b47820]'
                  }`}
                >
                  <span>{parentCat.name}</span>
                  <span className="text-[10px] font-bold bg-[#fbf3e6] text-[#8f5a13] px-2 py-0.5 rounded-full">
                    الكل
                  </span>
                </button>

                <ul className="space-y-1">
                  {parentCat.children?.map((sub) => {
                    const isSubActive = selectedCategory === sub.id;
                    return (
                      <li key={sub.id}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(sub.id);
                            setIsMenuOpen(false);
                          }}
                          className={`w-full text-right text-xs py-1.5 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                            isSubActive
                              ? 'bg-[#fbf3e6] text-[#8f5a13] font-bold'
                              : 'text-slate-600 hover:text-slate-950 hover:bg-stone-50 font-medium'
                          }`}
                        >
                          <span>{sub.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* شريط الأقسام الفرعية التلقائي عند اختيار قسم رئيسي يحتوي على فروع */}
      {hasSubcategories && activeParent && !isMenuOpen && (
        <div className="border-t border-amber-100/90 bg-[#fdfbf7]/95 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="shrink-0 text-xs font-black text-slate-900 pl-2 border-l border-amber-200">
              {activeParent.name}:
            </span>

            <button
              type="button"
              onClick={() => onSelect(activeParent.id)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                selectedCategory === activeParent.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
              }`}
            >
              كل {activeParent.name}
            </button>

            {activeParent.children?.map((sub) => {
              const isSubActive = selectedCategory === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onSelect(sub.id)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    isSubActive
                      ? 'bg-[#b47820] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-[#8f5a13] hover:border-[#ebd2b0] border border-stone-200'
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
