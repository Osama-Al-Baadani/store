'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Category, Product } from '@/types';
import { catalogApi } from '../api/catalog.api';
import {
  CatalogAdvancedFilters,
  CatalogBrandFacet,
  CatalogFilter,
  CatalogResponse,
  DEFAULT_CATALOG_FILTERS,
} from '../types/catalog.types';

const PAGE_SIZE = 24;

export function useCatalog(branchId: number | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<CatalogBrandFacet[]>([]);
  const [offersCount, setOffersCount] = useState<number>(0);
  const [totalBranchCount, setTotalBranchCount] = useState<number>(0);

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<CatalogResponse['pagination']>({
    current_page: 1,
    last_page: 1,
    per_page: PAGE_SIZE,
    total: 0,
  });

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [advancedFilters, setAdvancedFilters] = useState<CatalogAdvancedFilters>(
    DEFAULT_CATALOG_FILTERS
  );
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef<number>(0);

  useEffect(() => {
    if (!branchId) return;
    let cancelled = false;
    catalogApi
      .getCategories(branchId)
      .then((res) => {
        if (!cancelled && res.success) {
          setCategories(res.data);
        }
      })
      .catch(() => {
        // ignore
      });
    return () => {
      cancelled = true;
    };
  }, [branchId]);

  useEffect(() => {
    if (!branchId) return;
    let cancelled = false;
    catalogApi
      .getBrands(branchId, selectedCategory)
      .then((res) => {
        if (!cancelled && res.success) {
          setBrands(res.data.brands);
          setOffersCount(res.data.offers_count);
          setTotalBranchCount(res.data.total_count);
        }
      })
      .catch(() => {
        // ignore
      });
    return () => {
      cancelled = true;
    };
  }, [branchId, selectedCategory]);

  const buildFilterParams = useCallback(
    (page: number): CatalogFilter | null => {
      if (!branchId) return null;
      const filters: CatalogFilter = {
        branch_id: branchId,
        category_id: selectedCategory ?? undefined,
        brand: advancedFilters.brand ?? undefined,
        search: searchQuery.trim() || undefined,
        sort: advancedFilters.sort !== 'default' ? advancedFilters.sort : undefined,
        per_page: PAGE_SIZE,
        page,
      };

      if (advancedFilters.quickFilter === 'new') {
        filters.is_new = 1;
        filters.is_coming_soon = 0;
      } else if (advancedFilters.quickFilter === 'discounted') {
        filters.on_sale = 1;
      } else if (advancedFilters.quickFilter === 'featured') {
        filters.is_featured = 1;
      } else if (advancedFilters.quickFilter === 'available') {
        filters.is_coming_soon = 0;
      }

      const min = advancedFilters.minPrice !== '' ? parseFloat(advancedFilters.minPrice) : NaN;
      const max = advancedFilters.maxPrice !== '' ? parseFloat(advancedFilters.maxPrice) : NaN;
      if (!Number.isNaN(min) && min >= 0) {
        filters.min_price = min;
      }
      if (!Number.isNaN(max) && max >= 0) {
        filters.max_price = max;
      }

      return filters;
    },
    [branchId, selectedCategory, searchQuery, advancedFilters]
  );

  useEffect(() => {
    const filters = buildFilterParams(1);
    if (!filters) return;

    const reqId = ++requestIdRef.current;
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled && reqId === requestIdRef.current) {
        setIsLoading(true);
        setError(null);
      }
    });

    catalogApi
      .getProducts(filters)
      .then((res) => {
        if (!cancelled && reqId === requestIdRef.current && res.success) {
          setProducts(res.data.items);
          setPagination(res.data.pagination);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled && reqId === requestIdRef.current) {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'تعذر تحميل الأصناف';
          setError(message);
        }
      })
      .finally(() => {
        if (!cancelled && reqId === requestIdRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [buildFilterParams, refreshTick]);

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore) return;
    if (pagination.current_page >= pagination.last_page) return;
    const filters = buildFilterParams(pagination.current_page + 1);
    if (!filters) return;

    const reqId = ++requestIdRef.current;
    setIsLoadingMore(true);
    setError(null);

    catalogApi
      .getProducts(filters)
      .then((res) => {
        if (reqId === requestIdRef.current && res.success) {
          setProducts((prev) => [...prev, ...res.data.items]);
          setPagination(res.data.pagination);
        }
      })
      .catch((err: unknown) => {
        if (reqId === requestIdRef.current) {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'تعذر تحميل المزيد من الأصناف';
          setError(message);
        }
      })
      .finally(() => {
        if (reqId === requestIdRef.current) {
          setIsLoadingMore(false);
        }
      });
  }, [isLoading, isLoadingMore, pagination.current_page, pagination.last_page, buildFilterParams]);

  const setSelectedBrand = useCallback((brand: string | null) => {
    setAdvancedFilters((prev) => ({ ...prev, brand }));
  }, []);

  const toggleOffersOnly = useCallback(() => {
    setAdvancedFilters((prev) => ({
      ...prev,
      quickFilter: prev.quickFilter === 'discounted' ? 'all' : 'discounted',
    }));
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.sort !== 'default') count += 1;
    if (advancedFilters.quickFilter !== 'all') count += 1;
    if (advancedFilters.brand) count += 1;
    if (advancedFilters.minPrice !== '' || advancedFilters.maxPrice !== '') count += 1;
    return count;
  }, [advancedFilters]);

  const resetAdvancedFilters = useCallback(() => {
    setAdvancedFilters(DEFAULT_CATALOG_FILTERS);
  }, []);

  const resetAllFilters = useCallback(() => {
    setSelectedCategory(null);
    setSearchQuery('');
    setAdvancedFilters(DEFAULT_CATALOG_FILTERS);
  }, []);

  const refresh = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  return {
    categories,
    brands,
    offersCount,
    totalBranchCount,
    products,
    pagination,
    hasMore: pagination.current_page < pagination.last_page,
    loadMore,
    selectedCategory,
    setSelectedCategory,
    selectedBrand: advancedFilters.brand,
    setSelectedBrand,
    toggleOffersOnly,
    searchQuery,
    setSearchQuery,
    advancedFilters,
    setAdvancedFilters,
    activeFiltersCount,
    hasActiveFilters: activeFiltersCount > 0,
    resetAdvancedFilters,
    resetAllFilters,
    isLoading,
    isLoadingMore,
    error,
    refresh,
  };
}
