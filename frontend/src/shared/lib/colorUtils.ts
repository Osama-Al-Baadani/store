/**
 * دوال مساعدة لحساب تدرجات وظلال ألوان الهوية تلقائياً
 */

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function adjustBrightness(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 + percent / 100;
  const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
  const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
  const newB = Math.min(255, Math.max(0, Math.round(b * factor)));

  return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
}

export interface BrandThemeTokens {
  primary: string;
  dark: string;
  light: string;
  ring: string;
  gradient: string;
}

export function generateThemeTokens(primaryHex: string = '#b47820'): BrandThemeTokens {
  // ترقية الألوان تلقائياً إلى درجات الأبيض والذهبي الملكي الفاخر
  const colorMap: Record<string, string> = {
    '#68107e': '#b47820', // ذهبي ملكي دافئ (مستودع البديعة)
    '#58126b': '#b47820',
    '#4c1d95': '#c28b38', // ذهبي كلاسيكي ناصع (مستودع العزيزية)
    '#701a75': '#854d0e', // ذهبي برونزي فاخر (مستودع السلي)
    '#4f46e5': '#b47820',
    '#059669': '#c28b38',
    '#7c3aed': '#854d0e',
  };

  let safeHex = primaryHex.startsWith('#') ? primaryHex.toLowerCase() : `#${primaryHex.toLowerCase()}`;
  if (colorMap[safeHex]) {
    safeHex = colorMap[safeHex];
  }

  const rgb = hexToRgb(safeHex);

  const dark = adjustBrightness(safeHex, -32);
  const bright = adjustBrightness(safeHex, 24);
  const light = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`;
  const ring = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
  const gradient = `linear-gradient(135deg, #8f5a13 0%, #b47820 40%, #c28b38 75%, #dfb76c 100%)`;

  return {
    primary: safeHex,
    dark,
    light,
    ring,
    gradient,
  };
}

