import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  FileText,
  Eye,
  Heart,
  Edit3,
  BarChart2,
  Clock,
  CheckCircle,
  Calendar,
  Download,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils';
import { Button, LoadingSection } from '@/components/ui';
import type { Content } from '@/types/database';

export const dynamic = 'force-dynamic';

interface ContentWithStats extends Content {
  purchase_count?: number;
  revenue?: number;
  tags?: string[];
  download_count?: number;
  subject?: string | null;
  grade?: string | null;
}

async function getCreatorContents(userId: string) {
  const supabase = await createClient();

  const { data: contents, error } = await supabase
    .from('contents')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false });

  if (error || !contents) {
    return { contents: [], stats: { total: 0, published: 0, draft: 0, scheduled: 0 } };
  }

  const contentsWithStats: ContentWithStats[] = [];

  for (const content of contents) {
    const { count: purchaseCount } = await supabase
      .from('content_purchases')
      .select('*', { count: 'exact', head: true })
      .eq('content_id', content.id)
      .eq('status', 'completed');

    const { data: purchases } = await supabase
      .from('content_purchases')
      .select('creator_revenue')
      .eq('content_id', content.id)
      .eq('status', 'completed');

    const revenue = purchases?.reduce((sum: number, p: { creator_revenue: number | null }) => sum + (p.creator_revenue || 0), 0) || 0;

    contentsWithStats.push({
      ...content,
      purchase_count: purchaseCount || 0,
      revenue,
    });
  }

  const now = new Date();
  const stats = {
    total: contents.length,
    published: contents.filter((c: Content) => c.is_published && (!c.published_at || new Date(c.published_at) <= now)).length,
    draft: contents.filter((c: Content) => !c.is_published).length,
    scheduled: contents.filter((c: Content) => c.is_published && c.published_at && new Date(c.published_at) > now).length,
  };

  return { contents: contentsWithStats, stats };
}

// 과목 색상
function getSubjectStyle(subject?: string | null) {
  const styles: Record<string, { bg: string; text: string }> = {
    '국어': { bg: 'bg-rose-50', text: 'text-rose-600' },
    '수학': { bg: 'bg-blue-50', text: 'text-blue-600' },
    '영어': { bg: 'bg-purple-50', text: 'text-purple-600' },
    '과학': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    '사회': { bg: 'bg-yellow-50', text: 'text-yellow-600' },
    '한국사': { bg: 'bg-orange-50', text: 'text-orange-600' },
    '루틴': { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    '플래너': { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  };
  return styles[subject || ''] || { bg: 'bg-gray-50', text: 'text-gray-600' };
}

// Content Card Component - 탐색 페이지와 동일한 리스트 스타일
function ContentCard({ content }: { content: ContentWithStats }) {
  const now = new Date();
  const publishedAt = content.published_at ? new Date(content.published_at) : null;
  const isScheduled = content.is_published && publishedAt && publishedAt > now;
  const isDraft = !content.is_published;
  const subjectStyle = getSubjectStyle(content.subject);

  const getStatusBadge = () => {
    if (isDraft) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-600">
          <Clock className="w-3 h-3" />
          임시저장
        </span>
      );
    }
    if (isScheduled) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-600">
          <Calendar className="w-3 h-3" />
          예약됨
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600">
        <CheckCircle className="w-3 h-3" />
        발행중
      </span>
    );
  };

  return (
    <div className="group">
      <Link href={`/content/${content.id}`} className="block">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-colors duration-200">
          <div className="flex gap-5">
            {/* 콘텐츠 정보 */}
            <div className="flex-1 min-w-0">
              {/* 태그 라인 */}
              <div className="flex items-center gap-2 mb-2.5">
                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subjectStyle.bg} ${subjectStyle.text}`}>
                  {content.subject || '학습자료'}
                </span>
                {content.grade && (
                  <span className="px-2.5 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg">
                    {content.grade}
                  </span>
                )}
                {getStatusBadge()}
                <span className="text-xs text-gray-400">• {formatRelativeTime(content.created_at)}</span>
              </div>

              {/* 제목 */}
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-500 transition-colors mb-1.5 line-clamp-1">
                {content.title}
              </h3>

              {/* 설명 */}
              {content.description && (
                <p className="text-sm text-gray-500 mb-4 line-clamp-1">
                  {content.description}
                </p>
              )}

              {/* 하단: 통계 + 판매 정보 */}
              <div className="flex items-center justify-between">
                {/* 통계 */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-gray-400">
                    <Eye className="w-4 h-4" />
                    <span className="font-medium">{formatNumber(content.view_count || 0)}</span>
                  </span>
                  <span className="flex items-center gap-1 text-gray-400">
                    <Heart className="w-4 h-4" />
                    <span className="font-medium">{formatNumber(content.like_count || 0)}</span>
                  </span>
                  <span className="flex items-center gap-1 text-gray-400">
                    <Download className="w-4 h-4" />
                    <span className="font-medium">{formatNumber(content.download_count || 0)}</span>
                  </span>
                </div>

                {/* 판매 정보 */}
                {(content.purchase_count || 0) > 0 && (
                  <span className="text-sm text-orange-600 font-semibold">
                    {formatNumber(content.purchase_count || 0)}건 판매 • {formatCurrency(content.revenue || 0)} 수익
                  </span>
                )}
              </div>
            </div>

            {/* 우측: 가격 + 액션 */}
            <div className="flex flex-col items-end justify-between pl-5 border-l border-gray-200 min-w-[120px]">
              {/* 가격 */}
              <div className="text-right">
                {content.price === 0 ? (
                  <span className="inline-block px-4 py-2 bg-blue-50 text-blue-600 text-lg font-bold rounded-xl">
                    무료
                  </span>
                ) : (
                  <div>
                    <span className="block text-xs text-gray-400 mb-0.5">가격</span>
                    <span className="text-xl font-bold text-gray-900">{formatCurrency(content.price || 0)}</span>
                  </div>
                )}
              </div>

              {/* 액션 버튼 */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/contents/${content.id}/edit`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </Link>
                <Link
                  href={`/dashboard/analytics?content=${content.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                >
                  <BarChart2 className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

// Empty State
function EmptyState({ filter }: { filter: string }) {
  const messages: Record<string, { title: string; description: string }> = {
    all: {
      title: '아직 콘텐츠가 없어요',
      description: '첫 번째 학습 자료를 업로드해보세요!',
    },
    published: {
      title: '발행된 콘텐츠가 없어요',
      description: '임시저장된 콘텐츠를 발행해보세요.',
    },
    draft: {
      title: '임시저장된 콘텐츠가 없어요',
      description: '작성 중인 콘텐츠가 여기에 저장됩니다.',
    },
    scheduled: {
      title: '예약된 콘텐츠가 없어요',
      description: '발행 예약 기능을 사용해보세요.',
    },
  };

  const message = messages[filter] || messages.all;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-gray-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{message.title}</h3>
      <p className="text-gray-500 text-sm text-center max-w-xs mb-6">{message.description}</p>
      <Link href="/dashboard/upload">
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          새 콘텐츠 만들기
        </Button>
      </Link>
    </div>
  );
}

// Filter Tab
function FilterTab({
  label,
  count,
  active,
  href,
}: {
  label: string;
  count: number;
  active?: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-gray-900 text-white'
          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
      }`}
    >
      {label} <span className={active ? 'text-gray-300' : 'text-gray-400'}>{count}</span>
    </Link>
  );
}

async function ContentsContent({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/dashboard/contents');
  }

  const { data: creatorCheck } = await supabase
    .from('creator_settings')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!creatorCheck) {
    redirect('/dashboard');
  }

  const { contents, stats } = await getCreatorContents(user.id);
  const filter = (searchParams?.filter as string) || 'all';

  const now = new Date();
  const filteredContents = contents.filter((content) => {
    if (filter === 'all') return true;
    if (filter === 'published') {
      return content.is_published && (!content.published_at || new Date(content.published_at) <= now);
    }
    if (filter === 'draft') {
      return !content.is_published;
    }
    if (filter === 'scheduled') {
      return content.is_published && content.published_at && new Date(content.published_at) > now;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900">내 콘텐츠</h1>
            </div>
          </div>
          <Link href="/dashboard/upload">
            <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-9 px-4">
              <Plus className="w-4 h-4 mr-1.5" />
              새 콘텐츠
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          <FilterTab
            label="전체"
            count={stats.total}
            active={filter === 'all'}
            href="/dashboard/contents"
          />
          <FilterTab
            label="발행됨"
            count={stats.published}
            active={filter === 'published'}
            href="/dashboard/contents?filter=published"
          />
          <FilterTab
            label="임시저장"
            count={stats.draft}
            active={filter === 'draft'}
            href="/dashboard/contents?filter=draft"
          />
          <FilterTab
            label="예약됨"
            count={stats.scheduled}
            active={filter === 'scheduled'}
            href="/dashboard/contents?filter=scheduled"
          />
        </div>

        {/* Content List */}
        {filteredContents.length > 0 ? (
          <div className="space-y-4">
            {filteredContents.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl">
            <EmptyState filter={filter} />
          </div>
        )}
      </main>
    </div>
  );
}

export default function ContentsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return (
    <Suspense fallback={<LoadingSection fullHeight />}>
      <ContentsContent searchParams={searchParams} />
    </Suspense>
  );
}

export const metadata = {
  title: '내 콘텐츠 - 스터플',
  description: '내 콘텐츠를 관리하세요.',
};
