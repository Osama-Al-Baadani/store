'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Cart, CartItem, CartSummary } from '@/types';
import { cartApi } from '../api/cart.api';
import { UpdateCartPayload } from '../types/cart.types';

const SYNC_DELAY_MS = 350;

/** بيانات الصنف اللازمة لإضافته للسلة محلياً قبل وصول رد الخادم */
export type CartItemMeta = Pick<
  CartItem,
  | 'product_id'
  | 'product_name'
  | 'product_code'
  | 'barcode'
  | 'image_url'
  | 'package_name'
  | 'unit'
  | 'unit_price'
>;

const round2 = (n: number) => Math.round(n * 100) / 100;

function buildSummary(items: CartItem[], vatRate: number): CartSummary {
  const subtotal = round2(items.reduce((sum, i) => sum + i.line_total, 0));
  const vatAmount = round2((subtotal * vatRate) / 100);
  return {
    items_count: items.length,
    total_quantity: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal,
    vat_rate: vatRate,
    vat_amount: vatAmount,
    total: round2(subtotal + vatAmount),
  };
}

export function useCart(branchId: number | null) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // آخر كمية مطلوبة لكل صنف + مؤقتات المزامنة مع الخادم
  const latestQty = useRef<Record<number, number>>({});
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const inflight = useRef<number>(0);

  const fetchCart = useCallback(async () => {
    if (!branchId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await cartApi.getCart(branchId);
      if (res.success) {
        setCart(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'تعذر تحميل السلة');
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // تنظيف المؤقتات عند الخروج
  useEffect(() => {
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  /** تحديث فوري محلياً (متفائل) ثم مزامنة مؤجلة مع الخادم */
  const updateItemQuantity = useCallback(
    async (packageId: number, quantity: number, meta?: CartItemMeta) => {
      if (!branchId) return;
      const qty = Math.max(0, Math.floor(quantity));

      // 1) تحديث الواجهة فوراً
      setCart((prev) => {
        const base: Cart = prev ?? {
          id: 0,
          branch_id: branchId,
          items: [],
          summary: buildSummary([], 15),
        };
        const vatRate = base.summary?.vat_rate ?? 15;
        let items = base.items;
        const existing = items.find((i) => i.package_id === packageId);

        if (qty === 0) {
          items = items.filter((i) => i.package_id !== packageId);
        } else if (existing) {
          items = items.map((i) =>
            i.package_id === packageId
              ? { ...i, quantity: qty, line_total: round2(i.unit_price * qty) }
              : i
          );
        } else if (meta) {
          items = [
            ...items,
            {
              id: -packageId,
              package_id: packageId,
              pack_quantity: 1,
              step_quantity: 1,
              quantity: qty,
              line_total: round2(meta.unit_price * qty),
              ...meta,
            },
          ];
        } else {
          return base;
        }
        return { ...base, items, summary: buildSummary(items, vatRate) };
      });

      // 2) مزامنة مؤجلة: نرسل آخر كمية فقط بعد توقف الضغط
      latestQty.current[packageId] = qty;
      if (timers.current[packageId]) clearTimeout(timers.current[packageId]);

      timers.current[packageId] = setTimeout(async () => {
        const sendQty = latestQty.current[packageId];
        delete timers.current[packageId];
        inflight.current += 1;
        setIsUpdating(true);
        try {
          const payload: UpdateCartPayload = {
            branch_id: branchId,
            package_id: packageId,
            quantity: sendQty,
          };
          const res = await cartApi.updateItem(payload);
          const hasNewerChange =
            latestQty.current[packageId] !== sendQty ||
            Object.keys(timers.current).length > 0 ||
            inflight.current > 1;
          // لا نستبدل السلة برد الخادم إن كانت هناك تعديلات أحدث قيد الإرسال
          if (res.success && !hasNewerChange) {
            setCart(res.data);
          }
        } catch (err: any) {
          setError(err.response?.data?.message || 'تعذر تحديث الصنف بالسلة');
          // رجوع للحالة الصحيحة من الخادم
          await fetchCart();
        } finally {
          inflight.current -= 1;
          if (inflight.current === 0) setIsUpdating(false);
        }
      }, SYNC_DELAY_MS);
    },
    [branchId, fetchCart]
  );

  const clearCart = async () => {
    if (!branchId) return;
    Object.values(timers.current).forEach(clearTimeout);
    timers.current = {};
    latestQty.current = {};
    setCart((prev) =>
      prev ? { ...prev, items: [], summary: buildSummary([], prev.summary?.vat_rate ?? 15) } : null
    );
    try {
      await cartApi.clearCart(branchId);
    } catch (err: any) {
      await fetchCart();
      throw new Error(err.response?.data?.message || 'تعذر تفريغ السلة');
    }
  };

  return {
    cart,
    itemsCount: cart?.summary?.items_count ?? 0,
    totalQuantity: cart?.summary?.total_quantity ?? 0,
    subtotal: cart?.summary?.subtotal ?? 0,
    vatAmount: cart?.summary?.vat_amount ?? 0,
    total: cart?.summary?.total ?? 0,
    isLoading,
    isUpdating,
    error,
    updateItemQuantity,
    clearCart,
    refreshCart: fetchCart,
  };
}
