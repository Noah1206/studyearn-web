import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';

// Prefetched data types
export interface PrefetchedProfileData {
  user: {
    id: string;
    email: string;
    avatar_url?: string;
  };
  profile: {
    id: string;
    nickname: string;
    username?: string;
    avatar_url?: string;
    bio?: string;
    school?: string;
    is_creator: boolean;
  };
  creatorSettings?: {
    display_name: string;
    bio?: string;
    profile_image_url?: string;
    is_verified: boolean;
    subject?: string;
  };
  currentSession?: {
    room_id: string;
    room_name: string;
    seat_number: number;
    status: string;
    joined_at: string;
    current_session_minutes: number;
  };
}

export default async function ProfilePage() {
  const supabase = await createClient();

  // Handle build time when supabase is null
  if (!supabase) {
    return <ProfileClient prefetchedData={null} />;
  }

  // Get user - this is fast as it uses the session cookie
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Prefetch essential data in parallel on server
  const [profileResult, creatorResult, sessionResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('creator_settings')
      .select('display_name, bio, profile_image_url, is_verified, subject')
      .eq('user_id', user.id)
      .single(),
    supabase.from('study_with_me_participants')
      .select(`room_id, seat_number, status, joined_at, current_session_minutes, study_with_me_rooms!inner(name)`)
      .eq('user_id', user.id)
      .is('left_at', null)
      .single(),
  ]);

  // Build prefetched data
  const prefetchedData: PrefetchedProfileData = {
    user: {
      id: user.id,
      email: user.email || '',
      avatar_url: user.user_metadata?.avatar_url,
    },
    profile: {
      id: profileResult.data?.id || user.id,
      nickname: profileResult.data?.nickname || '',
      username: profileResult.data?.username,
      avatar_url: profileResult.data?.avatar_url || user.user_metadata?.avatar_url,
      bio: profileResult.data?.bio,
      school: profileResult.data?.school,
      is_creator: !!creatorResult.data,
    },
  };

  // Add creator settings if exists
  if (creatorResult.data) {
    prefetchedData.creatorSettings = {
      display_name: creatorResult.data.display_name || '',
      bio: creatorResult.data.bio,
      profile_image_url: creatorResult.data.profile_image_url,
      is_verified: creatorResult.data.is_verified || false,
      subject: creatorResult.data.subject,
    };
  }

  // Add current session if exists
  if (sessionResult.data) {
    prefetchedData.currentSession = {
      room_id: sessionResult.data.room_id,
      room_name: (sessionResult.data.study_with_me_rooms as any)?.name || 'Study Room',
      seat_number: sessionResult.data.seat_number,
      status: sessionResult.data.status,
      joined_at: sessionResult.data.joined_at,
      current_session_minutes: sessionResult.data.current_session_minutes || 0,
    };
  }

  return <ProfileClient prefetchedData={prefetchedData} />;
}
