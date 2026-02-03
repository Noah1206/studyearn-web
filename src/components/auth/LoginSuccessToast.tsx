'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToastActions } from '@/components/ui/Toast';
import { useUserStore } from '@/store/userStore';

export function LoginSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToastActions();
  const hasShown = useRef(false);
  const hasCleanedUrl = useRef(false);
  const { profile } = useUserStore();

  // URL 파라미터 정리 함수
  const cleanupUrl = () => {
    if (hasCleanedUrl.current) return;
    hasCleanedUrl.current = true;

    const params = new URLSearchParams(searchParams.toString());
    params.delete('login');
    const newPath = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    router.replace(newPath, { scroll: false });
  };

  // 닉네임이 있을 때만 토스트 표시
  useEffect(() => {
    if (hasShown.current) return;
    if (searchParams.get('login') !== 'success') return;

    const nickname = profile?.nickname;

    // 닉네임이 있으면 토스트 표시
    if (nickname) {
      hasShown.current = true;
      toast.success(`${nickname}님, 환영합니다!`);
      cleanupUrl();
    }
  }, [searchParams, router, toast, profile]);

  // 3초 후에도 닉네임이 없으면 URL만 정리 (토스트 없이)
  useEffect(() => {
    if (searchParams.get('login') !== 'success') return;

    const timer = setTimeout(() => {
      if (!hasShown.current) {
        cleanupUrl();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [searchParams]);

  return null;
}
