'use client';

import { cn } from '@/lib/utils';

export interface SkeletonProps {
  className?: string;
  /** Variant shape */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  /** Width - can be any CSS value */
  width?: string | number;
  /** Height - can be any CSS value */
  height?: string | number;
  /** Animation type */
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton = ({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) => {
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const animations = {
    pulse: 'animate-pulse',
    wave: 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : variant === 'text' ? '1em' : undefined,
  };

  return (
    <span
      className={cn(
        'block bg-gray-200',
        variants[variant],
        animations[animation],
        variant === 'text' && !height && 'h-4',
        className
      )}
      style={style}
    />
  );
};

Skeleton.displayName = 'Skeleton';

// Preset skeletons for common use cases
const SkeletonText = ({ lines = 3, className }: { lines?: number; className?: string }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? '60%' : '100%'}
        height={16}
      />
    ))}
  </div>
);

SkeletonText.displayName = 'SkeletonText';

const SkeletonAvatar = ({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) => {
  const sizes = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  return (
    <Skeleton
      variant="circular"
      width={sizes[size]}
      height={sizes[size]}
      className={className}
    />
  );
};

SkeletonAvatar.displayName = 'SkeletonAvatar';

const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn('rounded-xl bg-white p-4 shadow-toss-2', className)}>
    <div className="flex items-center gap-3 mb-4">
      <SkeletonAvatar size="md" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="40%" height={14} />
        <Skeleton variant="text" width="60%" height={12} />
      </div>
    </div>
    <Skeleton variant="rounded" height={120} className="mb-4" />
    <SkeletonText lines={2} />
  </div>
);

SkeletonCard.displayName = 'SkeletonCard';

const SkeletonButton = ({
  size = 'md',
  width = 100,
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  width?: number | string;
  className?: string;
}) => {
  const heights = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  return (
    <Skeleton
      variant="rounded"
      width={width}
      height={heights[size]}
      className={className}
    />
  );
};

SkeletonButton.displayName = 'SkeletonButton';

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard, SkeletonButton };
