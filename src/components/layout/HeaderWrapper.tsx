'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';

export function HeaderWrapper() {
  const pathname = usePathname();

  // 대시보드 페이지에서는 헤더를 렌더링하지 않음 (CreatorHeader가 별도로 렌더링됨)
  if (pathname.startsWith('/dashboard')) {
    return null;
  }

  return <Header />;
}
