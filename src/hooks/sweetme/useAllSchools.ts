'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { SchoolType } from './types';

/**
 * Minimal school data for map rendering
 */
export interface SchoolMapData {
  id: string;
  name: string;
  short_name: string | null;
  type: SchoolType;
  latitude: number;
  longitude: number;
  active_rooms_count: number;
}

/**
 * Query key factory for all schools
 */
export const allSchoolsKeys = {
  all: ['allSchools'] as const,
  forMap: (types?: SchoolType[]) => [...allSchoolsKeys.all, 'map', types] as const,
};

/**
 * Fetch all schools for map rendering using direct query (faster than RPC)
 */
async function fetchAllSchoolsForMap(types?: SchoolType[]): Promise<SchoolMapData[]> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  // Default types: 중학교, 고등학교, 대학교
  const schoolTypes = types || ['중학교', '고등학교', '대학교'];

  // Direct query is faster than RPC for simple selects
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, short_name, type, latitude, longitude, active_rooms_count')
    .in('type', schoolTypes)
    .order('name');

  if (error) {
    console.error('Error fetching all schools:', error);
    throw new Error(error.message || '학교 목록 조회에 실패했습니다.');
  }

  return (data || []).map((school: {
    id: string;
    name: string;
    short_name: string | null;
    type: string;
    latitude: number;
    longitude: number;
    active_rooms_count: number | null;
  }) => ({
    id: school.id,
    name: school.name,
    short_name: school.short_name,
    type: school.type as SchoolType,
    latitude: Number(school.latitude),
    longitude: Number(school.longitude),
    active_rooms_count: school.active_rooms_count || 0,
  }));
}

/**
 * Hook to fetch all schools for map pre-loading
 * Uses direct query for faster performance
 *
 * @example
 * ```tsx
 * const { data: schools, isLoading } = useAllSchoolsForMap();
 * // or with specific types
 * const { data: universities } = useAllSchoolsForMap(['대학교']);
 * ```
 */
export function useAllSchoolsForMap(
  types?: SchoolType[],
  options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
  }
) {
  const {
    enabled = true,
    staleTime = 60 * 60 * 1000, // 1 hour - schools don't change often
    cacheTime = 24 * 60 * 60 * 1000, // 24 hours
  } = options || {};

  return useQuery({
    queryKey: allSchoolsKeys.forMap(types),
    queryFn: () => fetchAllSchoolsForMap(types),
    enabled,
    staleTime,
    gcTime: cacheTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1, // Reduced retries for faster failure
    retryDelay: 1000,
  });
}

export default useAllSchoolsForMap;
