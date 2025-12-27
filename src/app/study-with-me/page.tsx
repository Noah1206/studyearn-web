import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { LoadingSection } from '@/components/ui';
import StudyWithMeClient from './StudyWithMeClient';

export const dynamic = 'force-dynamic';

// 스터디룸 목록 데이터 조회 (앱과 동일한 구조)
async function getStudyRooms() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 공개 방 조회
  const { data: publicRooms } = await supabase
    .from('study_with_me_rooms')
    .select(`
      id,
      name,
      goal,
      is_public,
      current_participants,
      max_participants,
      session_status,
      theme,
      created_at,
      creator_id,
      profiles:creator_id (
        id,
        nickname,
        avatar_url
      )
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(20);

  // 인기 방 조회 (참여자 많은 순)
  const { data: popularRooms } = await supabase
    .from('study_with_me_rooms')
    .select(`
      id,
      name,
      goal,
      is_public,
      current_participants,
      max_participants,
      session_status,
      theme,
      created_at,
      creator_id,
      profiles:creator_id (
        id,
        nickname,
        avatar_url
      )
    `)
    .eq('is_public', true)
    .gt('current_participants', 0)
    .order('current_participants', { ascending: false })
    .limit(10);

  // 내가 참여 중인 방 조회
  let myRooms: any[] = [];
  if (user) {
    const { data: participations } = await supabase
      .from('study_with_me_participants')
      .select(`
        room_id,
        study_with_me_rooms (
          id,
          name,
          goal,
          is_public,
          current_participants,
          max_participants,
          session_status,
          theme,
          created_at,
          creator_id,
          profiles:creator_id (
            id,
            nickname,
            avatar_url
          )
        )
      `)
      .eq('user_id', user.id)
      .is('left_at', null);

    myRooms = (participations || [])
      .map((p: any) => p.study_with_me_rooms)
      .filter(Boolean);
  }

  // 데이터 변환
  const transformRoom = (room: any) => ({
    id: room.id,
    name: room.name,
    goal: room.goal,
    is_public: room.is_public,
    current_participants: room.current_participants,
    max_participants: room.max_participants,
    session_status: room.session_status,
    theme: room.theme,
    created_at: room.created_at,
    creator: {
      id: (room.profiles as any)?.id || room.creator_id,
      nickname: (room.profiles as any)?.nickname || '알 수 없음',
      avatar_url: (room.profiles as any)?.avatar_url,
    },
  });

  return {
    publicRooms: (publicRooms || []).map(transformRoom),
    popularRooms: (popularRooms || []).map(transformRoom),
    myRooms: myRooms.map(transformRoom),
    isLoggedIn: !!user,
  };
}

async function StudyWithMeContent() {
  const { publicRooms, popularRooms, myRooms, isLoggedIn } = await getStudyRooms();

  return (
    <StudyWithMeClient
      publicRooms={publicRooms}
      popularRooms={popularRooms}
      myRooms={myRooms}
      isLoggedIn={isLoggedIn}
    />
  );
}

export default function StudyWithMePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Suspense fallback={<LoadingSection />}>
          <StudyWithMeContent />
        </Suspense>
      </main>
    </div>
  );
}

export const metadata = {
  title: 'Study With Me - 스터플',
  description: '함께 공부하면 더 오래 집중할 수 있어요. 스터디룸에 참여해보세요.',
};
