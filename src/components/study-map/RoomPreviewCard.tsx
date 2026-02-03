'use client';

import { forwardRef, useMemo } from 'react';
import { motion, type Variants, AnimatePresence } from 'framer-motion';
import {
  Users,
  Clock,
  X,
  Timer,
  BookOpen,
  ArrowRight,
  Headphones,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, Badge, Button, Card } from '@/components/ui';
import {
  type RoomMarkerData,
  type SessionStatus,
  type RoomCategory,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
} from './RoomMarker';

// ============================================
// Types
// ============================================
export interface RoomPreviewCardProps {
  /** Room data */
  room: RoomMarkerData | null;
  /** Is the card visible */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Join room handler */
  onJoin?: (room: RoomMarkerData) => void;
  /** View room handler (for live rooms) */
  onView?: (room: RoomMarkerData) => void;
  /** Custom className */
  className?: string;
}

// ============================================
// Constants
// ============================================
const CATEGORY_LABELS: Record<RoomCategory, string> = {
  math: 'Mathematics',
  english: 'English',
  science: 'Science',
  coding: 'Coding',
  language: 'Language',
  art: 'Art',
  music: 'Music',
  other: 'General',
};

const STATUS_MESSAGES: Record<SessionStatus, string> = {
  waiting: 'Waiting for participants',
  studying: 'Study session in progress',
  break: 'Taking a short break',
  ended: 'Session has ended',
};

// ============================================
// Animation Variants
// ============================================
const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 100,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: 50,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ============================================
// Component
// ============================================
const RoomPreviewCard = forwardRef<HTMLDivElement, RoomPreviewCardProps>(
  ({ room, isOpen, onClose, onJoin, onView, className }, ref) => {
    if (!room) return null;

    const CategoryIcon = CATEGORY_ICONS[room.category];
    const categoryColors = CATEGORY_COLORS[room.category];
    const isLive = room.sessionStatus === 'studying';
    const isOpen_ = room.sessionStatus === 'waiting';
    const canJoin = isOpen_ || room.sessionStatus === 'break';
    const isActive = room.sessionStatus !== 'ended';

    // Format duration
    const formattedDuration = useMemo(() => {
      if (!room.studyDurationMinutes) return null;
      const hours = Math.floor(room.studyDurationMinutes / 60);
      const mins = room.studyDurationMinutes % 60;
      if (hours > 0) {
        return `${hours}h ${mins}m`;
      }
      return `${mins} min`;
    }, [room.studyDurationMinutes]);

    // Spots available
    const spotsLeft = room.maxParticipants - room.currentParticipants;
    const isFull = spotsLeft <= 0;

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={ref}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-40',
              'px-4 pb-6 pt-2',
              'pointer-events-none',
              className
            )}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Card
              variant="elevated"
              padding="none"
              className={cn(
                'pointer-events-auto',
                'max-w-lg mx-auto',
                'overflow-hidden',
                'border border-gray-100'
              )}
            >
              {/* Header with category color bar */}
              <div
                className={cn(
                  'h-1.5',
                  categoryColors.bg
                )}
              />

              {/* Close button */}
              <button
                onClick={onClose}
                className={cn(
                  'absolute top-4 right-4 z-10',
                  'w-8 h-8 rounded-full',
                  'bg-gray-100 hover:bg-gray-200',
                  'flex items-center justify-center',
                  'transition-colors'
                )}
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>

              <div className="p-4">
                {/* Host info */}
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <Avatar
                      src={room.hostAvatarUrl}
                      alt={room.hostName}
                      size="lg"
                      fallback={room.hostName}
                    />
                    {/* LIVE indicator on avatar */}
                    {isLive && (
                      <motion.div
                        className={cn(
                          'absolute -bottom-1 -right-1',
                          'w-5 h-5 rounded-full',
                          'bg-red-500 border-2 border-white',
                          'flex items-center justify-center'
                        )}
                        variants={pulseVariants}
                        animate="animate"
                      >
                        <span className="text-[8px] font-bold text-white">
                          LIVE
                        </span>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-gray-900 truncate">
                        {room.title}
                      </h3>
                      {isLive && (
                        <Badge variant="error" size="sm" className="animate-pulse">
                          LIVE
                        </Badge>
                      )}
                      {isOpen_ && (
                        <Badge variant="success" size="sm">
                          OPEN
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Hosted by <span className="font-medium">{room.hostName}</span>
                    </p>
                  </div>
                </div>

                {/* Category and Stats */}
                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  {/* Category badge */}
                  <div
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-full',
                      'bg-gray-100'
                    )}
                  >
                    <CategoryIcon className={cn('w-3.5 h-3.5', categoryColors.text)} />
                    <span className="text-xs font-medium text-gray-700">
                      {CATEGORY_LABELS[room.category]}
                    </span>
                  </div>

                  {/* Participants */}
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>
                      {room.currentParticipants}/{room.maxParticipants}
                    </span>
                    {!isFull && canJoin && (
                      <span className="text-green-600 font-medium">
                        ({spotsLeft} spots left)
                      </span>
                    )}
                    {isFull && (
                      <span className="text-red-500 font-medium">(Full)</span>
                    )}
                  </div>

                  {/* Duration */}
                  {formattedDuration && isLive && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Timer className="w-4 h-4" />
                      <span>{formattedDuration}</span>
                    </div>
                  )}
                </div>

                {/* Status message */}
                <div className="mt-3 p-3 rounded-xl bg-gray-50">
                  <p className="text-sm text-gray-600">
                    {STATUS_MESSAGES[room.sessionStatus]}
                  </p>
                </div>

                {/* Features (example - could be dynamic) */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Video className="w-3.5 h-3.5" />
                    <span>Video On</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Headphones className="w-3.5 h-3.5" />
                    <span>Audio On</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex gap-2">
                  {canJoin && !isFull && (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => onJoin?.(room)}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Join Room
                    </Button>
                  )}

                  {canJoin && isFull && (
                    <Button variant="secondary" fullWidth disabled>
                      Room is Full
                    </Button>
                  )}

                  {isLive && (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => onView?.(room)}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      View Session
                    </Button>
                  )}

                  {!isActive && (
                    <Button variant="secondary" fullWidth disabled>
                      Session Ended
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

RoomPreviewCard.displayName = 'RoomPreviewCard';

export { RoomPreviewCard, CATEGORY_LABELS };
