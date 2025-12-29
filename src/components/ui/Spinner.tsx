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
        'animate-spin rounded-full border-2 border-gray-200 border-t-gray-900',
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
 */
const LoadingSection = ({ message }: { message?: string }) => (
  <div className="py-12 flex flex-col items-center justify-center gap-3">
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
