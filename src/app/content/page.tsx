'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  Search,
  FileText,
  Star,
  Heart,
  X,
  Clock,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  ContentCard,
  CategorySidebar,
  FilterTagBar,
  MobileCategoryDrawer,
  defaultCategories,
  defaultGradeFilters,
} from '@/components/content';
import { LoadingSection } from '@/components/ui/Spinner';

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: string;
  content_count?: number;
}

interface DisplayProduct extends Product {
  download_count: number;
  rating_sum: number;
  rating_count: number;
  view_count: number;
  like_count: number;
  rating: number;
  creator?: {
    name: string;
    avatar_url?: string;
  };
  subject?: string;
  grade?: string;
  tags?: string[];
}

interface ContentFilters {
  category: string;
  grades: string[];
  freeOnly: boolean;
  minRating: number;
}

// 과목별 카테고리 매핑
const categorySubjectMap: Record<string, string[]> = {
  korean: ['국어'],
  math: ['수학'],
  english: ['영어'],
  science: ['과학', '물리', '화학', '생물', '지구과학'],
  social: ['사회', '경제', '정치'],
  history: ['한국사', '세계사'],
  routine: ['루틴', '플래너', '스케줄', '습관'],
  etc: ['기타', '자격증'],
};

// 학년 매핑
const gradeSubjectMap: Record<string, string[]> = {
  middle: ['중1', '중2', '중3', '중학교'],
  high: ['고1', '고2', '고3', '고등학교'],
  university: ['대학교', '대학'],
  cert: ['자격증'],
};

// 리스트 뷰 카드 (크몽 스타일)
function ProductListCard({ product, index, likedIds, onToggleLike }: { product: DisplayProduct; index: number; likedIds: Set<string>; onToggleLike: (id: string) => void }) {
  const isLiked = likedIds.has(product.id);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleLike(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className="relative"
    >
      {/* 찜 버튼 - Link 바깥에 배치 */}
      <button
        type="button"
        onClick={handleLikeClick}
        className="absolute top-5 right-5 z-10 p-1.5 transition-all duration-200"
      >
        <Heart
          className={cn(
            'w-4 h-4 transition-colors',
            isLiked ? 'text-red-500 fill-red-500' : 'text-gray-300 hover:text-gray-400'
          )}
        />
      </button>

      <Link href={`/content/${product.id}`} className="block group">
        <div className="bg-white rounded-xl p-5 hover:shadow-md transition-shadow duration-200">
          <div className="flex gap-5">
            {/* 콘텐츠 정보 */}
            <div className="flex-1 min-w-0">
              {/* 제목 - 크몽 스타일로 강조 */}
              <h3 className="text-base font-bold text-gray-900 group-hover:text-orange-600 transition-colors mb-2 line-clamp-2 leading-snug">
                {product.title}
              </h3>

              {/* 별점 + 리뷰 수 */}
              <div className="flex items-center gap-1.5 mb-2">
                {product.rating > 0 ? (
                  <>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-gray-900">{product.rating.toFixed(1)}</span>
                    {product.rating_count > 0 && (
                      <span className="text-sm text-gray-400">({product.rating_count})</span>
                    )}
                  </>
                ) : null}
              </div>

              {/* 가격 */}
              <div className="mb-2">
                {product.price === 0 ? (
                  <span className="text-base font-bold text-orange-600">무료</span>
                ) : (
                  <span className="text-base font-bold text-gray-900">
                    {formatCurrency(product.price)}~
                  </span>
                )}
              </div>

              {/* 크리에이터 */}
              <span className="text-xs text-gray-400">
                {product.creator?.name || '익명'}
              </span>
            </div>

            {/* 우측 여백 (버튼 공간) */}
            <div className="w-9" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyState() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleUploadClick = async () => {
    if (isNavigating) return;
    setIsNavigating(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/login?redirectTo=/dashboard/upload');
        return;
      }

      // 3초 타임아웃으로 크리에이터 체크
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 3000)
      );

      const checkPromise = supabase
        .from('creator_settings')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      try {
        const { data: creatorSettings } = await Promise.race([checkPromise, timeoutPromise]) as { data: { id: string } | null };

        if (creatorSettings) {
          router.push('/dashboard/upload');
        } else {
          router.push('/become-creator?redirectTo=/dashboard/upload');
        }
      } catch {
        // 타임아웃이나 에러 시 기본적으로 업로드 페이지로 이동
        router.push('/dashboard/upload');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login?redirectTo=/dashboard/upload');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-24 bg-white rounded-2xl"
    >
      <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6">
        <FileText className="w-10 h-10 text-gray-300" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        등록된 자료가 없습니다
      </h3>
      <p className="text-gray-500 mb-8">
        첫 번째 학습 자료를 등록해보세요!
      </p>
      <button
        onClick={handleUploadClick}
        disabled={isNavigating}
        className="inline-flex px-6 py-3 text-orange-500 font-semibold rounded-xl hover:text-orange-600 transition-colors disabled:opacity-50"
      >
        {isNavigating ? '이동 중...' : '자료 올리기'}
      </button>
    </motion.div>
  );
}


const RECENT_SEARCHES_KEY = 'stuple_recent_searches';
const MAX_RECENT_SEARCHES = 10;

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [headerSearchSlot, setHeaderSearchSlot] = useState<HTMLElement | null>(null);

  // Header search slot 찾기
  useEffect(() => {
    const slot = document.getElementById('header-search-slot');
    setHeaderSearchSlot(slot);
    return () => setHeaderSearchSlot(null);
  }, []);

  // 최근 검색어 불러오기
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // 검색어 저장
  const saveSearch = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // 검색어 삭제
  const removeSearch = (query: string) => {
    const updated = recentSearches.filter(s => s !== query);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // 전체 삭제
  const clearAllSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  // 검색 실행
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    saveSearch(query);
    setIsSearchFocused(false);
  };

  // 통합 필터 상태
  const [filters, setFilters] = useState<ContentFilters>({
    category: 'all',
    grades: [],
    freeOnly: false,
    minRating: 0,
  });

  // 찜한 콘텐츠 ID 목록
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [isLiking, setIsLiking] = useState(false);

  // 찜한 콘텐츠 불러오기 (API 사용으로 RLS 우회)
  useEffect(() => {
    const fetchLikedIds = async () => {
      try {
        const response = await fetch('/api/me/likes');
        if (!response.ok) {
          // 401인 경우 로그인 안 된 상태이므로 조용히 종료
          if (response.status === 401) return;
          throw new Error('Failed to fetch likes');
        }

        const data = await response.json();
        if (data.likedIds) {
          setLikedIds(new Set(data.likedIds));
        }
      } catch (error) {
        console.error('Failed to fetch liked IDs:', error);
      }
    };
    fetchLikedIds();
  }, []);

  // 찜하기 토글
  const handleToggleLike = async (contentId: string) => {
    if (isLiking) return;
    setIsLiking(true);

    try {
      const response = await fetch(`/api/content/${contentId}/like`, {
        method: 'POST',
      });

      if (response.status === 401) {
        window.location.href = `/login?redirectTo=/content`;
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setLikedIds(prev => {
          const newSet = new Set(prev);
          if (data.isLiked) {
            newSet.add(contentId);
          } else {
            newSet.delete(contentId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error('Like toggle failed:', error);
    } finally {
      setIsLiking(false);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');

        const data = await response.json();

        interface ApiProduct extends Product {
          creator?: { name: string; avatar_url?: string };
          subject?: string;
          grade?: string;
          download_count?: number;
          rating_sum?: number;
          rating_count?: number;
          view_count?: number;
          like_count?: number;
        }

        const enhancedProducts: DisplayProduct[] = (data.products || []).map((p: ApiProduct) => {
          const ratingSum = p.rating_sum || 0;
          const ratingCount = p.rating_count || 0;
          const calculatedRating = ratingCount > 0 ? ratingSum / ratingCount : 0;

          return {
            ...p,
            download_count: p.download_count || 0,
            rating_sum: ratingSum,
            rating_count: ratingCount,
            view_count: p.view_count || 0,
            like_count: p.like_count || 0,
            rating: parseFloat(calculatedRating.toFixed(1)),
            creator: p.creator || { name: '익명' },
            subject: p.subject || null,
            grade: p.grade || null,
          };
        });

        setProducts(enhancedProducts);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 필터링
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 검색어 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          product.title.toLowerCase().includes(query) ||
          (product.description && product.description.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // 카테고리 필터
      if (filters.category !== 'all') {
        const subjects = categorySubjectMap[filters.category];
        if (subjects && !subjects.some(s => product.subject?.includes(s))) {
          return false;
        }
      }

      // 학년 필터
      if (filters.grades.length > 0) {
        const matchesGrade = filters.grades.some(gradeId => {
          const gradeTerms = gradeSubjectMap[gradeId];
          return gradeTerms?.some(g => product.grade?.includes(g));
        });
        if (!matchesGrade) return false;
      }

      // 무료만 필터
      if (filters.freeOnly && product.price > 0) {
        return false;
      }

      // 평점 필터
      if (filters.minRating > 0 && product.rating < filters.minRating) {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, filters]);

  // 정렬
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'popular':
        default:
          return (b.download_count || 0) - (a.download_count || 0);
      }
    });
  }, [filteredProducts, sortBy]);

  // 활성 필터 태그 생성
  const activeFilters = useMemo(() => {
    const tags: { id: string; type: 'category' | 'grade' | 'price' | 'rating'; label: string }[] = [];

    if (filters.category !== 'all') {
      const category = defaultCategories.find(c => c.id === filters.category);
      if (category) {
        tags.push({ id: filters.category, type: 'category', label: category.label });
      }
    }

    filters.grades.forEach(gradeId => {
      const grade = defaultGradeFilters.find(g => g.id === gradeId);
      if (grade) {
        tags.push({ id: gradeId, type: 'grade', label: grade.label });
      }
    });

    if (filters.freeOnly) {
      tags.push({ id: 'free', type: 'price', label: '무료' });
    }

    if (filters.minRating > 0) {
      tags.push({ id: `rating-${filters.minRating}`, type: 'rating', label: `${filters.minRating}점 이상` });
    }

    return tags;
  }, [filters]);

  // 필터 제거 핸들러
  const handleRemoveFilter = (filterId: string, type: string) => {
    switch (type) {
      case 'category':
        setFilters(prev => ({ ...prev, category: 'all' }));
        break;
      case 'grade':
        setFilters(prev => ({
          ...prev,
          grades: prev.grades.filter(g => g !== filterId),
        }));
        break;
      case 'price':
        setFilters(prev => ({ ...prev, freeOnly: false }));
        break;
      case 'rating':
        setFilters(prev => ({ ...prev, minRating: 0 }));
        break;
    }
  };

  // 필터 추가 핸들러
  const handleAddFilter = (filterId: string, type: string) => {
    switch (type) {
      case 'category':
        setFilters(prev => ({ ...prev, category: filterId }));
        break;
      case 'grade':
        setFilters(prev => ({
          ...prev,
          grades: prev.grades.includes(filterId) ? prev.grades : [...prev.grades, filterId],
        }));
        break;
      case 'price':
        setFilters(prev => ({ ...prev, freeOnly: true }));
        break;
      case 'rating':
        setFilters(prev => ({ ...prev, minRating: 4 }));
        break;
    }
  };

  // 전체 필터 초기화
  const handleClearAllFilters = () => {
    setFilters({
      category: 'all',
      grades: [],
      freeOnly: false,
      minRating: 0,
    });
  };

  // 카테고리 라벨 가져오기
  const currentCategoryLabel = defaultCategories.find(c => c.id === filters.category)?.label || '전체';

  return (
    <motion.div
      className="min-h-screen bg-white"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* 필터 태그바 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <FilterTagBar
              activeFilters={activeFilters}
              onRemoveFilter={handleRemoveFilter}
              onAddFilter={handleAddFilter}
              onClearAll={handleClearAllFilters}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              totalCount={sortedProducts.length}
              onMobileFilterClick={() => setIsMobileFilterOpen(true)}
            />
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex gap-6 lg:gap-8">
          {/* 사이드바 - 데스크탑 */}
          <div className="hidden lg:block sticky top-24 h-fit">
            <CategorySidebar
              categories={defaultCategories}
              gradeFilters={defaultGradeFilters}
              filters={filters}
              onFilterChange={setFilters}
            />
          </div>

          {/* 메인 콘텐츠 영역 */}
          <div className="flex-1 min-w-0">
            {/* 콘텐츠 목록 */}
            {isLoading ? (
              <div className="flex items-center justify-center py-32">
                <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-gray-100 overflow-hidden">
                  <div className="h-full bg-orange-500 animate-progress-bar rounded-r-full" />
                </div>
              </div>
            ) : sortedProducts.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
                  {sortedProducts.map((product, index) => (
                    <ContentCard key={product.id} product={product} index={index} likedIds={likedIds} onToggleLike={handleToggleLike} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedProducts.map((product, index) => (
                    <ProductListCard key={product.id} product={product} index={index} likedIds={likedIds} onToggleLike={handleToggleLike} />
                  ))}
                </div>
              )
            ) : searchQuery || activeFilters.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 bg-white rounded-2xl"
              >
                <Search className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                <p className="text-xl font-semibold text-gray-900 mb-2">
                  검색 결과가 없습니다
                </p>
                <p className="text-gray-500 mb-6">
                  다른 키워드나 필터로 검색해보세요
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    handleClearAllFilters();
                  }}
                  className="text-orange-500 hover:text-orange-600 font-semibold"
                >
                  전체 자료 보기
                </button>
              </motion.div>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>

      {/* 모바일 필터 드로어 */}
      <MobileCategoryDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* 헤더 검색바 포털 */}
      {headerSearchSlot && createPortal(
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="필요한 학습 자료를 검색해보세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                handleSearch(searchQuery);
              }
            }}
            className="w-full pl-6 pr-14 py-2.5 bg-white border border-gray-300 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 transition-all text-[15px]"
          />
          <button
            onClick={() => { if (searchQuery.trim()) handleSearch(searchQuery); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* 최근 검색어 드롭다운 */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-900">최근 검색어</span>
                  {recentSearches.length > 0 && (
                    <button
                      onClick={clearAllSearches}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      전체 삭제
                    </button>
                  )}
                </div>

                {recentSearches.length > 0 ? (
                  <div className="space-y-1">
                    {recentSearches.map((search, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between group px-2 py-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        onClick={() => handleSearch(search)}
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-gray-300" />
                          <span className="text-sm text-gray-700">{search}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSearch(search);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                        >
                          <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-6">
                    최근 검색어 내역이 없습니다
                  </p>
                )}
              </div>
            </div>
          )}
        </div>,
        headerSearchSlot
      )}
    </motion.div>
  );
}
