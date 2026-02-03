/**
 * SweetMe Map Feature Hooks
 *
 * React hooks for map-based study room discovery functionality.
 * Connects to Supabase Edge Functions and RPC functions.
 *
 * @example
 * ```tsx
 * import {
 *   useNearbySchools,
 *   useSchoolRooms,
 *   useSearchSchools,
 *   useMapRooms,
 *   useNearbyRooms,
 *   useJoinRoom,
 * } from '@/hooks/sweetme';
 *
 * // Get schools near user
 * const { data: schools } = useNearbySchools({
 *   latitude: 37.5665,
 *   longitude: 126.9780,
 *   radiusKm: 5,
 * });
 *
 * // Get rooms for a school
 * const { data: schoolData } = useSchoolRooms('school-uuid');
 *
 * // Search schools with debouncing
 * const { data, search } = useSearchSchools();
 * search('서울대');
 *
 * // Get rooms in map viewport
 * const { data: mapData } = useMapRooms({
 *   bounds: { north: 37.6, south: 37.5, east: 127.1, west: 126.9 },
 * });
 *
 * // Get nearby rooms
 * const { data: nearbyData } = useNearbyRooms({
 *   latitude: 37.5665,
 *   longitude: 126.9780,
 * });
 *
 * // Join a room
 * const { mutate: joinRoom } = useJoinRoom();
 * joinRoom({ roomId: 'room-uuid' });
 * ```
 */

// Hook exports
export { useNearbySchools, nearbySchoolsKeys } from './useNearbySchools';
export {
  useAllSchoolsForMap,
  allSchoolsKeys,
  type SchoolMapData,
} from './useAllSchools';
export { useSchoolRooms, schoolRoomsKeys } from './useSchoolRooms';
export {
  useSearchSchools,
  useSchoolSearchQuery,
  searchSchoolsKeys,
} from './useSearchSchools';
export {
  useMapRooms,
  useNearbyRooms,
  mapRoomsKeys,
} from './useMapRooms';
export {
  useJoinRoom,
  useLeaveRoom,
  type JoinRoomParams,
  type JoinRoomResult,
  type LeaveRoomParams,
  type LeaveRoomResult,
} from './useJoinRoom';

// Type exports
export type {
  // School types
  School,
  SchoolWithRelevance,
  SchoolType,

  // Room types
  Room,
  RoomDetail,
  SessionStatus,
  LocationType,

  // Request parameter types
  NearbySchoolsParams,
  SearchSchoolsParams,
  SchoolRoomsParams,
  MapBounds,
  MapFilters,
  MapRoomsParams,
  NearbyRoomsParams,

  // Response types
  Pagination,
  NearbySchoolsResponse,
  SearchSchoolsResponse,
  SchoolRoomStatistics,
  SchoolRoomsResponse,
  NearbyRoomsResponse,

  // Error types
  ApiError,
  SweetMeApiError,
} from './types';
