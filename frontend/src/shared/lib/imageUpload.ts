const STANDARD_DIRECT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export interface ImageOptimizeOptions {
  maxDimension?: number;
  directPassMaxBytes?: number;
  quality?: number;
}

/**
 * يجهّز الصورة المختارة (خاصة صور الذكاء الاصطناعي الكبيرة أو بصيغ AVIF/JFIF/BMP)
 * عبر ضغطها وتوحيد صيغتها داخل المتصفح لتنجح عملية الرفع على الخادم دائماً.
 */
export async function prepareImageForUpload(
  file: File,
  options: ImageOptimizeOptions = {}
): Promise<File> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  const { maxDimension = 1920, directPassMaxBytes = 1_200_000, quality = 0.88 } = options;
  const mime = (file.type || '').toLowerCase();

  // الحفاظ على الصور المتحركة GIF والملفات القياسية الصغيرة كما هي
  if (mime === 'image/gif' || (STANDARD_DIRECT_TYPES.has(mime) && file.size <= directPassMaxBytes)) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('decode_failed'));
      image.src = objectUrl;
    });

    const srcWidth = img.naturalWidth || img.width;
    const srcHeight = img.naturalHeight || img.height;
    if (!srcWidth || !srcHeight) {
      return file;
    }

    const scale = Math.min(1, maxDimension / Math.max(srcWidth, srcHeight));
    const targetWidth = Math.max(1, Math.round(srcWidth * scale));
    const targetHeight = Math.max(1, Math.round(srcHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const preferWebp = mime === 'image/png' || mime === 'image/webp' || mime === 'image/avif';
    const encode = (targetMime: string, q: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, targetMime, q));

    let outputMime = preferWebp ? 'image/webp' : 'image/jpeg';
    let blob = await encode(outputMime, quality);

    if (!blob || blob.type !== outputMime) {
      outputMime = 'image/jpeg';
      blob = await encode(outputMime, quality);
    }

    if (!blob) {
      return file;
    }

    // إذا كان الملف الأصلي قياسياً وأصغر من النسخة المضغوطة، نُبقي الأصلي
    if (STANDARD_DIRECT_TYPES.has(mime) && blob.size >= file.size && file.size <= 3_000_000) {
      return file;
    }

    const ext = outputMime === 'image/webp' ? 'webp' : 'jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${baseName}.${ext}`, {
      type: outputMime,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * يستخرج رسالة الخطأ الفعلية من استجابة Laravel أو خطأ حجم الطلب (413).
 */
export function extractUploadErrorMessage(err: unknown, fallback: string): string {
  const error = err as {
    response?: {
      status?: number;
      data?: { message?: string; errors?: Record<string, string[]> };
    };
    message?: string;
  };

  if (error?.response?.status === 413) {
    return 'حجم الصورة كبير جداً على الخادم؛ يرجى اختيار صورة أصغر أو ضغطها.';
  }

  const fieldErrors = error?.response?.data?.errors;
  if (fieldErrors && typeof fieldErrors === 'object') {
    const firstList = Object.values(fieldErrors).find((list) => Array.isArray(list) && list.length > 0);
    if (firstList?.[0]) {
      return firstList[0];
    }
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message?.toLowerCase().includes('timeout')) {
    return 'انتهت مهلة الاتصال أثناء رفع الصورة؛ يرجى المحاولة مرة أخرى.';
  }

  return fallback;
}

