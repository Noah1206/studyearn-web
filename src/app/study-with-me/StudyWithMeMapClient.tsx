'use client';

import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Navigation, Minus, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import {
  AbstractLocationMap,
  LocationMarker,
  UserPulse,
  MapLeftSidebar,
  SchoolMarker,
  MapSidebar,
  NearbySchoolsRecommendation,
  type AbstractLocationMapRef,
  type Coordinates,
  type SchoolMarkerData,
  type RoomMarkerData,
  type SchoolType,
  type RoomCategory,
} from '@/components/study-map';
import {
  useSchoolRooms,
  useJoinRoom,
  type RoomDetail,
} from '@/hooks/sweetme';
import { SCHOOLS_DATA, type SchoolData } from '@/data/schools';
import { useStudyMapStore } from '@/stores';

// ============================================
// Types
// ============================================
interface StudyWithMeMapClientProps {
  initialRooms?: RoomMarkerData[];
}

// ============================================
// Constants
// ============================================
const DEFAULT_CENTER: Coordinates = { lat: 37.5665, lng: 126.978 };
const DEFAULT_ZOOM = 14;

// ============================================
// Helper Functions
// ============================================
function schoolDataToMarkerData(school: SchoolData): SchoolMarkerData {
  const typeMap: Record<string, SchoolType> = {
    '초등학교': 'elementary',
    '중학교': 'middle',
    '고등학교': 'high',
    '대학교': 'university',
    '기타': 'other',
  };

  return {
    id: school.id,
    name: school.name,
    shortName: school.short_name || undefined,
    type: typeMap[school.type] || 'other',
    activeRoomsCount: school.active_rooms_count,
    latitude: school.latitude,
    longitude: school.longitude,
    logoUrl: school.logo_url || undefined,
  };
}

function roomToMarkerData(room: RoomDetail): RoomMarkerData {
  let category: RoomCategory = 'other';
  if (room.tags && room.tags.length > 0) {
    const tag = room.tags[0].toLowerCase();
    if (tag.includes('math') || tag.includes('수학')) category = 'math';
    else if (tag.includes('english') || tag.includes('영어')) category = 'english';
    else if (tag.includes('science') || tag.includes('과학')) category = 'science';
    else if (tag.includes('coding') || tag.includes('코딩') || tag.includes('프로그래밍')) category = 'coding';
    else if (tag.includes('language') || tag.includes('언어') || tag.includes('국어')) category = 'language';
    else if (tag.includes('art') || tag.includes('미술') || tag.includes('예술')) category = 'art';
    else if (tag.includes('music') || tag.includes('음악')) category = 'music';
  }

  let studyDurationMinutes: number | undefined;
  if (room.session_status === 'studying' && room.session_start_time) {
    const startTime = new Date(room.session_start_time);
    const now = new Date();
    studyDurationMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);
  }

  return {
    id: room.id,
    title: room.name,
    hostName: room.creator_name || 'Unknown',
    hostAvatarUrl: room.creator_avatar_url || undefined,
    category,
    sessionStatus: room.session_status,
    currentParticipants: room.current_participants,
    maxParticipants: room.max_participants,
    studyDurationMinutes,
    latitude: room.latitude,
    longitude: room.longitude,
  };
}

// ============================================
// Main Component
// ============================================
export default function StudyWithMeMapClient({ initialRooms = [] }: StudyWithMeMapClientProps) {
  const router = useRouter();
  const mapRef = useRef<AbstractLocationMapRef>(null);

  // Local state for map
  const [mapCenter, setMapCenter] = useState<Coordinates>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);

  // Zustand store
  const {
    zoom,
    setZoom,
    userLocation,
    setUserLocation,
    isLocating,
    setIsLocating,
    selectedSchool,
    isSidebarOpen,
    filters,
    handleSchoolClick,
    closeSidebar,
    setFilters,
  } = useStudyMapStore();

  const selectedSchoolId = selectedSchool?.id || null;

  // Use static school data - no server fetch needed!
  // Schools data is loaded instantly from local file

  // Fetch rooms for selected school
  const { data: schoolRoomsData, isLoading: isLoadingSchoolRooms } = useSchoolRooms(selectedSchoolId, {
    sessionStatus: 'all',
    enabled: !!selectedSchoolId,
    refetchInterval: 30000,
  });

  // Join room mutation
  const { mutate: joinRoomMutation } = useJoinRoom({
    onSuccess: (data) => console.log('Successfully joined room:', data.room.name),
    onError: (error) => console.error('Failed to join room:', error.message),
  });

  // Convert static data to component types - instant, no loading!
  const schools = useMemo((): SchoolMarkerData[] => {
    return SCHOOLS_DATA.map(schoolDataToMarkerData);
  }, []);

  const roomsInSelectedSchool = useMemo((): RoomMarkerData[] => {
    if (schoolRoomsData?.rooms && schoolRoomsData.rooms.length > 0) {
      return schoolRoomsData.rooms.map(roomToMarkerData);
    }
    return [];
  }, [schoolRoomsData]);

  // Filtered schools
  const filteredSchools = useMemo(() => {
    let result = schools;
    if (filters.liveOnly) {
      result = result.filter((s) => s.activeRoomsCount > 0);
    }
    if (filters.schoolTypes.length > 0) {
      result = result.filter((s) => filters.schoolTypes.includes(s.type));
    }
    return result;
  }, [schools, filters]);

  // Stats
  const stats = useMemo(() => {
    const totalActive = filteredSchools.reduce((sum, s) => sum + s.activeRoomsCount, 0);
    const totalParticipants = filteredSchools.reduce((sum, s) => sum + (s.totalParticipants || 0), 0);
    const schoolsWithLive = filteredSchools.filter((s) => s.activeRoomsCount > 0).length;
    return {
      totalActive,
      totalParticipants,
      schoolsWithLive,
      totalSchools: filteredSchools.length,
    };
  }, [filteredSchools]);

  // Get user location on mount
  useEffect(() => {
    if (!userLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation({ lat: location.lat, lng: location.lng });
          setMapCenter(location);
        },
        () => {
          // Use default Seoul center if geolocation fails
          setMapCenter(DEFAULT_CENTER);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setMapCenter({ lat: userLocation.lat, lng: userLocation.lng });
    }
  }, [userLocation, setUserLocation]);

  // Handlers
  const handleMapMove = useCallback(
    (center: Coordinates, newZoom: number) => {
      setMapCenter(center);
      setMapZoom(newZoom);
      setZoom(newZoom);
    },
    [setZoom]
  );

  const handleLocateUser = useCallback(() => {
    if (!userLocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation({ lat: location.lat, lng: location.lng });
          mapRef.current?.setCenter(location, true);
          setIsLocating(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      mapRef.current?.setCenter({ lat: userLocation.lat, lng: userLocation.lng }, true);
    }
  }, [userLocation, setUserLocation, setIsLocating]);

  const handleSchoolMarkerClick = useCallback(
    (school: SchoolMarkerData) => {
      handleSchoolClick(school);
      mapRef.current?.setCenter({ lat: school.latitude, lng: school.longitude }, true);
      mapRef.current?.setZoom(18, true); // Maximum zoom for best detail
    },
    [handleSchoolClick]
  );

  const handleJoinRoom = useCallback(
    (room: RoomMarkerData) => {
      joinRoomMutation(
        { roomId: room.id },
        {
          onSuccess: () => router.push(`/study-room/${room.id}`),
          onError: () => router.push(`/study-room/${room.id}`),
        }
      );
    },
    [router, joinRoomMutation]
  );

  const handleViewRoom = useCallback(
    (room: RoomMarkerData) => {
      router.push(`/study-room/${room.id}`);
    },
    [router]
  );

  const handleCreateRoom = useCallback(
    (schoolId?: string) => {
      if (schoolId) {
        router.push(`/study-with-me/create?school=${schoolId}`);
      } else {
        router.push('/study-with-me/create');
      }
    },
    [router]
  );

  const handleSchoolSearch = useCallback(
    (school: SchoolMarkerData) => {
      if (!school) return;

      const existingSchool = schools.find(
        (s) => s.id === school.id || s.name.toLowerCase() === school.name.toLowerCase()
      );

      if (existingSchool) {
        handleSchoolMarkerClick(existingSchool);
      } else {
        const newSchool: SchoolMarkerData = {
          id: school.id,
          name: school.name,
          type: school.type,
          activeRoomsCount: 0,
          latitude: school.latitude,
          longitude: school.longitude,
        };
        handleSchoolClick(newSchool);
        mapRef.current?.setCenter({ lat: school.latitude, lng: school.longitude }, true);
        mapRef.current?.setZoom(18, true); // Maximum zoom for best detail
      }
    },
    [schools, handleSchoolMarkerClick, handleSchoolClick]
  );

  const handleZoomIn = useCallback(() => {
    const currentZoom = mapRef.current?.getZoom() || mapZoom;
    const newZoom = Math.min(currentZoom + 1, 18);
    mapRef.current?.setZoom(newZoom, true);
  }, [mapZoom]);

  const handleZoomOut = useCallback(() => {
    const currentZoom = mapRef.current?.getZoom() || mapZoom;
    const newZoom = Math.max(currentZoom - 1, 10);
    mapRef.current?.setZoom(newZoom, true);
  }, [mapZoom]);

  const handleToggleLiveOnly = useCallback(() => {
    setFilters({ liveOnly: !filters.liveOnly });
  }, [filters.liveOnly, setFilters]);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
      {/* Abstract Location Map - No external API needed */}
      <AbstractLocationMap
        ref={mapRef}
        center={mapCenter}
        zoom={mapZoom}
        minZoom={10}
        maxZoom={18}
        backgroundColor="#F8FAFC"
        gridColor="rgba(148, 163, 184, 0.08)"
        showDistanceRings={true}
        distanceRings={[1, 3, 5, 10]}
        ringColor="rgba(59, 130, 246, 0.12)"
        userLocation={userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null}
        showUserPulse={true}
        showControls={false}
        selectedDestination={selectedSchool ? { lat: selectedSchool.latitude, lng: selectedSchool.longitude } : null}
        showConnectionLine={!!selectedSchool && !!userLocation}
        onMove={handleMapMove}
        onConnectionLineClick={() => {
          if (selectedSchool) {
            mapRef.current?.setCenter({ lat: selectedSchool.latitude, lng: selectedSchool.longitude }, true);
            mapRef.current?.setZoom(18, true);
          }
        }}
        className="w-full h-full"
      >
        {/* School Markers */}
        {filteredSchools.map((school) => {
          // Skip selected school here - we'll render it separately with higher z-index
          if (selectedSchool?.id === school.id) return null;
          return (
            <LocationMarker
              key={school.id}
              position={{ lat: school.latitude, lng: school.longitude }}
              anchor="bottom"
              zIndex={10}
            >
              <SchoolMarker
                school={school}
                isSelected={false}
                onClick={handleSchoolMarkerClick}
              />
            </LocationMarker>
          );
        })}

        {/* Selected School Marker - Always render on top */}
        {selectedSchool && (
          <LocationMarker
            key={`selected-${selectedSchool.id}`}
            position={{ lat: selectedSchool.latitude, lng: selectedSchool.longitude }}
            anchor="bottom"
            zIndex={100}
          >
            <SchoolMarker
              school={selectedSchool}
              isSelected={true}
              onClick={handleSchoolMarkerClick}
            />
          </LocationMarker>
        )}
      </AbstractLocationMap>

      {/* Search Bar - TODO: Implement SchoolSearchBar component */}
      {/* <motion.div
        className="absolute top-4 left-4 right-4 md:left-20 md:right-20 lg:left-1/4 lg:right-1/4 z-30"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <SchoolSearchBar onSchoolSelect={handleSchoolSearch} placeholder="학교 검색" showRecent />
      </motion.div> */}

      {/* Stats Bar */}
      <motion.div
        className="absolute bottom-24 left-4 right-4 md:left-20 md:right-20 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div
          className={cn(
            'flex items-center justify-center gap-6',
            'px-5 py-3 rounded-xl',
            'bg-white/95 backdrop-blur-sm shadow-md border border-gray-200/60'
          )}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-gray-900 font-medium">{stats.totalActive} 진행중</span>
          </div>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-600">{stats.schoolsWithLive.toLocaleString()}개 학교</span>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-500">{stats.totalSchools.toLocaleString()}개 전체</span>
        </div>
      </motion.div>

      {/* Map Controls - Right Side */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        {/* My Location */}
        <button
          onClick={handleLocateUser}
          className={cn(
            'w-12 h-12 rounded-xl bg-white shadow-lg border border-gray-100',
            'flex items-center justify-center',
            'hover:bg-gray-50 active:bg-gray-100 transition-colors',
            isLocating && 'animate-pulse'
          )}
          disabled={isLocating}
        >
          <Navigation className={cn('w-5 h-5', userLocation ? 'text-orange-500' : 'text-gray-400')} />
        </button>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className={cn(
            'w-12 h-12 rounded-xl bg-white shadow-lg border border-gray-100',
            'flex items-center justify-center',
            'hover:bg-gray-50 active:bg-gray-100 transition-colors'
          )}
        >
          <Plus className="w-5 h-5 text-gray-600" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className={cn(
            'w-12 h-12 rounded-xl bg-white shadow-lg border border-gray-100',
            'flex items-center justify-center',
            'hover:bg-gray-50 active:bg-gray-100 transition-colors'
          )}
        >
          <Minus className="w-5 h-5 text-gray-600" />
        </button>

        {/* Live Only Filter */}
        <button
          onClick={handleToggleLiveOnly}
          className={cn(
            'w-12 h-12 rounded-xl shadow-lg border',
            'flex items-center justify-center transition-colors',
            filters.liveOnly
              ? 'bg-red-500 border-red-500 text-white'
              : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
          )}
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Create Room Floating Button */}
      <motion.div
        className="absolute bottom-6 right-4 z-20"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          size="lg"
          onClick={() => handleCreateRoom()}
          className={cn('rounded-full shadow-lg', 'bg-gray-900 hover:bg-gray-800', 'text-white', 'px-5 gap-2')}
        >
          <Plus className="w-4 h-4" />
          스터디 만들기
        </Button>
      </motion.div>

      {/* Left Sidebar - School Detail */}
      <MapSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        school={selectedSchool}
        rooms={roomsInSelectedSchool}
        isLoading={isLoadingSchoolRooms}
        onRoomClick={handleViewRoom}
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
      />

      {/* Nearby Schools Recommendation - Left Side */}
      {!isSidebarOpen && (
        <NearbySchoolsRecommendation
          userLocation={userLocation}
          onSchoolSelect={handleSchoolMarkerClick}
          maxSchools={5}
          radiusKm={15}
          className="absolute left-4 top-20 z-20 w-72 max-h-[50vh] overflow-y-auto"
        />
      )}
    </div>
  );
}
