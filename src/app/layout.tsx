import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { HeaderWrapper, FooterWrapper } from '@/components/layout';
import { Providers } from '@/components/providers';
import { createClient } from '@/lib/supabase/server';
import { LoginSuccessToast } from '@/components/auth/LoginSuccessToast';
import './globals.css';

// Optimize font loading with next/font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: '스터플 - 학습 콘텐츠 플랫폼',
    template: '%s | StuPle',
  },
  description: '학습 콘텐츠 크리에이터와 학생을 연결하는 플랫폼입니다. 공부하고, 배우고, 성장하세요.',
  keywords: ['학습', '교육', '콘텐츠', '크리에이터', '구독', 'StuPle', '스터플'],
  authors: [{ name: 'StuPle' }],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'StuPle',
    title: '스터플 - 학습 콘텐츠 플랫폼',
    description: '학습 콘텐츠 크리에이터와 학생을 연결하는 플랫폼입니다.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'StuPle',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '스터플 - 학습 콘텐츠 플랫폼',
    description: '학습 콘텐츠 크리에이터와 학생을 연결하는 플랫폼입니다.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1A1A1A',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 서버에서 세션 읽기
  const supabase = await createClient();
  const { data: { session } } = await supabase?.auth.getSession() ?? { data: { session: null } };

  return (
    <html lang="ko" className={inter.variable}>
      <head>
        {/* Preload Pretendard font for faster loading */}
        <link
          rel="preload"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="min-h-screen bg-white flex flex-col antialiased">
        <Providers initialSession={session}>
          <HeaderWrapper />
          <Suspense fallback={null}>
            <LoginSuccessToast />
          </Suspense>
          <main className="flex-1">{children}</main>
          <FooterWrapper />
        </Providers>
      </body>
    </html>
  );
}
