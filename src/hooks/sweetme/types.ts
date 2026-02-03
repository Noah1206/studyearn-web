/**
 * SweetMe Map Feature Types
 * Type definitions for map-based study room discovery
 */

// ============================================
// School Types
// ============================================

export type SchoolType = '초등학교' | '중학교' | '고등학교' | '대학교' | '기타';

export interface School {
  id: string;
  name: string;
  short_name?: string | null;
  type: SchoolType;
  region: string;
  district?: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  logo_url?: string | null;
  distance_km?: number | null;
  active_rooms_count: number;
  total_members?: number;
}

export interface SchoolWithRelevance extends School {
  relevance_score?: number;
}

// ============================================
// Room Types
// ============================================

export type SessionStatus = 'waiting' | 'studying' | 'break' | 'ended';
export type LocationType = 'school' | 'home' | 'custom';

export interface Room {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  creator_id: string;
  is_public: boolean;
  max_participants: number;
  current_participants: number;
  session_status: SessionStatus;
  session_start_time: string | null;
  school_id: string | null;
  school_name: string | null;
  latitude: number;
  longitude: number;
  location_type: LocationType;
  location_name: string | null;
  distance_km?: number;
  created_at: string;
}

export interface RoomDetail extends Room {
  creator_name: string | null;
  creator_avatar_url: string | null;
  thumbnail_url: string | null;
  tags: string[] | null;
}

// ============================================
// API Request Types
// ============================================

export interface NearbySchoolsParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  type?: SchoolType;
}

export interface SearchSchoolsParams {
  query?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  type?: SchoolType;
  region?: string;
  sortBy?: 'name' | 'distance' | 'active_rooms' | 'relevance';
  limit?: number;
  offset?: number;
}

export interface SchoolRoomsParams {
  schoolId: string;
  sessionStatus?: SessionStatus | 'all';
  includePrivate?: boolean;
  sortBy?: 'created_at' | 'participants' | 'status';
  limit?: number;
  offset?: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapFilters {
  schoolId?: string;
  sessionStatus?: SessionStatus;
}

export interface MapRoomsParams {
  bounds: MapBounds;
  filters?: MapFilters;
}

export interface NearbyRoomsParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  schoolId?: string;
  sessionStatus?: SessionStatus;
  limit?: number;
  offset?: number;
}

// ============================================
// API Response Types
// ============================================

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface NearbySchoolsResponse {
  success: boolean;
  data: {
    schools: School[];
    pagination: Pagination;
    search_params: {
      latitude: number;
      longitude: number;
      radius_km: number;
      type: SchoolType | null;
    };
  };
}

export interface SearchSchoolsResponse {
  success: boolean;
  data: {
    schools: SchoolWithRelevance[];
    pagination: Pagination;
    search_params: {
      query: string | null;
      latitude: number | null;
      longitude: number | null;
      radius_km: number | null;
      type: SchoolType | null;
      region: string | null;
      sort_by: string;
    };
  };
}

export interface SchoolRoomStatistics {
  total_rooms: number;
  studying_rooms: number;
  waiting_rooms: number;
  break_rooms: number;
  total_participants: number;
}

export interface SchoolRoomsResponse {
  success: boolean;
  data: {
    school: School;
    rooms: RoomDetail[];
    statistics: SchoolRoomStatistics;
    pagination: Pagination;
  };
}

export interface NearbyRoomsResponse {
  success: boolean;
  data: {
    rooms: Room[];
    pagination: Pagination;
    search_params: {
      latitude: number;
      longitude: number;
      radius_km: number;
      school_id: string | null;
      session_status: SessionStatus | null;
    };
  };
}

// ============================================
// Hook Return Types
// ============================================

export interface UseQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isSuccess: boolean;
  data: TData | undefined;
  reset: () => void;
}

// ============================================
// Error Types
// ============================================

export interface ApiError {
  error: string;
  details?: string;
}

export class SweetMeApiError extends Error {
  constructor(
    message: string,
    public details?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'SweetMeApiError';
  }
}
