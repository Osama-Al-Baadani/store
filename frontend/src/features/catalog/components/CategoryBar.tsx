'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Category } from '@/types';
import { ChevronDown, LayoutGrid } from 'lucide-react';

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
  const [openCategoryId, setOpenCategoryId] = useState<number | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastPointerTypeRef = useRef<string>('mouse');

  useEffect(() => {
    const handleOutsidePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenCategoryId(null);
      }
    };

    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerDown);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleOpen = (catId: number) => {
    clearCloseTimeout();
    setOpenCategoryId(catId);
  };

  const handleScheduleClose = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setOpenCategoryId(null);
    }, 120);
  };

  const handleCloseImmediate = () => {
    clearCloseTimeout();
    setOpenCategoryId(null);
  };

  const openParent = categories.find(
    (cat) => cat.id === openCategoryId && Boolean(cat.children && cat.children.length > 0)
  );

  return (
    <div
      ref={containerRef}
      className="w-full bg-white/95 backdrop-blur-md border-b border-amber-200/80 sticky top-0 z-20 shadow-2xs"
    >
      {/* شريط الأقسام الرئيسية */}
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2.5 sm:py-3 px-3 sm:px-4 no-scrollbar scroll-smooth">
        {/* زر الكل */}
        <button
          type="button"
          onPointerEnter={(e) => {
            if (e.pointerType === 'mouse') handleCloseImmediate();
          }}
          onClick={() => {
            onSelect(null);
            handleCloseImmediate();
          }}
          className={`shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedCategory === null
              ? 'bg-gradient-to-r from-[#996515] via-[#c28b38] to-[#dfb76c] text-white shadow-sm shadow-amber-950/20 border border-amber-300/40'
              : 'bg-white hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300/80 text-stone-700 border border-stone-200 shadow-2xs'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>كل الأصناف</span>
        </button>

        {/* تصنيفات المستودع الرئيسية */}
        {categories.map((cat) => {
          const isParentSelected = cat.id === selectedCategory;
          const activeChild = cat.children?.find((sub) => sub.id === selectedCategory);
          const isActive = isParentSelected || Boolean(activeChild);
          const subCount = cat.children?.length ?? 0;
          const isOpen = openParent?.id === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onPointerDown={(e) => {
                lastPointerTypeRef.current = e.pointerType || 'mouse';
              }}
              onPointerEnter={(e) => {
                if (e.pointerType !== 'mouse') return;
                if (subCount > 0) {
                  handleOpen(cat.id);
                } else {
                  handleCloseImmediate();
                }
              }}
              onPointerLeave={(e) => {
                if (e.pointerType !== 'mouse') return;
                if (subCount > 0) {
                  handleScheduleClose();
                }
              }}
              onClick={() => {
                const isTouch = lastPointerTypeRef.current !== 'mouse';
                if (isTouch && subCount > 0) {
                  onSelect(cat.id);
                  if (openCategoryId === cat.id) {
                    handleCloseImmediate();
                  } else {
                    handleOpen(cat.id);
                  }
                  return;
                }

                onSelect(cat.id);
                handleCloseImmediate();
              }}
              className={`shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#996515] via-[#c28b38] to-[#dfb76c] text-white shadow-sm shadow-amber-950/20 border border-amber-300/40'
                  : 'bg-white hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300/80 text-stone-700 border border-stone-200 shadow-2xs'
              }`}
            >
              <span>{activeChild ? `${cat.name} (${activeChild.name})` : cat.name}</span>
              {subCount > 0 && (
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    isOpen
                      ? isActive
                        ? 'text-amber-100 rotate-180'
                        : 'text-amber-700 rotate-180'
                      : isActive
                        ? 'text-amber-100'
                        : 'text-stone-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* قائمة الأقسام الفرعية: تفتح بالهفر على الكمبيوتر وبالضغط على الجوال وتُغلق تلقائياً عند الابتعاد أو الضغط خارجها */}
      {openParent && openParent.children && openParent.children.length > 0 && (
        <div
          onPointerEnter={(e) => {
            if (e.pointerType === 'mouse') handleOpen(openParent.id);
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') handleScheduleClose();
          }}
          className="absolute top-full inset-x-0 z-30 border-t border-amber-100/90 border-b border-amber-200/80 bg-[#fdfbf7]/98 backdrop-blur-md px-4 py-2.5 shadow-lg animate-in fade-in duration-150"
        >
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="shrink-0 text-xs font-black text-slate-900 pl-2 border-l border-amber-200">
              {openParent.name}:
            </span>

            <button
              type="button"
              onClick={() => {
                onSelect(openParent.id);
                handleCloseImmediate();
              }}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                selectedCategory === openParent.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
              }`}
            >
              كل {openParent.name}
            </button>

            {openParent.children.map((sub) => {
              const isSubActive = selectedCategory === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    onSelect(sub.id);
                    handleCloseImmediate();
                  }}
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
