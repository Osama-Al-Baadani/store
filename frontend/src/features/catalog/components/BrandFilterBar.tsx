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
      className="bg-white rounded-xl sm:rounded-2xl border border-[#eeeeee] p-3 sm:p-4 shadow-2xs space-y-2.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#faf6fc] border border-[#c7aad1] text-[#482b52] flex items-center justify-center shrink-0">
            <Award className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#111827] leading-tight">
              العلامات التجارية
            </h3>
            <p className="text-[10px] sm:text-[11px] text-[#4b5563] font-medium">
              اختر علامة تجارية لعرض منتجاتها فقط
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {expanded && brands.length > 8 && (
            <div className="relative flex items-center bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-2.5 py-1">
              <Search className="w-3 h-3 text-[#a184ab] ml-1.5 shrink-0" />
              <input
                type="text"
                placeholder="بحث في العلامات..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="w-28 sm:w-40 bg-transparent text-[11px] font-semibold text-[#111827] placeholder-gray-400 focus:outline-hidden"
              />
              {brandSearch && (
                <button
                  type="button"
                  onClick={() => setBrandSearch('')}
                  className="text-gray-400 hover:text-[#111827] cursor-pointer"
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
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#faf6fc] hover:bg-[#edd0f7]/45 text-[#482b52] border border-[#c7aad1] text-[11px] font-bold transition-colors cursor-pointer"
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
              ? 'bg-[#482b52] text-white border-[#482b52] shadow-2xs'
              : 'bg-[#f9fafb] hover:bg-[#faf6fc] text-[#111827] border-[#e5e7eb]'
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
                  ? 'bg-[#482b52] text-white border-[#482b52] shadow-xs'
                  : 'bg-white hover:bg-[#faf6fc] text-[#111827] hover:text-[#482b52] border-[#e5e7eb] hover:border-[#c7aad1]'
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

