'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Category } from '@/types';
import {
  ChevronDown,
  ChevronLeft,
  LayoutGrid,
  Tag,
  Layers,
  X,
} from 'lucide-react';

interface CategoryBarProps {
  categories: Category[];
  selectedCategory: number | null;
  onSelect: (id: number | null) => void;
  offersCount?: number;
  isOffersActive?: boolean;
  onToggleOffers?: () => void;
}

function findCategoryPath(nodes: Category[], targetId: number): Category[] {
  for (const node of nodes) {
    if (node.id === targetId) {
      return [node];
    }
    if (node.children && node.children.length > 0) {
      const subPath = findCategoryPath(node.children, targetId);
      if (subPath.length > 0) {
        return [node, ...subPath];
      }
    }
  }
  return [];
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategory,
  onSelect,
  offersCount = 0,
  isOffersActive = false,
  onToggleOffers,
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
    }, 150);
  };

  const handleCloseImmediate = () => {
    clearCloseTimeout();
    setOpenCategoryId(null);
  };

  const openParent = categories.find(
    (cat) => cat.id === openCategoryId && Boolean(cat.children && cat.children.length > 0)
  );

  const selectedPath = useMemo(
    () => (selectedCategory !== null ? findCategoryPath(categories, selectedCategory) : []),
    [categories, selectedCategory]
  );

  const activeRootId = selectedPath[0]?.id ?? null;
  const activeNode = selectedPath[selectedPath.length - 1] ?? null;
  const parentNode = selectedPath.length >= 2 ? selectedPath[selectedPath.length - 2] : null;

  // إظهار الأبناء المباشرين إن وُجدوا، وإلا الأشقاء في نفس المستوى لسهولة التنقل السريع
  const quickSubItems = useMemo(() => {
    if (!activeNode) return [];
    if (activeNode.children && activeNode.children.length > 0) {
      return activeNode.children;
    }
    if (parentNode && parentNode.children && parentNode.children.length > 1) {
      return parentNode.children;
    }
    return [];
  }, [activeNode, parentNode]);

  const hasGrandChildren = Boolean(
    openParent?.children?.some((sub) => sub.children && sub.children.length > 0)
  );

  return (
    <div
      ref={containerRef}
      className="w-full bg-white/95 backdrop-blur-md border-b border-[#eeeeee] sticky top-0 z-20 shadow-[0_2px_10px_-6px_rgba(72,43,82,0.08)]"
    >
      {/* الصف الرئيسي للتصنيفات والعروض */}
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2.5 sm:py-3 px-3 sm:px-4 no-scrollbar scroll-smooth">
        {/* زر كل الأصناف */}
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
            selectedCategory === null && !isOffersActive
              ? 'bg-[#482b52] text-white shadow-xs border border-[#482b52]'
              : 'bg-white hover:bg-[#faf6fc] hover:text-[#482b52] hover:border-[#c7aad1] text-[#111827] border border-[#e5e7eb] shadow-2xs'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>كل الأصناف</span>
        </button>

        {/* زر العروض والتخفيضات السريع */}
        {onToggleOffers && offersCount > 0 && (
          <button
            type="button"
            onPointerEnter={(e) => {
              if (e.pointerType === 'mouse') handleCloseImmediate();
            }}
            onClick={() => {
              onToggleOffers();
              handleCloseImmediate();
            }}
            className={`shrink-0 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              isOffersActive
                ? 'bg-gradient-to-r from-rose-600 to-[#8c649c] text-white shadow-sm border border-rose-300/40'
                : 'bg-rose-50/90 hover:bg-rose-100 text-rose-700 border border-rose-200/90 shadow-2xs'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>العروض</span>
          </button>
        )}

        {/* التصنيفات الرئيسية */}
        {categories.map((cat) => {
          const isActive = activeRootId === cat.id;
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
                  if (openCategoryId === cat.id) {
                    onSelect(cat.id);
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
                  ? 'bg-[#482b52] text-white shadow-xs border border-[#482b52]'
                  : 'bg-white hover:bg-[#faf6fc] hover:text-[#482b52] hover:border-[#c7aad1] text-[#111827] border border-[#e5e7eb] shadow-2xs'
              }`}
            >
              <span>{cat.name}</span>
              {subCount > 0 && (
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    isOpen
                      ? isActive
                        ? 'text-[#edd0f7] rotate-180'
                        : 'text-[#482b52] rotate-180'
                      : isActive
                        ? 'text-[#edd0f7]'
                        : 'text-gray-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* شريط المسار الهرمي والأقسام الفرعية النشطة */}
      {selectedPath.length > 0 && (
        <div className="border-t border-[#eeeeee] bg-[#faf6fc]/80 px-3 sm:px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-col gap-2">
            {/* مسار التنقل Breadcrumb */}
            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => onSelect(null)}
                className="font-bold text-[#4b5563] hover:text-[#482b52] transition-colors cursor-pointer"
              >
                كل الأصناف
              </button>

              {selectedPath.map((node, index) => {
                const isLast = index === selectedPath.length - 1;
                return (
                  <React.Fragment key={node.id}>
                    <ChevronLeft className="w-3 h-3 text-gray-400 shrink-0" />
                    <button
                      type="button"
                      onClick={() => onSelect(node.id)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                        isLast
                          ? 'bg-[#edd0f7]/55 text-[#482b52] font-black border border-[#c7aad1]'
                          : 'font-bold text-[#4b5563] hover:text-[#482b52] hover:bg-white'
                      }`}
                    >
                      <span>{node.name}</span>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            {/* أزرار الأقسام الفرعية أو الشقيقة للتنقل بلمسة واحدة */}
            {quickSubItems.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-[#4b5563] ml-1">
                  <Layers className="w-3 h-3 text-[#a184ab]" />
                  <span>
                    {activeNode?.children && activeNode.children.length > 0
                      ? 'الأقسام الفرعية:'
                      : 'تصفح أيضاً:'}
                  </span>
                </span>
                {quickSubItems.map((item) => {
                  const isCurrent = item.id === selectedCategory;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelect(item.id)}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#482b52] text-white border-[#482b52] shadow-2xs'
                          : 'bg-white hover:bg-[#faf6fc] text-[#111827] hover:text-[#482b52] border-[#e5e7eb] hover:border-[#c7aad1]'
                      }`}
                    >
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* القائمة المنسدلة متعددة المستويات (Mega Menu) */}
      {openParent && openParent.children && openParent.children.length > 0 && (
        <div
          onPointerEnter={(e) => {
            if (e.pointerType === 'mouse') handleOpen(openParent.id);
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') handleScheduleClose();
          }}
          className="absolute top-full inset-x-0 z-30 border-t border-[#eeeeee] border-b border-[#c7aad1] bg-white px-3 sm:px-4 py-4 shadow-2xl animate-in fade-in duration-150 max-h-[70vh] overflow-y-auto"
        >
          <div className="max-w-7xl mx-auto space-y-3">
            {/* ترويسة القائمة المنسدلة */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#eeeeee]">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-[#111827]">
                  أقسام {openParent.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(openParent.id);
                    handleCloseImmediate();
                  }}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    selectedCategory === openParent.id
                      ? 'bg-[#482b52] text-white shadow-2xs'
                      : 'bg-[#faf6fc] hover:bg-[#edd0f7]/50 text-[#482b52] border border-[#c7aad1]'
                  }`}
                >
                  عرض كل {openParent.name}
                </button>
              </div>

              <button
                type="button"
                onClick={handleCloseImmediate}
                className="w-7 h-7 rounded-full bg-white hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-[#4b5563] cursor-pointer"
                aria-label="إغلاق قائمة التصنيفات"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* عرض المستوى الثاني والمستوى الثالث */}
            {hasGrandChildren ? (
              <div
                className={`grid grid-cols-1 gap-3 ${
                  openParent.children.length === 1
                    ? ''
                    : openParent.children.length === 2
                      ? 'sm:grid-cols-2'
                      : 'sm:grid-cols-2 lg:grid-cols-3'
                }`}
              >
                {openParent.children.map((sub) => {
                  const isSubActive = selectedCategory === sub.id;
                  const grandChildren = sub.children ?? [];
                  return (
                    <div
                      key={sub.id}
                      className="bg-[#f9fafb] rounded-xl border border-[#eeeeee] p-3 space-y-2 shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(sub.id);
                          handleCloseImmediate();
                        }}
                        className={`w-full flex items-center justify-between gap-2 text-right px-2.5 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                          isSubActive
                            ? 'bg-[#482b52] text-white'
                            : 'bg-[#faf6fc] hover:bg-[#edd0f7]/60 text-[#482b52]'
                        }`}
                      >
                        <span>{sub.name}</span>
                      </button>

                      {grandChildren.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {grandChildren.map((leaf) => {
                            const isLeafActive = selectedCategory === leaf.id;
                            return (
                              <button
                                key={leaf.id}
                                type="button"
                                onClick={() => {
                                  onSelect(leaf.id);
                                  handleCloseImmediate();
                                }}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                                  isLeafActive
                                    ? 'bg-[#482b52] text-white border-[#482b52] shadow-2xs'
                                    : 'bg-white hover:bg-[#faf6fc] text-[#111827] hover:text-[#482b52] border-[#e5e7eb] hover:border-[#c7aad1]'
                                }`}
                              >
                                <span>{leaf.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
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
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        isSubActive
                          ? 'bg-[#482b52] text-white border-[#482b52] shadow-xs'
                          : 'bg-white text-[#111827] hover:text-[#482b52] hover:border-[#c7aad1] border-[#e5e7eb]'
                      }`}
                    >
                      <span>{sub.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
