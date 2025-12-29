'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

export function FooterWrapper() {
  const pathname = usePathname();

  // 홈페이지에서만 푸터 표시
  if (pathname !== '/') {
    return null;
  }

  return <Footer />;
}
