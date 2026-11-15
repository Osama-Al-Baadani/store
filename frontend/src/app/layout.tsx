import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/shared/providers/ThemeProvider';

export const metadata: Metadata = {
  title: 'شركة المخازن الاقتصادية | منصة مبيعات وتوريد الجملة B2B',
  description: 'كتالوج شركة المخازن الاقتصادية لتصفح الأصناف وإرسال طلبات الجملة المباشرة للمستودعات',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#b47820',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth" className="h-full scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-[#faf8f5] text-stone-900 antialiased font-sans">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
