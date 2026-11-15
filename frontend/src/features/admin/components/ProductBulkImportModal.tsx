'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Link2,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderArchive,
  Sparkles,
} from 'lucide-react';
import {
  adminApi,
  ProductImportPreviewResponse,
  ProductImportExecuteResult,
} from '@/features/admin/api/admin.api';

interface SimpleBranch {
  id: number;
  name: string;
}

interface SimpleCategory {
  id: number;
  name: string;
  branch_id?: number;
}

interface ProductBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: SimpleBranch[];
  categories: SimpleCategory[];
  onImported: () => Promise<void> | void;
}

const MAPPING_LABELS: Array<{ key: string; label: string; required?: boolean }> = [
  { key: 'name', label: 'الاسم / المنتج', required: true },
  { key: 'unit_price', label: 'السعر الأساسي', required: true },
  { key: 'sale_price', label: 'سعر العرض' },
  { key: 'brand', label: 'العلامة التجارية' },
  { key: 'code', label: 'SKU / الكود' },
  { key: 'category', label: 'التصنيفات' },
  { key: 'description', label: 'وصف مختصر' },
  { key: 'image', label: 'الصورة (رابط / اسم)' },
  { key: 'branch', label: 'المستودع' },
  { key: 'barcode', label: 'الباركود' },
  { key: 'old_price', label: 'سعر قديم (بديل)' },
  { key: 'unit', label: 'الوحدة' },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  create: { label: 'جديد', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  update: { label: 'تحديث', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  skip: { label: 'تخطي', cls: 'bg-stone-100 text-stone-600 border-stone-200' },
  error: { label: 'خطأ', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const IMAGE_SOURCE_LABELS: Record<string, string> = {
  embedded: 'مدمجة (Excel)',
  zip: 'من ملف ZIP',
  url: 'رابط صورة',
  none: 'بدون',
};

export const ProductBulkImportModal: React.FC<ProductBulkImportModalProps> = ({
  isOpen,
  onClose,
  branches,
  categories,
  onImported,
}) => {
  const [sourceMode, setSourceMode] = useState<'file' | 'url'>('file');
  const [sheetFile, setSheetFile] = useState<File | null>(null);
  const [imagesZipFile, setImagesZipFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');

  const [defaultBranchId, setDefaultBranchId] = useState<string>(branches[0]?.id?.toString() || '');
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>('');
  const [duplicateMode, setDuplicateMode] = useState<'update' | 'skip'>('update');
  const [createMissingCategories, setCreateMissingCategories] = useState(true);
  const [downloadRemoteImages, setDownloadRemoteImages] = useState(false);
  const [columnMapping, setColumnMapping] = useState<Record<string, number | null> | null>(null);

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<ProductImportPreviewResponse | null>(null);
  const [executeResult, setExecuteResult] = useState<ProductImportExecuteResult | null>(null);

  if (!isOpen) return null;

  const buildFormData = (mappingOverride?: Record<string, number | null> | null): FormData => {
    const fd = new FormData();
    if (sourceMode === 'file' && sheetFile) {
      fd.append('file', sheetFile);
    }
    if (sourceMode === 'url' && sourceUrl.trim()) {
      fd.append('source_url', sourceUrl.trim());
    }
    if (imagesZipFile) {
      fd.append('images_zip', imagesZipFile);
    }
    if (defaultBranchId) {
      fd.append('default_branch_id', defaultBranchId);
    }
    if (defaultCategoryId && categories.some((c) => c.id.toString() === defaultCategoryId)) {
      fd.append('default_category_id', defaultCategoryId);
    }
    fd.append('duplicate_mode', duplicateMode);
    fd.append('create_missing_categories', createMissingCategories ? '1' : '0');
    fd.append('download_remote_images', downloadRemoteImages ? '1' : '0');

    const effectiveMapping = mappingOverride ?? columnMapping;
    if (effectiveMapping) {
      fd.append('column_mapping', JSON.stringify(effectiveMapping));
    }

    return fd;
  };

  const handlePreview = async (mappingOverride?: Record<string, number | null> | null) => {
    setErrorMsg(null);
    setExecuteResult(null);

    if (sourceMode === 'file' && !sheetFile) {
      setErrorMsg('يرجى اختيار ملف Excel (.xlsx) أو CSV أولاً.');
      return;
    }
    if (sourceMode === 'url' && !sourceUrl.trim()) {
      setErrorMsg('يرجى لصق رابط Google Sheet أو Google Drive أولاً.');
      return;
    }

    setIsPreviewing(true);
    try {
      const res = await adminApi.previewProductsImport(buildFormData(mappingOverride));
      if (res.success) {
        setPreview(res.data);
        setColumnMapping(res.data.mapping);
      } else {
        setErrorMsg(res.message || 'تعذر تحليل الملف.');
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorMsg(message || 'تعذر تحليل الملف أو الرابط. تأكد من الصيغة وصلاحية المشاركة.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleExecuteImport = async () => {
    setErrorMsg(null);
    setIsImporting(true);
    try {
      const res = await adminApi.importProducts(buildFormData());
      if (res.success) {
        setExecuteResult(res.data);
        await onImported();
      } else {
        setErrorMsg(res.message || 'تعذر إتمام الاستيراد.');
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorMsg(message || 'حدث خطأ أثناء تنفيذ الاستيراد.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      await adminApi.downloadImportTemplateCsv();
    } catch {
      setErrorMsg('تعذر تحميل القالب حالياً.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const resetAndClose = () => {
    setErrorMsg(null);
    setExecuteResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 max-w-4xl w-full max-h-[93vh] overflow-y-auto border-t sm:border border-[#eddcc8] shadow-2xl space-y-4">
        <div className="w-12 h-1.5 rounded-full bg-stone-200 mx-auto sm:hidden" />

        {/* الرأس */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#eddcc8]/70 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fbf3e6] to-amber-100/80 border border-[#ebd2b0] text-[#b47820] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-stone-900">
                استيراد المنتجات دفعة واحدة (Excel / CSV / Google Drive)
              </h3>
              <p className="text-[11px] text-stone-500">
                يدعم استيراد الاسم، السعر، الوصف، الكود، القسم، والصور المدمجة أو الروابط وأرشيف ZIP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={isDownloadingTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#fbf3e6] hover:bg-[#f5e7cf] border border-[#ebd2b0] text-[#8f5a13] text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloadingTemplate ? 'جاري التحميل...' : 'تحميل قالب جاهز'}</span>
            </button>
            <button
              type="button"
              onClick={resetAndClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {executeResult && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>تم إتمام الاستيراد بنجاح</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="bg-white rounded-xl px-3 py-2 border border-emerald-100">
                <span className="text-stone-500 block text-[10px]">منتجات مضافة</span>
                <span className="font-mono font-black text-emerald-700 text-sm">{executeResult.created}</span>
              </div>
              <div className="bg-white rounded-xl px-3 py-2 border border-blue-100">
                <span className="text-stone-500 block text-[10px]">منتجات محدّثة</span>
                <span className="font-mono font-black text-blue-700 text-sm">{executeResult.updated}</span>
              </div>
              <div className="bg-white rounded-xl px-3 py-2 border border-stone-200">
                <span className="text-stone-500 block text-[10px]">تم تخطيها</span>
                <span className="font-mono font-black text-stone-700 text-sm">{executeResult.skipped}</span>
              </div>
              <div className="bg-white rounded-xl px-3 py-2 border border-amber-100">
                <span className="text-stone-500 block text-[10px]">صور محفوظة</span>
                <span className="font-mono font-black text-[#8f5a13] text-sm">{executeResult.images_saved}</span>
              </div>
              <div className="bg-white rounded-xl px-3 py-2 border border-rose-100">
                <span className="text-stone-500 block text-[10px]">أخطاء</span>
                <span className="font-mono font-black text-rose-700 text-sm">{executeResult.failed}</span>
              </div>
            </div>
            {executeResult.errors.length > 0 && (
              <div className="text-[11px] text-rose-800 bg-white/80 rounded-xl p-2.5 border border-rose-200 space-y-1 max-h-28 overflow-y-auto">
                {executeResult.errors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* اختيار مصدر البيانات */}
        <div className="bg-[#fdfbf7] rounded-2xl border border-[#eddcc8] p-3.5 sm:p-4 space-y-3.5">
          <div className="bg-white p-1 rounded-xl border border-[#eddcc8] inline-flex gap-1">
            <button
              type="button"
              onClick={() => {
                setSourceMode('file');
                setPreview(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sourceMode === 'file'
                  ? 'bg-gradient-to-r from-[#8f5a13] to-[#b47820] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>رفع ملف (Excel / CSV)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSourceMode('url');
                setPreview(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sourceMode === 'url'
                  ? 'bg-gradient-to-r from-[#8f5a13] to-[#b47820] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>رابط Google Sheets / Drive</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {sourceMode === 'file' ? (
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  ملف المنتجات (.xlsx أو .csv) *
                </label>
                <label className="flex items-center justify-between gap-2 bg-white border border-dashed border-[#d9b683] hover:border-[#b47820] rounded-xl px-3 py-2.5 cursor-pointer transition-colors">
                  <span className="truncate font-semibold text-stone-700">
                    {sheetFile ? sheetFile.name : 'اختر ملف Excel أو CSV من جهازك...'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#fbf3e6] text-[#8f5a13] font-bold shrink-0">
                    استعراض
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.csv,.txt,.tsv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setSheetFile(f);
                      setPreview(null);
                      setColumnMapping(null);
                      setExecuteResult(null);
                    }}
                  />
                </label>
              </div>
            ) : (
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  رابط Google Sheets أو ملف Google Drive *
                </label>
                <input
                  type="url"
                  dir="ltr"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={sourceUrl}
                  onChange={(e) => {
                    setSourceUrl(e.target.value);
                    setPreview(null);
                    setColumnMapping(null);
                  }}
                  className="w-full bg-white border border-[#eddcc8] rounded-xl px-3 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-[#b47820]"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  اجعل مشاركة الملف على Drive/Sheets: «أي شخص لديه الرابط — عارض».
                </p>
              </div>
            )}

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                ملف صور مضغوط (.zip) — اختياري
              </label>
              <label className="flex items-center justify-between gap-2 bg-white border border-dashed border-stone-300 hover:border-[#b47820] rounded-xl px-3 py-2.5 cursor-pointer transition-colors">
                <span className="flex items-center gap-1.5 truncate font-medium text-stone-600">
                  <FolderArchive className="w-4 h-4 text-[#b47820] shrink-0" />
                  <span className="truncate">
                    {imagesZipFile ? imagesZipFile.name : 'مجلد صور ZIP (يطابق الكود أو اسم الصورة)'}
                  </span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-bold shrink-0">
                  رفع ZIP
                </span>
                <input
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={(e) => {
                    setImagesZipFile(e.target.files?.[0] || null);
                    setPreview(null);
                  }}
                />
              </label>
            </div>
          </div>

          {/* إعدادات الربط الافتراضية */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
            <div>
              <label className="block font-bold text-stone-700 mb-1">المستودع الافتراضي</label>
              <select
                value={defaultBranchId}
                onChange={(e) => setDefaultBranchId(e.target.value)}
                className="w-full bg-white border border-[#eddcc8] rounded-xl py-2 px-3 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-[#b47820]"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id.toString()}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">القسم الافتراضي (عند عدم التطابق)</label>
              <select
                value={defaultCategoryId}
                onChange={(e) => setDefaultCategoryId(e.target.value)}
                className="w-full bg-white border border-[#eddcc8] rounded-xl py-2 px-3 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-[#b47820]"
              >
                <option value="">بدون قسم افتراضي</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">عند تكرار كود الصنف</label>
              <select
                value={duplicateMode}
                onChange={(e) => setDuplicateMode(e.target.value as 'update' | 'skip')}
                className="w-full bg-white border border-[#eddcc8] rounded-xl py-2 px-3 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-[#b47820]"
              >
                <option value="update">تحديث بيانات وسعر المنتج</option>
                <option value="skip">تخطي المنتج الموجود</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="inline-flex items-center gap-2 font-semibold text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createMissingCategories}
                  onChange={(e) => setCreateMissingCategories(e.target.checked)}
                  className="rounded border-stone-300 text-[#b47820] focus:ring-[#b47820]"
                />
                <span>إنشاء الأقسام الجديدة غير الموجودة تلقائياً</span>
              </label>

              <label className="inline-flex items-center gap-2 font-semibold text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={downloadRemoteImages}
                  onChange={(e) => setDownloadRemoteImages(e.target.checked)}
                  className="rounded border-stone-300 text-[#b47820] focus:ring-[#b47820]"
                />
                <span>حفظ صور الروابط داخل السيرفر محلياً</span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => handlePreview()}
              disabled={isPreviewing || isImporting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
            >
              {isPreviewing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>{isPreviewing ? 'جاري التحليل...' : 'تحليل ومعاينة الملف'}</span>
            </button>
          </div>
        </div>

        {/* نتائج التحليل والمعاينة */}
        {preview && (
          <div className="space-y-3.5">
            {/* ربط الأعمدة */}
            <div className="bg-white rounded-2xl border border-[#eddcc8] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-extrabold text-stone-800">
                  مطابقة أعمدة الملف ({preview.headers.length} عمود · {preview.rows_count} منتج)
                </h4>
                <button
                  type="button"
                  onClick={() => handlePreview(columnMapping)}
                  disabled={isPreviewing}
                  className="text-[11px] font-bold text-[#8f5a13] hover:underline cursor-pointer"
                >
                  تحديث المعاينة حسب الربط
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                {MAPPING_LABELS.map((field) => {
                  const val = columnMapping?.[field.key];
                  return (
                    <div key={field.key} className="bg-[#fdfbf7] rounded-xl p-2 border border-[#eddcc8]/70">
                      <label className="block font-bold text-stone-700 mb-1 truncate">
                        {field.label}
                        {field.required && <span className="text-rose-500"> *</span>}
                      </label>
                      <select
                        value={val !== null && val !== undefined ? val.toString() : ''}
                        onChange={(e) => {
                          const nextVal = e.target.value === '' ? null : parseInt(e.target.value, 10);
                          setColumnMapping((prev) => ({ ...(prev || preview.mapping), [field.key]: nextVal }));
                        }}
                        className="w-full bg-white border border-stone-200 rounded-lg py-1 px-1.5 text-[11px] font-semibold text-stone-800 focus:outline-hidden focus:border-[#b47820]"
                      >
                        <option value="">— غير مرتبط —</option>
                        {preview.headers.map((header, idx) => (
                          <option key={`${header}-${idx}`} value={idx.toString()}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* شريط الإحصائيات قبل التنفيذ */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
                <span className="text-[10px] text-emerald-700 block">إضافة جديدة</span>
                <span className="font-mono font-black text-emerald-900 text-sm">{preview.summary.will_create}</span>
              </div>
              <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2">
                <span className="text-[10px] text-blue-700 block">تحديث موجود</span>
                <span className="font-mono font-black text-blue-900 text-sm">{preview.summary.will_update}</span>
              </div>
              <div className="rounded-xl bg-stone-50 border border-stone-200 px-3 py-2">
                <span className="text-[10px] text-stone-600 block">تخطي</span>
                <span className="font-mono font-black text-stone-800 text-sm">{preview.summary.will_skip}</span>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                <span className="text-[10px] text-amber-800 block">صور مدمجة / ZIP</span>
                <span className="font-mono font-black text-[#8f5a13] text-sm">
                  {preview.embedded_images_count + preview.zip_images_count}
                </span>
              </div>
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2">
                <span className="text-[10px] text-rose-700 block">أخطاء</span>
                <span className="font-mono font-black text-rose-800 text-sm">{preview.summary.errors}</span>
              </div>
            </div>

            {/* جدول المعاينة */}
            <div className="bg-white rounded-2xl border border-[#eddcc8] overflow-hidden">
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-right text-[11px]">
                  <thead className="bg-[#faf7f2] border-b border-[#eddcc8] text-stone-600 font-bold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">الصف</th>
                      <th className="py-2.5 px-3">الحالة</th>
                      <th className="py-2.5 px-3">اسم المنتج والعلامة</th>
                      <th className="py-2.5 px-3">SKU / الكود</th>
                      <th className="py-2.5 px-3">السعر (العرض / الأساسي)</th>
                      <th className="py-2.5 px-3">التصنيف / المستودع</th>
                      <th className="py-2.5 px-3">الصورة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {preview.rows.map((row) => {
                      const badge = STATUS_BADGE[row.status] || STATUS_BADGE.create;
                      return (
                        <tr key={row.row_number} className="hover:bg-[#fdfbf7]">
                          <td className="py-2 px-3 font-mono text-stone-500">{row.row_number}</td>
                          <td className="py-2 px-3">
                            <span
                              title={row.error || undefined}
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                            {row.error && <div className="text-[10px] text-rose-600 mt-0.5">{row.error}</div>}
                          </td>
                          <td className="py-2 px-3 max-w-[220px]">
                            <div className="font-bold text-stone-900 truncate">{row.name || '—'}</div>
                            {row.brand && (
                              <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#fbf3e6] text-[#8f5a13] border border-[#ebd2b0]/70">
                                {row.brand}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-stone-600">{row.code}</td>
                          <td className="py-2 px-3 font-mono font-bold text-[#8f5a13]">
                            {row.unit_price !== null ? (
                              <div className="flex flex-col">
                                <span>{row.unit_price} ر.س</span>
                                {row.old_price && row.old_price > row.unit_price && (
                                  <span className="text-[10px] text-stone-400 line-through font-normal">
                                    {row.old_price} ر.س
                                  </span>
                                )}
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-2 px-3 text-stone-600">
                            {row.category} · <span className="text-stone-400">{row.branch}</span>
                          </td>
                          <td className="py-2 px-3 text-stone-500">
                            {IMAGE_SOURCE_LABELS[row.image_source] || 'بدون'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {preview.rows_count > preview.rows.length && (
                <div className="px-3 py-2 bg-[#faf7f2] border-t border-[#eddcc8] text-[10px] text-stone-500 text-center">
                  يتم عرض أول {preview.rows.length} صفاً من أصل {preview.rows_count} صفاً في المعاينة (سيتم استيراد جميع الصفوف عند التنفيذ).
                </div>
              )}
            </div>

            {/* أزرار التنفيذ */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={resetAndClose}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-50 cursor-pointer"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting || preview.summary.will_create + preview.summary.will_update === 0}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8f5a13] to-[#b47820] hover:opacity-95 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري استيراد المنتجات وحفظ الصور...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      اعتماد وتنفيذ الاستيراد ({preview.summary.will_create + preview.summary.will_update} منتج)
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

