'use client';

import { ReactNode, Suspense } from 'react';
import { ToastProvider, PageLoader } from '@/components/ui';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ToastProvider position="top-center">
      <Suspense fallback={null}>
        <PageLoader />
      </Suspense>
      {children}
    </ToastProvider>
  );
}
