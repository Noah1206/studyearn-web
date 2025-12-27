'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Search, BookOpen, Gift, Award, Sparkles, Loader2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

// ============================================
// Types
// ============================================

type SubjectTag = '국어' | '영어' | '수학' | '과학' | '사회' | '기타';
type ContentType = '공부법' | '교재' | '노트' | '문제집';
type AccessLevel = 'free' | 'preview' | 'paid';
type PurchaseStatus = 'purchased' | 'not_purchased';

interface Creator {
  id: string;
  name: string;
  profileImage?: string;
  isVerified: boolean;
  school?: string;
}

interface ContentItem {
  id: string;
  title: string;
  description: string;
  subject: SubjectTag;
  contentType: ContentType;
  thumbnailUrl?: string;
  creator: Creator;
  rating: number;
  learnerCount: number;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isHot?: boolean;
  isNew?: boolean;
  accessLevel: AccessLevel;
  purchaseStatus: PurchaseStatus;
  price?: number;
  progress?: number;
}

// ============================================
// Mock Data
// ============================================

const mockCreators: Creator[] = [
  { id: 'c1', name: '서울대 수연', profileImage: undefined, isVerified: true, school: '서울대학교' },
  { id: 'c2', name: '영어천재 민준', profileImage: undefined, isVerified: true, school: '연세대학교' },
  { id: 'c3', name: '수학의신 지훈', profileImage: undefined, isVerified: true, school: 'KAIST' },
  { id: 'c4', name: '과학탐구러', profileImage: undefined, isVerified: false, school: '고려대학교' },
  { id: 'c5', name: '국어1등급', profileImage: undefined, isVerified: true, school: '성균관대학교' },
  { id: 'c6', name: '사회탐구왕', profileImage: undefined, isVerified: false, school: '한양대학교' },
];

const mockContents: ContentItem[] = [
  {
    id: '1',
    title: '수능 수학 킬러문항 공략법',
    description: '상위 1%만 아는 킬러문항 접근 전략',
    subject: '수학',
    contentType: '공부법',
    thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop',
    creator: mockCreators[2],
    rating: 4.9,
    learnerCount: 2847,
    likeCount: 423,
    commentCount: 89,
    isLiked: false,
    isBookmarked: true,
    isHot: true,
    accessLevel: 'paid',
    purchaseStatus: 'not_purchased',
    price: 4900,
  },
  {
    id: '2',
    title: '영어 문법 완벽 정리 노트',
    description: '수능 영어 문법 핵심만 정리',
    subject: '영어',
    contentType: '노트',
    thumbnailUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop',
    creator: mockCreators[1],
    rating: 4.8,
    learnerCount: 5621,
    likeCount: 892,
    commentCount: 156,
    isLiked: true,
    isBookmarked: false,
    isHot: true,
    accessLevel: 'free',
    purchaseStatus: 'not_purchased',
  },
  {
    id: '3',
    title: '국어 비문학 독해의 기술',
    description: '지문 분석부터 선지 판단까지',
    subject: '국어',
    contentType: '공부법',
    thumbnailUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=300&fit=crop',
    creator: mockCreators[4],
    rating: 4.7,
    learnerCount: 3294,
    likeCount: 567,
    commentCount: 78,
    isLiked: false,
    isBookmarked: false,
    isNew: true,
    accessLevel: 'preview',
    purchaseStatus: 'not_purchased',
    price: 3900,
  },
  {
    id: '4',
    title: '물리학I 개념+문제 교재',
    description: '개념 설명과 기출 변형 문제를 한 번에',
    subject: '과학',
    contentType: '교재',
    thumbnailUrl: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=300&fit=crop',
    creator: mockCreators[3],
    rating: 4.6,
    learnerCount: 1823,
    likeCount: 298,
    commentCount: 45,
    isLiked: false,
    isBookmarked: true,
    accessLevel: 'paid',
    purchaseStatus: 'purchased',
    price: 7900,
  },
  {
    id: '5',
    title: '한국사 시대별 핵심 정리 노트',
    description: '시대순 정리로 흐름을 잡자',
    subject: '사회',
    contentType: '노트',
    thumbnailUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
    creator: mockCreators[5],
    rating: 4.5,
    learnerCount: 4521,
    likeCount: 712,
    commentCount: 134,
    isLiked: true,
    isBookmarked: true,
    isNew: true,
    accessLevel: 'free',
    purchaseStatus: 'not_purchased',
  },
  {
    id: '6',
    title: '수능 수학 실전 문제집',
    description: '최신 기출 트렌드 반영 모의고사',
    subject: '수학',
    contentType: '문제집',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=300&fit=crop',
    creator: mockCreators[0],
    rating: 4.9,
    learnerCount: 1256,
    likeCount: 234,
    commentCount: 56,
    isLiked: false,
    isBookmarked: false,
    isHot: true,
    accessLevel: 'paid',
    purchaseStatus: 'not_purchased',
    price: 5900,
  },
  {
    id: '7',
    title: '영어 독해 지문 분석법',
    description: '글의 구조를 파악하는 독해 전략',
    subject: '영어',
    contentType: '공부법',
    thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
    creator: mockCreators[1],
    rating: 4.7,
    learnerCount: 3847,
    likeCount: 523,
    commentCount: 98,
    isLiked: false,
    isBookmarked: true,
    isNew: true,
    accessLevel: 'preview',
    purchaseStatus: 'not_purchased',
    price: 2900,
  },
  {
    id: '8',
    title: '생명과학I 핵심 개념 노트',
    description: '그림과 도표로 쉽게 이해하기',
    subject: '과학',
    contentType: '노트',
    thumbnailUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=300&fit=crop',
    creator: mockCreators[3],
    rating: 4.8,
    learnerCount: 2156,
    likeCount: 445,
    commentCount: 67,
    isLiked: true,
    isBookmarked: false,
    accessLevel: 'paid',
    purchaseStatus: 'not_purchased',
    price: 3900,
  },
  {
    id: '9',
    title: '화학I 반응식 총정리',
    description: '자주 출제되는 반응식만 모았다',
    subject: '과학',
    contentType: '노트',
    thumbnailUrl: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=400&h=300&fit=crop',
    creator: mockCreators[3],
    rating: 4.7,
    learnerCount: 1892,
    likeCount: 312,
    commentCount: 45,
    isLiked: false,
    isBookmarked: false,
    isNew: true,
    accessLevel: 'paid',
    purchaseStatus: 'not_purchased',
    price: 2900,
  },
  {
    id: '10',
    title: '수능 국어 문학 작품 해설',
    description: '필수 문학 작품 완벽 분석',
    subject: '국어',
    contentType: '교재',
    thumbnailUrl: 'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=400&h=300&fit=crop',
    creator: mockCreators[4],
    rating: 4.8,
    learnerCount: 2934,
    likeCount: 487,
    commentCount: 92,
    isLiked: true,
    isBookmarked: true,
    isHot: true,
    accessLevel: 'free',
    purchaseStatus: 'not_purchased',
  },
];

// ============================================
// Constants
// ============================================

const SUBJECT_COLORS: Record<SubjectTag, { bg: string; text: string; gradient: string }> = {
  '국어': { bg: 'bg-rose-100', text: 'text-rose-600', gradient: 'from-rose-500 to-pink-500' },
  '영어': { bg: 'bg-blue-100', text: 'text-blue-600', gradient: 'from-blue-500 to-cyan-500' },
  '수학': { bg: 'bg-violet-100', text: 'text-violet-600', gradient: 'from-violet-500 to-purple-500' },
  '과학': { bg: 'bg-emerald-100', text: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-500' },
  '사회': { bg: 'bg-amber-100', text: 'text-amber-600', gradient: 'from-amber-500 to-orange-500' },
  '기타': { bg: 'bg-gray-100', text: 'text-gray-600', gradient: 'from-gray-500 to-slate-500' },
};

const subjects: SubjectTag[] = ['국어', '영어', '수학', '과학', '사회'];

// ============================================
// Collection Data
// ============================================

const collections = [
  {
    id: 'free-start',
    title: '무료로 시작하기',
    description: '부담 없이 체험해보세요',
    icon: Gift,
    gradient: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
  },
  {
    id: 'editor-pick',
    title: '에디터 추천',
    description: '검증된 퀄리티 콘텐츠',
    icon: Award,
    gradient: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-500',
  },
  {
    id: 'new-this-week',
    title: '이번 주 새로 올라온',
    description: '따끈따끈한 신규 콘텐츠',
    icon: Sparkles,
    gradient: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
];

// ============================================
// Collection Card Component
// ============================================

function CollectionCard({ collection }: { collection: typeof collections[0] }) {
  const Icon = collection.icon;

  return (
    <Link href={`/content?collection=${collection.id}`} className="block flex-1 min-w-[200px]">
      <div className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${collection.gradient} hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}>
        <div className="relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-white text-base mb-1">{collection.title}</h3>
          <p className="text-white/80 text-xs">{collection.description}</p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
      </div>
    </Link>
  );
}

// ============================================
// Compact Card (작은 카드 - 리스트용)
// ============================================

function CompactCard({ content }: { content: ContentItem }) {
  const subjectColor = SUBJECT_COLORS[content.subject];

  return (
    <Link href={`/content/${content.id}`} className="block">
      <div className="bg-gray-50 rounded-2xl p-3 flex gap-3 hover:bg-gray-100 active:scale-[0.99] transition-all duration-200">
        {/* Thumbnail */}
        <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-200">
          {content.thumbnailUrl && (
            <Image src={content.thumbnailUrl} alt={content.title} fill className="object-cover" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col py-0.5">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${subjectColor.bg} ${subjectColor.text}`}>
              {content.subject}
            </span>
            <span className="text-[9px] text-gray-400">{content.contentType}</span>
          </div>
          <h3 className="font-medium text-gray-800 text-sm leading-tight mb-1 line-clamp-2">{content.title}</h3>
          <div className="flex items-center gap-2 mt-auto">
            {content.accessLevel === 'free' ? (
              <span className="text-[12px] font-semibold text-emerald-600">무료</span>
            ) : content.accessLevel === 'paid' ? (
              <span className="text-[12px] font-semibold text-gray-900">{formatCurrency(content.price || 0)}</span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================
// Main Page
// ============================================

// ============================================
// Content Type Mapping
// ============================================

const DB_TO_UI_CONTENT_TYPE: Record<string, ContentType> = {
  'post': '공부법',
  'document': '교재',
  'video': '노트',
  'audio': '노트',
  'image': '문제집',
  'live': '공부법',
};

const SUBJECT_FROM_TAGS: Record<string, SubjectTag> = {
  '국어': '국어',
  '영어': '영어',
  '수학': '수학',
  '과학': '과학',
  '물리': '과학',
  '화학': '과학',
  '생물': '과학',
  '지구과학': '과학',
  '사회': '사회',
  '한국사': '사회',
  '세계사': '사회',
  '지리': '사회',
  '윤리': '사회',
};

function getSubjectFromTags(tags: string[]): SubjectTag {
  for (const tag of tags) {
    if (SUBJECT_FROM_TAGS[tag]) {
      return SUBJECT_FROM_TAGS[tag];
    }
  }
  return '기타';
}

function isContentNew(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
}

function isContentHot(viewCount: number, likeCount: number): boolean {
  return viewCount >= 1000 || likeCount >= 100;
}

export default function ContentBrowsePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<SubjectTag | null>(null);
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const contentTypes: ContentType[] = ['공부법', '교재', '노트', '문제집'];

  // Fetch contents from Supabase
  useEffect(() => {
    const fetchContents = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();

        // Fetch published contents with creator info
        const { data: contentsData, error } = await supabase
          .from('contents')
          .select(`
            id,
            creator_id,
            title,
            description,
            content_type,
            thumbnail_url,
            access_level,
            price,
            view_count,
            like_count,
            comment_count,
            tags,
            created_at,
            creator:creator_settings(
              user_id,
              display_name,
              profile_image_url,
              is_verified
            )
          `)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching contents:', error);
          // Use mock data as fallback
          setContents(mockContents);
          return;
        }

        if (!contentsData || contentsData.length === 0) {
          // No data in DB, use mock data
          setContents(mockContents);
          return;
        }

        // Check user's purchases
        const { data: { user } } = await supabase.auth.getUser();
        let purchasedContentIds: string[] = [];

        if (user) {
          const { data: purchasesData } = await supabase
            .from('content_purchases')
            .select('content_id')
            .eq('buyer_id', user.id)
            .eq('status', 'completed');

          purchasedContentIds = purchasesData?.map((p: { content_id: string }) => p.content_id) || [];
        }

        // Transform database contents to UI format
        const transformedContents: ContentItem[] = contentsData.map((item: any) => {
          const creator = item.creator;
          const subject = getSubjectFromTags(item.tags || []);
          const contentType = DB_TO_UI_CONTENT_TYPE[item.content_type] || '기타';

          return {
            id: item.id,
            title: item.title,
            description: item.description || '',
            subject,
            contentType: contentType as ContentType,
            thumbnailUrl: item.thumbnail_url,
            creator: {
              id: item.creator_id,
              name: creator?.display_name || 'Unknown',
              profileImage: creator?.profile_image_url,
              isVerified: creator?.is_verified || false,
            },
            rating: 4.5 + Math.random() * 0.5, // Random rating for now
            learnerCount: item.view_count || 0,
            likeCount: item.like_count || 0,
            commentCount: item.comment_count || 0,
            isLiked: false,
            isBookmarked: false,
            isHot: isContentHot(item.view_count || 0, item.like_count || 0),
            isNew: isContentNew(item.created_at),
            accessLevel: item.access_level === 'public' ? 'free' :
                         item.access_level === 'paid' ? 'paid' : 'preview',
            purchaseStatus: purchasedContentIds.includes(item.id) ? 'purchased' : 'not_purchased',
            price: item.price || undefined,
          };
        });

        setContents(transformedContents);
      } catch (error) {
        console.error('Failed to fetch contents:', error);
        setContents(mockContents);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContents();
  }, []);

  // 필터링된 콘텐츠
  const filteredContents = contents.filter(content => {
    if (searchQuery && !content.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedSubject && content.subject !== selectedSubject) return false;
    if (selectedType && content.contentType !== selectedType) return false;
    if (showFreeOnly && content.accessLevel !== 'free') return false;
    return true;
  });


  // 과목별 콘텐츠 수
  const subjectCounts = subjects.reduce((acc, subject) => {
    acc[subject] = contents.filter(c => c.subject === subject).length;
    return acc;
  }, {} as Record<SubjectTag, number>);

  const resetFilters = () => {
    setSelectedSubject(null);
    setSelectedType(null);
    setShowFreeOnly(false);
  };

  const hasActiveFilters = selectedSubject || selectedType || showFreeOnly;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.div
        className="bg-white border-b border-gray-100 sticky top-0 z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">콘텐츠</h1>
              <p className="text-sm text-gray-400">학습 자료 둘러보기</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-orange-500" />
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="콘텐츠 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        className="max-w-7xl mx-auto px-6 py-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex gap-8">
          {/* 왼쪽: 필터 패널 */}
          <motion.div className="w-56 flex-shrink-0" variants={itemVariants}>
            <div className="sticky top-24">
              {/* 필터 헤더 */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-800">필터</h2>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                  >
                    초기화
                  </button>
                )}
              </div>

              {/* 무료만 보기 체크박스 */}
              <button
                onClick={() => setShowFreeOnly(!showFreeOnly)}
                className="flex items-center gap-3 py-4 w-full text-left cursor-pointer group hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    showFreeOnly
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-gray-300 bg-white group-hover:border-gray-400'
                  }`}
                >
                  {showFreeOnly && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm ${showFreeOnly ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>무료 콘텐츠만 보기</span>
              </button>

              <div className="border-t border-gray-100 my-4" />

              {/* 과목 필터 */}
              <div className="mb-6">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">과목</h3>
                <div className="space-y-1">
                  {subjects.map(subject => (
                    <button
                      key={subject}
                      onClick={() => setSelectedSubject(selectedSubject === subject ? null : subject)}
                      className="flex items-center gap-3 py-3 px-2 -mx-2 w-full text-left rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        selectedSubject === subject
                          ? 'border-orange-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedSubject === subject && (
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        )}
                      </div>
                      <span className={`text-sm ${selectedSubject === subject ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {subject}
                      </span>
                      <span className="text-xs text-gray-300 ml-auto">{subjectCounts[subject]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 my-4" />

              {/* 카테고리 필터 */}
              <div>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">카테고리</h3>
                <div className="space-y-1">
                  {contentTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(selectedType === type ? null : type)}
                      className="flex items-center gap-3 py-3 px-2 -mx-2 w-full text-left rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        selectedType === type
                          ? 'border-orange-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedType === type && (
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        )}
                      </div>
                      <span className={`text-sm ${selectedType === type ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 오른쪽: 콘텐츠 영역 */}
          <motion.div className="flex-1 space-y-8 min-w-0" variants={itemVariants}>

            {/* 추천 컬렉션 */}
            {!hasActiveFilters && (
              <section>
                <div className="flex gap-4">
                  {collections.map(collection => (
                    <CollectionCard key={collection.id} collection={collection} />
                  ))}
                </div>
              </section>
            )}

            {/* 전체 콘텐츠 */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-900">
                    {hasActiveFilters ? '검색 결과' : '전체 콘텐츠'}
                  </h2>
                  <span className="text-sm text-gray-400">{filteredContents.length}개</span>
                </div>
                <select className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
                  <option>인기순</option>
                  <option>최신순</option>
                  <option>평점순</option>
                </select>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    <span className="text-sm text-gray-500">콘텐츠를 불러오는 중...</span>
                  </motion.div>
                </div>
              ) : filteredContents.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {filteredContents.map(content => (
                    <CompactCard key={content.id} content={content} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <p className="text-gray-400">검색 결과가 없습니다</p>
                  <button
                    onClick={resetFilters}
                    className="mt-2 text-sm text-orange-500 hover:text-orange-600 font-medium"
                  >
                    필터 초기화
                  </button>
                </div>
              )}
            </section>

            {/* Load More */}
            {filteredContents.length > 0 && (
              <div className="text-center pt-4 pb-8">
                <button className="px-6 py-2.5 bg-gray-900 text-white rounded-full font-medium text-sm hover:bg-gray-800 active:scale-[0.97] transition-all">
                  더 많은 콘텐츠 보기
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
