'use client';

import { forwardRef, useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Users, BookOpen, Code, Calculator, Globe, Music, Palette, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui';

// ============================================
// Types
// ============================================
export type SessionStatus = 'waiting' | 'studying' | 'break' | 'ended';
export type RoomCategory = 'math' | 'english' | 'science' | 'coding' | 'language' | 'art' | 'music' | 'other';

export interface RoomMarkerData {
  id: string;
  title: string;
  hostName: string;
  hostAvatarUrl?: string;
  category: RoomCategory;
  sessionStatus: SessionStatus;
  currentParticipants: number;
  maxParticipants: number;
  studyDurationMinutes?: number;
  latitude: number;
  longitude: number;
}

export interface RoomMarkerProps {
  room: RoomMarkerData;
  /** Is this marker selected */
  isSelected?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show room title */
  showTitle?: boolean;
  /** Click handler */
  onClick?: (room: RoomMarkerData) => void;
  /** Custom className */
  className?: string;
}

// ============================================
// Constants
// ============================================
const CATEGORY_ICONS: Record<RoomCategory, typeof BookOpen> = {
  math: Calculator,
  english: BookOpen,
  science: FlaskConical,
  coding: Code,
  language: Globe,
  art: Palette,
  music: Music,
  other: BookOpen,
};

const CATEGORY_COLORS: Record<RoomCategory, { bg: string; text: string; glow: string }> = {
  math: {
    bg: 'bg-blue-500',
    text: 'text-blue-500',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]',
  },
  english: {
    bg: 'bg-green-500',
    text: 'text-green-500',
    glow: 'shadow-[0_0_20px_rgba(34,197,94,0.5)]',
  },
  science: {
    bg: 'bg-purple-500',
    text: 'text-purple-500',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]',
  },
  coding: {
    bg: 'bg-orange-500',
    text: 'text-orange-500',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.5)]',
  },
  language: {
    bg: 'bg-cyan-500',
    text: 'text-cyan-500',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.5)]',
  },
  art: {
    bg: 'bg-pink-500',
    text: 'text-pink-500',
    glow: 'shadow-[0_0_20px_rgba(236,72,153,0.5)]',
  },
  music: {
    bg: 'bg-amber-500',
    text: 'text-amber-500',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.5)]',
  },
  other: {
    bg: 'bg-gray-500',
    text: 'text-gray-500',
    glow: 'shadow-[0_0_20px_rgba(107,114,128,0.5)]',
  },
};

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; dotColor: string }> = {
  waiting: {
    label: 'OPEN',
    color: 'bg-green-500',
    dotColor: 'bg-green-400',
  },
  studying: {
    label: 'LIVE',
    color: 'bg-red-500',
    dotColor: 'bg-red-400',
  },
  break: {
    label: 'BREAK',
    color: 'bg-yellow-500',
    dotColor: 'bg-yellow-400',
  },
  ended: {
    label: 'ENDED',
    color: 'bg-gray-400',
    dotColor: 'bg-gray-300',
  },
};

const SIZE_CLASSES = {
  sm: {
    container: 'w-12 h-12',
    avatar: 'sm' as const,
    badge: 'text-[8px] px-1 py-0.5',
    participants: 'text-[10px] w-5 h-5',
    title: 'text-[10px] max-w-16',
  },
  md: {
    container: 'w-14 h-14',
    avatar: 'md' as const,
    badge: 'text-[9px] px-1.5 py-0.5',
    participants: 'text-xs w-6 h-6',
    title: 'text-xs max-w-20',
  },
  lg: {
    container: 'w-16 h-16',
    avatar: 'lg' as const,
    badge: 'text-[10px] px-2 py-1',
    participants: 'text-sm w-7 h-7',
    title: 'text-sm max-w-24',
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
      stiffness: 300,
      damping: 20,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.2,
    },
  },
  hover: {
    scale: 1.1,
    y: -5,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.95,
  },
  selected: {
    scale: 1.15,
    y: -5,
  },
};

// Pokemon Go style glow animation for LIVE rooms
const glowVariants: Variants = {
  animate: {
    boxShadow: [
      '0 0 5px rgba(59, 130, 246, 0.3), 0 0 10px rgba(59, 130, 246, 0.2)',
      '0 0 20px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.3)',
      '0 0 5px rgba(59, 130, 246, 0.3), 0 0 10px rgba(59, 130, 246, 0.2)',
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const pulseRingVariants: Variants = {
  animate: {
    scale: [1, 1.5, 2],
    opacity: [0.6, 0.3, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeOut',
    },
  },
};

const liveDotVariants: Variants = {
  animate: {
    opacity: [1, 0.3, 1],
    scale: [1, 0.8, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const floatVariants: Variants = {
  animate: {
    y: [0, -4, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ============================================
// Component
// ============================================
const RoomMarker = forwardRef<HTMLDivElement, RoomMarkerProps>(
  (
    {
      room,
      isSelected = false,
      size = 'md',
      showTitle = false,
      onClick,
      className,
    },
    ref
  ) => {
    const categoryColors = CATEGORY_COLORS[room.category];
    const statusConfig = STATUS_CONFIG[room.sessionStatus];
    const sizeClasses = SIZE_CLASSES[size];
    const CategoryIcon = CATEGORY_ICONS[room.category];

    const isLive = room.sessionStatus === 'studying';
    const isActive = room.sessionStatus !== 'ended';

    const handleClick = () => {
      onClick?.(room);
    };

    // Format study duration
    const formattedDuration = useMemo(() => {
      if (!room.studyDurationMinutes) return null;
      const hours = Math.floor(room.studyDurationMinutes / 60);
      const mins = room.studyDurationMinutes % 60;
      if (hours > 0) {
        return `${hours}h ${mins}m`;
      }
      return `${mins}m`;
    }, [room.studyDurationMinutes]);

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
        {/* Pulse rings for LIVE rooms */}
        {isLive && (
          <>
            <motion.div
              className={cn(
                'absolute rounded-full',
                categoryColors.bg,
                sizeClasses.container,
                'opacity-20'
              )}
              variants={pulseRingVariants}
              animate="animate"
            />
            <motion.div
              className={cn(
                'absolute rounded-full',
                categoryColors.bg,
                sizeClasses.container,
                'opacity-10'
              )}
              variants={pulseRingVariants}
              animate="animate"
              transition={{ delay: 0.5 }}
            />
          </>
        )}

        {/* Floating container for the marker */}
        <motion.div
          className="relative"
          variants={isLive ? floatVariants : undefined}
          animate={isLive ? 'animate' : undefined}
        >
          {/* Selection ring */}
          {isSelected && (
            <motion.div
              className={cn(
                'absolute -inset-1 rounded-full ring-4 ring-primary-500'
              )}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            />
          )}

          {/* Main marker - Host avatar with glow effect */}
          <motion.div
            className={cn(
              'relative rounded-full overflow-hidden',
              'border-3 border-white shadow-lg',
              sizeClasses.container,
              isLive && categoryColors.glow
            )}
            variants={isLive ? glowVariants : undefined}
            animate={isLive ? 'animate' : undefined}
          >
            {room.hostAvatarUrl ? (
              <Avatar
                src={room.hostAvatarUrl}
                alt={room.hostName}
                size={sizeClasses.avatar}
                className="w-full h-full"
              />
            ) : (
              <div
                className={cn(
                  'w-full h-full flex items-center justify-center',
                  categoryColors.bg,
                  'text-white'
                )}
              >
                <CategoryIcon className="w-1/2 h-1/2" />
              </div>
            )}
          </motion.div>

          {/* Participants count badge */}
          <div
            className={cn(
              'absolute -top-1 -right-1 flex items-center justify-center',
              'bg-gray-900 text-white font-bold rounded-full',
              'border-2 border-white shadow-md',
              sizeClasses.participants
            )}
          >
            <Users className="w-2.5 h-2.5 mr-0.5" />
            {room.currentParticipants}
          </div>

          {/* Status badge (LIVE/OPEN/BREAK) */}
          {isActive && (
            <motion.div
              className={cn(
                'absolute -bottom-2 left-1/2 -translate-x-1/2',
                'flex items-center gap-0.5',
                statusConfig.color,
                'text-white font-bold rounded-full shadow-md',
                sizeClasses.badge
              )}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Animated dot for LIVE */}
              {isLive && (
                <motion.div
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    statusConfig.dotColor
                  )}
                  variants={liveDotVariants}
                  animate="animate"
                />
              )}
              {statusConfig.label}
            </motion.div>
          )}

          {/* Study duration indicator (for studying status) */}
          {isLive && formattedDuration && (
            <div
              className={cn(
                'absolute -bottom-6 left-1/2 -translate-x-1/2',
                'text-[9px] text-gray-500 font-medium whitespace-nowrap'
              )}
            >
              {formattedDuration}
            </div>
          )}
        </motion.div>

        {/* Room title */}
        {showTitle && (
          <motion.div
            className={cn(
              'mt-3 px-2 py-1',
              'bg-white/95 backdrop-blur-sm rounded-lg shadow-sm',
              'text-gray-800 font-medium text-center truncate',
              sizeClasses.title
            )}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {room.title}
          </motion.div>
        )}
      </motion.div>
    );
  }
);

RoomMarker.displayName = 'RoomMarker';

export { RoomMarker, CATEGORY_ICONS, CATEGORY_COLORS, STATUS_CONFIG };
