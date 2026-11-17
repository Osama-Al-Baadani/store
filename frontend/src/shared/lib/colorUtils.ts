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

export function generateThemeTokens(primaryHex: string = '#8c649c'): BrandThemeTokens {
  // توحيد ألوان المنصة والمستودعات مع هوية دار الأميرات (اللافندر الملكي والبرقوقي العميق)
  const colorMap: Record<string, string> = {
    '#68107e': '#8c649c',
    '#58126b': '#7d568d',
    '#4c1d95': '#482b52',
    '#701a75': '#a184ab',
    '#4f46e5': '#8c649c',
    '#059669': '#a184ab',
    '#7c3aed': '#482b52',
    '#b47820': '#8c649c',
    '#c28b38': '#a184ab',
    '#854d0e': '#482b52',
    '#8f5a13': '#482b52',
  };

  let safeHex = primaryHex.startsWith('#') ? primaryHex.toLowerCase() : `#${primaryHex.toLowerCase()}`;
  if (colorMap[safeHex]) {
    safeHex = colorMap[safeHex];
  }

  const rgb = hexToRgb(safeHex);

  const dark = '#482b52';
  const light = `rgba(199, 170, 209, 0.16)`;
  const ring = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28)`;
  const gradient = `linear-gradient(135deg, #482b52 0%, #8c649c 55%, #c7aad1 100%)`;

  return {
    primary: safeHex,
    dark,
    light,
    ring,
    gradient,
  };
}

