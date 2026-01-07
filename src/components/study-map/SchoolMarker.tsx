'use client';

import { forwardRef, useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { School, GraduationCap, Building2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================
export type SchoolType = 'elementary' | 'middle' | 'high' | 'university' | 'other';

export interface SchoolMarkerData {
  id: string;
  name: string;
  type: SchoolType;
  activeRoomsCount: number;
  totalParticipants?: number;
  latitude: number;
  longitude: number;
  /** School logo URL */
  logoUrl?: string;
  /** Short name for display (e.g., "서울대" instead of "서울대학교") */
  shortName?: string;
}

export interface SchoolMarkerProps {
  school: SchoolMarkerData;
  /** Is this marker selected */
  isSelected?: boolean;
  /** Is this the user's school */
  isUserSchool?: boolean;
  /** Show school name (always true in new design) */
  showName?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Click handler */
  onClick?: (school: SchoolMarkerData) => void;
  /** Custom className */
  className?: string;
}

// ============================================
// Constants
// ============================================
const SCHOOL_TYPE_LABELS: Record<SchoolType, string> = {
  elementary: '초등학교',
  middle: '중학교',
  high: '고등학교',
  university: '대학교',
  other: '기타',
};

const SCHOOL_TYPE_COLORS: Record<SchoolType, { bg: string; text: string; ring: string; accent: string }> = {
  elementary: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    ring: 'ring-emerald-200',
    accent: 'bg-emerald-500',
  },
  middle: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    ring: 'ring-blue-200',
    accent: 'bg-blue-500',
  },
  high: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    ring: 'ring-violet-200',
    accent: 'bg-violet-500',
  },
  university: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    ring: 'ring-indigo-200',
    accent: 'bg-indigo-500',
  },
  other: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    ring: 'ring-gray-200',
    accent: 'bg-gray-500',
  },
};

// ============================================
// Animation Variants
// ============================================
const markerVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
    y: 20,
  },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.98,
  },
  selected: {
    scale: 1.05,
    opacity: 1,
    y: -4,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
    },
  },
};

// ============================================
// Component
// ============================================
const SchoolMarker = forwardRef<HTMLDivElement, SchoolMarkerProps>(
  (
    {
      school,
      isSelected = false,
      isUserSchool = false,
      showName = true, // Always show name in new design
      size = 'md',
      onClick,
      className,
    },
    ref
  ) => {
    const colors = SCHOOL_TYPE_COLORS[school.type];
    const displayName = school.shortName || school.name;
    const hasLogo = !!school.logoUrl;
    const isActive = school.activeRoomsCount > 0;

    // Get appropriate icon based on school type
    const SchoolIcon = useMemo(() => {
      switch (school.type) {
        case 'university':
          return GraduationCap;
        case 'other':
          return Building2;
        default:
          return School;
      }
    }, [school.type]);

    const handleClick = () => {
      onClick?.(school);
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative flex flex-col items-center cursor-pointer',
          'select-none touch-manipulation',
          className
        )}
        variants={markerVariants}
        initial="initial"
        animate={isSelected ? 'selected' : 'animate'}
        exit="exit"
        whileHover="hover"
        whileTap="tap"
        onClick={handleClick}
      >
        {/* Subtle indicator for active schools */}
        {isActive && (
          <motion.div
            className="absolute -inset-1 rounded-xl bg-gray-900/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}

        {/* Main card container - Clean, minimal design */}
        <div
          className={cn(
            'relative flex items-center gap-2.5 px-3 py-2',
            'bg-white rounded-lg',
            'shadow-sm border border-gray-200/80',
            'transition-all duration-200',
            isSelected && 'shadow-md border-gray-300 ring-1 ring-gray-900/10',
            isUserSchool && !isSelected && 'border-blue-300'
          )}
        >
          {/* Logo or Icon */}
          <div
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center"
          >
            {hasLogo ? (
              <Image
                src={school.logoUrl!}
                alt={school.name}
                width={24}
                height={24}
                className="w-full h-full object-contain"
                unoptimized
              />
            ) : (
              <SchoolIcon className={cn('w-5 h-5', colors.text)} />
            )}
          </div>

          {/* School info */}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate max-w-[100px]">
              {displayName}
            </span>
            {isActive && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-xs text-gray-500">
                  {school.activeRoomsCount}개 진행중
                </span>
              </div>
            )}
            {!isActive && school.totalParticipants !== undefined && school.totalParticipants > 0 && (
              <span className="text-xs text-gray-400 mt-0.5">
                {school.totalParticipants}명 멤버
              </span>
            )}
          </div>
        </div>

        {/* Bottom pointer/anchor */}
        <div className="relative">
          <div
            className={cn(
              'w-2 h-2 bg-white rotate-45 -mt-1',
              'shadow-sm border-r border-b border-gray-100',
              isSelected && 'border-gray-200'
            )}
          />
        </div>
      </motion.div>
    );
  }
);

SchoolMarker.displayName = 'SchoolMarker';

export { SchoolMarker, SCHOOL_TYPE_LABELS, SCHOOL_TYPE_COLORS };
