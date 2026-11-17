'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useBranches } from '@/features/branches/hooks/useBranches';
import { useTheme } from '@/shared/providers/ThemeProvider';
import { authApi } from '@/features/auth/api/auth.api';
import { AdvertisementItem, getPublicAdvertisements } from '@/features/admin/api/admin.api';
import {
  Phone,
  Lock,
  LogIn,
  Building2,
  Truck,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  MapPin,
  Clock,
  LogOut,
  AlertCircle,
  Package,
  Layers,
  FileCheck2,
  Hourglass,
  Sparkles,
  Zap,
  ArrowLeft,
  Boxes,
  FileText,
  Warehouse,
  Check,
} from 'lucide-react';

export default function MainPage() {
  const router = useRouter();
  const { user, isAuthenticated, login, logout, isLoading: isAuthLoading, error: authError, refreshUser } = useAuth();
  const { branches, selectedBranch, selectBranch, isLoading: isBranchesLoading } = useBranches();
  const { setBrandColor } = useTheme();

  // نموذج تسجيل الدخول الموحد
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isStorePreview, setIsStorePreview] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationMessage, setSimulationMessage] = useState<string | null>(null);
  const [homeAds, setHomeAds] = useState<AdvertisementItem[]>([]);
  const [homeAdIndex, setHomeAdIndex] = useState(0);

  useEffect(() => {
    if (!isAuthLoading) {
      setHasInitialized(true);
    }
  }, [isAuthLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const preview = new URLSearchParams(window.location.search).get('view') === 'store';
      setIsStorePreview(preview);
      if (!isAuthLoading && isAuthenticated && user?.role === 'admin' && !preview) {
        router.replace('/admin');
      }
    }
  }, [isAuthLoading, isAuthenticated, user?.role, router]);

  useEffect(() => {
    if (isBranchesLoading && !selectedBranch?.id) return;

    const targetBranchId = selectedBranch?.id ?? branches[0]?.id ?? null;
    let cancelled = false;

    getPublicAdvertisements('home', targetBranchId)
      .then((res) => {
        if (cancelled) return;
        if (res.success && Array.isArray(res.data)) {
          setHomeAds(res.data);
          setHomeAdIndex(0);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isBranchesLoading, selectedBranch?.id, branches]);

  useEffect(() => {
    if (homeAds.length <= 1) return;
    const timer = setInterval(() => {
      setHomeAdIndex((prev) => (prev + 1) % homeAds.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [homeAds.length]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!phone || !password) {
      setLoginError('يرجى إدخال رقم الجوال والرمز السري');
      return;
    }

    try {
      const loggedUser = await login({ phone, password });
      if (loggedUser?.role === 'admin') {
        router.replace('/admin');
      }
    } catch (err: any) {
      setLoginError(err.message || 'فشل تسجيل الدخول، تأكد من صحة البيانات.');
    }
  };

  const handleBranchSelect = (branch: any) => {
    selectBranch(branch);
    if (branch.color) {
      setBrandColor(branch.color);
    }
    router.push('/catalog');
  };

  // محاكاة اعتماد الإدارة فورياً لحين اكتمال لوحة التحكم
  const handleSimulateApproval = async () => {
    setIsSimulating(true);
    setSimulationMessage(null);
    try {
      const res = await authApi.simulateApproval();
      if (res.success) {
        setSimulationMessage('تم اعتماد المنشأة بنجاح من قبل إدارة شركة المخازن الاقتصادية!');
        await refreshUser();
      }
    } catch (err: any) {
      setSimulationMessage(err.response?.data?.message || 'تعذر محاكاة الاعتماد حالياً');
    } finally {
      setIsSimulating(false);
    }
  };

  const merchantStatus = user?.merchant_profile?.status || 'pending';
  const isApproved = user?.role === 'admin' || merchantStatus === 'active';
  const isRedirectingAdmin = hasInitialized && isAuthenticated && user?.role === 'admin' && !isStorePreview;

  return (
    <div className="min-h-screen bg-white text-[#111827] flex flex-col selection:bg-[#edd0f7] selection:text-[#482b52] relative overflow-x-hidden">
      {/* إضاءة خلفية ناعمة بدرجات اللافندر */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#edd0f7]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#c7aad1]/20 rounded-full blur-3xl pointer-events-none" />

      {/* الشريط العلوي الرسمي المتجاوب بهوية دار الأميرات */}
      <div className="relative z-10 h-1 w-full bg-gradient-to-l from-[#482b52] via-[#a184ab] to-[#c7aad1]" />
      <header className="relative z-10 border-b border-[#eeeeee] px-3.5 sm:px-8 py-3 flex items-center justify-between gap-2.5 backdrop-blur-md bg-white/95 shadow-[0_2px_14px_-6px_rgba(72,43,82,0.08)]">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-[#eeeeee] p-1 flex items-center justify-center shadow-2xs overflow-hidden shrink-0">
            <img src="/logo.png" alt="شركة المخازن الاقتصادية" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-bold text-[#111827] leading-tight truncate">
              شركة المخازن الاقتصادية
            </h1>
            <p className="hidden sm:block text-[11px] text-[#4b5563] font-medium mt-0.5 truncate">
              منصة الجملة الرسمية للشركات والمؤسسات التجارية المعتمدة
            </p>
          </div>
        </div>

        {isAuthenticated && user && (
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="hidden md:flex items-center gap-2.5 bg-[#faf6fc] px-3.5 py-1.5 rounded-xl border border-[#c7aad1] text-xs shadow-2xs text-[#4b5563]">
              <Building2 className="w-4 h-4 text-[#a184ab]" />
              <span className="font-bold text-[#111827]">
                {user.merchant_profile?.company_name || user.name}
              </span>
              {user.role === 'admin' ? (
                <span className="text-[10px] bg-[#482b52] text-[#edd0f7] px-2 py-0.5 rounded-md font-bold">
                  إدارة المنصة
                </span>
              ) : isApproved ? (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                  معتمد ✓
                </span>
              ) : (
                <span className="text-[10px] bg-[#faf6fc] text-[#482b52] px-2 py-0.5 rounded-md font-bold border border-[#c7aad1]">
                  بانتظار الاعتماد
                </span>
              )}
            </div>
            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 text-xs text-white bg-[#482b52] hover:bg-[#5c3969] active:scale-95 px-2.5 sm:px-3.5 py-2 rounded-xl transition-all font-bold shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#edd0f7]" />
                <span className="hidden sm:inline">لوحة تحكم الإدارة</span>
                <span className="sm:hidden">الإدارة</span>
              </Link>
            )}

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 text-xs text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 active:scale-95 px-2.5 sm:px-3.5 py-2 rounded-xl border border-rose-200 transition-all cursor-pointer font-bold"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تسجيل خروج</span>
            </button>
          </div>
        )}
      </header>

      {/* المحتوى الرئيسي */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col justify-center">
        {/* ========================================================= */}
        {/* الحالة 0: جاري التحقق من الجلسة أو تحويل الإدارة            */}
        {/* ========================================================= */}
        {!hasInitialized || isRedirectingAdmin ? (
          <div className="max-w-md w-full mx-auto bg-white border border-[#eeeeee] rounded-2xl p-8 shadow-xl shadow-purple-950/5 text-center space-y-3">
            <div className="w-16 h-16 rounded-xl bg-[#faf6fc] border border-[#c7aad1] p-2 mx-auto flex items-center justify-center">
              <img src="/logo.png" alt="شركة المخازن الاقتصادية" className="w-full h-full object-contain animate-pulse" />
            </div>
            <p className="text-sm font-bold text-[#111827]">
              {isRedirectingAdmin ? 'جاري توجيهك إلى لوحة تحكم الإدارة...' : 'جاري التحقق من حالة الجلسة...'}
            </p>
          </div>
        ) : !isAuthenticated ? (
          /* ========================================================= */
          /* الحالة 1: تسجيل دخول واحد موحد في البداية (شركة أو أدمن)   */
          /* ========================================================= */
          <div className="max-w-md w-full mx-auto animate-in fade-in zoom-in-95 duration-300">
            {/* الشعار والترحيب */}
            <div className="text-center mb-6">
              <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white border border-[#eeeeee] p-2.5 mb-3 shadow-lg shadow-purple-950/5 overflow-hidden">
                <img src="/logo.png" alt="شركة المخازن الاقتصادية" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-2xl font-black text-[#111827] tracking-tight">
                تسجيل الدخول الموحد للمنصة
              </h2>
              <p className="text-xs text-[#4b5563] mt-1.5 max-w-sm mx-auto font-medium leading-relaxed">
                أدخل رقم الجوال وكلمة المرور — للشركات الشريكة والإدارة، وسيتم توجيهك تلقائياً حسب نوع حسابك
              </p>
            </div>

            {/* بطاقة تسجيل الدخول */}
            <div className="bg-white border border-[#eeeeee] backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-xl shadow-purple-950/5">
              {(loginError || authError) && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{loginError || authError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-1.5">
                    رقم الجوال
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#a184ab] absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      dir="ltr"
                      placeholder="05XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#f9fafb] border border-gray-200 rounded-xl py-3 pr-10 pl-4 text-sm text-[#111827] placeholder-gray-400 focus:outline-hidden focus:border-[#a184ab] focus:ring-2 focus:ring-[#c7aad1]/35 focus:bg-white transition-all text-right font-medium font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-1.5">
                    الرمز السري / كلمة المرور
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#a184ab] absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#f9fafb] border border-gray-200 rounded-xl py-3 pr-10 pl-4 text-sm text-[#111827] placeholder-gray-400 focus:outline-hidden focus:border-[#a184ab] focus:ring-2 focus:ring-[#c7aad1]/35 focus:bg-white transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="btn-shimmer w-full bg-[#482b52] hover:bg-[#5c3969] text-white font-black py-3.5 px-4 rounded-xl shadow-lg shadow-purple-950/15 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isAuthLoading ? 'جاري التحقق من الحساب...' : 'تسجيل الدخول'}</span>
                </button>
              </form>

              {/* رابط تسجيل مؤسسة جديدة */}
              <div className="mt-5 pt-4 border-t border-gray-100 text-center text-xs text-[#4b5563]">
                <span>تريد فتح حساب جملة لمنشأتك؟ </span>
                <Link
                  href="/register"
                  className="text-[#482b52] font-bold hover:text-[#8c649c] underline decoration-[#c7aad1]"
                >
                  تسجيل منشأة جديدة بالسجل التجاري والضريبي
                </Link>
              </div>
            </div>
          </div>
        ) : !isApproved ? (
          /* ========================================================= */
          /* الحالة 2: مسجل دخول ولكن بانتظار الاعتماد (Pending Status)  */
          /* ========================================================= */
          <div className="max-w-2xl w-full mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative overflow-hidden rounded-2xl bg-white border border-[#c7aad1] p-6 sm:p-8 shadow-xl shadow-purple-950/5">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#faf6fc] border border-[#c7aad1] text-[#482b52] mb-3 shadow-md">
                  <Hourglass className="w-8 h-8 animate-pulse text-[#8c649c]" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#111827]">
                  طلب اعتماد المنشأة قيد المراجعة والتدقيق
                </h2>
                <div className="inline-flex items-center gap-1.5 mt-2 bg-[#faf6fc] text-[#482b52] border border-[#c7aad1] px-3 py-1 rounded-full text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-[#a184ab]" />
                  <span>بانتظار موافقة الإدارة وتفعيل الحساب من لوحة التحكم</span>
                </div>
              </div>

              {/* بيانات المنشأة التي سجل بها */}
              <div className="bg-[#f9fafb] rounded-xl p-5 border border-[#eeeeee] space-y-3 mb-6">
                <h4 className="text-xs font-black text-[#482b52] border-b border-[#eeeeee] pb-2">
                  بيانات المنشأة المسجلة تحت التدقيق:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#4b5563] block text-[11px] font-medium">اسم المنشأة:</span>
                    <strong className="text-[#111827] text-sm">
                      {user?.merchant_profile?.company_name || 'شركة قيد الاعتماد'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#4b5563] block text-[11px] font-medium">المسؤول المفوض:</span>
                    <strong className="text-[#111827] text-sm">
                      {user?.merchant_profile?.owner_name || user?.name}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#4b5563] block text-[11px] font-medium">رقم السجل التجاري:</span>
                    <strong className="text-[#482b52] font-mono text-sm">
                      {user?.merchant_profile?.cr_number || '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#4b5563] block text-[11px] font-medium">الرقم الضريبي (ZATCA):</span>
                    <strong className="text-[#482b52] font-mono text-sm">
                      {user?.merchant_profile?.vat_number || '300XXXXXXXX0003'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#4b5563] block text-[11px] font-medium">المدينة:</span>
                    <span className="text-[#111827] font-bold">{user?.merchant_profile?.city || 'الرياض'}</span>
                  </div>
                  <div>
                    <span className="text-[#4b5563] block text-[11px] font-medium">رقم الجوال:</span>
                    <span className="text-[#111827] font-mono font-bold">{user?.phone}</span>
                  </div>
                </div>
              </div>

              {/* التنبيه النظامي */}
              <div className="p-4 rounded-xl bg-[#faf6fc] border border-[#c7aad1]/70 text-xs text-[#4b5563] leading-relaxed mb-6 font-medium">
                <p>
                  شكراً لتسجيل منشأتكم في منصة شركة المخازن الاقتصادية. يجري حالياً التحقق من السجل التجاري والشهادة الضريبية. وفقاً للنظام، لا يسمح بدخول مستودعات التوريد والاطلاع على الأسعار إلا بعد اعتماد الحساب.
                </p>
              </div>

              {/* زر المحاكاة التجريبي لاعتماد الإدارة */}
              <div className="p-4 rounded-xl bg-[#faf6fc] border border-[#c7aad1] text-center">
                <p className="text-xs text-[#111827] mb-2 font-medium">
                  لوحة التحكم قيد الإنشاء — يمكنك تجربة موافقة الإدارة فورياً بنقرة زر واحدة:
                </p>

                {simulationMessage && (
                  <div className="mb-3 p-2.5 rounded-xl bg-[#edd0f7]/45 border border-[#c7aad1] text-[#482b52] text-xs font-bold">
                    {simulationMessage}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSimulateApproval}
                  disabled={isSimulating}
                  className="btn-shimmer inline-flex items-center gap-2 bg-[#482b52] hover:bg-[#5c3969] text-white font-black py-2.5 px-6 rounded-xl shadow-md text-xs cursor-pointer disabled:opacity-50 transition-all"
                >
                  <Zap className="w-4 h-4 text-[#edd0f7]" />
                  <span>{isSimulating ? 'جاري الاعتماد...' : '⚡ تجربة: محاكاة اعتماد الإدارة فورياً'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* الحالة 3: تاجر معتمد ومفعل -> بيانات المنشأة + المستودعات  */
          /* ========================================================= */
          <div className="space-y-5 sm:space-y-7 animate-in fade-in zoom-in-95 duration-300">
            {/* 0. البنر الإعلاني الترحيبي (يستخدم الإعلانات المرفوعة من الإدارة إن وجدت) */}
            {homeAds.length > 0 ? (() => {
              const currentAd = homeAds[homeAdIndex % homeAds.length];
              return (
                <div className="relative overflow-hidden rounded-2xl bg-white border border-[#eeeeee] shadow-[0_8px_28px_-10px_rgba(72,43,82,0.14)]">
                  {currentAd.title || currentAd.subtitle ? (
                    <div className="bg-gradient-to-l from-white via-white to-[#faf6fc] p-4 sm:p-7 flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
                      <div className="w-full sm:w-56 md:w-72 h-40 sm:h-44 rounded-xl bg-white border border-[#eeeeee] overflow-hidden shadow-md shrink-0">
                        <img
                          src={currentAd.image_url}
                          alt={currentAd.title || 'إعلان'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 text-center sm:text-right space-y-2.5">
                        {currentAd.badge_text && (
                          <div className="inline-flex items-center gap-1.5 bg-[#faf6fc] border border-[#c7aad1] text-[#482b52] text-[11px] font-bold px-3 py-1 rounded-full">
                            <Sparkles className="w-3.5 h-3.5 text-[#a184ab]" />
                            <span>{currentAd.badge_text}</span>
                          </div>
                        )}
                        {currentAd.title && (
                          <h2 className="text-xl sm:text-2xl font-bold text-[#111827] leading-snug">
                            {currentAd.title}
                          </h2>
                        )}
                        {currentAd.subtitle && (
                          <p className="text-xs sm:text-sm text-[#4b5563] leading-relaxed font-medium">
                            {currentAd.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full bg-[#faf6fc]">
                      <img
                        src={currentAd.image_url}
                        alt="إعلان المتجر"
                        className="w-full h-44 sm:h-64 md:h-72 object-cover"
                      />
                    </div>
                  )}

                  {homeAds.length > 1 && (
                    <div className="bg-white border-t border-[#eeeeee] py-2 flex items-center justify-center gap-2">
                      {homeAds.map((ad, idx) => (
                        <button
                          key={ad.id}
                          type="button"
                          onClick={() => setHomeAdIndex(idx)}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            homeAdIndex === idx ? 'w-7 bg-[#482b52]' : 'w-2 bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })() : (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-white via-[#faf6fc] to-[#edd0f7]/45 border border-[#eeeeee] shadow-[0_8px_28px_-10px_rgba(72,43,82,0.14)] p-4 sm:p-7">
                {/* إضاءات وزخارف خلفية ناعمة */}
                <div className="absolute -top-16 -left-16 w-56 h-56 bg-[#edd0f7]/45 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 right-1/3 w-64 h-64 bg-[#c7aad1]/25 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-8">
                  {/* الصورة الإعلانية داخل إطار بارز */}
                  <div className="relative shrink-0 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#edd0f7]/55 to-[#c7aad1]/30 rounded-2xl blur-xl scale-95 group-hover:scale-105 transition-transform duration-500" />
                    <div className="relative w-36 h-32 sm:w-48 sm:h-40 rounded-2xl bg-white border border-[#eeeeee] p-3 sm:p-4 shadow-lg shadow-purple-950/10 flex items-center justify-center overflow-hidden">
                      <img
                        src="/banner-promo.png"
                        alt="شركة المخازن الاقتصادية - إعلان التوريد المباشر"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </div>

                  {/* المحتوى الإعلاني والنص الترويجي */}
                  <div className="flex-1 text-center sm:text-right space-y-2.5 sm:space-y-3">
                    <div className="inline-flex items-center gap-1.5 bg-white border border-[#c7aad1] text-[#482b52] text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-[#a184ab]" />
                      <span>توريد الجملة المباشر • أسعار منافسة بالحبة</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#111827] leading-snug">
                      شركة المخازن الاقتصادية — <span className="text-[#482b52]">شريك التوريد الموثوق</span> لمنشأتك
                    </h2>

                    <p className="text-xs sm:text-sm text-[#4b5563] max-w-2xl leading-relaxed font-medium mx-auto sm:mx-0">
                      اطلب احتياجات منشأتك الآن مباشرة من مستودعاتنا المعتمدة في الرياض بأسعار الجملة الرسمية بالحبة، مع تجهيز فوري وفواتير ضريبية إلكترونية معتمدة (ZATCA).
                    </p>

                    <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                      {branches[0] && (
                        <button
                          type="button"
                          onClick={() => handleBranchSelect(branches[0])}
                          className="btn-shimmer inline-flex items-center gap-2 bg-[#482b52] hover:bg-[#5c3969] active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 sm:py-3 rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          <span>ابدأ التصفح والطلب الآن</span>
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                      )}

                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                        <Truck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>شحن وتجهيز سريع خلال 24 ساعة</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 1. كرت بيانات المنشأة والشركة المعتمدة */}
            {user?.role !== 'admin' && (
            <div className="relative overflow-hidden rounded-2xl bg-white border border-[#eeeeee] shadow-[0_4px_24px_-6px_rgba(72,43,82,0.08)] p-4 sm:p-7">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-[#482b52] text-white flex items-center justify-center shadow-md shrink-0">
                    <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-[#edd0f7]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg sm:text-2xl font-bold text-[#111827] leading-snug">
                        {user?.merchant_profile?.company_name || 'مؤسسة لمسة للتجارة والتوريد'}
                      </h2>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#482b52] bg-[#faf6fc] border border-[#c7aad1] px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#a184ab]" />
                        حساب معتمد للتوريد
                      </span>
                    </div>
                    <p className="text-xs text-[#4b5563] mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-medium">
                      <span>المسؤول المفوض: <strong className="text-[#111827]">{user?.merchant_profile?.owner_name || user?.name || 'لمسه'}</strong></span>
                      <span className="text-gray-300">•</span>
                      <span>المدينة: <strong className="text-[#111827]">{user?.merchant_profile?.city || 'الرياض'}</strong></span>
                      <span className="text-gray-300 hidden sm:inline">•</span>
                      <span className="hidden sm:inline">الجوال: <strong className="text-[#111827] font-mono" dir="ltr">{user?.phone || '0579621870'}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-3 self-stretch sm:self-start lg:self-auto shrink-0">
                  <div className="w-full sm:w-auto bg-[#faf6fc] border border-[#c7aad1] px-4 py-2 sm:py-2.5 rounded-xl flex sm:block items-center justify-between text-center shadow-2xs">
                    <div className="text-[11px] sm:text-[10px] text-[#482b52] font-bold sm:mb-0.5">كود التاجر المعتمد</div>
                    <div className="font-mono text-sm sm:text-base font-bold text-[#111827]">
                      {user?.merchant_profile?.customer_code || 'CUS-3640'}
                    </div>
                  </div>
                </div>
              </div>

              {/* بيانات السجل التجاري والرقم الضريبي والمقر بشكل متناسق 2×2 على الجوال */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 pt-4 sm:pt-5">
                {/* السجل التجاري */}
                <div className="bg-[#f9fafb] border border-[#eeeeee] rounded-xl p-3 sm:p-4 transition-all hover:bg-white hover:border-[#c7aad1] hover:shadow-xs">
                  <div className="flex items-center gap-1.5 text-[#4b5563] text-[11px] sm:text-xs mb-1 font-bold">
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#a184ab] shrink-0" />
                    <span className="truncate">السجل التجاري (CR)</span>
                  </div>
                  <div className="font-mono text-xs sm:text-base font-bold text-[#111827] truncate">
                    {user?.merchant_profile?.cr_number || '1010123456'}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>ساري ومطابق</span>
                  </div>
                </div>

                {/* الرقم الضريبي الرسمي */}
                <div className="bg-[#f9fafb] border border-[#eeeeee] rounded-xl p-3 sm:p-4 transition-all hover:bg-white hover:border-[#c7aad1] hover:shadow-xs">
                  <div className="flex items-center gap-1.5 text-[#4b5563] text-[11px] sm:text-xs mb-1 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#a184ab] shrink-0" />
                    <span className="truncate">الرقم الضريبي (ZATCA)</span>
                  </div>
                  <div className="font-mono text-[11px] sm:text-base font-bold text-[#482b52] truncate">
                    {user?.merchant_profile?.vat_number || '300123456700003'}
                  </div>
                  <div className="text-[10px] text-[#4b5563] font-semibold mt-1 truncate">
                    ضريبة 15% بالفاتورة
                  </div>
                </div>

                {/* مقر المنشأة */}
                <div className="bg-[#f9fafb] border border-[#eeeeee] rounded-xl p-3 sm:p-4 transition-all hover:bg-white hover:border-[#c7aad1] hover:shadow-xs">
                  <div className="flex items-center gap-1.5 text-[#4b5563] text-[11px] sm:text-xs mb-1 font-bold">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 shrink-0" />
                    <span className="truncate">مقر المنشأة</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-[#111827] leading-snug line-clamp-1">
                    {user?.merchant_profile?.address || 'الرياض - حي البطحاء'}
                  </div>
                  <div className="text-[10px] text-[#4b5563] font-semibold mt-1 truncate">
                    نطاق الشحن المعتمد
                  </div>
                </div>

                {/* نوع التوريد */}
                <div className="bg-[#f9fafb] border border-[#eeeeee] rounded-xl p-3 sm:p-4 transition-all hover:bg-white hover:border-[#c7aad1] hover:shadow-xs">
                  <div className="flex items-center gap-1.5 text-[#4b5563] text-[11px] sm:text-xs mb-1 font-bold">
                    <Boxes className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">نظام التوريد</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-emerald-900 truncate">
                    بيع جملة بالحبة
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-1 truncate">
                    كشف أسعار الشركات
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* 2. قسم اختيار المستودع الرئيسي المنظم */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-5">
                <div>
                  <h3 className="text-base sm:text-xl font-bold text-[#111827] flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-[#a184ab]" />
                    مستودعات شركة المخازن الاقتصادية المعتمدة
                  </h3>
                  <p className="text-xs text-[#4b5563] mt-1 font-medium">
                    اختر المستودع لعرض كشف أصنافه، أسعاره بالحبة، وبدء تجهيز طلبيتك
                  </p>
                </div>
                <span className="self-start sm:self-auto text-xs bg-[#faf6fc] text-[#482b52] border border-[#c7aad1] px-3.5 py-1.5 rounded-full font-bold">
                  {branches.length} مستودعات نشطة
                </span>
              </div>

              {/* شبكة المستودعات الثلاثية الأنيقة والمرتبة */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                {isBranchesLoading && branches.length === 0 ? (
                  <div className="col-span-3 text-center py-12 text-sm text-[#4b5563] font-bold bg-white rounded-2xl border border-[#eeeeee]">
                    جاري تحميل المستودعات التابعة للشركة...
                  </div>
                ) : (
                  branches.map((branch) => {
                    const isSelected = selectedBranch?.id === branch.id;
                    const isBadeea = branch.code === 'badeea' || branch.name.includes('البديعة');
                    const isAzizia = branch.code === 'azizia' || branch.name.includes('العزيزية');

                    const locationText = isBadeea ? 'الرياض - حي البديعة' : isAzizia ? 'الرياض - حي العزيزية' : 'الرياض - مخرج 18 السلي';

                    return (
                      <div
                        key={branch.id}
                        onClick={() => handleBranchSelect(branch)}
                        className={`group relative overflow-hidden rounded-2xl p-5 sm:p-6 cursor-pointer transition-all duration-200 border flex flex-col justify-between active:scale-[0.99] ${
                          isSelected
                            ? 'bg-white border-[#a184ab] shadow-xl ring-2 ring-[#c7aad1]/45 -translate-y-1'
                            : 'bg-white border-[#eeeeee] hover:border-[#c7aad1] shadow-xs hover:shadow-xl hover:-translate-y-1'
                        }`}
                      >
                        {/* أعلى الكرت */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#482b52] bg-[#faf6fc] border border-[#c7aad1] px-3 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#a184ab]" />
                              جاهز للتجهيز
                            </span>
                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#482b52] text-white flex items-center justify-center shadow-sm">
                              <Warehouse className="w-5 h-5 sm:w-6 sm:h-6 text-[#edd0f7]" />
                            </div>
                          </div>

                          <h4 className="text-base sm:text-lg font-bold text-[#111827] group-hover:text-[#482b52] transition-colors leading-snug">
                            {branch.name}
                          </h4>
                          <p className="text-xs text-[#4b5563] mt-1.5 line-clamp-2 leading-relaxed">
                            {branch.description || 'توريد فوري بالحبة لجميع المنشآت مع كشف حساب وفواتير ضريبية معتمدة.'}
                          </p>
                        </div>

                        {/* الموقع والكود وزر الدخول */}
                        <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
                          <div className="flex items-center justify-between text-xs gap-2">
                            <div className="flex items-center gap-1.5 text-[#4b5563] font-medium truncate">
                              <MapPin className="w-3.5 h-3.5 text-[#a184ab] shrink-0" />
                              <span className="truncate">{locationText}</span>
                            </div>
                            <span className="shrink-0 text-[11px] font-mono bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-lg text-[#111827] font-bold">
                              كود: {branch.code}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#482b52] group-hover:bg-[#5c3969] shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <span>دخول المستودع وتصفح الكتالوج</span>
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* شريط الأمان والاعتماد الرسمي في الأسفل */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#f3f4f6] border border-[#eeeeee] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#374151] font-medium text-center sm:text-right">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#a184ab] shrink-0" />
                <span>المستودعات تستقبل طلبات التجهيز والشحن المباشر على مدار الساعة</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-stone-800">فواتير ضريبية إلكترونية متوافقة مع (ZATCA)</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
