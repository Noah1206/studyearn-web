'use client';

import { forwardRef } from 'react';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================
export interface UserLocationMarkerProps {
  /** Accuracy of the location in meters */
  accuracy?: number;
  /** Whether location is stale/outdated */
  isStale?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
}

// ============================================
// Constants
// ============================================
const SIZE_CLASSES = {
  sm: {
    outer: 'w-8 h-8',
    inner: 'w-4 h-4',
    pulse: 'w-10 h-10',
  },
  md: {
    outer: 'w-10 h-10',
    inner: 'w-5 h-5',
    pulse: 'w-12 h-12',
  },
  lg: {
    outer: 'w-12 h-12',
    inner: 'w-6 h-6',
    pulse: 'w-14 h-14',
  },
};

// ============================================
// Animation Variants
// ============================================
const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.5, 2],
    opacity: [0.5, 0.3, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeOut',
    },
  },
};

const innerPulseVariants: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const appearVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

// ============================================
// Component
// ============================================
const UserLocationMarker = forwardRef<HTMLDivElement, UserLocationMarkerProps>(
  ({ accuracy, isStale = false, size = 'md', className }, ref) => {
    const sizeClasses = SIZE_CLASSES[size];

    // Calculate accuracy circle size (capped at 100px)
    const accuracySize = accuracy
      ? Math.min(Math.max(accuracy * 2, 40), 100)
      : 0;

    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative flex items-center justify-center',
          'pointer-events-none',
          className
        )}
        variants={appearVariants}
        initial="initial"
        animate="animate"
      >
        {/* Accuracy circle */}
        {accuracy && accuracy > 0 && (
          <motion.div
            className={cn(
              'absolute rounded-full',
              'bg-primary-500/10 border border-primary-500/20'
            )}
            style={{
              width: `${accuracySize}px`,
              height: `${accuracySize}px`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          />
        )}

        {/* Outer pulse ring */}
        <motion.div
          className={cn(
            'absolute rounded-full bg-primary-500',
            sizeClasses.pulse
          )}
          variants={pulseVariants}
          animate="animate"
        />

        {/* Outer circle with border */}
        <div
          className={cn(
            'relative rounded-full',
            'bg-white shadow-lg',
            'border-4 border-primary-500',
            'flex items-center justify-center',
            sizeClasses.outer,
            isStale && 'border-gray-400'
          )}
        >
          {/* Inner dot */}
          <motion.div
            className={cn(
              'rounded-full',
              isStale ? 'bg-gray-400' : 'bg-primary-500',
              sizeClasses.inner
            )}
            variants={innerPulseVariants}
            animate="animate"
          />
        </div>

        {/* Direction indicator (arrow pointing up by default) */}
        <motion.div
          className={cn(
            'absolute -top-1',
            'w-0 h-0',
            'border-l-[6px] border-l-transparent',
            'border-r-[6px] border-r-transparent',
            'border-b-[10px]',
            isStale ? 'border-b-gray-400' : 'border-b-primary-500'
          )}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        />

        {/* Stale indicator */}
        {isStale && (
          <div
            className={cn(
              'absolute -bottom-2 left-1/2 -translate-x-1/2',
              'px-1.5 py-0.5',
              'bg-gray-100 text-gray-500',
              'text-[8px] font-medium rounded-full',
              'whitespace-nowrap'
            )}
          >
            Updating...
          </div>
        )}
      </motion.div>
    );
  }
);

UserLocationMarker.displayName = 'UserLocationMarker';

export { UserLocationMarker };
