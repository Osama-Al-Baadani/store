import { apiClient } from '@/shared/lib/axios';
import { ApiResponse, Order } from '@/types';
import { CheckoutPayload, OrdersListResponse } from '../types/orders.types';

export const ordersApi = {
  getOrders: async (page = 1): Promise<ApiResponse<OrdersListResponse>> => {
    const { data } = await apiClient.get<ApiResponse<OrdersListResponse>>('/orders', {
      params: { page },
    });
    return data;
  },

  getOrderById: async (id: number): Promise<ApiResponse<Order>> => {
    const { data } = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
    return data;
  },

  checkout: async (payload: CheckoutPayload): Promise<ApiResponse<Order>> => {
    const { data } = await apiClient.post<ApiResponse<Order>>('/orders/checkout', payload);
    return data;
  },

  getInvoiceDownloadUrl: (orderId: number): string => {
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1'}/orders/${orderId}/invoice`;
  },
};

