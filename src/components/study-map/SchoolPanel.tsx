'use client';

import { forwardRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  School,
  MapPin,
  Users,
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomSheet, Badge, Avatar, Button } from '@/components/ui';
import { type SchoolMarkerData, type SchoolType, SCHOOL_TYPE_LABELS } from './SchoolMarker';
import { type RoomMarkerData, type SessionStatus, CATEGORY_COLORS, CATEGORY_ICONS } from './RoomMarker';

// ============================================
// Types
// ============================================
export interface SchoolPanelProps {
  /** Is the panel open */
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
  other: School,
};

// ============================================
// Sub-components
// ============================================
interface RoomListItemProps {
  room: RoomMarkerData;
  onClick?: (room: RoomMarkerData) => void;
  onJoin?: (room: RoomMarkerData) => void;
}

const RoomListItem = forwardRef<HTMLDivElement, RoomListItemProps>(
  ({ room, onClick, onJoin }, ref) => {
    const categoryColors = CATEGORY_COLORS[room.category];
    const CategoryIcon = CATEGORY_ICONS[room.category];
    const isLive = room.sessionStatus === 'studying';
    const isOpen = room.sessionStatus === 'waiting';
    const isActive = room.sessionStatus !== 'ended';

    const statusBadge = useMemo(() => {
      switch (room.sessionStatus) {
        case 'studying':
          return (
            <Badge variant="error" size="sm" className="animate-pulse">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </span>
            </Badge>
          );
        case 'waiting':
          return (
            <Badge variant="success" size="sm">
              OPEN
            </Badge>
          );
        case 'break':
          return (
            <Badge variant="warning" size="sm">
              BREAK
            </Badge>
          );
        default:
          return null;
      }
    }, [room.sessionStatus]);

    return (
      <motion.div
        ref={ref}
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl',
          'bg-white border border-gray-100',
          'transition-all duration-200',
          isActive && 'hover:border-gray-200 hover:shadow-sm cursor-pointer',
          isLive && 'border-red-100 bg-red-50/30',
          !isActive && 'opacity-60'
        )}
        whileHover={isActive ? { scale: 1.01, y: -1 } : undefined}
        whileTap={isActive ? { scale: 0.99 } : undefined}
        onClick={() => isActive && onClick?.(room)}
      >
        {/* Host avatar with category indicator */}
        <div className="relative flex-shrink-0">
          <Avatar
            src={room.hostAvatarUrl}
            alt={room.hostName}
            size="md"
            fallback={room.hostName}
          />
          <div
            className={cn(
              'absolute -bottom-1 -right-1 w-5 h-5 rounded-full',
              'flex items-center justify-center',
              'border-2 border-white',
              categoryColors.bg
            )}
          >
            <CategoryIcon className="w-2.5 h-2.5 text-white" />
          </div>
        </div>

        {/* Room info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 truncate text-sm">
              {room.title}
            </h4>
            {statusBadge}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
            <span className="truncate">{room.hostName}</span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-0.5">
              <Users className="w-3 h-3" />
              {room.currentParticipants}/{room.maxParticipants}
            </span>
            {room.studyDurationMinutes && isLive && (
              <>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {room.studyDurationMinutes}min
                </span>
              </>
            )}
          </div>
        </div>

        {/* Join button */}
        {isOpen && (
          <Button
            size="sm"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              onJoin?.(room);
            }}
            className="flex-shrink-0"
          >
            Join
          </Button>
        )}

        {isLive && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(room);
            }}
            className="flex-shrink-0"
          >
            View
          </Button>
        )}
      </motion.div>
    );
  }
);

RoomListItem.displayName = 'RoomListItem';

// ============================================
// Main Component
// ============================================
const SchoolPanel = forwardRef<HTMLDivElement, SchoolPanelProps>(
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
    const [isExpanded, setIsExpanded] = useState(false);

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

    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        height={isExpanded ? 'full' : 'half'}
        showHandle
        dragToClose
        className={className}
      >
        <div ref={ref} className="flex flex-col h-full">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    'bg-gradient-to-br from-indigo-500 to-purple-600 text-white',
                    'shadow-lg'
                  )}
                >
                  <SchoolIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">
                      {school.name}
                    </h2>
                    {isUserSchool && (
                      <Badge variant="primary" size="sm">
                        My School
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{SCHOOL_TYPE_LABELS[school.type]}</span>
                  </div>
                </div>
              </div>

              {/* Expand/Collapse button */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-sm">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-medium text-gray-700">{liveCount} Live</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="font-medium text-gray-700">{openCount} Open</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{totalParticipants} studying</span>
              </div>
            </div>
          </div>

          {/* Room list */}
          <div className="flex-1 overflow-y-auto px-5 py-3">
            {isLoading ? (
              // Loading skeleton
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-xl bg-gray-100 animate-pulse"
                  />
                ))}
              </div>
            ) : sortedRooms.length === 0 ? (
              // Empty state
              <motion.div
                className="flex flex-col items-center justify-center py-12 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  No active rooms
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Be the first to start a study session!
                </p>
                {isUserSchool && onCreateRoom && (
                  <Button
                    variant="primary"
                    onClick={() => onCreateRoom(school.id)}
                    leftIcon={<BookOpen className="w-4 h-4" />}
                  >
                    Create Room
                  </Button>
                )}
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div
                  className="space-y-2"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.05,
                      },
                    },
                  }}
                >
                  {sortedRooms.map((room) => (
                    <motion.div
                      key={room.id}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 },
                      }}
                    >
                      <RoomListItem
                        room={room}
                        onClick={onRoomClick}
                        onJoin={onJoinRoom}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Footer - Create room button */}
          {sortedRooms.length > 0 && isUserSchool && onCreateRoom && (
            <div className="px-5 py-4 border-t border-gray-100 bg-white">
              <Button
                variant="primary"
                fullWidth
                onClick={() => onCreateRoom(school.id)}
                leftIcon={<BookOpen className="w-4 h-4" />}
              >
                Create Study Room
              </Button>
            </div>
          )}
        </div>
      </BottomSheet>
    );
  }
);

SchoolPanel.displayName = 'SchoolPanel';

export { SchoolPanel };
