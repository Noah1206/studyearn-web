'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type {
  School,
  NearbySchoolsParams,
  SchoolType,
} from './types';

/**
 * Query key factory for nearby schools
 */
export const nearbySchoolsKeys = {
  all: ['nearbySchools'] as const,
  list: (params: NearbySchoolsParams) =>
    [...nearbySchoolsKeys.all, params] as const,
};

/**
 * Fetch nearby schools using Supabase RPC function
 * Uses PostGIS for accurate distance calculation
 */
async function fetchNearbySchools(params: NearbySchoolsParams): Promise<School[]> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { latitude, longitude, radiusKm = 15, type } = params;

  // Validate coordinates
  if (latitude < -90 || latitude > 90) {
    throw new Error('유효하지 않은 위도입니다. (-90 ~ 90)');
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error('유효하지 않은 경도입니다. (-180 ~ 180)');
  }

  // Call the actual RPC function: get_nearby_schools
  // Parameters: user_lat, user_lng, radius_km, filter_type
  const { data, error } = await supabase.rpc('get_nearby_schools', {
    user_lat: latitude,
    user_lng: longitude,
    radius_km: Math.min(radiusKm, 50), // Max 50km
    filter_type: type || null,
  });

  if (error) {
    console.error('Error fetching nearby schools:', error);
    throw new Error(error.message || '주변 학교 조회에 실패했습니다.');
  }

  // Map RPC response to School type
  // RPC returns: id, name, type, region, address, latitude, longitude, distance_km, active_rooms_count, total_students
  return (data || []).map((school: Record<string, unknown>) => ({
    id: school.id as string,
    name: school.name as string,
    short_name: null, // Not returned by RPC
    type: school.type as SchoolType,
    region: school.region as string,
    district: null,
    address: school.address as string | null,
    latitude: Number(school.latitude),
    longitude: Number(school.longitude),
    logo_url: null,
    distance_km: Number(school.distance_km) || null,
    active_rooms_count: Number(school.active_rooms_count) || 0,
    total_members: Number(school.total_students) || 0,
  }));
}

/**
 * Hook to fetch nearby schools based on user's location
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useNearbySchools({
 *   latitude: 37.5665,
 *   longitude: 126.9780,
 *   radiusKm: 10
 * });
 * ```
 */
export function useNearbySchools(
  params: NearbySchoolsParams | null,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
  }
) {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus = false,
  } = options || {};

  return useQuery({
    queryKey: params ? nearbySchoolsKeys.list(params) : nearbySchoolsKeys.all,
    queryFn: () => {
      if (!params) {
        throw new Error('Location parameters are required');
      }
      return fetchNearbySchools(params);
    },
    enabled: enabled && params !== null &&
      typeof params.latitude === 'number' &&
      typeof params.longitude === 'number',
    staleTime,
    gcTime: cacheTime,
    refetchOnWindowFocus,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export default useNearbySchools;
