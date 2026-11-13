'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantityInputProps {
  quantity: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  onChange: (newQuantity: number) => void;
}

export const QuantityInput: React.FC<QuantityInputProps> = ({
  quantity,
  step = 1,
  unit = 'حبة',
  disabled = false,
  onChange,
}) => {
  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(quantity + step);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || quantity <= 0) return;
    const next = quantity - step;
    onChange(next < 0 ? 0 : next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 0) {
      onChange(0);
    } else {
      onChange(val);
    }
  };

  const hasQuantity = quantity > 0;

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border p-1 transition-all duration-200 ${
        hasQuantity
          ? 'border-brand bg-brand-light shadow-sm'
          : 'border-slate-200/90 bg-white hover:border-slate-300'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <button
        type="button"
        onClick={handleIncrease}
        aria-label="زيادة الكمية"
        className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center active:scale-95 transition-all shadow-xs hover:opacity-90 cursor-pointer"
      >
        <Plus className="w-4 h-4 stroke-[3]" />
      </button>

      <div className="flex items-center justify-center gap-1.5 px-3 font-semibold select-none">
        <input
          type="number"
          min="0"
          step={step}
          value={quantity}
          onChange={handleInputChange}
          className="w-10 text-center bg-transparent text-slate-900 text-sm font-black focus:outline-hidden"
        />
        <span className="text-[11px] text-slate-500 font-bold">{unit}</span>
      </div>

      <button
        type="button"
        onClick={handleDecrease}
        disabled={quantity <= 0}
        aria-label="إنقاص الكمية"
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
          quantity > 0
            ? 'bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 active:scale-95 shadow-xs cursor-pointer'
            : 'bg-slate-100 text-slate-300 cursor-not-allowed'
        }`}
      >
        <Minus className="w-4 h-4 stroke-[3]" />
      </button>
    </div>
  );
};
