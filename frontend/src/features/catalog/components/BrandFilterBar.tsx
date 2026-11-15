'use client';

import React, { useState, useMemo } from 'react';
import { Award, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { CatalogBrandFacet } from '../types/catalog.types';

interface BrandFilterBarProps {
  brands: CatalogBrandFacet[];
  selectedBrand: string | null;
  onSelectBrand: (brand: string | null) => void;
}

export const BrandFilterBar: React.FC<BrandFilterBarProps> = ({
  brands,
  selectedBrand,
  onSelectBrand,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');

  const filteredBrands = useMemo(() => {
    const q = brandSearch.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.brand.toLowerCase().includes(q));
  }, [brands, brandSearch]);

  if (brands.length === 0) return null;

  return (
    <section
      aria-label="تصفية حسب العلامة التجارية"
      className="bg-white/95 rounded-2xl sm:rounded-3xl border border-[#eddcc8] p-3 sm:p-4 shadow-2xs space-y-2.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#fbf3e6] border border-[#ebd2b0] text-[#b47820] flex items-center justify-center shrink-0">
            <Award className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-stone-900 leading-tight">
              العلامات التجارية
            </h3>
            <p className="text-[10px] sm:text-[11px] text-stone-500 font-medium">
              اختر علامة تجارية لعرض منتجاتها فقط
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {expanded && brands.length > 8 && (
            <div className="relative flex items-center bg-[#fdfbf7] border border-[#eddcc8] rounded-xl px-2.5 py-1">
              <Search className="w-3 h-3 text-[#b47820] ml-1.5 shrink-0" />
              <input
                type="text"
                placeholder="بحث في العلامات..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="w-28 sm:w-40 bg-transparent text-[11px] font-semibold text-stone-800 placeholder-stone-400 focus:outline-hidden"
              />
              {brandSearch && (
                <button
                  type="button"
                  onClick={() => setBrandSearch('')}
                  className="text-stone-400 hover:text-stone-700 cursor-pointer"
                  aria-label="مسح بحث العلامات"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {selectedBrand && (
            <button
              type="button"
              onClick={() => onSelectBrand(null)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>إلغاء ({selectedBrand})</span>
            </button>
          )}

          {brands.length > 10 && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#fbf3e6] hover:bg-[#f6e8cf] text-[#8f5a13] border border-[#ebd2b0] text-[11px] font-bold transition-colors cursor-pointer"
            >
              <span>{expanded ? 'طي القائمة' : 'عرض الكل'}</span>
              {expanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>

      <div
        className={
          expanded
            ? 'flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pt-0.5'
            : 'flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5'
        }
      >
        <button
          type="button"
          onClick={() => onSelectBrand(null)}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
            selectedBrand === null
              ? 'bg-gradient-to-r from-[#8f5a13] to-[#b47820] text-white border-[#8f5a13] shadow-2xs'
              : 'bg-[#fdfbf7] hover:bg-[#fbf3e6] text-stone-700 border-[#eddcc8]'
          }`}
        >
          جميع العلامات
        </button>

        {filteredBrands.map((item) => {
          const isSelected = selectedBrand === item.brand;
          return (
            <button
              key={item.brand}
              type="button"
              onClick={() => onSelectBrand(isSelected ? null : item.brand)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-[#8f5a13] via-[#b47820] to-[#c28b38] text-white border-[#8f5a13] shadow-xs'
                  : 'bg-white hover:bg-[#fbf3e6] text-stone-700 hover:text-[#8f5a13] border-stone-200 hover:border-[#ebd2b0]'
              }`}
            >
              <span>{item.brand}</span>
            </button>
          );
        })}

        {expanded && filteredBrands.length === 0 && (
          <p className="text-[11px] text-stone-400 py-1 px-2">
            لا توجد علامة مطابقة للبحث.
          </p>
        )}
      </div>
    </section>
  );
};

