import { Suspense } from 'react';
import Link from 'next/link';
import {
  Search,
  TrendingUp,
  Star,
  Users,
  ChevronRight,
  Video,
  Mic,
  BookOpen,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Flame,
  Clock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button, Card, CardContent, Badge, Avatar, LoadingSection } from '@/components/ui';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { ExplorePageWrapper } from './ExplorePageWrapper';

export const dynamic = 'force-dynamic';

// 카테고리 옵션
const CATEGORIES = [
  { id: 'korean', label: '국어', icon: '📚', color: 'bg-red-100 text-red-600' },
  { id: 'math', label: '수학', icon: '📐', color: 'bg-blue-100 text-blue-600' },
  { id: 'english', label: '영어', icon: '🔤', color: 'bg-green-100 text-green-600' },
  { id: 'science', label: '과학', icon: '🔬', color: 'bg-purple-100 text-purple-600' },
  { id: 'social', label: '사회', icon: '🌍', color: 'bg-amber-100 text-amber-600' },
  { id: 'history', label: '역사', icon: '📜', color: 'bg-orange-100 text-orange-600' },
  { id: 'coding', label: '코딩', icon: '💻', color: 'bg-cyan-100 text-cyan-600' },
  { id: 'art', label: '예술', icon: '🎨', color: 'bg-pink-100 text-pink-600' },
  { id: 'music', label: '음악', icon: '🎵', color: 'bg-indigo-100 text-indigo-600' },
  { id: 'study-tips', label: '공부법', icon: '💡', color: 'bg-yellow-100 text-yellow-600' },
  { id: 'exam-prep', label: '시험대비', icon: '📝', color: 'bg-rose-100 text-rose-600' },
  { id: 'language', label: '외국어', icon: '🗣️', color: 'bg-teal-100 text-teal-600' },
];

// 콘텐츠 타입 아이콘
function getContentTypeIcon(type: string) {
  switch (type) {
    case 'video': return Video;
    case 'audio': return Mic;
    case 'document': return BookOpen;
    case 'image': return ImageIcon;
    default: return FileText;
  }
}

async function getExploreData() {
  const supabase = await createClient();

  // 인기 콘텐츠
  const { data: trendingContents } = await supabase
    .from('contents')
    .select(`
      id, title, thumbnail_url, content_type, view_count, price, access_level,
      creator:creator_settings!creator_id (
        user_id, display_name, avatar_url
      )
    `)
    .eq('is_published', true)
    .order('view_count', { ascending: false })
    .limit(6);

  // 최신 콘텐츠
  const { data: latestContents } = await supabase
    .from('contents')
    .select(`
      id, title, thumbnail_url, content_type, view_count, price, access_level,
      creator:creator_settings!creator_id (
        user_id, display_name, avatar_url
      )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(6);

  // 인기 크리에이터
  const { data: popularCreators } = await supabase
    .from('creator_settings')
    .select('user_id, display_name, avatar_url, bio, subscriber_count, categories')
    .order('subscriber_count', { ascending: false })
    .limit(6);

  // 카테고리별 콘텐츠 수
  const categoryStats: Record<string, number> = {};
  for (const cat of CATEGORIES) {
    const { count } = await supabase
      .from('contents')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true)
      .eq('category', cat.id);
    categoryStats[cat.id] = count || 0;
  }

  return {
    trendingContents: trendingContents || [],
    latestContents: latestContents || [],
    popularCreators: popularCreators || [],
    categoryStats,
  };
}

// 콘텐츠 카드 컴포넌트
function ContentCard({ content }: { content: any }) {
  const TypeIcon = getContentTypeIcon(content.content_type);

  return (
    <Link href={`/content/${content.id}`}>
      <Card variant="outlined" className="h-full hover:shadow-lg transition-all group">
        <div className="aspect-video bg-gray-100 rounded-t-xl overflow-hidden relative">
          {content.thumbnail_url ? (
            <img
              src={content.thumbnail_url}
              alt={content.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TypeIcon className="w-10 h-10 text-gray-300" />
            </div>
          )}
          {content.price ? (
            <Badge className="absolute top-2 right-2 bg-orange-500 text-white">
              {formatCurrency(content.price)}
            </Badge>
          ) : (
            <Badge className="absolute top-2 right-2 bg-green-500 text-white">
              무료
            </Badge>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm mb-2">
            {content.title}
          </h3>
          <div className="flex items-center gap-2">
            <Avatar
              src={content.creator?.avatar_url}
              alt={content.creator?.display_name}
              size="xs"
            />
            <span className="text-xs text-gray-500 truncate">
              {content.creator?.display_name}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            조회 {formatNumber(content.view_count)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

// 크리에이터 카드 컴포넌트
function CreatorCard({ creator }: { creator: any }) {
  return (
    <Link href={`/creator/${creator.user_id}`}>
      <Card variant="outlined" className="h-full hover:shadow-lg transition-all text-center p-4">
        <Avatar
          src={creator.avatar_url}
          alt={creator.display_name}
          size="xl"
          className="mx-auto mb-3"
        />
        <h3 className="font-semibold text-gray-900 mb-1">
          {creator.display_name}
        </h3>
        {creator.bio && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">
            {creator.bio}
          </p>
        )}
        <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
          <Users size={12} />
          구독자 {formatNumber(creator.subscriber_count || 0)}
        </div>
        {creator.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center mt-2">
            {creator.categories.slice(0, 2).map((cat: string) => {
              const category = CATEGORIES.find(c => c.id === cat);
              return (
                <Badge key={cat} variant="secondary" size="sm">
                  {category?.icon} {category?.label}
                </Badge>
              );
            })}
          </div>
        )}
      </Card>
    </Link>
  );
}

async function ExploreContent() {
  const { trendingContents, latestContents, popularCreators, categoryStats } = await getExploreData();

  return (
    <div className="space-y-10">
      {/* 검색 바 */}
      <Link href="/search">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-gray-300 hover:shadow-sm transition-all">
          <Search className="w-5 h-5 text-gray-400" />
          <span className="text-gray-500">콘텐츠, 크리에이터 검색...</span>
        </div>
      </Link>

      {/* 카테고리 */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          카테고리별 탐색
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/search?q=&category=${category.id}`}
            >
              <div className="bg-white border border-gray-200 rounded-xl p-3 text-center hover:shadow-md hover:border-gray-300 transition-all">
                <span className="text-2xl mb-1 block">{category.icon}</span>
                <span className="text-sm font-medium text-gray-700">{category.label}</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatNumber(categoryStats[category.id] || 0)}개
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 인기 콘텐츠 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500" />
            인기 콘텐츠
          </h2>
          <Link href="/ranking">
            <Button variant="ghost" size="sm">
              더보기 <ChevronRight size={16} />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {trendingContents.map((content: any) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      </section>

      {/* 최신 콘텐츠 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            최신 콘텐츠
          </h2>
          <Link href="/content">
            <Button variant="ghost" size="sm">
              더보기 <ChevronRight size={16} />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {latestContents.map((content: any) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      </section>

      {/* 인기 크리에이터 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            인기 크리에이터
          </h2>
          <Link href="/ranking?tab=creators">
            <Button variant="ghost" size="sm">
              더보기 <ChevronRight size={16} />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {popularCreators.map((creator: any) => (
            <CreatorCard key={creator.user_id} creator={creator} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <ExplorePageWrapper>
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center">
            <h1 className="text-xl font-bold text-gray-900">탐색</h1>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<LoadingSection />}>
          <ExploreContent />
        </Suspense>
      </main>
    </ExplorePageWrapper>
  );
}
