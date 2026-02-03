'use client';

import { forwardRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  BookOpen,
  GraduationCap,
  School,
  Building2,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button, Avatar } from '@/components/ui';
import { type SchoolMarkerData, type SchoolType, SCHOOL_TYPE_LABELS } from './SchoolMarker';
import { type RoomMarkerData, type SessionStatus, CATEGORY_ICONS } from './RoomMarker';

// ============================================
// Types
// ============================================
export interface MapSidebarProps {
  /** Is the sidebar open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Selected school data */
  school: SchoolMarkerData | null;
  /** Active rooms in this school */
  rooms: RoomMarkerData[];
  /** Loading state */
  isLoading?: boolean;
  /** Is this the user's school */
  isUserSchool?: boolean;
  /** Room click handler */
  onRoomClick?: (room: RoomMarkerData) => void;
  /** Join room handler */
  onJoinRoom?: (room: RoomMarkerData) => void;
  /** Create room handler */
  onCreateRoom?: (schoolId: string) => void;
  /** Custom className */
  className?: string;
}

// ============================================
// Constants
// ============================================
const STATUS_SORT_ORDER: Record<SessionStatus, number> = {
  studying: 0,
  waiting: 1,
  break: 2,
  ended: 3,
};

const SCHOOL_TYPE_ICONS: Record<SchoolType, typeof School> = {
  elementary: School,
  middle: School,
  high: School,
  university: GraduationCap,
  other: Building2,
};

// ============================================
// Animation Variants
// ============================================
const sidebarVariants = {
  closed: {
    x: '-100%',
    opacity: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 40,
    },
  },
  open: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 40,
    },
  },
};

const backdropVariants = {
  closed: { opacity: 0 },
  open: { opacity: 1 },
};

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

// ============================================
// Sub-components
// ============================================
interface SessionCardProps {
  room: RoomMarkerData;
  onClick?: () => void;
  onJoin?: () => void;
}

const SessionCard = ({ room, onClick, onJoin }: SessionCardProps) => {
  const CategoryIcon = CATEGORY_ICONS[room.category];
  const isLive = room.sessionStatus === 'studying';
  const isOpen = room.sessionStatus === 'waiting';
  const isFull = room.currentParticipants >= room.maxParticipants;

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        'group relative p-4 rounded-lg',
        'bg-white border border-gray-200/80',
        'transition-all duration-200 cursor-pointer',
        'hover:border-gray-300 hover:shadow-sm'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Host Avatar */}
        <Avatar
          src={room.hostAvatarUrl}
          alt={room.hostName}
          size="md"
          fallback={room.hostName}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 truncate text-sm">
              {room.title}
            </h4>
            {isLive && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {room.hostName}
          </p>
        </div>

        {/* Category Icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <CategoryIcon className="w-4 h-4 text-gray-500" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <span>{room.currentParticipants}/{room.maxParticipants}명</span>
        {isLive && room.studyDurationMinutes && (
          <span>{room.studyDurationMinutes}분째</span>
        )}
        {isOpen && !isFull && (
          <span className="text-blue-600">참여 가능</span>
        )}
      </div>

      {/* Action Button */}
      {isOpen && !isFull && (
        <Button
          size="sm"
          variant="primary"
          onClick={(e) => {
            e.stopPropagation();
            onJoin?.();
          }}
          className="w-full mt-3"
        >
          참여하기
        </Button>
      )}

      {isLive && (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="w-full mt-3"
        >
          구경하기
        </Button>
      )}
    </motion.div>
  );
};

// ============================================
// Main Component
// ============================================
const MapSidebar = forwardRef<HTMLDivElement, MapSidebarProps>(
  (
    {
      isOpen,
      onClose,
      school,
      rooms,
      isLoading = false,
      isUserSchool = false,
      onRoomClick,
      onJoinRoom,
      onCreateRoom,
      className,
    },
    ref
  ) => {
    // Sort rooms: LIVE first, then OPEN, then BREAK
    const sortedRooms = useMemo(() => {
      return [...rooms].sort(
        (a, b) => STATUS_SORT_ORDER[a.sessionStatus] - STATUS_SORT_ORDER[b.sessionStatus]
      );
    }, [rooms]);

    // Stats
    const liveCount = rooms.filter((r) => r.sessionStatus === 'studying').length;
    const openCount = rooms.filter((r) => r.sessionStatus === 'waiting').length;
    const totalParticipants = rooms.reduce((sum, r) => sum + r.currentParticipants, 0);

    if (!school) return null;

    const SchoolIcon = SCHOOL_TYPE_ICONS[school.type];
    const hasLogo = !!school.logoUrl;

    return (
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Backdrop - Only on mobile */}
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
              variants={backdropVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={onClose}
            />

            {/* Sidebar */}
            <motion.div
              ref={ref}
              className={cn(
                'fixed left-0 top-16 bottom-0 z-40',
                'w-full max-w-sm lg:max-w-md',
                'bg-gray-50 shadow-2xl',
                'flex flex-col',
                className
              )}
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              {/* Header */}
              <div className="flex-shrink-0 bg-white border-b border-gray-200/60">
                {/* Close button row */}
                <div className="flex items-center justify-between p-4 pb-0">
                  <button
                    onClick={onClose}
                    className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                  {isUserSchool && (
                    <span className="text-xs text-blue-600 font-medium">내 학교</span>
                  )}
                </div>

                {/* School Info */}
                <div className="p-4 pt-2">
                  <div className="flex items-center gap-3">
                    {/* Logo */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-12 h-12 rounded-lg',
                        'flex items-center justify-center overflow-hidden',
                        'bg-gray-100'
                      )}
                    >
                      {hasLogo ? (
                        <Image
                          src={school.logoUrl!}
                          alt={school.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-contain p-1.5"
                          unoptimized
                        />
                      ) : (
                        <SchoolIcon className="w-6 h-6 text-gray-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-gray-900 truncate">
                        {school.name}
                      </h2>
                      <span className="text-sm text-gray-500">
                        {SCHOOL_TYPE_LABELS[school.type]}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span>{liveCount} 진행중</span>
                    </div>
                    <span className="text-gray-300">·</span>
                    <span>{openCount} 대기중</span>
                    <span className="text-gray-300">·</span>
                    <span>{totalParticipants}명</span>
                  </div>
                </div>
              </div>

              {/* Room List */}
              <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                  // Loading skeleton
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-28 rounded-lg bg-gray-100 animate-pulse"
                      />
                    ))}
                  </div>
                ) : sortedRooms.length === 0 ? (
                  // Empty state
                  <motion.div
                    className="flex flex-col items-center justify-center py-16 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                      <BookOpen className="w-7 h-7 text-gray-400" />
                    </div>
                    <h3 className="text-base font-medium text-gray-700 mb-1">
                      진행 중인 스터디가 없습니다
                    </h3>
                    <p className="text-sm text-gray-500 mb-5">
                      첫 번째 스터디를 만들어보세요
                    </p>
                    {onCreateRoom && (
                      <Button
                        variant="primary"
                        onClick={() => onCreateRoom(school.id)}
                      >
                        스터디 만들기
                      </Button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    className="space-y-3"
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {sortedRooms.map((room) => (
                      <SessionCard
                        key={room.id}
                        room={room}
                        onClick={() => onRoomClick?.(room)}
                        onJoin={() => onJoinRoom?.(room)}
                      />
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Footer - Create room button */}
              {sortedRooms.length > 0 && onCreateRoom && (
                <div className="flex-shrink-0 p-4 bg-white border-t border-gray-200/60">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => onCreateRoom(school.id)}
                  >
                    스터디 만들기
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }
);

MapSidebar.displayName = 'MapSidebar';

export { MapSidebar };
