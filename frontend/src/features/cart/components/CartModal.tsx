'use client';

import React, { useState } from 'react';
import { X, Trash2, FileText, Share2, CheckCircle2, Loader2 } from 'lucide-react';
import { Cart } from '@/types';
import { QuantityInput } from '@/features/catalog/components/QuantityInput';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Cart | null;
  onUpdateQuantity: (packageId: number, qty: number) => Promise<void>;
  onClearCart: () => Promise<void>;
  onCheckout: () => Promise<any>;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onClearCart,
  onCheckout,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any>(null);

  if (!isOpen) return null;

  const items = cart?.items || [];
  const summary = cart?.summary || {
    items_count: 0,
    total_quantity: 0,
    subtotal: 0,
    vat_amount: 0,
    total: 0,
  };

  const handleCheckout = async () => {
    setIsSubmitting(true);
    try {
      const order = await onCheckout();
      setSuccessOrder(order);
      if (order?.whatsapp_share?.url) {
        window.open(order.whatsapp_share.url, '_blank');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء تجهيز الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
        {/* رأس السلة */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div>
              <h2 className="font-extrabold text-base text-slate-800">
                سلة الطلب
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {summary.items_count} صنف
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClearCart}
              disabled={items.length === 0}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg font-bold transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>تفريغ السلة</span>
            </button>
          </div>
        </div>

        {/* جسم السلة */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {successOrder ? (
            <div className="py-12 px-6 text-center flex flex-col items-center">
              <CheckCircle2 className="w-16 h-16 text-amber-600 mb-3" />
              <h3 className="text-lg font-bold text-slate-800">
                تم اعتماد الطلب بنجاح!
              </h3>
              <p className="text-sm text-slate-600 mt-1 mb-4">
                رقم الطلب: #{successOrder.order_number}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {successOrder.invoice_pdf_url && (
                  <a
                    href={successOrder.invoice_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    <FileText className="w-4 h-4" /> عرض وطباعة الفاتورة
                  </a>
                )}
                {successOrder.invoice_download_url && (
                  <a
                    href={successOrder.invoice_download_url}
                    download={`فاتورة-طلب-${successOrder.order_number}.pdf`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
                  >
                    <FileText className="w-4 h-4 text-brand" /> تنزيل PDF مباشرة
                  </a>
                )}
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <span className="text-4xl block mb-2">🛒</span>
              <p className="font-semibold text-sm">سلة التسوق فارغة</p>
              <p className="text-xs mt-1 text-slate-400">
                تصفح الكتالوج وأضف الكميات المطلوبة بالحبة
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-sm">
                        {item.product_name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.package_id, 0)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="حذف من السلة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-xs text-slate-500 mt-0.5">
                      <span className="font-semibold text-brand-dark">
                        {item.product_code}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1">
                      سعر الحبة: {item.unit_price.toFixed(2)} ر.س. غير شامل الضريبة
                    </div>

                    <div className="text-xs font-bold text-brand-dark mt-1">
                      إجمالي الصنف: {item.line_total.toFixed(2)} ر.س.
                    </div>
                  </div>

                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="w-16 h-16 object-contain rounded-xl bg-slate-50 p-1 border border-slate-100 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-brand-light flex items-center justify-center text-xl shrink-0">
                      📦
                    </div>
                  )}
                </div>

                {/* أزرار زيادة وإنقاص الكمية */}
                <div className="pt-1 border-t border-slate-50">
                  <QuantityInput
                    quantity={item.quantity}
                    step={1}
                    unit="حبة"
                    onChange={(newQty) =>
                      onUpdateQuantity(item.package_id, newQty)
                    }
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* شريط الإجمالي وزر الاعتماد */}
        {items.length > 0 && !successOrder && (
          <div className="p-4 bg-white border-t border-slate-100 shadow-md">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
              <span>المجموع قبل الضريبة:</span>
              <span className="font-semibold text-slate-700">
                {summary.subtotal.toFixed(2)} ر.س.
              </span>
            </div>
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
              <span>ضريبة القيمة المضافة (15%):</span>
              <span className="font-semibold text-slate-700">
                {summary.vat_amount.toFixed(2)} ر.س.
              </span>
            </div>
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <span className="text-xs text-slate-400 block font-normal">
                  الصافي شامل الضريبة
                </span>
                <span className="text-2xl font-black text-brand-dark">
                  {summary.total.toFixed(2)}
                </span>{' '}
                <span className="text-sm font-bold text-brand">ر.س.</span>
              </div>
              <span className="text-xs text-brand font-semibold bg-brand-light px-2.5 py-1 rounded-full border border-brand/20">
                {summary.total_quantity} قطعة
              </span>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-brand hover:bg-brand-dark active:scale-[0.99] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تجهيز الفاتورة...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>مشاركة الطلب للتجهيز</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

