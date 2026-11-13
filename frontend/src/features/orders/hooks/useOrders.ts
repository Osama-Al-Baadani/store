'use client';

import { useState, useCallback } from 'react';
import { Order } from '@/types';
import { ordersApi } from '../api/orders.api';
import { CheckoutPayload } from '../types/orders.types';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ordersApi.getOrders(page);
      if (res.success) {
        setOrders(res.data.items);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'تعذر تحميل قائمة الطلبات');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchOrderById = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ordersApi.getOrderById(id);
      if (res.success) {
        setCurrentOrder(res.data);
        return res.data;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'تعذر تحميل تفاصيل الطلب');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkout = async (payload: CheckoutPayload): Promise<Order> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await ordersApi.checkout(payload);
      if (res.success) {
        setCurrentOrder(res.data);
        return res.data;
      }
      throw new Error(res.message);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'فشل إتمام الطلب';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    orders,
    currentOrder,
    isLoading,
    isSubmitting,
    error,
    fetchOrders,
    fetchOrderById,
    checkout,
    getInvoiceUrl: ordersApi.getInvoiceDownloadUrl,
  };
}

