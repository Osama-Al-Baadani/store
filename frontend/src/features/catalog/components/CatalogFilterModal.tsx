'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
  Tag,
  Check,
  RotateCcw,
  Star,
  PackageCheck,
  Award,
  Search,
} from 'lucide-react';
import {
  CatalogAdvancedFilters,
  CatalogBrandFacet,
  CatalogQuickFilter,
  CatalogSortOption,
  DEFAULT_CATALOG_FILTERS,
} from '../types/catalog.types';

interface CatalogFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CatalogAdvancedFilters;
  brands?: CatalogBrandFacet[];
  onApply: (filters: CatalogAdvancedFilters) => void;
  onReset: () => void;
}

const SORT_OPTIONS: { value: CatalogSortOption; label: string }[] = [
  { value: 'default', label: 'الترتيب الافتراضي' },
  { value: 'price_asc', label: 'السعر: من الأقل إلى الأعلى' },
  { value: 'price_desc', label: 'السعر: من الأعلى إلى الأقل' },
  { value: 'discount_desc', label: 'الأكثر توفيراً (أعلى خصم)' },
  { value: 'newest', label: 'الأحدث وصولاً أولاً' },
];

const QUICK_FILTER_OPTIONS: {
  value: CatalogQuickFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: 'all', label: 'جميع الأصناف', icon: SlidersHorizontal },
  { value: 'discounted', label: 'عروض وتخفيضات', icon: Tag },
  { value: 'new', label: 'الأصناف الجديدة', icon: Sparkles },
  { value: 'featured', label: 'الأصناف المميزة', icon: Star },
  { value: 'available', label: 'متوفر للتوريد الفوري', icon: PackageCheck },
];

const PRICE_PRESETS: { label: string; min: string; max: string }[] = [
  { label: 'أقل من 10 ر.س', min: '', max: '10' },
  { label: '10 — 50 ر.س', min: '10', max: '50' },
  { label: '50 — 150 ر.س', min: '50', max: '150' },
  { label: 'أكثر من 150 ر.س', min: '150', max: '' },
];

const CatalogFilterModalContent: React.FC<Omit<CatalogFilterModalProps, 'isOpen'>> = ({
  onClose,
  filters,
  brands = [],
  onApply,
  onReset,
}) => {
  const [draft, setDraft] = useState<CatalogAdvancedFilters>(filters);
  const [brandQuery, setBrandQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filteredBrands = useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.brand.toLowerCase().includes(q));
  }, [brands, brandQuery]);

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft(DEFAULT_CATALOG_FILTERS);
    onReset();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#eeeeee]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 rounded-full bg-gray-200 mx-auto mt-3 sm:hidden" />

        {/* رأس النافذة */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#faf6fc] border border-[#c7aad1] text-[#482b52] flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-base text-[#111827]">
                الفرز والتصفية المتقدمة
              </h2>
              <p className="text-[11px] text-[#4b5563] font-medium">
                رتّب وصفّي الأصناف حسب العلامة، العروض، أو السعر
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#4b5563] transition-colors cursor-pointer"
            aria-label="إغلاق نافذة الفرز"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* جسم النافذة */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#f9fafb]">
          {/* 1. خيارات الترتيب */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-[#111827] flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#a184ab]" />
              <span>ترتيب الأصناف</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SORT_OPTIONS.map((option) => {
                const isSelected = draft.sort === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({ ...prev, sort: option.value }))
                    }
                    className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-right ${
                      isSelected
                        ? 'bg-[#faf6fc] border-[#a184ab] text-[#482b52] shadow-2xs'
                        : 'bg-white border-gray-200 text-[#111827] hover:border-[#c7aad1]'
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#482b52] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. تصفية سريعة حسب النوع والعروض */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-[#111827] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#a184ab]" />
              <span>نوع وحالة الصنف</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {QUICK_FILTER_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = draft.quickFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        quickFilter: option.value,
                      }))
                    }
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#482b52] text-white border-[#482b52] shadow-xs'
                        : 'bg-white border-gray-200 text-[#111827] hover:border-[#c7aad1]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. العلامة التجارية */}
          {brands.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-black text-[#111827] flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#a184ab]" />
                  <span>العلامة التجارية</span>
                </h3>
                {brands.length > 6 && (
                  <div className="relative flex items-center bg-white border border-gray-200 rounded-xl px-2 py-1">
                    <Search className="w-3 h-3 text-gray-400 ml-1" />
                    <input
                      type="text"
                      placeholder="ابحث عن علامة..."
                      value={brandQuery}
                      onChange={(e) => setBrandQuery(e.target.value)}
                      className="w-28 bg-transparent text-[11px] font-semibold text-[#111827] focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                <button
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, brand: null }))}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                    draft.brand === null
                      ? 'bg-[#faf6fc] border-[#a184ab] text-[#482b52]'
                      : 'bg-white border-gray-200 text-[#4b5563] hover:border-[#c7aad1]'
                  }`}
                >
                  كل العلامات
                </button>
                {filteredBrands.map((b) => {
                  const isSelected = draft.brand === b.brand;
                  return (
                    <button
                      key={b.brand}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          brand: isSelected ? null : b.brand,
                        }))
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#482b52] text-white border-[#482b52]'
                          : 'bg-white border-gray-200 text-[#111827] hover:border-[#c7aad1]'
                      }`}
                    >
                      <span>{b.brand}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. نطاق سعر الحبة */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-[#111827] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#a184ab]" />
              <span>نطاق سعر الحبة (ر.س)</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#4b5563] mb-1">
                  من سعر
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  dir="ltr"
                  placeholder="0.00"
                  value={draft.minPrice}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, minPrice: e.target.value }))
                  }
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#111827] focus:outline-hidden focus:border-[#a184ab] text-right"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4b5563] mb-1">
                  إلى سعر
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  dir="ltr"
                  placeholder="مفتوح"
                  value={draft.maxPrice}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, maxPrice: e.target.value }))
                  }
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#111827] focus:outline-hidden focus:border-[#a184ab] text-right"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRICE_PRESETS.map((preset) => {
                const isActive =
                  draft.minPrice === preset.min && draft.maxPrice === preset.max;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        minPrice: isActive ? '' : preset.min,
                        maxPrice: isActive ? '' : preset.max,
                      }))
                    }
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#faf6fc] border-[#a184ab] text-[#482b52]'
                        : 'bg-white border-gray-200 text-[#4b5563] hover:border-[#c7aad1]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* تذييل أزرار التطبيق وإعادة الضبط */}
        <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-2.5 safe-pb">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-[#111827] text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-3 px-4 rounded-xl bg-[#482b52] hover:bg-[#5c3969] active:scale-[0.99] text-white text-xs sm:text-sm font-black shadow-md transition-all cursor-pointer"
          >
            تطبيق الفرز والتصفية
          </button>
        </div>
      </div>
    </div>
  );
};

export const CatalogFilterModal: React.FC<CatalogFilterModalProps> = ({
  isOpen,
  ...props
}) => {
  if (!isOpen) return null;
  return <CatalogFilterModalContent {...props} />;
};
