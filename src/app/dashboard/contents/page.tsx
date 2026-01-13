import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  FileText,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button, LoadingSection } from '@/components/ui';
import type { Content } from '@/types/database';
import { ContentCard, type ContentWithStats } from './ContentCard';

export const dynamic = 'force-dynamic';

async function getCreatorContents(userId: string) {
  const supabase = await createClient();

  if (!supabase) {
    return { contents: [], stats: { total: 0, published: 0, draft: 0, scheduled: 0 } };
  }

  const { data: contents, error } = await supabase
    .from('contents')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false });

  if (error || !contents || contents.length === 0) {
    return { contents: [], stats: { total: 0, published: 0, draft: 0, scheduled: 0 } };
  }

  // 한 번에 모든 구매 데이터 가져오기 (N+1 문제 해결)
  const contentIds = contents.map((c: Content) => c.id);
  const { data: allPurchases } = await supabase
    .from('content_purchases')
    .select('content_id, creator_revenue')
    .in('content_id', contentIds)
    .eq('status', 'completed');

  // 콘텐츠별로 구매 데이터 집계
  const purchaseMap = new Map<string, { count: number; revenue: number }>();
  if (allPurchases) {
    for (const purchase of allPurchases) {
      const existing = purchaseMap.get(purchase.content_id) || { count: 0, revenue: 0 };
      purchaseMap.set(purchase.content_id, {
        count: existing.count + 1,
        revenue: existing.revenue + (purchase.creator_revenue || 0),
      });
    }
  }

  // 콘텐츠에 통계 데이터 매핑
  const contentsWithStats: ContentWithStats[] = contents.map((content: Content) => {
    const stats = purchaseMap.get(content.id) || { count: 0, revenue: 0 };
    return {
      ...content,
      purchase_count: stats.count,
      revenue: stats.revenue,
    };
  });

  const now = new Date();
  const stats = {
    total: contents.length,
    published: contents.filter((c: Content) => c.is_published && (!c.published_at || new Date(c.published_at) <= now)).length,
    draft: contents.filter((c: Content) => !c.is_published).length,
    scheduled: contents.filter((c: Content) => c.is_published && c.published_at && new Date(c.published_at) > now).length,
  };

  return { contents: contentsWithStats, stats };
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

async function ContentsContent({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const supabase = await createClient();

  if (!supabase) {
    redirect('/login?redirectTo=/dashboard/contents');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/dashboard/contents');
  }

  const { data: creatorCheck } = await supabase
    .from('creator_settings')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!creatorCheck) {
    redirect('/dashboard');
  }

  const { contents, stats } = await getCreatorContents(user.id);
  const resolvedSearchParams = await searchParams;
  const filter = (resolvedSearchParams?.filter as string) || 'all';

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

export default async function ContentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
