'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  Search,
  FileText,
  Star,
  Download,
  Heart,
  ChevronDown,
  BookOpen,
  GraduationCap,
  Calculator,
  Globe,
  Beaker,
  History,
  Languages,
  Grid3X3,
  List,
  User,
  SlidersHorizontal,
  CalendarCheck,
} from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

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
  rating: number; // Calculated from rating_sum / rating_count
  creator?: {
    name: string;
  };
  subject?: string;
  grade?: string;
  tags?: string[];
}

// 과목별 카테고리
const categories = [
  { id: 'all', label: '전체', icon: Grid3X3 },
  { id: 'korean', label: '국어', icon: BookOpen },
  { id: 'math', label: '수학', icon: Calculator },
  { id: 'english', label: '영어', icon: Languages },
  { id: 'science', label: '과학', icon: Beaker },
  { id: 'social', label: '사회', icon: Globe },
  { id: 'history', label: '한국사', icon: History },
  { id: 'routine', label: '루틴/플래너', icon: CalendarCheck },
  { id: 'etc', label: '기타', icon: GraduationCap },
];

// 학년 필터
const gradeFilters = [
  { id: 'all', label: '전체 학년' },
  { id: 'middle', label: '중학교' },
  { id: 'high', label: '고등학교' },
  { id: 'university', label: '대학교' },
  { id: 'cert', label: '자격증' },
];

const sortOptions = [
  { id: 'popular', label: '인기순' },
  { id: 'newest', label: '최신순' },
  { id: 'price-low', label: '낮은 가격순' },
  { id: 'price-high', label: '높은 가격순' },
];

// 과목 색상
function getSubjectStyle(subject?: string) {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    '국어': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
    '수학': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    '영어': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    '과학': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    '사회': { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
    '한국사': { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    '루틴': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
    '플래너': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  };
  return styles[subject || ''] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
}


// 카테고리별 아이콘
function getCategoryIcon(subject?: string) {
  if (subject === '루틴' || subject === '플래너') {
    return CalendarCheck;
  }
  return FileText;
}

// 자료 카드 - 리스트 뷰
function ProductCard({ product, index }: { product: DisplayProduct; index: number }) {
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
          'bg-white rounded-2xl p-6 border transition-colors duration-200',
          'border-gray-200 hover:border-gray-300'
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

// 그리드 뷰 카드
function ProductGridCard({ product, index }: { product: DisplayProduct; index: number }) {
  const [isLiked, setIsLiked] = useState(false);
  const subjectStyle = getSubjectStyle(product.subject);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
    >
      <Link href={`/content/${product.id}`} className="block group h-full">
        <div className={cn(
          'bg-white rounded-2xl p-5 border transition-colors duration-200 h-full flex flex-col',
          'border-gray-200 hover:border-gray-300'
        )}>
          {/* 상단: 찜 버튼 */}
          <div className="flex items-start justify-end mb-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsLiked(!isLiked);
              }}
              className={cn(
                'p-2 rounded-xl transition-all duration-200',
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
          </div>

          {/* 태그 + 시간 */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-bold',
              subjectStyle.bg, subjectStyle.text
            )}>
              {product.subject || '학습자료'}
            </span>
            {product.grade && (
              <span className="px-2 py-1 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg">
                {product.grade}
              </span>
            )}
          </div>

          {/* 제목 */}
          <h3 className="font-bold text-gray-900 group-hover:text-orange-500 transition-colors line-clamp-2 mb-2 flex-grow">
            {product.title}
          </h3>

          {/* 시간 */}
          <span className="text-xs text-gray-400 mb-3">{formatRelativeTime(product.created_at)}</span>

          {/* 창작자 */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center">
              <User className="w-3 h-3 text-gray-500" />
            </div>
            <span className="text-sm text-gray-700 font-semibold">{product.creator?.name || '익명'}</span>
          </div>

          {/* 하단: 통계 + 가격 */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center gap-3 text-sm">
              {product.rating > 0 && (
                <span className="flex items-center gap-1 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="font-bold">{product.rating.toFixed(1)}</span>
                </span>
              )}
              <span className="flex items-center gap-1 text-gray-400">
                <Download className="w-3.5 h-3.5" />
                <span className="font-medium">{product.download_count}</span>
              </span>
            </div>
            {product.price === 0 ? (
              <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-base font-bold rounded-lg">무료</span>
            ) : (
              <span className="text-lg font-bold text-gray-900">{formatCurrency(product.price)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyState() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  const handleUploadClick = async () => {
    setIsChecking(true);

    try {
      // 1. 로그인 확인
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // 로그인 안됨 → 로그인 페이지로 리다이렉트
        router.push('/login?redirectTo=/dashboard/upload');
        return;
      }

      // 2. 크리에이터 경험 확인 (DB에 creator_settings가 있는지)
      // 일반 계정으로 전환해도 creator_settings가 있으면 업로드 가능
      const { data: creatorSettings } = await supabase
        .from('creator_settings')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (creatorSettings) {
        // 크리에이터 경험 있음 → 업로드 페이지로 이동
        router.push('/dashboard/upload');
      } else {
        // 크리에이터 경험 없음 → 크리에이터 전환 페이지로 이동
        router.push('/become-creator?redirectTo=/dashboard/upload');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login?redirectTo=/dashboard/upload');
    } finally {
      setIsChecking(false);
    }
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
        disabled={isChecking}
        className="inline-flex px-6 py-3 text-orange-500 font-semibold rounded-xl hover:text-orange-600 transition-colors disabled:opacity-50"
      >
        {isChecking ? '확인 중...' : '자료 올리기'}
      </button>
    </motion.div>
  );
}


export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeGrade, setActiveGrade] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');

        const data = await response.json();

        // Use real data from API
        interface ApiProduct extends Product {
          creator?: { name: string };
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
  const filteredProducts = products.filter((product) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        product.title.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    if (activeCategory !== 'all') {
      const categoryMap: Record<string, string[]> = {
        korean: ['국어'],
        math: ['수학'],
        english: ['영어'],
        science: ['과학', '물리', '화학', '생물', '지구과학'],
        social: ['사회', '경제', '정치'],
        history: ['한국사', '세계사'],
        routine: ['루틴', '플래너', '스케줄', '습관'],
        etc: ['기타', '자격증'],
      };
      if (!categoryMap[activeCategory]?.some(s => product.subject?.includes(s))) {
        return false;
      }
    }

    if (activeGrade !== 'all') {
      const gradeMap: Record<string, string[]> = {
        middle: ['중1', '중2', '중3'],
        high: ['고1', '고2', '고3'],
        university: ['대학교', '대학'],
        cert: ['자격증'],
      };
      if (!gradeMap[activeGrade]?.some(g => product.grade?.includes(g))) {
        return false;
      }
    }

    return true;
  });

  // 정렬
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'popular':
      default:
        return (b.download_count || 0) - (a.download_count || 0);
    }
  });

  return (
    <motion.div
      className="min-h-screen bg-white"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* 검색바 */}
          <div className="py-5">
            <div className="relative max-w-3xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="필요한 학습 자료를 검색해보세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-base"
              />
            </div>
          </div>

          {/* 카테고리 탭 */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all',
                    activeCategory === category.id
                      ? 'bg-gray-900 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 필터 바 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* 학년 필터 */}
            <select
              value={activeGrade}
              onChange={(e) => setActiveGrade(e.target.value)}
              className="px-3 py-2 border-0 rounded-lg text-sm font-medium text-gray-900 focus:outline-none cursor-pointer bg-transparent"
            >
              {gradeFilters.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.label}
                </option>
              ))}
            </select>

            {/* 정렬 */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {sortOptions.find((o) => o.id === sortBy)?.label}
                <ChevronDown className={cn('w-4 h-4 transition-transform', showSortDropdown && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {showSortDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 top-full mt-2 w-36 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20"
                  >
                    {sortOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSortBy(option.id);
                          setShowSortDropdown(false);
                        }}
                        className={cn(
                          'w-full px-4 py-3 text-left text-sm font-medium transition-colors',
                          sortBy === option.id
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span className="text-sm text-gray-900">
              총 <span className="font-bold">{sortedProducts.length}</span>개의 자료
            </span>
          </div>

          {/* 보기 모드 */}
          <div className="flex items-center gap-1 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2.5 rounded-lg transition-colors',
                viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2.5 rounded-lg transition-colors',
                viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 자료 목록 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400">로딩 중...</div>
          </div>
        ) : sortedProducts.length > 0 ? (
          viewMode === 'list' ? (
            <div className="space-y-4">
              {sortedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {sortedProducts.map((product, index) => (
                <ProductGridCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )
        ) : searchQuery ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white rounded-2xl"
          >
            <Search className="w-16 h-16 text-gray-200 mx-auto mb-6" />
            <p className="text-xl font-semibold text-gray-900 mb-2">
              "{searchQuery}"에 대한 검색 결과가 없습니다
            </p>
            <p className="text-gray-500 mb-6">
              다른 키워드로 검색해보세요
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-blue-500 hover:text-blue-600 font-semibold"
            >
              전체 자료 보기
            </button>
          </motion.div>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* 드롭다운 닫기 */}
      {showSortDropdown && (
        <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
      )}
    </motion.div>
  );
}
