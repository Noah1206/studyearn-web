'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { mapRoomsKeys } from './useMapRooms';
import { schoolRoomsKeys } from './useSchoolRooms';
import type { RoomDetail, SessionStatus } from './types';

/**
 * Join room request parameters
 */
export interface JoinRoomParams {
  roomId: string;
}

/**
 * Join room result
 */
export interface JoinRoomResult {
  success: boolean;
  room: RoomDetail;
  message: string;
}

/**
 * Leave room request parameters
 */
export interface LeaveRoomParams {
  roomId: string;
}

/**
 * Leave room result
 */
export interface LeaveRoomResult {
  success: boolean;
  message: string;
}

/**
 * Join a study room
 */
async function joinRoom(params: JoinRoomParams): Promise<JoinRoomResult> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { roomId } = params;

  // UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(roomId)) {
    throw new Error('유효하지 않은 방 ID입니다.');
  }

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('로그인이 필요합니다.');
  }

  // Get room details
  const { data: room, error: roomError } = await supabase
    .from('study_with_me_rooms')
    .select(`
      id,
      name,
      description,
      goal,
      creator_id,
      is_public,
      max_participants,
      current_participants,
      session_status,
      session_start_time,
      school_id,
      latitude,
      longitude,
      location_type,
      location_name,
      thumbnail_url,
      tags,
      created_at
    `)
    .eq('id', roomId)
    .single();

  if (roomError || !room) {
    throw new Error('방을 찾을 수 없습니다.');
  }

  // Check if room is active
  const activeStatuses: SessionStatus[] = ['waiting', 'studying', 'break'];
  if (!activeStatuses.includes(room.session_status as SessionStatus)) {
    throw new Error('이 방은 현재 참여할 수 없는 상태입니다.');
  }

  // Check if room is full
  if (room.current_participants >= room.max_participants) {
    throw new Error('방이 가득 찼습니다.');
  }

  // Check if room is public or user is creator
  if (!room.is_public && room.creator_id !== user.id) {
    throw new Error('비공개 방입니다.');
  }

  // Update participant count
  const { error: updateError } = await supabase
    .from('study_with_me_rooms')
    .update({
      current_participants: room.current_participants + 1,
    })
    .eq('id', roomId);

  if (updateError) {
    console.error('Error joining room:', updateError);
    throw new Error('방 참가에 실패했습니다.');
  }

  // Get school name if school_id exists
  let schoolName: string | null = null;
  if (room.school_id) {
    const { data: school } = await supabase
      .from('schools')
      .select('name')
      .eq('id', room.school_id)
      .single();
    schoolName = school?.name || null;
  }

  return {
    success: true,
    room: {
      id: room.id,
      name: room.name,
      description: room.description,
      goal: room.goal,
      creator_id: room.creator_id,
      creator_name: null, // Would need to fetch from profiles
      creator_avatar_url: null,
      is_public: room.is_public,
      max_participants: room.max_participants,
      current_participants: room.current_participants + 1,
      session_status: room.session_status as SessionStatus,
      session_start_time: room.session_start_time,
      school_id: room.school_id,
      school_name: schoolName,
      latitude: Number(room.latitude),
      longitude: Number(room.longitude),
      location_type: room.location_type as 'school' | 'home' | 'custom',
      location_name: room.location_name,
      thumbnail_url: room.thumbnail_url,
      tags: room.tags,
      created_at: room.created_at,
    },
    message: '방에 참가했습니다.',
  };
}

/**
 * Leave a study room
 */
async function leaveRoom(params: LeaveRoomParams): Promise<LeaveRoomResult> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { roomId } = params;

  // UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(roomId)) {
    throw new Error('유효하지 않은 방 ID입니다.');
  }

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('로그인이 필요합니다.');
  }

  // Get current participant count
  const { data: room, error: roomError } = await supabase
    .from('study_with_me_rooms')
    .select('current_participants')
    .eq('id', roomId)
    .single();

  if (roomError || !room) {
    throw new Error('방을 찾을 수 없습니다.');
  }

  // Update participant count
  const { error: updateError } = await supabase
    .from('study_with_me_rooms')
    .update({
      current_participants: Math.max(0, room.current_participants - 1),
    })
    .eq('id', roomId);

  if (updateError) {
    console.error('Error leaving room:', updateError);
    throw new Error('방 나가기에 실패했습니다.');
  }

  return {
    success: true,
    message: '방을 나갔습니다.',
  };
}

/**
 * Hook to join a study room
 *
 * @example
 * ```tsx
 * const { mutate: joinRoom, isLoading, isSuccess, error } = useJoinRoom();
 *
 * // Join a room
 * joinRoom({ roomId: 'room-uuid' });
 *
 * // With callbacks
 * joinRoom(
 *   { roomId: 'room-uuid' },
 *   {
 *     onSuccess: (data) => console.log('Joined!', data.room),
 *     onError: (error) => console.error('Failed:', error.message),
 *   }
 * );
 * ```
 */
export function useJoinRoom(options?: {
  onSuccess?: (data: JoinRoomResult) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: joinRoom,
    onSuccess: (data, variables) => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: mapRoomsKeys.all });

      // Invalidate school rooms if the room has a school
      if (data.room.school_id) {
        queryClient.invalidateQueries({
          queryKey: schoolRoomsKeys.bySchool(data.room.school_id),
        });
      }

      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

/**
 * Hook to leave a study room
 *
 * @example
 * ```tsx
 * const { mutate: leaveRoom, isLoading } = useLeaveRoom();
 *
 * // Leave a room
 * leaveRoom({ roomId: 'room-uuid' });
 * ```
 */
export function useLeaveRoom(options?: {
  onSuccess?: (data: LeaveRoomResult) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveRoom,
    onSuccess: (data) => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: mapRoomsKeys.all });
      queryClient.invalidateQueries({ queryKey: schoolRoomsKeys.all });

      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

export default useJoinRoom;
