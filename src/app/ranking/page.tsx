'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Trophy,
  Crown,
  Medal,
  TrendingUp,
  Users,
  Eye,
  Heart,
  Star,
  ChevronRight,
  Flame,
  Video,
  Mic,
  BookOpen,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, CardContent, Badge, Avatar, Spinner } from '@/components/ui';
import { pageVariants } from '@/components/ui/motion/variants';
import { cn, formatNumber, formatCurrency } from '@/lib/utils';

// 기간 옵션
const PERIOD_OPTIONS = [
  { id: 'weekly', label: '이번 주' },
  { id: 'monthly', label: '이번 달' },
  { id: 'all', label: '전체' },
];

// 카테고리 옵션
const CATEGORY_OPTIONS = [
  { id: 'all', label: '전체' },
  { id: 'korean', label: '국어' },
  { id: 'math', label: '수학' },
  { id: 'english', label: '영어' },
  { id: 'science', label: '과학' },
  { id: 'coding', label: '코딩' },
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

// 순위 뱃지 컴포넌트
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
        <Crown className="w-5 h-5 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center">
        <Medal className="w-5 h-5 text-white" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center">
        <Medal className="w-5 h-5 text-white" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
      <span className="text-lg font-bold text-gray-600">{rank}</span>
    </div>
  );
}

interface Creator {
  id: string;
  display_name: string;
  avatar_url: string | null;
  subscriber_count: number;
  bio: string | null;
  categories: string[];
}

interface Content {
  id: string;
  title: string;
  thumbnail_url: string | null;
  content_type: string;
  view_count: number;
  like_count: number;
  creator: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

function RankingContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'creators';

  const [activeTab, setActiveTab] = useState<'creators' | 'contents'>(
    initialTab === 'contents' ? 'contents' : 'creators'
  );
  const [period, setPeriod] = useState('monthly');
  const [category, setCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const [creators, setCreators] = useState<Creator[]>([]);
  const [contents, setContents] = useState<Content[]>([]);

  useEffect(() => {
    loadRankingData();
  }, [activeTab, period, category]);

  const loadRankingData = async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      if (activeTab === 'creators') {
        const { data } = await supabase
          .from('creator_settings')
          .select('user_id, display_name, avatar_url, subscriber_count, bio, categories')
          .order('subscriber_count', { ascending: false })
          .limit(50);

        setCreators((data || []).map((c: { user_id: string; display_name: string | null; avatar_url: string | null; subscriber_count: number | null; bio: string | null; categories: string[] | null }) => ({ ...c, id: c.user_id })) as Creator[]);
      } else {
        let query = supabase
          .from('contents')
          .select(`
            id, title, thumbnail_url, content_type, view_count, like_count,
            creator:creator_settings!creator_id (
              user_id, display_name, avatar_url
            )
          `)
          .eq('is_published', true);

        if (category !== 'all') {
          query = query.eq('category', category);
        }

        const { data } = await query
          .order('view_count', { ascending: false })
          .limit(50);

        setContents((data || []).map((c: { id: string; title: string; thumbnail_url: string | null; content_type: string; view_count: number; like_count: number; creator: { user_id: string; display_name: string | null; avatar_url: string | null } | null }) => ({
          ...c,
          creator: c.creator ? { ...c.creator, id: c.creator.user_id } : null,
        })) as any[]);
      }
    } catch (error) {
      console.error('Error loading ranking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-50"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="h-14 flex items-center gap-4">
            <Link href="/" className="p-2 -ml-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              랭킹
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 탭 */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('creators')}
            className={cn(
              "flex-1 py-3 rounded-xl font-medium text-sm transition-all",
              activeTab === 'creators'
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-gray-700 border border-gray-200"
            )}
          >
            <Users className="w-4 h-4 inline-block mr-2" />
            인기 크리에이터
          </button>
          <button
            onClick={() => setActiveTab('contents')}
            className={cn(
              "flex-1 py-3 rounded-xl font-medium text-sm transition-all",
              activeTab === 'contents'
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-gray-700 border border-gray-200"
            )}
          >
            <Flame className="w-4 h-4 inline-block mr-2" />
            인기 콘텐츠
          </button>
        </div>

        {/* 필터 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {/* 기간 */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PERIOD_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>

          {/* 카테고리 (콘텐츠 탭에서만) */}
          {activeTab === 'contents' && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORY_OPTIONS.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* 로딩 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : activeTab === 'creators' ? (
          /* 크리에이터 랭킹 */
          <div className="space-y-3">
            {/* Top 3 특별 표시 */}
            {creators.slice(0, 3).length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {/* 2위 */}
                {creators[1] && (
                  <Link href={`/creator/${creators[1].id}`}>
                    <Card variant="outlined" className="text-center p-4 hover:shadow-md transition-shadow order-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-white font-bold text-sm">2</span>
                      </div>
                      <Avatar
                        src={creators[1].avatar_url}
                        alt={creators[1].display_name}
                        size="lg"
                        className="mx-auto mb-2"
                      />
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {creators[1].display_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatNumber(creators[1].subscriber_count)} 구독자
                      </p>
                    </Card>
                  </Link>
                )}

                {/* 1위 */}
                {creators[0] && (
                  <Link href={`/creator/${creators[0].id}`}>
                    <Card variant="outlined" className="text-center p-4 hover:shadow-md transition-shadow order-0 bg-gradient-to-b from-yellow-50 to-white border-yellow-200">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                      <Avatar
                        src={creators[0].avatar_url}
                        alt={creators[0].display_name}
                        size="xl"
                        className="mx-auto mb-2 ring-4 ring-yellow-200"
                      />
                      <p className="font-bold text-gray-900 truncate">
                        {creators[0].display_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatNumber(creators[0].subscriber_count)} 구독자
                      </p>
                    </Card>
                  </Link>
                )}

                {/* 3위 */}
                {creators[2] && (
                  <Link href={`/creator/${creators[2].id}`}>
                    <Card variant="outlined" className="text-center p-4 hover:shadow-md transition-shadow order-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-white font-bold text-sm">3</span>
                      </div>
                      <Avatar
                        src={creators[2].avatar_url}
                        alt={creators[2].display_name}
                        size="lg"
                        className="mx-auto mb-2"
                      />
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {creators[2].display_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatNumber(creators[2].subscriber_count)} 구독자
                      </p>
                    </Card>
                  </Link>
                )}
              </div>
            )}

            {/* 4위 이후 */}
            {creators.slice(3).map((creator, index) => (
              <Link key={creator.id} href={`/creator/${creator.id}`}>
                <Card variant="outlined" className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <RankBadge rank={index + 4} />
                      <Avatar
                        src={creator.avatar_url}
                        alt={creator.display_name}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {creator.display_name}
                        </h3>
                        {creator.bio && (
                          <p className="text-sm text-gray-500 truncate">
                            {creator.bio}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatNumber(creator.subscriber_count)}
                        </p>
                        <p className="text-xs text-gray-500">구독자</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}

            {creators.length === 0 && (
              <div className="text-center py-20">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">아직 랭킹 데이터가 없습니다</p>
              </div>
            )}
          </div>
        ) : (
          /* 콘텐츠 랭킹 */
          <div className="space-y-3">
            {contents.map((content, index) => {
              const TypeIcon = getContentTypeIcon(content.content_type);
              return (
                <Link key={content.id} href={`/content/${content.id}`}>
                  <Card variant="outlined" className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <RankBadge rank={index + 1} />

                        {/* 썸네일 */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {content.thumbnail_url ? (
                            <img
                              src={content.thumbnail_url}
                              alt={content.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <TypeIcon className="w-6 h-6 text-gray-400" />
                          )}
                        </div>

                        {/* 정보 */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 line-clamp-1">
                            {content.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar
                              src={content.creator?.avatar_url}
                              alt={content.creator?.display_name}
                              size="xs"
                            />
                            <span className="text-sm text-gray-500 truncate">
                              {content.creator?.display_name}
                            </span>
                          </div>
                        </div>

                        {/* 통계 */}
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-gray-900 font-semibold">
                            <Eye size={14} />
                            {formatNumber(content.view_count)}
                          </div>
                          <div className="flex items-center gap-1 text-gray-500 text-sm">
                            <Heart size={12} />
                            {formatNumber(content.like_count || 0)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}

            {contents.length === 0 && (
              <div className="text-center py-20">
                <Flame className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">아직 랭킹 데이터가 없습니다</p>
              </div>
            )}
          </div>
        )}
      </main>
    </motion.div>
  );
}

export default function RankingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <RankingContent />
    </Suspense>
  );
}
