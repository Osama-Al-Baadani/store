'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { BrandThemeTokens, generateThemeTokens } from '../lib/colorUtils';

interface ThemeContextType {
  color: string;
  tokens: BrandThemeTokens;
  setBrandColor: (hex: string) => void;
}

const defaultColor = '#8c649c';
const defaultTokens = generateThemeTokens(defaultColor);

const ThemeContext = createContext<ThemeContextType>({
  color: defaultColor,
  tokens: defaultTokens,
  setBrandColor: () => {},
});

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  initialColor?: string;
}> = ({ children, initialColor = defaultColor }) => {
  const [color, setColor] = useState<string>(initialColor);
  const [tokens, setTokens] = useState<BrandThemeTokens>(() => generateThemeTokens(initialColor));
  const currentColorRef = useRef<string>(initialColor);

  const applyTokensToCss = (themeTokens: BrandThemeTokens) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', themeTokens.primary);
    root.style.setProperty('--brand-dark', themeTokens.dark);
    root.style.setProperty('--brand-light', themeTokens.light);
    root.style.setProperty('--brand-ring', themeTokens.ring);
    root.style.setProperty('--brand-gradient', themeTokens.gradient);
  };

  const setBrandColor = useCallback((newColor: string) => {
    if (!newColor || newColor === currentColorRef.current) return;
    currentColorRef.current = newColor;
    const updated = generateThemeTokens(newColor);
    setColor(newColor);
    setTokens(updated);
    applyTokensToCss(updated);
  }, []);

  useEffect(() => {
    applyTokensToCss(tokens);
  }, [tokens]);

  return (
    <ThemeContext.Provider value={{ color, tokens, setBrandColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
