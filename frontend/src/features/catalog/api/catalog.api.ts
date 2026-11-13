import { apiClient } from '@/shared/lib/axios';
import { ApiResponse, Category, Product } from '@/types';
import { CatalogFilter, CatalogResponse } from '../types/catalog.types';

export const catalogApi = {
  getCategories: async (branchId: number): Promise<ApiResponse<Category[]>> => {
    const { data } = await apiClient.get<ApiResponse<Category[]>>('/categories', {
      params: { branch_id: branchId },
    });
    return data;
  },

  getProducts: async (filters: CatalogFilter): Promise<ApiResponse<CatalogResponse>> => {
    const { data } = await apiClient.get<ApiResponse<CatalogResponse>>('/products', {
      params: filters,
    });
    return data;
  },

  getProductById: async (id: number): Promise<ApiResponse<Product>> => {
    const { data } = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return data;
  },
};

