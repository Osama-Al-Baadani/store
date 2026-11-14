'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Category, Product } from '@/types';
import { catalogApi } from '../api/catalog.api';
import {
  CatalogAdvancedFilters,
  CatalogFilter,
  DEFAULT_CATALOG_FILTERS,
} from '../types/catalog.types';

function getProductUnitPrice(product: Product): number {
  const pkg = product.packages?.[0];
  return pkg ? Number(pkg.unit_price) || 0 : 0;
}

function getProductDiscount(product: Product): number {
  return product.packages?.[0]?.discount_percent ?? 0;
}

export function useCatalog(branchId: number | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [advancedFilters, setAdvancedFilters] = useState<CatalogAdvancedFilters>(
    DEFAULT_CATALOG_FILTERS
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await catalogApi.getCategories(branchId);
      if (res.success) {
        setCategories(res.data);
      }
    } catch {
      // ignore
    }
  }, [branchId]);

  const fetchProducts = useCallback(async () => {
    if (!branchId) return;
    setIsLoading(true);
    setError(null);
    try {
      const filters: CatalogFilter = {
        branch_id: branchId,
        category_id: selectedCategory,
        search: searchQuery || undefined,
        per_page: 100,
      };

      if (advancedFilters.quickFilter === 'new') {
        filters.is_new = 1;
      } else if (advancedFilters.quickFilter === 'featured') {
        filters.is_featured = 1;
      } else if (advancedFilters.quickFilter === 'available') {
        filters.is_coming_soon = 0;
      }

      const res = await catalogApi.getProducts(filters);
      if (res.success) {
        setProducts(res.data.items);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'تعذر تحميل الأصناف');
    } finally {
      setIsLoading(false);
    }
  }, [branchId, selectedCategory, searchQuery, advancedFilters.quickFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    const min = advancedFilters.minPrice !== '' ? parseFloat(advancedFilters.minPrice) : null;
    const max = advancedFilters.maxPrice !== '' ? parseFloat(advancedFilters.maxPrice) : null;

    const result = products.filter((product) => {
      if (advancedFilters.quickFilter === 'new' && (!product.is_new || product.is_coming_soon)) {
        return false;
      }
      if (
        advancedFilters.quickFilter === 'discounted' &&
        (getProductDiscount(product) <= 0 || product.is_coming_soon)
      ) {
        return false;
      }
      if (advancedFilters.quickFilter === 'featured' && !product.is_featured) {
        return false;
      }
      if (advancedFilters.quickFilter === 'available' && product.is_coming_soon) {
        return false;
      }

      const price = getProductUnitPrice(product);
      if (min !== null && !Number.isNaN(min) && price < min) {
        return false;
      }
      if (max !== null && !Number.isNaN(max) && price > max) {
        return false;
      }

      return true;
    });

    if (advancedFilters.sort === 'price_asc') {
      return [...result].sort((a, b) => getProductUnitPrice(a) - getProductUnitPrice(b));
    }
    if (advancedFilters.sort === 'price_desc') {
      return [...result].sort((a, b) => getProductUnitPrice(b) - getProductUnitPrice(a));
    }
    if (advancedFilters.sort === 'discount_desc') {
      return [...result].sort((a, b) => getProductDiscount(b) - getProductDiscount(a));
    }
    if (advancedFilters.sort === 'newest') {
      return [...result].sort((a, b) => {
        if (a.is_new !== b.is_new) return a.is_new ? -1 : 1;
        return b.id - a.id;
      });
    }

    return result;
  }, [products, advancedFilters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.sort !== 'default') count += 1;
    if (advancedFilters.quickFilter !== 'all') count += 1;
    if (advancedFilters.minPrice !== '' || advancedFilters.maxPrice !== '') count += 1;
    return count;
  }, [advancedFilters]);

  const resetAdvancedFilters = useCallback(() => {
    setAdvancedFilters(DEFAULT_CATALOG_FILTERS);
  }, []);

  return {
    categories,
    products: filteredProducts,
    rawProductsCount: products.length,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    advancedFilters,
    setAdvancedFilters,
    activeFiltersCount,
    hasActiveFilters: activeFiltersCount > 0,
    resetAdvancedFilters,
    isLoading,
    error,
    refreshProducts: fetchProducts,
  };
}

