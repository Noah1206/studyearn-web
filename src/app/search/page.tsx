'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  X,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Clock,
  TrendingUp,
  Users,
  BookOpen,
  Video,
  Mic,
  FileText,
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, CardContent, Badge, Avatar, Spinner } from '@/components/ui';
import { cn, formatNumber, formatCurrency } from '@/lib/utils';

// 카테고리 옵션
const CATEGORY_OPTIONS = [
  { id: 'all', label: '전체' },
  { id: 'korean', label: '국어' },
  { id: 'math', label: '수학' },
  { id: 'english', label: '영어' },
  { id: 'science', label: '과학' },
  { id: 'social', label: '사회' },
  { id: 'history', label: '역사' },
  { id: 'coding', label: '코딩' },
  { id: 'art', label: '예술' },
  { id: 'music', label: '음악' },
  { id: 'study-tips', label: '공부법' },
  { id: 'exam-prep', label: '시험대비' },
  { id: 'language', label: '외국어' },
];

// 콘텐츠 타입 옵션
const CONTENT_TYPE_OPTIONS = [
  { id: 'all', label: '전체', icon: null },
  { id: 'video', label: '동영상', icon: Video },
  { id: 'audio', label: '오디오', icon: Mic },
  { id: 'document', label: '문서', icon: BookOpen },
  { id: 'post', label: '포스트', icon: FileText },
  { id: 'image', label: '이미지', icon: ImageIcon },
];

// 정렬 옵션
const SORT_OPTIONS = [
  { id: 'relevance', label: '관련도순' },
  { id: 'latest', label: '최신순' },
  { id: 'popular', label: '인기순' },
  { id: 'views', label: '조회순' },
];

// 인기 검색어
const TRENDING_KEYWORDS = [
  '수능 수학', '영어 문법', '코딩 입문', '물리 개념',
  '한국사', '논술 첨삭', '토익 단어', '미적분',
];

interface SearchResult {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  content_type: string;
  view_count: number;
  price: number | null;
  access_level: string;
  creator: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface CreatorResult {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  subscriber_count: number;
  categories: string[];
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'contents' | 'creators'>('contents');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // 필터 상태
  const [category, setCategory] = useState('all');
  const [contentType, setContentType] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');

  // 검색 결과
  const [contents, setContents] = useState<SearchResult[]>([]);
  const [creators, setCreators] = useState<CreatorResult[]>([]);
  const [totalContents, setTotalContents] = useState(0);
  const [totalCreators, setTotalCreators] = useState(0);

  // 최근 검색어
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    // 로컬 스토리지에서 최근 검색어 불러오기
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (searchQuery) {
      performSearch();
    }
  }, [searchQuery, category, contentType, sortBy, activeTab]);

  const saveRecentSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchQuery(query.trim());
      saveRecentSearch(query.trim());
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeywordClick = (keyword: string) => {
    setQuery(keyword);
    setSearchQuery(keyword);
    saveRecentSearch(keyword);
    router.push(`/search?q=${encodeURIComponent(keyword)}`);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const performSearch = async () => {
    if (!searchQuery) return;

    setIsLoading(true);
    const supabase = createClient();

    try {
      if (activeTab === 'contents') {
        // 콘텐츠 검색
        let query = supabase
          .from('contents')
          .select(`
            id, title, description, thumbnail_url, content_type,
            view_count, price, access_level,
            creator:creator_settings!creator_id (
              id:user_id, display_name, avatar_url
            )
          `)
          .eq('is_published', true)
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);

        if (category !== 'all') {
          query = query.eq('category', category);
        }
        if (contentType !== 'all') {
          query = query.eq('content_type', contentType);
        }

        // 정렬
        switch (sortBy) {
          case 'latest':
            query = query.order('created_at', { ascending: false });
            break;
          case 'popular':
            query = query.order('like_count', { ascending: false });
            break;
          case 'views':
            query = query.order('view_count', { ascending: false });
            break;
          default:
            query = query.order('created_at', { ascending: false });
        }

        const { data, count } = await query.limit(20);
        setContents(data as any[] || []);
        setTotalContents(count || data?.length || 0);
      } else {
        // 크리에이터 검색
        const { data, count } = await supabase
          .from('creator_settings')
          .select('user_id, display_name, avatar_url, bio, subscriber_count, categories')
          .or(`display_name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`)
          .order('subscriber_count', { ascending: false })
          .limit(20);

        setCreators((data || []).map((c: { user_id: string; display_name: string | null; avatar_url: string | null; bio: string | null; subscriber_count: number | null; categories: string[] | null }) => ({ ...c, id: c.user_id })) as any[]);
        setTotalCreators(count || data?.length || 0);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getContentTypeIcon = (type: string) => {
    const option = CONTENT_TYPE_OPTIONS.find(o => o.id === type);
    return option?.icon || FileText;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="h-14 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
            </button>

            {/* 검색 바 */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="콘텐츠, 크리에이터 검색..."
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 검색 전 화면 */}
        {!searchQuery ? (
          <div className="space-y-8">
            {/* 최근 검색어 */}
            {recentSearches.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" />
                    최근 검색어
                  </h2>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    전체 삭제
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleKeywordClick(term)}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* 인기 검색어 */}
            <section>
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-red-500" />
                인기 검색어
              </h2>
              <div className="flex flex-wrap gap-2">
                {TRENDING_KEYWORDS.map((keyword, index) => (
                  <button
                    key={keyword}
                    onClick={() => handleKeywordClick(keyword)}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                    {keyword}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <>
            {/* 탭 */}
            <div className="flex items-center gap-4 mb-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('contents')}
                className={cn(
                  "pb-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'contents'
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                콘텐츠 {totalContents > 0 && `(${formatNumber(totalContents)})`}
              </button>
              <button
                onClick={() => setActiveTab('creators')}
                className={cn(
                  "pb-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'creators'
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                크리에이터 {totalCreators > 0 && `(${formatNumber(totalCreators)})`}
              </button>
            </div>

            {/* 필터 (콘텐츠 탭에서만) */}
            {activeTab === 'contents' && (
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-colors flex-shrink-0",
                    showFilters
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <SlidersHorizontal size={14} />
                  필터
                </button>

                {/* 카테고리 */}
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-full text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORY_OPTIONS.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>

                {/* 콘텐츠 타입 */}
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="px-3 py-1.5 rounded-full text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CONTENT_TYPE_OPTIONS.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>

                {/* 정렬 */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 rounded-full text-sm border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 검색 결과 */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : activeTab === 'contents' ? (
              contents.length > 0 ? (
                <div className="space-y-4">
                  {contents.map((content) => {
                    const TypeIcon = getContentTypeIcon(content.content_type);
                    return (
                      <Link key={content.id} href={`/content/${content.id}`}>
                        <Card variant="outlined" className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              {/* 썸네일 */}
                              <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center">
                                {content.thumbnail_url ? (
                                  <img
                                    src={content.thumbnail_url}
                                    alt={content.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <TypeIcon className="w-8 h-8 text-gray-400" />
                                )}
                              </div>

                              {/* 정보 */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="secondary" size="sm">
                                    {CONTENT_TYPE_OPTIONS.find(t => t.id === content.content_type)?.label}
                                  </Badge>
                                  {content.price ? (
                                    <Badge size="sm" className="bg-orange-100 text-orange-700">
                                      {formatCurrency(content.price)}
                                    </Badge>
                                  ) : (
                                    <Badge size="sm" className="bg-green-100 text-green-700">
                                      무료
                                    </Badge>
                                  )}
                                </div>
                                <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">
                                  {content.title}
                                </h3>
                                {content.description && (
                                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                                    {content.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2">
                                  <Avatar
                                    src={content.creator?.avatar_url}
                                    alt={content.creator?.display_name}
                                    size="xs"
                                  />
                                  <span className="text-xs text-gray-500">
                                    {content.creator?.display_name}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    조회 {formatNumber(content.view_count)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    '{searchQuery}'에 대한 검색 결과가 없습니다
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    다른 키워드로 검색해보세요
                  </p>
                </div>
              )
            ) : (
              creators.length > 0 ? (
                <div className="space-y-4">
                  {creators.map((creator) => (
                    <Link key={creator.id} href={`/creator/${creator.id}`}>
                      <Card variant="outlined" className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <Avatar
                              src={creator.avatar_url}
                              alt={creator.display_name}
                              size="lg"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900">
                                {creator.display_name}
                              </h3>
                              {creator.bio && (
                                <p className="text-sm text-gray-500 line-clamp-1 mb-1">
                                  {creator.bio}
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Users size={12} />
                                  구독자 {formatNumber(creator.subscriber_count || 0)}
                                </span>
                                {creator.categories?.slice(0, 2).map(cat => (
                                  <Badge key={cat} variant="secondary" size="sm">
                                    {CATEGORY_OPTIONS.find(c => c.id === cat)?.label || cat}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              프로필
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    '{searchQuery}' 크리에이터를 찾을 수 없습니다
                  </p>
                </div>
              )
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
