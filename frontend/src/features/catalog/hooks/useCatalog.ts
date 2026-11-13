'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category, Product } from '@/types';
import { catalogApi } from '../api/catalog.api';
import { CatalogFilter } from '../types/catalog.types';

export function useCatalog(branchId: number | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
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
      };
      const res = await catalogApi.getProducts(filters);
      if (res.success) {
        setProducts(res.data.items);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'تعذر تحميل الأصناف');
    } finally {
      setIsLoading(false);
    }
  }, [branchId, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    categories,
    products,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    isLoading,
    error,
    refreshProducts: fetchProducts,
  };
}

