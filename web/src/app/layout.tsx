import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
});

export const metadata: Metadata = {
  title: 'أوليكس - إدارة المعصرة',
  description: 'نظام إدارة معصرة الزيتون',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var r=document.documentElement;r.classList.remove('dark');var s=localStorage.getItem('oilix-theme');if(!s)return;var m=JSON.parse(s).state?.mode;if(m==='dark')r.classList.add('dark');}catch(e){document.documentElement.classList.remove('dark');}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
