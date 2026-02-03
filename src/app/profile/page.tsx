import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';
import { Spinner } from '@/components/ui';

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

  // getSession()으로 빠르게 세션 확인 (미들웨어에서 이미 getUser()로 검증됨)
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user;

  // 필수 데이터만 서버에서 로드 (profile, creator_settings)
  // study_with_me는 클라이언트에서 로드하도록 제거
  const [profileResult, creatorResult] = await Promise.all([
    supabase.from('profiles').select('id, nickname, username, avatar_url, bio, school').eq('id', user.id).maybeSingle(),
    supabase.from('creator_settings')
      .select('display_name, bio, profile_image_url, is_verified, subject')
      .eq('user_id', user.id)
      .maybeSingle(),
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

  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center"><Spinner size="lg" /></div>}>
      <ProfileClient prefetchedData={prefetchedData} />
    </Suspense>
  );
}
