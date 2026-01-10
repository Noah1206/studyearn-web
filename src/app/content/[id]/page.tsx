'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowLeft,
  Download,
  Eye,
  Star,
  Play,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  Loader2,
  User,
  Clock,
  Heart,
  Share2,
  ChevronRight,
  Calendar,
  Copy,
} from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui';

interface RoutineItem {
  id: string;
  day: number;
  startHour?: number;
  endHour?: number;
  title: string;
  color: string;
}

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: string;
  subject: string | null;
  grade: string | null;
  type: string | null;
  content_type?: string | null;
  routine_type?: string | null;
  routine_days?: number | null;
  routine_items?: RoutineItem[] | null;
  view_count: number;
  download_count: number;
  like_count: number;
  rating_sum: number;
  rating_count: number;
  creator?: {
    name: string;
    avatar_url?: string | null;
    bio?: string | null;
  };
}

interface ContentItem {
  id: string;
  title: string;
  type: string | null;
  url: string | null;
  thumbnail_url: string | null;
}

const contentTypeIcons: Record<string, React.ElementType> = {
  video: Play,
  pdf: FileText,
  image: ImageIcon,
  routine: Calendar,
};

const contentTypeLabels: Record<string, string> = {
  video: '동영상',
  pdf: 'PDF',
  image: '이미지',
  routine: '루틴',
};

// Routine type labels
const routineTypeLabels: Record<string, string> = {
  week: '주간 루틴',
  weekly: '주간 루틴',
  day: '하루 루틴',
  daily: '하루 루틴',
  month: '월간 루틴',
  monthly: '월간 루틴',
  custom: '커스텀 루틴',
};

// Weekdays for calendar
const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

// Tailwind color class to hex mapping
const tailwindColorMap: Record<string, string> = {
  'bg-red-500': '#EF4444',
  'bg-orange-500': '#F97316',
  'bg-amber-500': '#F59E0B',
  'bg-yellow-500': '#EAB308',
  'bg-lime-500': '#84CC16',
  'bg-green-500': '#22C55E',
  'bg-emerald-500': '#10B981',
  'bg-teal-500': '#14B8A6',
  'bg-cyan-500': '#06B6D4',
  'bg-sky-500': '#0EA5E9',
  'bg-blue-500': '#3B82F6',
  'bg-indigo-500': '#6366F1',
  'bg-violet-500': '#8B5CF6',
  'bg-purple-500': '#A855F7',
  'bg-fuchsia-500': '#D946EF',
  'bg-pink-500': '#EC4899',
  'bg-rose-500': '#F43F5E',
};

// Get hex color from tailwind class or return as-is if already hex
const getHexColor = (color: string): string => {
  if (color.startsWith('#')) return color;
  return tailwindColorMap[color] || '#3B82F6';
};

const subjectLabels: Record<string, string> = {
  korean: '국어',
  math: '수학',
  english: '영어',
  science: '과학',
  social: '사회',
  history: '한국사',
  routine: '루틴/플래너',
  etc: '기타',
};

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isPreviewAllowed, setIsPreviewAllowed] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/products/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            router.push('/content');
            return;
          }
          throw new Error('Failed to fetch product');
        }

        const data = await response.json();
        setProduct(data.product);
        setContents(data.contents || []);
        setIsPurchased(data.isPurchased || false);
        setIsOwner(data.isOwner || false);
        setIsLiked(data.isLiked || false);
        setIsPreviewAllowed(data.isPreviewAllowed ?? true);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, router]);

  const handleDownload = async () => {
    // 본인 콘텐츠이거나 구매한 경우 다운로드 허용
    if ((!isPurchased && !isOwner) || isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await fetch(`/api/content/${id}/download`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Download failed');
      }

      const data = await response.json();
      if (data.downloadUrl) {
        // Fetch the actual file as blob for cross-origin download
        const fileResponse = await fetch(data.downloadUrl);
        if (!fileResponse.ok) {
          throw new Error('Failed to fetch file');
        }

        const blob = await fileResponse.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = data.filename || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl);

        if (product) {
          setProduct({
            ...product,
            download_count: (product.download_count || 0) + 1,
          });
        }
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('다운로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsDownloading(false);
    }
  };

  // 루틴을 내 루틴으로 복사 (프로필 페이지로 이동)
  const handleCopyRoutine = async () => {
    if (!product || product.content_type !== 'routine' || isCopying) return;
    if (!isPurchased && !isOwner && product.price > 0) return;

    setIsCopying(true);
    try {
      const response = await fetch('/api/routines/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: id,
          title: `${product.title} (복사본)`,
          routineType: product.routine_type || 'week',
          routineDays: product.routine_days,
          routineItems: product.routine_items || [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Not logged in, redirect to login
          router.push(`/login?redirectTo=/content/${id}`);
          return;
        }
        throw new Error(data.error || 'Failed to copy routine');
      }

      // Successfully copied, redirect to profile page
      router.push('/profile?tab=routine&copied=true');
    } catch (error) {
      console.error('Copy routine failed:', error);
      alert('루틴 복사에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsCopying(false);
    }
  };

  // 찜하기/찜 취소 (자신의 콘텐츠도 가능)
  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    try {
      const response = await fetch(`/api/content/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok && response.status === 401) {
        // Not logged in, redirect to login
        router.push(`/login?redirectTo=/content/${id}`);
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setIsLiked(data.isLiked);
        if (product) {
          setProduct({
            ...product,
            like_count: data.like_count,
          });
        }
      }
    } catch (error) {
      console.error('Like failed:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const getAverageRating = (): number => {
    if (!product || !product.rating_count) return 0;
    return parseFloat((product.rating_sum / product.rating_count).toFixed(1));
  };

  const handleClaimFree = async () => {
    if (!product || isClaiming) return;

    setIsClaiming(true);
    try {
      const response = await fetch('/api/purchase/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: id }),
      });

      const data = await response.json();

      if (!response.ok && response.status === 401) {
        // Not logged in, redirect to login
        router.push(`/login?redirectTo=/content/${id}`);
        return;
      }

      if (response.ok || data.alreadyClaimed) {
        // Successfully claimed or already claimed
        setIsPurchased(true);
        // Refetch content to get updated URL access
        const contentResponse = await fetch(`/api/products/${id}`);
        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          setContents(contentData.contents || []);
        }
      } else {
        alert(data.message || '처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('Claim free failed:', error);
      alert('처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsClaiming(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">불러오는 중...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            자료를 찾을 수 없습니다
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            삭제되었거나 존재하지 않는 자료입니다.
          </p>
          <Link href="/content">
            <Button>목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Determine the display type - use 'routine' for routine content
  const displayType = product.content_type === 'routine' ? 'routine' : (product.type || 'pdf');
  const TypeIcon = contentTypeIcons[displayType] || FileText;
  const rating = getAverageRating();
  const hasStats = (product.like_count > 0) || (product.view_count > 0) || (product.download_count > 0) || (rating > 0);

  return (
    <motion.div
      className="min-h-screen bg-white"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/content"
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">목록</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`p-2 rounded-full transition-colors ${
                isLiked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              } ${isLiking ? 'opacity-50' : ''}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
            </button>
            <button className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Left: Main Content */}
          <div className="lg:col-span-8 px-4 py-6 lg:py-10 lg:pl-8">
            {/* Category & Type */}
            <div className="flex items-center gap-2 mb-4">
              {product.subject && (
                <span className="text-sm font-medium text-orange-500">
                  {subjectLabels[product.subject] || product.subject}
                </span>
              )}
              {product.subject && product.grade && (
                <span className="text-gray-300">•</span>
              )}
              {product.grade && (
                <span className="text-sm text-gray-500">{product.grade}</span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {product.title}
            </h1>

            {/* Creator Info */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {product.creator?.avatar_url ? (
                  <Image
                    src={product.creator.avatar_url}
                    alt={product.creator?.name || ''}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-orange-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {product.creator?.name || '익명'}
                </p>
                {product.creator?.bio && (
                  <p className="text-sm text-gray-500 truncate">{product.creator.bio}</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
              {/* Like/Wishlist Button */}
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center gap-1 transition-colors ${
                  isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                } ${isLiking ? 'opacity-50' : ''}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />
                <span>{product.like_count.toLocaleString()}</span>
              </button>
              {product.view_count > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{product.view_count.toLocaleString()}</span>
                </div>
              )}
              {product.content_type !== 'routine' && product.download_count > 0 && (
                <div className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  <span>{product.download_count.toLocaleString()}</span>
                </div>
              )}
              {rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-semibold text-gray-900">{rating}</span>
                  <span>({product.rating_count})</span>
                </div>
              )}
            </div>

            {/* File Preview */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 mb-8">
              {/* File type badge - hide for routine since routine preview has its own header */}
              {product.content_type !== 'routine' && (
                <div className="absolute top-4 left-4 z-10">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700">
                    <TypeIcon className="w-4 h-4" />
                    {contentTypeLabels[displayType]}
                  </div>
                </div>
              )}

              {/* Content Preview */}
              {(() => {
                const contentUrl = contents[0]?.url;
                const fileType = product.type || 'pdf';

                // Check if URL is valid (starts with http or https)
                const isValidUrl = contentUrl && (contentUrl.startsWith('http://') || contentUrl.startsWith('https://'));

                // Routine preview - check content_type first
                if (product.content_type === 'routine') {
                  const routineType = product.routine_type || 'week';
                  const routineItems = product.routine_items || [];
                  const isWeekly = routineType === 'week' || routineType === 'weekly';
                  const isDaily = routineType === 'day' || routineType === 'daily';

                  // Time slots for schedule display (6am to 11pm)
                  const timeSlots = Array.from({ length: 18 }, (_, i) => i + 6);

                  // Weekly routine view - Clean Minimal Style
                  if (isWeekly) {
                    const weekDays = ['월', '화', '수', '목', '금', '토', '일'];

                    // Group items by day
                    const itemsByDay: Record<number, RoutineItem[]> = {};
                    routineItems.forEach((item) => {
                      if (!itemsByDay[item.day]) {
                        itemsByDay[item.day] = [];
                      }
                      itemsByDay[item.day].push(item);
                    });

                    // For preview, only show first 2 items
                    const previewLimit = 2;
                    let itemCount = 0;

                    return (
                      <div className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        {/* Clean Header */}
                        <div className="px-6 py-5 border-b border-gray-100">
                          <h3 className="text-lg font-semibold text-gray-900">주간 루틴</h3>
                          <p className="text-sm text-gray-400 mt-0.5">{routineItems.length}개의 일정</p>
                        </div>

                        {/* Week Grid */}
                        <div className="grid grid-cols-7 border-b border-gray-100">
                          {weekDays.map((day, index) => {
                            const hasItems = itemsByDay[index] && itemsByDay[index].length > 0;
                            return (
                              <div key={day} className="py-4 flex flex-col items-center border-r border-gray-50 last:border-r-0">
                                <span className="text-xs text-gray-400 mb-2">{day}</span>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                                  hasItems ? 'bg-gray-900 text-white' : 'text-gray-300'
                                }`}>
                                  {itemsByDay[index]?.length || '·'}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Schedule List */}
                        <div className="divide-y divide-gray-50">
                          {weekDays.map((day, dayIndex) => {
                            const dayItems = itemsByDay[dayIndex] || [];
                            if (dayItems.length === 0) return null;

                            return dayItems
                              .sort((a, b) => (a.startHour || 0) - (b.startHour || 0))
                              .map((item) => {
                                itemCount++;
                                // Hide items beyond preview limit if not purchased
                                if (!isPurchased && !isOwner && itemCount > previewLimit) return null;

                                return (
                                  <div key={item.id} className="flex items-center px-6 py-4">
                                    <div className="w-12 text-center">
                                      <span className="text-xs font-medium text-gray-400">{day}</span>
                                    </div>
                                    <div className="flex-1 ml-4">
                                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                      {(item.startHour !== undefined && item.endHour !== undefined) && (
                                        <p className="text-xs text-gray-400 mt-0.5">
                                          {String(item.startHour).padStart(2, '0')}:00 – {String(item.endHour).padStart(2, '0')}:00
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              });
                          })}

                          {/* Empty State */}
                          {Object.keys(itemsByDay).length === 0 && (
                            <div className="py-16 text-center">
                              <p className="text-sm text-gray-400">등록된 일정이 없습니다</p>
                            </div>
                          )}
                        </div>

                        {/* Preview Overlay */}
                        {!isPurchased && !isOwner && routineItems.length > previewLimit && (
                          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/95 to-transparent flex flex-col items-center justify-end pb-6">
                            <p className="text-sm font-medium text-gray-600">미리보기</p>
                            <p className="text-xs text-gray-400 mt-1">구매 후 전체 {routineItems.length}개 일정을 확인하세요</p>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Daily routine view - Clean Minimal Style
                  if (isDaily) {
                    // Sort items by start hour
                    const sortedItems = [...routineItems].sort((a, b) => (a.startHour || 0) - (b.startHour || 0));
                    const startTime = sortedItems[0]?.startHour;
                    const endTime = sortedItems[sortedItems.length - 1]?.endHour;

                    // Preview limit for non-purchased users
                    const previewLimit = 3;
                    const showPreview = !isPurchased && !isOwner && sortedItems.length > previewLimit;
                    const displayItems = showPreview ? sortedItems.slice(0, previewLimit) : sortedItems;

                    return (
                      <div className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        {/* Clean Header */}
                        <div className="px-6 py-5 border-b border-gray-100">
                          <h3 className="text-lg font-semibold text-gray-900">하루 루틴</h3>
                          <p className="text-sm text-gray-400 mt-0.5">
                            {startTime !== undefined && endTime !== undefined
                              ? `${String(startTime).padStart(2, '0')}:00 – ${String(endTime).padStart(2, '0')}:00`
                              : `${sortedItems.length}개의 일정`}
                          </p>
                        </div>

                        {/* Timeline */}
                        <div className="divide-y divide-gray-50">
                          {displayItems.length > 0 ? (
                            displayItems.map((item) => (
                              <div key={item.id} className="flex items-stretch">
                                {/* Time Column */}
                                <div className="w-20 flex-shrink-0 py-4 px-4 flex flex-col items-end justify-center bg-gray-50/50">
                                  <span className="text-sm font-medium text-gray-900">
                                    {item.startHour !== undefined ? `${String(item.startHour).padStart(2, '0')}:00` : '–'}
                                  </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 py-4 px-5 flex items-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-900 mr-4 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                    {(item.endHour !== undefined && item.startHour !== undefined) && (
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        {item.endHour - item.startHour}시간
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-16 text-center">
                              <p className="text-sm text-gray-400">등록된 일정이 없습니다</p>
                            </div>
                          )}
                        </div>

                        {/* Preview Overlay */}
                        {showPreview && (
                          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/95 to-transparent flex flex-col items-center justify-end pb-6">
                            <p className="text-sm font-medium text-gray-600">미리보기</p>
                            <p className="text-xs text-gray-400 mt-1">구매 후 전체 {sortedItems.length}개 일정을 확인하세요</p>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Monthly routine view - Clean Minimal Style
                  const isMonthly = routineType === 'month' || routineType === 'monthly';
                  if (isMonthly) {
                    // Group items by day (1-31)
                    const itemsByDay: Record<number, RoutineItem[]> = {};
                    routineItems.forEach((item) => {
                      if (!itemsByDay[item.day]) {
                        itemsByDay[item.day] = [];
                      }
                      itemsByDay[item.day].push(item);
                    });

                    const now = new Date();
                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
                    const totalDays = lastDay.getDate();

                    const days: (number | null)[] = [];
                    for (let i = 0; i < startDay; i++) days.push(null);
                    for (let i = 1; i <= totalDays; i++) days.push(i);

                    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
                    const weekDaysShort = ['월', '화', '수', '목', '금', '토', '일'];

                    // Preview limit for non-purchased users
                    const showPreview = !isPurchased && !isOwner && routineItems.length > 3;

                    return (
                      <div className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        {/* Clean Header */}
                        <div className="px-6 py-5 border-b border-gray-100">
                          <h3 className="text-lg font-semibold text-gray-900">월간 루틴</h3>
                          <p className="text-sm text-gray-400 mt-0.5">{now.getFullYear()}년 {monthNames[now.getMonth()]}</p>
                        </div>

                        {/* Calendar Grid */}
                        <div className="p-4">
                          {/* Weekday Headers */}
                          <div className="grid grid-cols-7 mb-1">
                            {weekDaysShort.map((day) => (
                              <div key={day} className="py-2 text-center text-xs text-gray-400 font-medium">
                                {day}
                              </div>
                            ))}
                          </div>

                          {/* Days Grid with Events */}
                          <div className="grid grid-cols-7">
                            {days.map((day, idx) => {
                              const dayItems = day ? (itemsByDay[day] || []) : [];
                              const hasItems = dayItems.length > 0;
                              const isToday = day === now.getDate();

                              return (
                                <div key={idx} className="min-h-[72px] border-t border-gray-50 p-1">
                                  {day && (
                                    <div className="h-full">
                                      {/* Day Number */}
                                      <div className={`text-xs mb-1 ${
                                        isToday
                                          ? 'w-5 h-5 bg-gray-900 text-white rounded-full flex items-center justify-center font-medium'
                                          : hasItems
                                            ? 'text-gray-900 font-medium'
                                            : 'text-gray-400'
                                      }`}>
                                        {day}
                                      </div>
                                      {/* Event Items */}
                                      <div className="space-y-0.5">
                                        {dayItems.slice(0, 2).map((item) => (
                                          <div
                                            key={item.id}
                                            className="text-[10px] leading-tight px-1 py-0.5 rounded truncate text-white font-medium"
                                            style={{ backgroundColor: getHexColor(item.color) }}
                                          >
                                            {item.title}
                                          </div>
                                        ))}
                                        {dayItems.length > 2 && (
                                          <div className="text-[10px] text-gray-400 px-1">
                                            +{dayItems.length - 2}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Full Event List - Only for purchased, owner, or free routines */}
                        {routineItems.length > 0 && (isPurchased || isOwner || product.price === 0) && (
                          <div className="px-6 py-4">
                            <p className="text-xs text-gray-400 mb-4">전체 일정 · {routineItems.length}개</p>
                            <div className="max-h-[280px] overflow-y-auto space-y-3">
                              {Object.entries(itemsByDay)
                                .sort(([a], [b]) => Number(a) - Number(b))
                                .map(([day, items]) => (
                                  <div key={day}>
                                    <p className="text-xs text-gray-500 mb-1.5">{day}일</p>
                                    <div className="space-y-1">
                                      {items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-2">
                                          <div
                                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: getHexColor(item.color) }}
                                          />
                                          <span className="text-sm text-gray-800">{item.title}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Preview Overlay */}
                        {showPreview && (
                          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/95 to-transparent flex flex-col items-center justify-end pb-6">
                            <p className="text-sm font-medium text-gray-600">미리보기</p>
                            <p className="text-xs text-gray-400 mt-1">구매 후 전체 {routineItems.length}개 일정을 확인하세요</p>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Custom routine view - Clean Minimal Style
                  const isCustom = routineType === 'custom';
                  if (isCustom) {
                    // Group items by day
                    const itemsByDay: Record<number, RoutineItem[]> = {};
                    routineItems.forEach((item) => {
                      if (!itemsByDay[item.day]) {
                        itemsByDay[item.day] = [];
                      }
                      itemsByDay[item.day].push(item);
                    });

                    const maxDay = Math.max(...routineItems.map(item => item.day), product.routine_days || 30);
                    const totalDays = product.routine_days || maxDay;
                    const daysWithItems = Object.keys(itemsByDay).length;

                    // Preview limit for non-purchased users
                    const previewLimit = 5;
                    const showPreview = !isPurchased && !isOwner && totalDays > previewLimit;
                    const displayDays = showPreview ? previewLimit : Math.min(maxDay, 30);

                    return (
                      <div className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        {/* Clean Header */}
                        <div className="px-6 py-5 border-b border-gray-100">
                          <h3 className="text-lg font-semibold text-gray-900">{totalDays}일 루틴</h3>
                          <p className="text-sm text-gray-400 mt-0.5">{daysWithItems}일 활성</p>
                        </div>

                        {/* Progress Bar */}
                        <div className="px-6 py-4 border-b border-gray-100">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gray-900 rounded-full transition-all"
                              style={{ width: `${Math.round((daysWithItems / totalDays) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Day List */}
                        <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                          {Array.from({ length: displayDays }, (_, i) => i + 1).map((day) => {
                            const dayItems = itemsByDay[day] || [];
                            const hasItems = dayItems.length > 0;

                            return (
                              <div key={day} className="flex items-center px-6 py-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                                  hasItems ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-300'
                                }`}>
                                  {day}
                                </div>
                                <div className="flex-1 ml-4 min-w-0">
                                  {hasItems ? (
                                    dayItems.map((item) => (
                                      <p key={item.id} className="text-sm text-gray-900 truncate">{item.title}</p>
                                    ))
                                  ) : (
                                    <p className="text-sm text-gray-300">휴식</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {!showPreview && maxDay > 30 && (
                            <div className="py-4 text-center bg-gray-50">
                              <span className="text-sm text-gray-500">+{maxDay - 30}일</span>
                            </div>
                          )}
                        </div>

                        {/* Preview Overlay */}
                        {showPreview && (
                          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/95 to-transparent flex flex-col items-center justify-end pb-6">
                            <p className="text-sm font-medium text-gray-600">미리보기</p>
                            <p className="text-xs text-gray-400 mt-1">구매 후 전체 {totalDays}일 루틴을 확인하세요</p>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Fallback for other routine types - Clean Minimal Style
                  return (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      <div className="px-6 py-5 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {routineTypeLabels[routineType] || '루틴'}
                        </h3>
                        <p className="text-sm text-gray-400 mt-0.5">{routineItems.length}개의 일정</p>
                      </div>

                      <div className="py-16 text-center">
                        <p className="text-sm text-gray-400">
                          {routineItems.length > 0
                            ? '구매 후 상세 일정을 확인하세요'
                            : '등록된 일정이 없습니다'}
                        </p>
                      </div>
                    </div>
                  );
                }

                // Image preview
                if (fileType === 'image' && isValidUrl) {
                  return (
                    <div className="aspect-[4/3] relative">
                      <Image
                        src={contentUrl}
                        alt={product.title}
                        fill
                        className="object-contain bg-white"
                        priority
                      />
                    </div>
                  );
                }

                // PDF preview
                if (fileType === 'pdf' && isValidUrl) {
                  return (
                    <div className="aspect-[4/3] relative bg-white">
                      <iframe
                        src={`${contentUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                        className="w-full h-full border-0"
                        title={product.title}
                      />
                      {/* Overlay to prevent interaction if not purchased */}
                      {!isPurchased && (
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent flex flex-col items-center justify-end pb-8">
                          <div className="text-center">
                            <p className="text-gray-600 font-medium mb-2">미리보기</p>
                            <p className="text-sm text-gray-400">구매 후 전체 내용을 확인하세요</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // Video preview
                if (fileType === 'video' && isValidUrl) {
                  return (
                    <div className="aspect-video relative bg-black">
                      <video
                        src={contentUrl}
                        className="w-full h-full object-contain"
                        controls={isPurchased}
                        poster={product.thumbnail_url || undefined}
                      />
                      {!isPurchased && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                            <Play className="w-8 h-8 text-orange-500 ml-1" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // Thumbnail fallback (also validate URL)
                const isValidThumbnail = product.thumbnail_url &&
                  (product.thumbnail_url.startsWith('http://') || product.thumbnail_url.startsWith('https://'));
                if (isValidThumbnail) {
                  return (
                    <div className="aspect-[4/3] relative">
                      <Image
                        src={product.thumbnail_url!}
                        alt={product.title}
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                  );
                }

                // Default placeholder
                return (
                  <div className="aspect-[4/3] flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-2xl bg-white/60 flex items-center justify-center mb-3">
                      <TypeIcon className="w-10 h-10 text-orange-500" />
                    </div>
                    <span className="text-sm font-medium text-orange-600">
                      {contentTypeLabels[displayType]} {displayType !== 'routine' ? '파일' : ''}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Description Section */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">자료 소개</h2>
              {product.description ? (
                <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </div>
              ) : (
                <p className="text-gray-400">
                  아직 등록된 설명이 없습니다.
                </p>
              )}
            </div>

            {/* Info Section */}
            <div className="rounded-2xl bg-gray-50 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">자료 정보</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{product.content_type === 'routine' ? '유형' : '파일 형식'}</span>
                  <span className="font-medium text-gray-900">
                    {product.content_type === 'routine'
                      ? (routineTypeLabels[product.routine_type || ''] || '루틴')
                      : (product.type || 'pdf').toUpperCase()
                    }
                  </span>
                </div>
                {product.content_type === 'routine' && product.routine_items && product.routine_items.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">일정 수</span>
                    <span className="font-medium text-gray-900">
                      {product.routine_items.length}개
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">등록일</span>
                  <span className="font-medium text-gray-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {formatRelativeTime(product.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Sticky Purchase Card */}
          <div className="lg:col-span-4 px-4 pb-6 lg:py-8 lg:pr-8">
            <div className="lg:sticky lg:top-20 space-y-3">
              {/* Purchase Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {(isPurchased || isOwner) ? (
                  /* Purchased or Owner State */
                  <div className="p-4">
                    {/* Success Badge */}
                    <div className={`flex items-center gap-2.5 p-3 rounded-xl mb-4 border ${
                      isOwner
                        ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100'
                        : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isOwner
                          ? 'bg-gradient-to-br from-orange-400 to-amber-500'
                          : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                      }`}>
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${isOwner ? 'text-orange-800' : 'text-emerald-800'}`}>
                          {isOwner ? '내 콘텐츠' : product.price === 0 ? '무료 자료 획득' : '구매 완료'}
                        </p>
                        <p className={`text-xs ${isOwner ? 'text-orange-600' : 'text-emerald-600'}`}>
                          {isOwner
                            ? '직접 등록한 콘텐츠입니다'
                            : product.content_type === 'routine'
                              ? '루틴을 확인해보세요'
                              : '언제든 다운로드 가능'}
                        </p>
                      </div>
                    </div>

                    {/* Download Button - 루틴이 아닐 때만 표시 */}
                    {product.content_type !== 'routine' && (
                      <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="w-full flex items-center justify-center gap-2 h-11 text-gray-900 font-medium text-sm rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>다운로드 중...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>다운로드</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Copy Routine Button - 루틴일 때만 표시 */}
                    {product.content_type === 'routine' && (
                      <button
                        onClick={handleCopyRoutine}
                        disabled={isCopying}
                        className="w-full flex items-center justify-center gap-2 h-11 text-orange-600 font-medium text-sm rounded-xl border-2 border-orange-200 hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCopying ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>복사 중...</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>내 루틴으로 복사</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Download Count - 루틴이 아닐 때만 표시 */}
                    {product.content_type !== 'routine' && product.download_count > 0 && (
                      <p className="text-center text-xs text-gray-400 mt-2">
                        {product.download_count.toLocaleString()}회 다운로드
                      </p>
                    )}
                  </div>
                ) : (
                  /* Not Purchased State */
                  <>
                    {/* Price Header */}
                    <div className="p-4 pb-3">
                      <div className="flex items-end justify-between">
                        <div>
                          {product.price === 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                                무료
                              </span>
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                FREE
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-2xl font-extrabold text-gray-900">
                                {formatCurrency(product.price)}
                              </span>
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-0.5">
                            {product.price === 0
                              ? (product.content_type === 'routine' ? '무료로 확인' : '무료 다운로드')
                              : '평생 소장'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-100 mx-4" />

                    {/* Action Area */}
                    <div className="p-4 pt-3">
                      {/* CTA Button */}
                      {product.price === 0 ? (
                        <button
                          onClick={handleClaimFree}
                          disabled={isClaiming}
                          className="w-full relative overflow-hidden group rounded-xl"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite] transition-transform group-hover:scale-[1.02]" />
                          <div className="relative flex items-center justify-center gap-2 h-11 text-white font-bold text-sm">
                            {isClaiming ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>처리 중...</span>
                              </>
                            ) : (
                              <>
                                <span>무료로 받기</span>
                                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                              </>
                            )}
                          </div>
                        </button>
                      ) : (
                        <Link href={`/purchase/${id}`} className="block">
                          <button className="w-full relative overflow-hidden group rounded-xl">
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 transition-transform group-hover:scale-[1.02]" />
                            <div className="relative flex items-center justify-center gap-2 h-11 text-white font-bold text-sm">
                              <span>구매하기</span>
                              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </div>
                          </button>
                        </Link>
                      )}

                      {/* Trust Signals */}
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <CheckCircle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                          <span>한 번 {product.price === 0 ? '받으면' : '구매하면'} 평생 소장</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <CheckCircle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                          <span>
                            {product.content_type === 'routine'
                              ? (product.price === 0 ? '바로' : '결제 후') + ' 확인 가능'
                              : (product.price === 0 ? '바로' : '결제 후') + ' 다운로드'}
                          </span>
                        </div>
                        {product.price > 0 && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <CheckCircle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                            <span>안전한 결제</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>

              {/* Creator Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="p-4">
                  {/* Creator Header */}
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 p-0.5">
                        <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center overflow-hidden">
                          {product.creator?.avatar_url ? (
                            <Image
                              src={product.creator.avatar_url}
                              alt={product.creator?.name || ''}
                              width={44}
                              height={44}
                              className="object-cover rounded-[10px]"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                              <User className="w-5 h-5 text-orange-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate text-sm">
                        {product.creator?.name || '익명'}
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                        <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                        크리에이터
                      </span>
                    </div>

                    {/* Follow Button */}
                    <button className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition-colors">
                      팔로우
                    </button>
                  </div>

                  {/* Bio */}
                  {product.creator?.bio && (
                    <p className="mt-3 text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-2.5">
                      {product.creator.bio}
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
