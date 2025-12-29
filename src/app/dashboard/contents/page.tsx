import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Video,
  Mic,
  Image as ImageIcon,
  FileText,
  BookOpen,
  Eye,
  Heart,
  MoreVertical,
  Edit,
  Trash2,
  BarChart3,
  Filter,
  Search,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatNumber, formatDate, formatRelativeTime } from '@/lib/utils';
import { Button, Card, CardContent, Badge, LoadingSection } from '@/components/ui';
import type { Content } from '@/types/database';

export const dynamic = 'force-dynamic';

// Content Type Icons
function getContentTypeIcon(type: string) {
  switch (type) {
    case 'video': return Video;
    case 'audio': return Mic;
    case 'image': return ImageIcon;
    case 'document': return BookOpen;
    default: return FileText;
  }
}

// Content Type Labels
const contentTypeLabels: Record<string, string> = {
  video: '동영상',
  audio: '오디오',
  image: '이미지',
  document: '문서',
  post: '포스트',
  live: '라이브',
};

// Access Level Labels
const accessLevelLabels: Record<string, string> = {
  public: '공개',
  subscribers: '구독자',
  tier: '티어',
  paid: '유료',
};

// Access Level Colors
const accessLevelColors: Record<string, string> = {
  public: 'bg-green-100 text-green-700',
  subscribers: 'bg-blue-100 text-blue-700',
  tier: 'bg-purple-100 text-purple-700',
  paid: 'bg-orange-100 text-orange-700',
};

interface ContentWithStats extends Content {
  purchase_count?: number;
  revenue?: number;
  tags?: string[];
}

async function getCreatorContents(userId: string) {
  const supabase = await createClient();

  // Get all contents
  const { data: contents, error } = await supabase
    .from('contents')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false });

  if (error || !contents) {
    return { contents: [], stats: { total: 0, published: 0, draft: 0, scheduled: 0 } };
  }

  // Get purchase stats for each content
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

  // Calculate stats
  const now = new Date();
  const stats = {
    total: contents.length,
    published: contents.filter((c: Content) => c.is_published && (!c.published_at || new Date(c.published_at) <= now)).length,
    draft: contents.filter((c: Content) => !c.is_published).length,
    scheduled: contents.filter((c: Content) => c.is_published && c.published_at && new Date(c.published_at) > now).length,
  };

  return { contents: contentsWithStats, stats };
}

// Content Card Component
function ContentCard({ content }: { content: ContentWithStats }) {
  const Icon = getContentTypeIcon(content.content_type);
  const now = new Date();
  const publishedAt = content.published_at ? new Date(content.published_at) : null;
  const isScheduled = content.is_published && publishedAt && publishedAt > now;
  const isDraft = !content.is_published;

  return (
    <div className="group bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all overflow-hidden">
      <div className="flex">
        {/* Thumbnail Area */}
        <div className="w-32 sm:w-40 flex-shrink-0 bg-gray-100 flex items-center justify-center">
          {content.thumbnail_url ? (
            <img
              src={content.thumbnail_url}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Icon className="w-8 h-8 text-gray-400" />
          )}
        </div>

        {/* Content Info */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {isDraft ? (
                  <Badge variant="secondary" size="sm" className="bg-gray-100 text-gray-600">
                    <Clock className="w-3 h-3 mr-1" />
                    임시저장
                  </Badge>
                ) : isScheduled ? (
                  <Badge variant="secondary" size="sm" className="bg-yellow-100 text-yellow-700">
                    <Calendar className="w-3 h-3 mr-1" />
                    예약됨
                  </Badge>
                ) : (
                  <Badge variant="secondary" size="sm" className="bg-green-100 text-green-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    발행됨
                  </Badge>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${accessLevelColors[content.access_level || 'public']}`}>
                  {accessLevelLabels[content.access_level || 'public']}
                </span>
              </div>

              <Link href={`/content/${content.id}`} className="block">
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-gray-900 transition-colors">
                  {content.title}
                </h3>
              </Link>

              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                {content.description || '설명이 없습니다'}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {formatNumber(content.view_count || 0)}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {formatNumber(content.like_count || 0)}
                </span>
                {content.access_level === 'paid' && content.revenue !== undefined && content.revenue > 0 && (
                  <span className="text-xs font-medium text-green-600">
                    {formatCurrency(content.revenue)}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link href={`/dashboard/contents/${content.id}/edit`}>
                <Button variant="ghost" size="sm" className="p-2">
                  <Edit className="w-4 h-4 text-gray-500" />
                </Button>
              </Link>
              <Link href={`/dashboard/analytics?content=${content.id}`}>
                <Button variant="ghost" size="sm" className="p-2">
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Icon className="w-3.5 h-3.5" />
              <span>{contentTypeLabels[content.content_type]}</span>
              <span>·</span>
              <span>
                {isScheduled && publishedAt
                  ? `${formatDate(publishedAt.toISOString())} 발행 예정`
                  : formatRelativeTime(content.created_at)
                }
              </span>
            </div>

            {content.tags && content.tags.length > 0 && (
              <div className="flex gap-1">
                {content.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-xs text-gray-400">
                    #{tag}
                  </span>
                ))}
                {content.tags.length > 2 && (
                  <span className="text-xs text-gray-400">+{content.tags.length - 2}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ filter }: { filter: string }) {
  const messages: Record<string, { title: string; description: string }> = {
    all: {
      title: '아직 콘텐츠가 없어요',
      description: '첫 콘텐츠를 업로드하고 팬들과 소통을 시작하세요.',
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
      description: '콘텐츠 발행을 예약할 수 있어요.',
    },
  };

  const message = messages[filter] || messages.all;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <FileText className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{message.title}</h3>
      <p className="text-gray-500 text-center max-w-sm mb-6">{message.description}</p>
      <Link href="/dashboard/upload">
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          콘텐츠 업로드
        </Button>
      </Link>
    </div>
  );
}

// Stats Card
function StatsCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 rounded-xl text-center transition-all ${
        active
          ? 'bg-gray-50 border-2 border-gray-900'
          : 'bg-white border border-gray-200 hover:border-gray-300'
      }`}
    >
      <p className={`text-2xl font-bold ${active ? 'text-gray-900' : 'text-gray-900'}`}>
        {value}
      </p>
      <p className={`text-sm ${active ? 'text-gray-900' : 'text-gray-500'}`}>{label}</p>
    </button>
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

  // Filter contents
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">콘텐츠 관리</h1>
                <p className="text-gray-500 text-sm mt-1">
                  총 {stats.total}개의 콘텐츠
                </p>
              </div>
            </div>
            <Link href="/dashboard/upload">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                새 콘텐츠
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Filter */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          <Link href="/dashboard/contents">
            <StatsCard label="전체" value={stats.total} active={filter === 'all'} />
          </Link>
          <Link href="/dashboard/contents?filter=published">
            <StatsCard label="발행됨" value={stats.published} active={filter === 'published'} />
          </Link>
          <Link href="/dashboard/contents?filter=draft">
            <StatsCard label="임시저장" value={stats.draft} active={filter === 'draft'} />
          </Link>
          <Link href="/dashboard/contents?filter=scheduled">
            <StatsCard label="예약됨" value={stats.scheduled} active={filter === 'scheduled'} />
          </Link>
        </div>

        {/* Content List */}
        {filteredContents.length > 0 ? (
          <div className="space-y-4">
            {filteredContents.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <EmptyState filter={filter} />
          </Card>
        )}
      </div>
    </div>
  );
}

export default function ContentsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return (
    <Suspense fallback={<LoadingSection />}>
      <ContentsContent searchParams={searchParams} />
    </Suspense>
  );
}

export const metadata = {
  title: '콘텐츠 관리 - 스터플',
  description: '내 콘텐츠를 관리하세요.',
};
