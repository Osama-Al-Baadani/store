'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  Phone,
  Lock,
  Building2,
  User,
  FileText,
  ArrowRight,
  AlertCircle,
  UserPlus,
  MapPin,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error } = useAuth();

  const [formData, setFormData] = useState({
    owner_name: '',
    company_name: '',
    cr_number: '',
    vat_number: '',
    phone: '',
    password: '',
    password_confirmation: '',
    city: 'الرياض',
  });

  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // التحقق من السجل التجاري (10 أرقام)
    if (!/^\d{10}$/.test(formData.cr_number)) {
      setFormError('رقم السجل التجاري يجب أن يتكون من 10 أرقام نظامية');
      return;
    }

    // التحقق من الرقم الضريبي (15 رقم ويبدأ وينتهي بـ 3 حسب الزكاة والضريبة)
    if (formData.vat_number && !/^3\d{13}3$/.test(formData.vat_number)) {
      setFormError('الرقم الضريبي للمنشأة يجب أن يتكون من 15 رقماً ويبدأ وينتهي بالرقم 3');
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setFormError('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
      return;
    }

    try {
      const { password_confirmation, ...registerData } = formData;
      await register(registerData);
      router.push('/');
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'فشل التسجيل، تأكد من صحة البيانات.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdfbf7] via-[#faf7f2] to-[#f4eee2] text-stone-900 flex flex-col justify-center px-4 py-8 selection:bg-amber-200 selection:text-amber-950 relative overflow-x-hidden">
      {/* إضاءات خلفية ناعمة ذهبية */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-300/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full mx-auto relative z-10">
        {/* العودة للرئيسية */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-amber-900 hover:text-amber-950 transition-colors bg-white hover:bg-amber-50 px-3.5 py-1.5 rounded-xl border border-amber-200/80 shadow-2xs"
          >
            <ArrowRight className="w-4 h-4" />
            <span>لديك حساب؟ تسجيل الدخول</span>
          </Link>
          <span className="text-xs text-amber-900 font-black bg-amber-100 border border-amber-300/80 px-2.5 py-1 rounded-lg">
            تسجيل منشأة جملة معتمدة B2B
          </span>
        </div>

        {/* الكرت الرئيسي الأبيض والذهبي */}
        <div className="bg-white/95 border border-amber-200/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl shadow-amber-950/5">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white border border-amber-200/90 p-2 mb-3 shadow-md shadow-amber-950/10 overflow-hidden">
              <img src="/logo.png" alt="شركة المخازن الاقتصادية" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-black text-stone-900">تسجيل منشأة تجارية جديدة</h1>
            <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto font-medium">
              المنصة مخصصة حصرياً للشركات والمؤسسات التجارية بالسجل التجاري والرقم الضريبي
            </p>
          </div>

          {(formError || error) && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* اسم المنشأة */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                اسم المؤسسة / الشركة التجارية *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-amber-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="company_name"
                  placeholder="مثال: مؤسسة الأفق الحديث للتجارة"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 pr-10 pl-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white font-medium"
                  required
                />
              </div>
            </div>

            {/* السجل التجاري والرقم الضريبي */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  رقم السجل التجاري (10 أرقام) *
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-amber-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="cr_number"
                    dir="ltr"
                    maxLength={10}
                    placeholder="1010XXXXXX"
                    value={formData.cr_number}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 pr-10 pl-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white text-right font-mono font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                  <span>الرقم الضريبي (15 رقم) *</span>
                  <span className="text-[10px] text-amber-800 font-bold">ZATCA</span>
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-amber-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="vat_number"
                    dir="ltr"
                    maxLength={15}
                    placeholder="300XXXXXXXX0003"
                    value={formData.vat_number}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 pr-10 pl-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white text-right font-mono font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            {/* اسم المسئول والجوال */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  اسم المسؤول المفوض *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-amber-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="owner_name"
                    placeholder="عبدالله محمد"
                    value={formData.owner_name}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 pr-10 pl-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  رقم الجوال للتواصل *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-amber-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    dir="ltr"
                    name="phone"
                    placeholder="05XXXXXXXX"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 pr-10 pl-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white text-right font-mono font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            {/* المدينة */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                المدينة والمقر الرئيسي *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-amber-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="city"
                  placeholder="الرياض"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 pr-10 pl-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white font-medium"
                  required
                />
              </div>
            </div>

            {/* كلمة المرور والتأكيد */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  كلمة المرور *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-amber-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 pr-10 pl-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white font-mono"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  تأكيد كلمة المرور *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-amber-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    name="password_confirmation"
                    placeholder="••••••••"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 pr-10 pl-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:bg-white font-mono"
                    required
                    minLength={8}
                  />
                </div>
              </div>
            </div>

            {/* تنبيه نظامي عن الاعتماد */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/90 text-xs text-stone-700 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-stone-900">إجراءات اعتماد المنشأة:</span>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed font-medium">
                  بعد إرسال الطلب، يتم التحقق من السجل التجاري والرقم الضريبي من قبل إدارة شركة المخازن الاقتصادية. لا يمكن الدخول للمستودعات وتوريد الأصناف إلا بعد تفعيل الحساب من لوحة التحكم.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-shimmer w-full mt-2 bg-gradient-to-r from-[#996515] via-[#c28b38] to-[#dfb76c] hover:opacity-95 text-white font-black py-3.5 px-4 rounded-2xl shadow-xl shadow-amber-950/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isLoading ? 'جاري تسجيل بيانات المنشأة...' : 'إرسال طلب فتح حساب واعتماد المنشأة'}</span>
            </button>
          </form>

          {/* العودة لتسجيل الدخول */}
          <div className="mt-6 pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
            <span>لديك حساب تاجر مسجل بالفعل؟ </span>
            <Link
              href="/"
              className="text-amber-800 font-bold hover:text-amber-950 underline decoration-amber-400"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
