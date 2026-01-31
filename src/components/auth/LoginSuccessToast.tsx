'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToastActions } from '@/components/ui/Toast';

export function LoginSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToastActions();
  const hasShown = useRef(false);

  useEffect(() => {
    if (searchParams.get('login') === 'success' && !hasShown.current) {
      hasShown.current = true;
      toast.success('환영합니다! 로그인되었습니다.');

      // URL에서 login 파라미터 제거
      const params = new URLSearchParams(searchParams.toString());
      params.delete('login');
      const newPath = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      router.replace(newPath, { scroll: false });
    }
  }, [searchParams, router, toast]);

  return null;
}
