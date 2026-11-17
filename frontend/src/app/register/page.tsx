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
    <div className="min-h-screen bg-white text-[#111827] flex flex-col justify-center px-4 py-8 selection:bg-[#edd0f7] selection:text-[#482b52] relative overflow-x-hidden">
      {/* إضاءات خلفية ناعمة بدرجات اللافندر */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#edd0f7]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#c7aad1]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full mx-auto relative z-10">
        {/* العودة للرئيسية */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-[#482b52] hover:bg-[#edd0f7]/40 transition-colors bg-[#faf6fc] px-3.5 py-1.5 rounded-xl border border-[#c7aad1] shadow-2xs"
          >
            <ArrowRight className="w-4 h-4" />
            <span>لديك حساب؟ تسجيل الدخول</span>
          </Link>
          <span className="text-xs text-[#482b52] font-black bg-[#faf6fc] border border-[#c7aad1] px-2.5 py-1 rounded-lg">
            تسجيل منشأة جملة معتمدة B2B
          </span>
        </div>

        {/* الكرت الرئيسي الأبيض بلمسة اللافندر */}
        <div className="bg-white border border-[#eeeeee] rounded-2xl p-6 sm:p-8 shadow-xl shadow-purple-950/5">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-white border border-[#eeeeee] p-2 mb-3 shadow-md shadow-purple-950/5 overflow-hidden">
              <img src="/logo.png" alt="شركة المخازن الاقتصادية" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-black text-[#111827]">تسجيل منشأة تجارية جديدة</h1>
            <p className="text-xs text-[#4b5563] mt-1 max-w-md mx-auto font-medium">
              المنصة مخصصة حصرياً للشركات والمؤسسات التجارية بالسجل التجاري والرقم الضريبي
            </p>
          </div>

          {(formError || error) && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* اسم المنشأة */}
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                اسم المؤسسة / الشركة التجارية *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#a184ab] absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="company_name"
                  placeholder="مثال: مؤسسة الأفق الحديث للتجارة"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="w-full bg-[#f9fafb] border border-gray-200 rounded-xl py-2.5 pr-10 pl-3 text-xs text-[#111827] placeholder-gray-400 focus:outline-hidden focus:border-[#a184ab] focus:ring-2 focus:ring-[#c7aad1]/35 focus:bg-white font-medium"
                  required
                />
              </div>
            </div>

            {/* السجل التجاري والرقم الضريبي */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1.5">
                  رقم السجل التجاري (10 أرقام) *
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-[#a184ab] absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="cr_number"
                    dir="ltr"
                    maxLength={10}
                    placeholder="1010XXXXXX"
                    value={formData.cr_number}
                    onChange={handleChange}
                    className="w-full bg-[#f9fafb] border border-gray-200 rounded-xl py-2.5 pr-10 pl-3 text-xs text-[#111827] placeholder-gray-400 focus:outline-hidden focus:border-[#a184ab] focus:ring-2 focus:ring-[#c7aad1]/35 focus:bg-white text-right font-mono font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1.5 flex items-center justify-between">
                  <span>الرقم الضريبي (15 رقم) *</span>
                  <span className="text-[10px] text-[#482b52] font-bold">ZATCA</span>
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-[#a184ab] absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="vat_number"
                    dir="ltr"
                    maxLength={15}
                    placeholder="300XXXXXXXX0003"
                    value={formData.vat_number}
                    onChange={handleChange}
                    className="w-full bg-[#f9fafb] border border-gray-200 rounded-xl py-2.5 pr-10 pl-3 text-xs text-[#111827] placeholder-gray-400 focus:outline-hidden focus:border-[#a184ab] focus:ring-2 focus:ring-[#c7aad1]/35 focus:bg-white text-right font-mono font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            {/* اسم المسئول والجوال */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1.5">
                  اسم المسؤول المفوض *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#a184ab] absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="owner_name"
                    placeholder="عبدالله محمد"
                    value={formData.owner_name}
                    onChange={handleChange}
                    className="w-full bg-[#f9fafb] border border-gray-200 rounded-xl py-2.5 pr-10 pl-3 text-xs text-[#111827] placeholder-gray-400 focus:outline-hidden focus:border-[#a184ab] focus:ring-2 focus:ring-[#c7aad1]/35 focus:bg-white font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1.5">
                  رقم الجوال للتواصل *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#a184ab] absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    dir="ltr"
                    name="phone"
                    placeholder="05XXXXXXXX"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-[#f9fafb] border border-gray-200 rounded-xl py-2.5 pr-10 pl-3 text-xs text-[#111827] placeholder-gray-400 focus:outline-hidden focus:border-[#a184ab] focus:ring-2 focus:ring-[#c7aad1]/35 focus:bg-white text-right font-mono font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            {/* المدينة */}
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                المدينة والمقر الرئيسي *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#a184ab] absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="city"
                  placeholder="الرياض"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full bg-[#f9fafb] border border-gray-200 rounded-xl py-2.5 pr-10 pl-3 text-xs text-[#111827] placeholder-gray-400 focus:outline-hidden focus:border-[#a184ab] focus:ring-2 focus:ring-[#c7aad1]/35 focus:bg-white font-medium"
                  required
                />
              </div>
            </div>

            {/* كلمة المرور والتأكيد */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1.5">
                  كلمة المرور *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#a184ab] absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-[#f9fafb] border border-gray-200 rounded-xl py-2.5 pr-10 pl-3 text-xs text-[#111827] placeholder-gray-400 focus:outline-hidden focus:border-[#a184ab] focus:ring-2 focus:ring-[#c7aad1]/35 focus:bg-white font-mono"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1.5">
                  تأكيد كلمة المرور *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#a184ab] absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    name="password_confirmation"
                    placeholder="••••••••"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    className="w-full bg-[#f9fafb] border border-gray-200 rounded-xl py-2.5 pr-10 pl-3 text-xs text-[#111827] placeholder-gray-400 focus:outline-hidden focus:border-[#a184ab] focus:ring-2 focus:ring-[#c7aad1]/35 focus:bg-white font-mono"
                    required
                    minLength={8}
                  />
                </div>
              </div>
            </div>

            {/* تنبيه نظامي عن الاعتماد */}
            <div className="p-3.5 rounded-xl bg-[#faf6fc] border border-[#c7aad1] text-xs text-[#4b5563] flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-[#8c649c] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#111827]">إجراءات اعتماد المنشأة:</span>
                <p className="text-[11px] text-[#4b5563] mt-0.5 leading-relaxed font-medium">
                  بعد إرسال الطلب، يتم التحقق من السجل التجاري والرقم الضريبي من قبل إدارة شركة المخازن الاقتصادية. لا يمكن الدخول للمستودعات وتوريد الأصناف إلا بعد تفعيل الحساب من لوحة التحكم.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-shimmer w-full mt-2 bg-[#482b52] hover:bg-[#5c3969] text-white font-black py-3.5 px-4 rounded-xl shadow-lg shadow-purple-950/15 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isLoading ? 'جاري تسجيل بيانات المنشأة...' : 'إرسال طلب فتح حساب واعتماد المنشأة'}</span>
            </button>
          </form>

          {/* العودة لتسجيل الدخول */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-[#4b5563]">
            <span>لديك حساب تاجر مسجل بالفعل؟ </span>
            <Link
              href="/"
              className="text-[#482b52] font-bold hover:text-[#8c649c] underline decoration-[#c7aad1]"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
