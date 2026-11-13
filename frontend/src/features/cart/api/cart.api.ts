import { apiClient } from '@/shared/lib/axios';
import { ApiResponse, Cart } from '@/types';
import { UpdateCartPayload } from '../types/cart.types';

export const cartApi = {
  getCart: async (branchId: number): Promise<ApiResponse<Cart>> => {
    const { data } = await apiClient.get<ApiResponse<Cart>>('/cart', {
      params: { branch_id: branchId },
    });
    return data;
  },

  updateItem: async (payload: UpdateCartPayload): Promise<ApiResponse<Cart>> => {
    const { data } = await apiClient.post<ApiResponse<Cart>>('/cart/items', payload);
    return data;
  },

  clearCart: async (branchId: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>('/cart', {
      params: { branch_id: branchId },
    });
    return data;
  },
};

