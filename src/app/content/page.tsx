'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  Search,
  FileText,
  Star,
  Download,
  Heart,
  User,
  ChevronRight,
  Home,
} from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  ContentCard,
  CategorySidebar,
  FilterTagBar,
  MobileCategoryDrawer,
  defaultCategories,
  defaultGradeFilters,
} from '@/components/content';

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

// 과목 색상
function getSubjectStyle(subject?: string) {
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

// 리스트 뷰 카드
function ProductListCard({ product, index }: { product: DisplayProduct; index: number }) {
  const [isLiked, setIsLiked] = useState(false);
  const subjectStyle = getSubjectStyle(product.subject);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
    >
      <Link href={`/content/${product.id}`} className="block group">
        <div className={cn(
          'bg-white rounded-2xl p-6 border transition-all duration-200',
          'border-gray-200 hover:border-gray-300 hover:shadow-toss-2'
        )}>
          <div className="flex gap-5">
            {/* 콘텐츠 정보 */}
            <div className="flex-1 min-w-0">
              {/* 태그 라인 */}
              <div className="flex items-center gap-2 mb-2.5">
                <span className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold',
                  subjectStyle.bg, subjectStyle.text
                )}>
                  {product.subject || '학습자료'}
                </span>
                {product.grade && (
                  <span className="px-2.5 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg">
                    {product.grade}
                  </span>
                )}
                <span className="text-xs text-gray-400">• {formatRelativeTime(product.created_at)}</span>
              </div>

              {/* 제목 */}
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-500 transition-colors mb-1.5 line-clamp-1">
                {product.title}
              </h3>

              {/* 설명 */}
              {product.description && (
                <p className="text-sm text-gray-500 mb-4 line-clamp-1">
                  {product.description}
                </p>
              )}

              {/* 하단: 창작자 + 메타 */}
              <div className="flex items-center justify-between">
                {/* 창작자 */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{product.creator?.name || '익명'}</span>
                </div>

                {/* 통계 */}
                <div className="flex items-center gap-4 text-sm">
                  {product.rating > 0 && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span className="font-bold">{product.rating.toFixed(1)}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-gray-400">
                    <Download className="w-4 h-4" />
                    <span className="font-medium">{product.download_count}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 우측: 가격 + 찜 */}
            <div className="flex flex-col items-end justify-between pl-5 border-l border-gray-200 min-w-[100px]">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsLiked(!isLiked);
                }}
                className={cn(
                  'p-2.5 rounded-xl transition-all duration-200',
                  isLiked
                    ? 'bg-red-50 scale-110'
                    : 'hover:scale-110'
                )}
              >
                <Heart
                  className={cn(
                    'w-5 h-5 transition-colors',
                    isLiked ? 'text-red-500 fill-red-500' : 'text-gray-300'
                  )}
                />
              </button>
              <div className="text-right">
                {product.price === 0 ? (
                  <span className="inline-block px-4 py-2 bg-blue-50 text-blue-600 text-lg font-bold rounded-xl">
                    무료
                  </span>
                ) : (
                  <div>
                    <span className="block text-xs text-gray-400 mb-0.5">가격</span>
                    <span className="text-xl font-bold text-gray-900">{formatCurrency(product.price)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyState() {
  const router = useRouter();

  // 바로 업로드 페이지로 이동 (인증 체크는 해당 페이지에서 처리)
  const handleUploadClick = () => {
    router.push('/dashboard/upload');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200"
    >
      <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
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
        className="inline-flex px-6 py-3 text-orange-500 font-semibold rounded-xl hover:text-orange-600 transition-colors"
      >
        자료 올리기
      </button>
    </motion.div>
  );
}


export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // 통합 필터 상태
  const [filters, setFilters] = useState<ContentFilters>({
    category: 'all',
    grades: [],
    freeOnly: false,
    minRating: 0,
  });

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
      className="min-h-screen bg-gray-50"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* 상단 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 브레드크럼 */}
          <nav className="flex items-center gap-2 py-4 text-sm">
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <Link href="/content" className="text-gray-400 hover:text-gray-600 transition-colors">
              콘텐츠
            </Link>
            {filters.category !== 'all' && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <span className="text-gray-900 font-medium">{currentCategoryLabel}</span>
              </>
            )}
          </nav>

          {/* 검색바 */}
          <div className="pb-6">
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="필요한 학습 자료를 검색해보세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-base"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            {/* 필터 태그바 */}
            <FilterTagBar
              activeFilters={activeFilters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleClearAllFilters}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              totalCount={sortedProducts.length}
              onMobileFilterClick={() => setIsMobileFilterOpen(true)}
            />

            {/* 콘텐츠 목록 */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-gray-400">로딩 중...</div>
              </div>
            ) : sortedProducts.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
                  {sortedProducts.map((product, index) => (
                    <ContentCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedProducts.map((product, index) => (
                    <ProductListCard key={product.id} product={product} index={index} />
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
    </motion.div>
  );
}
