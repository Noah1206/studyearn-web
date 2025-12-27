import { Suspense } from 'react';
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
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button, Badge, LoadingSection } from '@/components/ui';
import { formatNumber } from '@/lib/utils';
import StudyWithMeClient from './StudyWithMeClient';

export const dynamic = 'force-dynamic';

async function getStudyContents() {
  const supabase = await createClient();

  // 콘텐츠와 크리에이터 정보를 별도로 가져온 후 결합
  const [popularResult, latestResult, creatorsResult, allCreatorsResult] = await Promise.all([
    supabase
      .from('contents')
      .select('id, title, description, thumbnail_url, content_type, view_count, like_count, price, access_level, category, created_at, creator_id')
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .limit(10),
    supabase
      .from('contents')
      .select('id, title, description, thumbnail_url, content_type, view_count, like_count, price, access_level, category, created_at, creator_id')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('creator_settings')
      .select('id, user_id, display_name, profile_image_url, bio, total_subscribers')
      .order('total_subscribers', { ascending: false })
      .limit(6),
    // 모든 크리에이터 정보 (콘텐츠와 매칭용)
    supabase
      .from('creator_settings')
      .select('id, user_id, display_name, profile_image_url'),
  ]);

  // 크리에이터 맵 생성 (id로 빠르게 조회)
  type CreatorData = { id: string; user_id: string; display_name: string | null; profile_image_url: string | null };
  const creatorMap = new Map(
    (allCreatorsResult.data || []).map((c: CreatorData) => [c.id, c])
  );

  // 콘텐츠에 크리에이터 정보 결합
  const enrichContents = (contents: any[]) =>
    contents.map(content => ({
      ...content,
      creator: creatorMap.get(content.creator_id) || null,
    }));

  const popularContents = enrichContents(popularResult.data || []);
  const latestContents = enrichContents(latestResult.data || []);
  const popularCreators = creatorsResult.data || [];

  return {
    popularContents,
    latestContents,
    popularCreators,
    hasContents: popularContents.length > 0 || latestContents.length > 0,
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
  const { popularContents, latestContents, popularCreators, hasContents } = await getStudyContents();

  return (
    <div className="space-y-10">
      {hasContents ? (
        <>
          {/* 클라이언트 컴포넌트 - 히어로 + 검색/필터 + 콘텐츠 목록 */}
          <StudyWithMeClient
            popularContents={popularContents}
            latestContents={latestContents}
            popularCreators={popularCreators}
          />
        </>
      ) : (
        <>
          {/* 콘텐츠가 없을 때 - 심플 런칭 모드 */}
          <LaunchHeroSection />

          {/* 첫 크리에이터 권유 섹션 */}
          <section className="py-16">
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-8 md:p-12">
              {/* 배경 장식 */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10 text-center max-w-2xl mx-auto">
                {/* 이모지 아이콘 */}
                <div className="text-5xl mb-6">🎯</div>

                {/* 메인 메시지 */}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  아직 아무도 시작하지 않았어요
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  지금 시작하면, <span className="text-blue-600 font-semibold">당신이 첫 번째</span>가 될 수 있어요
                </p>

                {/* 혜택 배지들 */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/80 backdrop-blur rounded-full text-sm font-medium text-gray-700 shadow-sm">
                    <span className="text-green-500">✓</span> 프로필 상단 노출
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/80 backdrop-blur rounded-full text-sm font-medium text-gray-700 shadow-sm">
                    <span className="text-green-500">✓</span> 첫 달 수수료 0%
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/80 backdrop-blur rounded-full text-sm font-medium text-gray-700 shadow-sm">
                    <span className="text-green-500">✓</span> 얼리버드 뱃지
                  </span>
                </div>

                {/* CTA 버튼 */}
                <Link href="/become-creator">
                  <Button size="lg" className="gap-2 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-shadow">
                    <Zap className="w-4 h-4" />
                    지금 바로 시작하기
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function StudyWithMePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-[1600px] ml-4 lg:ml-8 mr-auto px-4 sm:px-6 lg:px-8 py-6">
        <Suspense fallback={<LoadingSection />}>
          <StudyWithMeContent />
        </Suspense>
      </main>
    </div>
  );
}

export const metadata = {
  title: 'Study With Me - 스터플',
  description: '함께 공부하면 더 오래 집중할 수 있어요. 다양한 스터디 콘텐츠와 함께 공부해보세요.',
};
