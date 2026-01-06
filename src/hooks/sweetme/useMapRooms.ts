'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type {
  Room,
  MapBounds,
  MapFilters,
  MapRoomsParams,
  NearbyRoomsParams,
  SessionStatus,
} from './types';

/**
 * Query key factory for map rooms
 */
export const mapRoomsKeys = {
  all: ['mapRooms'] as const,
  bounds: (bounds: MapBounds, filters?: MapFilters) =>
    [...mapRoomsKeys.all, 'bounds', bounds, filters] as const,
  nearby: (params: NearbyRoomsParams) =>
    [...mapRoomsKeys.all, 'nearby', params] as const,
};

interface MapRoomsResult {
  rooms: Room[];
  total: number;
}

/**
 * Fetch rooms within map bounds using RPC function
 */
async function fetchMapRooms(params: MapRoomsParams): Promise<MapRoomsResult> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { bounds, filters } = params;

  // Validate bounds
  if (bounds.north <= bounds.south) {
    throw new Error('Invalid bounds: north must be greater than south');
  }
  if (bounds.east <= bounds.west && bounds.east > -180 && bounds.west < 180) {
    // Handle normal case (not crossing date line)
    throw new Error('Invalid bounds: east must be greater than west');
  }

  const { data, error } = await supabase.rpc('get_rooms_in_bounds', {
    north: bounds.north,
    south: bounds.south,
    east: bounds.east,
    west: bounds.west,
    filter_school_id: filters?.schoolId || null,
    filter_session_status: filters?.sessionStatus || null,
  });

  if (error) {
    console.error('Error fetching map rooms:', error);
    throw new Error(error.message || '지도 영역의 스터디룸 조회에 실패했습니다.');
  }

  const rooms: Room[] = (data || []).map((room: Record<string, unknown>) => ({
    id: room.id as string,
    name: room.name as string,
    description: room.description as string | null,
    goal: room.goal as string | null,
    creator_id: room.creator_id as string,
    is_public: room.is_public as boolean,
    max_participants: Number(room.max_participants),
    current_participants: Number(room.current_participants),
    session_status: room.session_status as SessionStatus,
    session_start_time: room.session_start_time as string | null,
    school_id: room.school_id as string | null,
    school_name: room.school_name as string | null,
    latitude: Number(room.latitude),
    longitude: Number(room.longitude),
    location_type: (room.location_type as 'school' | 'home' | 'custom') || 'school',
    location_name: room.location_name as string | null,
    created_at: room.created_at as string,
  }));

  return {
    rooms,
    total: rooms.length,
  };
}

/**
 * Fetch rooms near a specific location using Edge Function
 */
async function fetchNearbyRooms(params: NearbyRoomsParams): Promise<MapRoomsResult & { pagination: { total: number; limit: number; offset: number; has_more: boolean } }> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const {
    latitude,
    longitude,
    radiusKm = 5,
    schoolId,
    sessionStatus,
    limit = 50,
    offset = 0,
  } = params;

  // Validate coordinates
  if (latitude < -90 || latitude > 90) {
    throw new Error('유효하지 않은 위도입니다. (-90 ~ 90)');
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error('유효하지 않은 경도입니다. (-180 ~ 180)');
  }

  // Call Edge Function
  const { data, error } = await supabase.functions.invoke('get-nearby-rooms', {
    body: {
      latitude,
      longitude,
      radius_km: Math.min(radiusKm, 50),
      school_id: schoolId,
      session_status: sessionStatus,
      limit: Math.min(limit, 100),
      offset,
    },
  });

  if (error) {
    console.error('Error fetching nearby rooms:', error);
    throw new Error(error.message || '주변 스터디룸 조회에 실패했습니다.');
  }

  if (!data?.success) {
    throw new Error(data?.error || '주변 스터디룸 조회에 실패했습니다.');
  }

  const { rooms: roomsData, pagination } = data.data;

  const rooms: Room[] = (roomsData || []).map((room: Record<string, unknown>) => ({
    id: room.id as string,
    name: room.name as string,
    description: room.description as string | null,
    goal: room.goal as string | null,
    creator_id: room.creator_id as string,
    is_public: room.is_public as boolean,
    max_participants: Number(room.max_participants),
    current_participants: Number(room.current_participants),
    session_status: room.session_status as SessionStatus,
    session_start_time: room.session_start_time as string | null,
    school_id: room.school_id as string | null,
    school_name: room.school_name as string | null,
    latitude: Number(room.latitude),
    longitude: Number(room.longitude),
    location_type: (room.location_type as 'school' | 'home' | 'custom') || 'school',
    location_name: room.location_name as string | null,
    distance_km: Number(room.distance_km),
    created_at: room.created_at as string,
  }));

  return {
    rooms,
    total: pagination.total,
    pagination,
  };
}

/**
 * Hook to fetch rooms within map bounds (for map viewport)
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useMapRooms({
 *   bounds: { north: 37.6, south: 37.5, east: 127.1, west: 126.9 }
 * });
 * ```
 */
export function useMapRooms(
  params: MapRoomsParams | null,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
    refetchInterval?: number | false;
  }
) {
  const {
    enabled = true,
    staleTime = 30 * 1000, // 30 seconds - rooms change frequently
    cacheTime = 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus = true,
    refetchInterval = false,
  } = options || {};

  return useQuery({
    queryKey: params
      ? mapRoomsKeys.bounds(params.bounds, params.filters)
      : mapRoomsKeys.all,
    queryFn: () => {
      if (!params) {
        throw new Error('Map bounds are required');
      }
      return fetchMapRooms(params);
    },
    enabled: enabled && params !== null,
    staleTime,
    gcTime: cacheTime,
    refetchOnWindowFocus,
    refetchInterval,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * Hook to fetch rooms near a specific location (radius-based)
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useNearbyRooms({
 *   latitude: 37.5665,
 *   longitude: 126.9780,
 *   radiusKm: 5
 * });
 * ```
 */
export function useNearbyRooms(
  params: NearbyRoomsParams | null,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
    refetchInterval?: number | false;
  }
) {
  const {
    enabled = true,
    staleTime = 30 * 1000, // 30 seconds
    cacheTime = 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus = true,
    refetchInterval = false,
  } = options || {};

  return useQuery({
    queryKey: params ? mapRoomsKeys.nearby(params) : mapRoomsKeys.all,
    queryFn: () => {
      if (!params) {
        throw new Error('Location parameters are required');
      }
      return fetchNearbyRooms(params);
    },
    enabled:
      enabled &&
      params !== null &&
      typeof params.latitude === 'number' &&
      typeof params.longitude === 'number',
    staleTime,
    gcTime: cacheTime,
    refetchOnWindowFocus,
    refetchInterval,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export default useMapRooms;
