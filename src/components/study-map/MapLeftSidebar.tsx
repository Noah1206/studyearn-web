'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Navigation,
  School,
  GraduationCap,
  Building2,
  X,
  ChevronLeft,
  BookOpen,
  Loader2,
  Plus,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button, Avatar } from '@/components/ui';
import { useSearchSchools, useNearbySchools, type School as SchoolData, type SchoolWithRelevance } from '@/hooks/sweetme';
import { type SchoolMarkerData, type SchoolType, SCHOOL_TYPE_LABELS } from './SchoolMarker';
import { type RoomMarkerData, type SessionStatus, CATEGORY_ICONS } from './RoomMarker';

// ============================================
// Types
// ============================================
export interface MapLeftSidebarProps {
  /** User's current location */
  userLocation: { lat: number; lng: number } | null;
  /** Currently selected school */
  selectedSchool: SchoolMarkerData | null;
  /** Rooms in selected school */
  selectedSchoolRooms: RoomMarkerData[];
  /** Loading state for rooms */
  isLoadingRooms?: boolean;
  /** School click handler */
  onSchoolSelect: (school: SchoolMarkerData) => void;
  /** Close selected school */
  onCloseSchool: () => void;
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
// Helper Functions
// ============================================
function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

function dbSchoolTypeToMarkerType(type: string): SchoolType {
  const typeMap: Record<string, SchoolType> = {
    '초등학교': 'elementary',
    '중학교': 'middle',
    '고등학교': 'high',
    '대학교': 'university',
    '기타': 'other',
  };
  return typeMap[type] || 'other';
}

function schoolToMarkerData(school: SchoolData | SchoolWithRelevance): SchoolMarkerData {
  return {
    id: school.id,
    name: school.name,
    shortName: (school as SchoolData).short_name || undefined,
    type: dbSchoolTypeToMarkerType(school.type),
    activeRoomsCount: school.active_rooms_count || 0,
    latitude: school.latitude,
    longitude: school.longitude,
  };
}

function getSchoolTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    '중학교': '중',
    '고등학교': '고',
    '대학교': '대',
    '초등학교': '초',
    '기타': '기타',
  };
  return labels[type] || type.charAt(0);
}

function getSchoolTypeColor(type: string): string {
  const colors: Record<string, string> = {
    '중학교': 'bg-blue-500',
    '고등학교': 'bg-orange-500',
    '대학교': 'bg-purple-500',
    '초등학교': 'bg-green-500',
    '기타': 'bg-gray-500',
  };
  return colors[type] || 'bg-gray-500';
}

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
    <div
      className={cn(
        'group relative p-3 rounded-lg',
        'bg-white border border-gray-200/80',
        'transition-all duration-200 cursor-pointer',
        'hover:border-gray-300 hover:shadow-sm'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Avatar
          src={room.hostAvatarUrl}
          alt={room.hostName}
          size="sm"
          fallback={room.hostName}
        />
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
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
          <CategoryIcon className="w-3.5 h-3.5 text-gray-500" />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
        <span>{room.currentParticipants}/{room.maxParticipants}명</span>
        {isLive && room.studyDurationMinutes && (
          <span>{room.studyDurationMinutes}분째</span>
        )}
        {isOpen && !isFull && (
          <span className="text-blue-600">참여 가능</span>
        )}
      </div>

      {isOpen && !isFull && (
        <Button
          size="sm"
          variant="primary"
          onClick={(e) => {
            e.stopPropagation();
            onJoin?.();
          }}
          className="w-full mt-2"
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
          className="w-full mt-2"
        >
          구경하기
        </Button>
      )}
    </div>
  );
};

// ============================================
// Main Component
// ============================================
export function MapLeftSidebar({
  userLocation,
  selectedSchool,
  selectedSchoolRooms,
  isLoadingRooms = false,
  onSchoolSelect,
  onCloseSchool,
  onRoomClick,
  onJoinRoom,
  onCreateRoom,
  className,
}: MapLeftSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Search schools from DB
  const {
    data: searchResults,
    isLoading: isSearching,
    search,
    clearSearch,
  } = useSearchSchools(
    userLocation ? {
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      radiusKm: 50,
      sortBy: 'relevance',
      limit: 10,
    } : undefined,
    {
      enabled: true,
      debounceMs: 300,
      minQueryLength: 1,
    }
  );

  // Nearby schools from DB
  const {
    data: nearbySchools,
    isLoading: isLoadingNearby,
  } = useNearbySchools(
    userLocation ? {
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      radiusKm: 15,
    } : null,
    {
      enabled: !!userLocation,
      staleTime: 60 * 1000,
    }
  );

  // Filter nearby schools to middle and high schools only
  const filteredNearbySchools = useMemo(() => {
    if (!nearbySchools) return [];
    return nearbySchools
      .filter(s => s.type === '중학교' || s.type === '고등학교')
      .slice(0, 8);
  }, [nearbySchools]);

  // Sort rooms
  const sortedRooms = useMemo(() => {
    return [...selectedSchoolRooms].sort(
      (a, b) => STATUS_SORT_ORDER[a.sessionStatus] - STATUS_SORT_ORDER[b.sessionStatus]
    );
  }, [selectedSchoolRooms]);

  // Stats for selected school
  const liveCount = selectedSchoolRooms.filter(r => r.sessionStatus === 'studying').length;
  const openCount = selectedSchoolRooms.filter(r => r.sessionStatus === 'waiting').length;
  const totalParticipants = selectedSchoolRooms.reduce((sum, r) => sum + r.currentParticipants, 0);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    search(value);
  }, [search]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    clearSearch();
  }, [clearSearch]);

  const handleSchoolClick = useCallback((school: SchoolData | SchoolWithRelevance) => {
    const markerData = schoolToMarkerData(school);
    onSchoolSelect(markerData);
    handleClearSearch();
  }, [onSchoolSelect, handleClearSearch]);

  const SchoolIcon = selectedSchool ? SCHOOL_TYPE_ICONS[selectedSchool.type] : School;
  const hasLogo = selectedSchool?.logoUrl;

  return (
    <div
      className={cn(
        'fixed left-0 top-16 bottom-0 z-40',
        'w-80 bg-white shadow-lg border-r border-gray-200',
        'flex flex-col',
        className
      )}
    >
      {/* Header with Search */}
      <div className="flex-shrink-0 p-4 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="학교 검색..."
            className={cn(
              'w-full pl-10 pr-10 py-2.5 rounded-xl',
              'bg-gray-50 border border-gray-200',
              'text-sm placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
              'transition-all duration-200'
            )}
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Search Results */}
          {searchQuery && (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <h3 className="text-sm font-medium text-gray-500 mb-3">검색 결과</h3>
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : searchResults?.schools && searchResults.schools.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.schools.map((school) => (
                    <button
                      key={school.id}
                      onClick={() => handleSchoolClick(school)}
                      className={cn(
                        'w-full p-3 flex items-center gap-3',
                        'bg-gray-50 rounded-xl',
                        'hover:bg-gray-100 active:bg-gray-200 transition-colors',
                        'text-left'
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0',
                          getSchoolTypeColor(school.type)
                        )}
                      >
                        {getSchoolTypeLabel(school.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {school.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {school.distance_km != null && (
                            <>
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {formatDistance(school.distance_km)}
                              </span>
                            </>
                          )}
                          {school.active_rooms_count > 0 && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span className="text-xs text-orange-500 font-medium">
                                {school.active_rooms_count}개 진행중
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Navigation className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  검색 결과가 없습니다
                </div>
              )}
            </motion.div>
          )}

          {/* Selected School Detail */}
          {!searchQuery && selectedSchool && (
            <motion.div
              key="selected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* School Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={onCloseSchool}
                    className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-400" />
                  </button>
                  <span className="text-sm text-gray-500">학교 상세</span>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex-shrink-0 w-12 h-12 rounded-xl',
                      'flex items-center justify-center overflow-hidden',
                      'bg-gray-100'
                    )}
                  >
                    {hasLogo ? (
                      <Image
                        src={selectedSchool.logoUrl!}
                        alt={selectedSchool.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-contain p-1.5"
                        unoptimized
                      />
                    ) : (
                      <SchoolIcon className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-gray-900 truncate">
                      {selectedSchool.name}
                    </h2>
                    <span className="text-sm text-gray-500">
                      {SCHOOL_TYPE_LABELS[selectedSchool.type]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
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

              {/* Room List */}
              <div className="p-4">
                {isLoadingRooms ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-24 rounded-lg bg-gray-100 animate-pulse"
                      />
                    ))}
                  </div>
                ) : sortedRooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                      <BookOpen className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">
                      진행 중인 스터디가 없습니다
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">
                      첫 번째 스터디를 만들어보세요
                    </p>
                    {onCreateRoom && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onCreateRoom(selectedSchool.id)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        스터디 만들기
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sortedRooms.map((room) => (
                      <SessionCard
                        key={room.id}
                        room={room}
                        onClick={() => onRoomClick?.(room)}
                        onJoin={() => onJoinRoom?.(room)}
                      />
                    ))}
                    {onCreateRoom && (
                      <Button
                        variant="outline"
                        fullWidth
                        onClick={() => onCreateRoom(selectedSchool.id)}
                        className="mt-3"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        스터디 만들기
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Nearby Schools (default view) */}
          {!searchQuery && !selectedSchool && (
            <motion.div
              key="nearby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">내 근처 학교</h3>
                {isLoadingNearby && (
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                )}
              </div>

              {!userLocation ? (
                <div className="text-center py-8">
                  <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    위치 권한을 허용하면<br />
                    근처 학교를 볼 수 있어요
                  </p>
                </div>
              ) : filteredNearbySchools.length === 0 && !isLoadingNearby ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  근처에 학교가 없습니다
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNearbySchools.map((school) => (
                    <button
                      key={school.id}
                      onClick={() => handleSchoolClick(school)}
                      className={cn(
                        'w-full p-3 flex items-center gap-3',
                        'bg-gray-50 rounded-xl',
                        'hover:bg-gray-100 active:bg-gray-200 transition-colors',
                        'text-left group'
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0',
                          getSchoolTypeColor(school.type)
                        )}
                      >
                        {getSchoolTypeLabel(school.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {school.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {school.distance_km != null ? formatDistance(school.distance_km) : '-'}
                          </span>
                          {school.active_rooms_count > 0 && (
                            <>
                              <span className="text-gray-300">·</span>
                              <span className="text-xs text-orange-500 font-medium">
                                {school.active_rooms_count}개 진행중
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Navigation className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}

              {/* Tips */}
              <div className="mt-6 p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-700">
                  <span className="font-medium">팁:</span> 학교를 선택하면 진행 중인 스터디를 볼 수 있어요
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default MapLeftSidebar;
