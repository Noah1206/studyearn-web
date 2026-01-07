import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Video,
  Play,
  Sparkles,
  Gift,
  Zap,
  Star,
  Target,
  TrendingUp,
  Users,
  Plus,
  Map as MapIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button, Badge, LoadingSection } from '@/components/ui';
import { formatNumber } from '@/lib/utils';
import StudyWithMeClient from './StudyWithMeClient';

// Dynamic import to avoid SSR hydration issues with map/canvas components
const StudyWithMeMapClient = dynamic(
  () => import('./StudyWithMeMapClient'),
  {
    ssr: false,
    loading: () => <LoadingSection fullHeight />
  }
);

export const revalidate = 0; // force-dynamic equivalent

async function getStudyRooms() {
  const supabase = await createClient();

  // 스터디룸 데이터를 가져옴
  const [popularResult, latestResult] = await Promise.all([
    // 인기 방 (참여자 많은 순)
    supabase
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
        thumbnail_url,
        created_at,
        creator_id,
        profiles:creator_id (
          id,
          nickname,
          avatar_url
        )
      `)
      .eq('is_public', true)
      .order('current_participants', { ascending: false })
      .limit(10),
    // 최신 방
    supabase
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
        thumbnail_url,
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
      .limit(10),
  ]);

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
    thumbnail_url: room.thumbnail_url,
    created_at: room.created_at,
    creator: {
      id: (room.profiles as any)?.id || room.creator_id,
      nickname: (room.profiles as any)?.nickname || '알 수 없음',
      avatar_url: (room.profiles as any)?.avatar_url,
    },
  });

  const popularRooms = (popularResult.data || []).map(transformRoom);
  const latestRooms = (latestResult.data || []).map(transformRoom);

  return {
    popularRooms,
    latestRooms,
    hasRooms: popularRooms.length > 0 || latestRooms.length > 0,
  };
}


// 런칭 히어로 섹션 (콘텐츠 없을 때)
function LaunchHeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-gray-900 rounded-2xl">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-black/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 px-6 py-12 md:px-12 md:py-16 lg:py-20">
        {/* 상단: LIVE 배지 */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
          <Badge className="bg-white/20 text-white border-0 text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            새로운 시작
          </Badge>
        </div>

        {/* 메인 헤드라인 */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
          지금, 새로운 공부 문화가<br />
          <span className="text-orange-200">시작됩니다</span>
        </h1>

        {/* 서브 카피 */}
        <p className="text-white/80 text-base md:text-lg mb-8 max-w-lg">
          당신이 첫 번째 크리에이터가 될 수 있어요.<br className="hidden md:block" />
          함께 공부하는 즐거움을 나눠보세요.
        </p>

        {/* CTA 버튼 */}
        <Link href="/become-creator">
          <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 shadow-xl gap-2">
            <Zap className="w-4 h-4" />
            크리에이터 시작하기
          </Button>
        </Link>
      </div>
    </section>
  );
}

// 가치 제안 섹션
function ValuePropositionSection() {
  const values = [
    {
      icon: Target,
      title: '집중력 향상',
      description: '혼자보다 함께할 때 더 오래 집중돼요',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      icon: TrendingUp,
      title: '꾸준한 동기부여',
      description: '서로의 노력이 자극이 돼요',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Users,
      title: '커뮤니티',
      description: '같은 목표를 가진 친구들을 만나요',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      icon: Star,
      title: '수익 창출',
      description: '공부 콘텐츠로 수익도 만들어요',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <section>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          왜 Study With Me인가요?
        </h2>
        <p className="text-gray-500">
          함께 공부하면 달라지는 것들
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {values.map((value) => (
          <div
            key={value.title}
            className="bg-white rounded-2xl p-6 text-center border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all"
          >
            <div className={`w-12 h-12 ${value.bgColor} rounded-xl flex items-center justify-center mx-auto mb-4`}>
              <value.icon className={`w-6 h-6 ${value.color}`} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{value.title}</h3>
            <p className="text-sm text-gray-500">{value.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// 첫 크리에이터 혜택 섹션
function EarlyCreatorBenefitsSection() {
  const benefits = [
    {
      icon: Star,
      title: '프로필 상단 노출',
      description: '초기 크리에이터는 메인 페이지에 우선 노출돼요',
    },
    {
      icon: Gift,
      title: '런칭 기념 배지',
      description: '얼리어답터 전용 특별 배지를 드려요',
    },
    {
      icon: Zap,
      title: '첫 달 수수료 0%',
      description: '첫 한 달간 수익 수수료가 없어요',
    },
  ];

  return (
    <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12">
      <div className="text-center mb-8">
        <Badge className="bg-orange-500 text-white border-0 mb-4">
          <Gift className="w-3 h-3 mr-1" />
          Early Bird
        </Badge>
        <h2 className="text-2xl font-bold text-white mb-2">
          첫 크리에이터 혜택
        </h2>
        <p className="text-gray-400">
          지금 시작하면 더 많은 혜택을 받을 수 있어요
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {benefits.map((benefit) => (
          <div
            key={benefit.title}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10"
          >
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
              <benefit.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-white mb-1">{benefit.title}</h3>
            <p className="text-sm text-gray-400">{benefit.description}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link href="/become-creator">
          <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white shadow-xl gap-2">
            <Plus className="w-4 h-4" />
            지금 시작하기
          </Button>
        </Link>
      </div>
    </section>
  );
}

// 카테고리 미리보기 섹션
function CategoryPreviewSection() {
  const categoryPreviews = [
    { id: 'korean', label: '국어', emoji: '📚', count: 0 },
    { id: 'math', label: '수학', emoji: '🔢', count: 0 },
    { id: 'english', label: '영어', emoji: '🌍', count: 0 },
    { id: 'science', label: '과학', emoji: '🔬', count: 0 },
    { id: 'coding', label: '코딩', emoji: '💻', count: 0 },
    { id: 'study-tips', label: '공부법', emoji: '💡', count: 0 },
  ];

  return (
    <section>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          어떤 분야를 공부하시나요?
        </h2>
        <p className="text-gray-500 text-sm">
          관심 있는 카테고리에서 첫 콘텐츠를 만들어보세요
        </p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {categoryPreviews.map((category) => (
          <Link
            key={category.id}
            href={`/search?category=${category.id}`}
            className="group"
          >
            <div className="bg-white rounded-xl p-4 text-center border border-gray-100 hover:border-orange-300 hover:shadow-md transition-all">
              <div className="text-3xl mb-2">{category.emoji}</div>
              <h3 className="font-medium text-gray-900 text-sm">{category.label}</h3>
              <p className="text-xs text-gray-400 mt-1">
                {category.count > 0 ? `${category.count}개` : '첫 번째가 되세요'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// 콘텐츠가 있을 때의 히어로 섹션 - 이제 클라이언트 컴포넌트로 이동됨

async function StudyWithMeContent() {
  const { popularRooms, latestRooms, hasRooms } = await getStudyRooms();

  // Combine all rooms for the map view
  const allRooms = [...popularRooms, ...latestRooms];
  // Remove duplicates by ID
  const uniqueRooms = Array.from(new Map(allRooms.map(r => [r.id, r])).values());

  // Default to map view (Pokemon Go style)
  return (
    <StudyWithMeMapClient
      initialRooms={uniqueRooms}
    />
  );
}

export default function StudyWithMePage() {
  return (
    <div className="w-full overflow-hidden">
      <Suspense fallback={<LoadingSection fullHeight />}>
        <StudyWithMeContent />
      </Suspense>
    </div>
  );
}

export const metadata = {
  title: 'Study With Me - 스터플',
  description: '함께 공부하면 더 오래 집중할 수 있어요. 다양한 스터디 콘텐츠와 함께 공부해보세요.',
};
