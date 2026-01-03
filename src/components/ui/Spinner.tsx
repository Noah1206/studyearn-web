'use client';

import { cn } from '@/lib/utils';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * 통합 로딩 스피너 컴포넌트
 * 모든 페이지에서 동일한 로딩 애니메이션 사용
 */
const Spinner = ({ size = 'md', className }: SpinnerProps) => {
  const sizes = {
    xs: 'h-4 w-4',
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-12 w-12',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-orange-200 border-t-orange-500',
        sizes[size],
        className
      )}
    />
  );
};

/**
 * 전체 페이지 로딩 상태
 * 페이지 초기 로딩 시 사용
 */
const LoadingPage = ({ message }: { message?: string }) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4">
    <Spinner size="lg" />
    {message && (
      <p className="text-sm text-gray-500 animate-pulse">{message}</p>
    )}
  </div>
);

/**
 * 섹션 로딩 상태
 * 컴포넌트나 섹션 로딩 시 사용
 * fullHeight: true로 설정하면 콘텐츠 영역 전체 높이를 채우고 정중앙에 스피너 위치
 */
const LoadingSection = ({ message, fullHeight = false }: { message?: string; fullHeight?: boolean }) => (
  <div className={`flex flex-col items-center justify-center gap-3 ${
    fullHeight ? 'min-h-[calc(100vh-8rem)]' : 'py-12'
  }`}>
    <Spinner size="md" />
    {message && (
      <p className="text-sm text-gray-500">{message}</p>
    )}
  </div>
);

/**
 * 인라인 로딩 상태
 * 버튼 내부 등 작은 공간에서 사용
 */
const LoadingInline = () => (
  <Spinner size="xs" className="border-current border-t-transparent" />
);

export { Spinner, LoadingPage, LoadingSection, LoadingInline };
