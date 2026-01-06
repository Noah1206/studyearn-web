'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type {
  School,
  RoomDetail,
  SchoolRoomStatistics,
  SchoolRoomsParams,
  SessionStatus,
} from './types';

/**
 * Query key factory for school rooms
 */
export const schoolRoomsKeys = {
  all: ['schoolRooms'] as const,
  bySchool: (schoolId: string) => [...schoolRoomsKeys.all, schoolId] as const,
  list: (params: SchoolRoomsParams) =>
    [...schoolRoomsKeys.all, params.schoolId, params] as const,
};

interface SchoolRoomsResult {
  school: School;
  rooms: RoomDetail[];
  statistics: SchoolRoomStatistics;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

/**
 * Fetch rooms for a specific school using Edge Function
 */
async function fetchSchoolRooms(params: SchoolRoomsParams): Promise<SchoolRoomsResult> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const {
    schoolId,
    sessionStatus = 'all',
    includePrivate = false,
    sortBy = 'status',
    limit = 20,
    offset = 0,
  } = params;

  // UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(schoolId)) {
    throw new Error('유효하지 않은 학교 ID입니다.');
  }

  // Call Edge Function
  const { data, error } = await supabase.functions.invoke('get-rooms-by-school', {
    body: {
      school_id: schoolId,
      session_status: sessionStatus,
      include_private: includePrivate,
      sort_by: sortBy,
      limit: Math.min(limit, 50),
      offset,
    },
  });

  if (error) {
    console.error('Error fetching school rooms:', error);
    throw new Error(error.message || '학교 스터디룸 조회에 실패했습니다.');
  }

  if (!data?.success) {
    throw new Error(data?.error || '학교 스터디룸 조회에 실패했습니다.');
  }

  const { school, rooms, statistics, pagination } = data.data;

  return {
    school: {
      id: school.id,
      name: school.name,
      type: school.type,
      region: school.region,
      address: school.address,
      latitude: Number(school.latitude),
      longitude: Number(school.longitude),
      distance_km: null,
      active_rooms_count: school.active_rooms_count || 0,
      total_members: school.total_members || 0,
    },
    rooms: (rooms || []).map((room: Record<string, unknown>) => ({
      id: room.id as string,
      name: room.name as string,
      description: room.description as string | null,
      goal: room.goal as string | null,
      creator_id: room.creator_id as string,
      creator_name: room.creator_name as string | null,
      creator_avatar_url: room.creator_avatar_url as string | null,
      is_public: room.is_public as boolean,
      max_participants: Number(room.max_participants),
      current_participants: Number(room.current_participants),
      session_status: room.session_status as SessionStatus,
      session_start_time: room.session_start_time as string | null,
      school_id: schoolId,
      school_name: school.name,
      latitude: Number(school.latitude),
      longitude: Number(school.longitude),
      location_type: 'school' as const,
      location_name: school.name,
      thumbnail_url: room.thumbnail_url as string | null,
      tags: room.tags as string[] | null,
      created_at: room.created_at as string,
    })),
    statistics,
    pagination,
  };
}

/**
 * Hook to fetch rooms for a specific school
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useSchoolRooms('school-uuid');
 *
 * // With options
 * const { data } = useSchoolRooms('school-uuid', {
 *   sessionStatus: 'studying',
 *   sortBy: 'participants'
 * });
 * ```
 */
export function useSchoolRooms(
  schoolId: string | null,
  options?: Omit<SchoolRoomsParams, 'schoolId'> & {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
    refetchInterval?: number | false;
  }
) {
  const {
    sessionStatus,
    includePrivate,
    sortBy,
    limit,
    offset,
    enabled = true,
    staleTime = 30 * 1000, // 30 seconds - rooms change frequently
    cacheTime = 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus = true,
    refetchInterval = false,
  } = options || {};

  const params: SchoolRoomsParams | null = schoolId
    ? {
        schoolId,
        sessionStatus,
        includePrivate,
        sortBy,
        limit,
        offset,
      }
    : null;

  return useQuery({
    queryKey: params ? schoolRoomsKeys.list(params) : schoolRoomsKeys.all,
    queryFn: () => {
      if (!params) {
        throw new Error('School ID is required');
      }
      return fetchSchoolRooms(params);
    },
    enabled: enabled && schoolId !== null && schoolId.length > 0,
    staleTime,
    gcTime: cacheTime,
    refetchOnWindowFocus,
    refetchInterval,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export default useSchoolRooms;
