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
  const [isClaiming, setIsClaiming] = useState(false);

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
              onClick={() => setIsLiked(!isLiked)}
              className={`p-2 rounded-full transition-colors ${
                isLiked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
            </button>
            <button className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="lg:grid lg:grid-cols-5 lg:gap-12">
          {/* Left: Main Content */}
          <div className="lg:col-span-3 px-4 py-6 lg:py-10">
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
                onClick={() => setIsLiked(!isLiked)}
                className={`flex items-center gap-1 transition-colors ${
                  isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />
                <span>{(product.like_count + (isLiked ? 1 : 0)).toLocaleString()}</span>
              </button>
              {product.view_count > 0 && (
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{product.view_count.toLocaleString()}</span>
                </div>
              )}
              {product.download_count > 0 && (
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
              {/* File type badge */}
              <div className="absolute top-4 left-4 z-10">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700">
                  <TypeIcon className="w-4 h-4" />
                  {contentTypeLabels[displayType]}
                </div>
              </div>

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

                  // Weekly routine view
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

                    return (
                      <div className="p-6 bg-white rounded-xl">
                        <div className="flex items-center gap-2 mb-5">
                          <Calendar className="w-5 h-5 text-orange-500" />
                          <span className="font-bold text-gray-900 text-lg">주간 루틴</span>
                        </div>

                        {/* Weekly Grid */}
                        <div className="overflow-x-auto">
                          <div className="min-w-[600px]">
                            {/* Day Headers */}
                            <div className="grid grid-cols-7 gap-2 mb-3">
                              {weekDays.map((day, index) => (
                                <div
                                  key={day}
                                  className={`text-center py-2 rounded-lg font-semibold text-sm ${
                                    index >= 5
                                      ? 'bg-orange-50 text-orange-600'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {day}
                                </div>
                              ))}
                            </div>

                            {/* Schedule Grid */}
                            <div className="grid grid-cols-7 gap-2">
                              {weekDays.map((_, dayIndex) => (
                                <div key={dayIndex} className="min-h-[200px] bg-gray-50 rounded-lg p-2 space-y-2">
                                  {(itemsByDay[dayIndex] || [])
                                    .sort((a, b) => (a.startHour || 0) - (b.startHour || 0))
                                    .map((item) => (
                                      <div
                                        key={item.id}
                                        className="p-2.5 rounded-lg text-white shadow-sm"
                                        style={{ backgroundColor: getHexColor(item.color) }}
                                      >
                                        <div className="text-xs opacity-80 mb-0.5">
                                          {item.startHour !== undefined ? `${item.startHour}:00` : ''}
                                          {item.endHour !== undefined ? ` - ${item.endHour}:00` : ''}
                                        </div>
                                        <div className="font-medium text-sm truncate">
                                          {item.title}
                                        </div>
                                      </div>
                                    ))}
                                  {(!itemsByDay[dayIndex] || itemsByDay[dayIndex].length === 0) && (
                                    <div className="h-full flex items-center justify-center text-gray-300 text-xs">
                                      일정 없음
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>총 {routineItems.length}개 일정</span>
                            <span>•</span>
                            <span>{Object.keys(itemsByDay).length}일 설정됨</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Daily routine view (time-based)
                  if (isDaily) {
                    // Sort items by start hour
                    const sortedItems = [...routineItems].sort((a, b) => (a.startHour || 0) - (b.startHour || 0));

                    return (
                      <div className="p-6 bg-white rounded-xl">
                        <div className="flex items-center gap-2 mb-5">
                          <Clock className="w-5 h-5 text-orange-500" />
                          <span className="font-bold text-gray-900 text-lg">하루 루틴</span>
                        </div>

                        {/* Time-based Schedule */}
                        <div className="relative">
                          {/* Time line */}
                          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

                          <div className="space-y-3">
                            {sortedItems.length > 0 ? sortedItems.map((item) => (
                              <div key={item.id} className="flex items-start gap-4 relative">
                                {/* Time */}
                                <div className="w-16 text-right text-sm font-medium text-gray-500 pt-2 flex-shrink-0">
                                  {item.startHour !== undefined ? `${item.startHour}:00` : '--:--'}
                                </div>

                                {/* Dot on timeline */}
                                <div
                                  className="w-3 h-3 rounded-full mt-2.5 flex-shrink-0 ring-4 ring-white z-10"
                                  style={{ backgroundColor: getHexColor(item.color) }}
                                />

                                {/* Content Card */}
                                <div
                                  className="flex-1 p-4 rounded-xl text-white shadow-md"
                                  style={{ backgroundColor: getHexColor(item.color) }}
                                >
                                  <div className="font-semibold">{item.title}</div>
                                  {item.endHour !== undefined && (
                                    <div className="text-sm opacity-80 mt-1">
                                      {item.startHour}:00 - {item.endHour}:00
                                      <span className="ml-2">({(item.endHour || 0) - (item.startHour || 0)}시간)</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )) : (
                              <div className="text-center py-8 text-gray-400">
                                등록된 일정이 없습니다
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Summary */}
                        {sortedItems.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>총 {sortedItems.length}개 일정</span>
                              {sortedItems[0]?.startHour !== undefined && sortedItems[sortedItems.length - 1]?.endHour !== undefined && (
                                <>
                                  <span>•</span>
                                  <span>{sortedItems[0].startHour}:00 ~ {sortedItems[sortedItems.length - 1].endHour}:00</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Monthly routine view (calendar)
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

                    // Get days in current month (assuming current month for display)
                    const now = new Date();
                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
                    const totalDays = lastDay.getDate();

                    const days: (number | null)[] = [];
                    for (let i = 0; i < startDay; i++) days.push(null);
                    for (let i = 1; i <= totalDays; i++) days.push(i);

                    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

                    return (
                      <div className="p-6 bg-white rounded-xl">
                        <div className="flex items-center gap-2 mb-5">
                          <Calendar className="w-5 h-5 text-orange-500" />
                          <span className="font-bold text-gray-900 text-lg">월간 루틴</span>
                          <span className="text-sm text-gray-500 ml-2">
                            {now.getFullYear()}년 {monthNames[now.getMonth()]}
                          </span>
                        </div>

                        {/* Calendar Grid */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          {/* Day Headers */}
                          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                            {WEEKDAYS.map((day, idx) => (
                              <div
                                key={day}
                                className={`py-2 text-center text-sm font-medium ${
                                  idx >= 5 ? 'text-red-500' : 'text-gray-700'
                                }`}
                              >
                                {day}
                              </div>
                            ))}
                          </div>

                          {/* Date Grid */}
                          <div className="grid grid-cols-7">
                            {days.map((day, idx) => {
                              const dayItems = day ? (itemsByDay[day] || []) : [];
                              return (
                                <div
                                  key={idx}
                                  className={`min-h-[80px] border-b border-r border-gray-100 p-1 ${
                                    day ? 'bg-white' : 'bg-gray-50'
                                  } ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}`}
                                >
                                  {day && (
                                    <>
                                      <div className={`text-sm mb-1 font-medium ${
                                        (idx % 7) >= 5 ? 'text-red-500' : 'text-gray-700'
                                      }`}>
                                        {day}
                                      </div>
                                      <div className="space-y-0.5">
                                        {dayItems.slice(0, 3).map((item) => (
                                          <div
                                            key={item.id}
                                            className="px-1.5 py-0.5 rounded text-white text-xs truncate"
                                            style={{ backgroundColor: getHexColor(item.color) }}
                                          >
                                            {item.title}
                                          </div>
                                        ))}
                                        {dayItems.length > 3 && (
                                          <div className="text-xs text-gray-500 pl-1">
                                            +{dayItems.length - 3}개
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>총 {routineItems.length}개 일정</span>
                            <span>•</span>
                            <span>{Object.keys(itemsByDay).length}일에 일정 있음</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Custom routine view (N-day planner)
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

                    // Find max day
                    const maxDay = Math.max(...routineItems.map(item => item.day), product.routine_days || 30);
                    const displayDays = Math.min(maxDay, 30); // Show first 30 days max

                    return (
                      <div className="p-6 bg-white rounded-xl">
                        <div className="flex items-center gap-2 mb-5">
                          <Calendar className="w-5 h-5 text-orange-500" />
                          <span className="font-bold text-gray-900 text-lg">
                            {product.routine_days || maxDay}일 루틴
                          </span>
                        </div>

                        {/* Day List */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                          {Array.from({ length: displayDays }, (_, i) => i + 1).map((day) => {
                            const dayItems = itemsByDay[day] || [];
                            return (
                              <div
                                key={day}
                                className="flex border-b border-gray-100 last:border-b-0"
                              >
                                <div className="w-20 py-3 px-3 text-sm font-medium text-gray-700 bg-gray-50 flex-shrink-0 border-r border-gray-100">
                                  Day {day}
                                </div>
                                <div className="flex-1 py-2 px-3 min-h-[50px]">
                                  {dayItems.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {dayItems.map((item) => (
                                        <div
                                          key={item.id}
                                          className="px-2.5 py-1 rounded-lg text-white text-sm"
                                          style={{ backgroundColor: getHexColor(item.color) }}
                                        >
                                          {item.title}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-gray-300 text-sm py-1">-</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {maxDay > 30 && (
                            <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
                              +{maxDay - 30}일 더 있음
                            </div>
                          )}
                        </div>

                        {/* Summary */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>총 {routineItems.length}개 일정</span>
                            <span>•</span>
                            <span>{Object.keys(itemsByDay).length}일에 일정 있음</span>
                            <span>•</span>
                            <span>전체 {product.routine_days || maxDay}일</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Fallback for other routine types
                  return (
                    <div className="p-6 bg-white rounded-xl">
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-orange-500" />
                        <span className="font-bold text-gray-900 text-lg">
                          {routineTypeLabels[routineType] || '루틴'}
                        </span>
                      </div>
                      <div className="text-center py-8 text-gray-400">
                        {routineItems.length > 0
                          ? `${routineItems.length}개의 일정이 등록되어 있습니다`
                          : '등록된 일정이 없습니다'
                        }
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
          <div className="lg:col-span-2 px-4 pb-6 lg:py-10">
            <div className="lg:sticky lg:top-20 space-y-4">
              {/* Purchase Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/50 overflow-hidden"
              >
                {(isPurchased || isOwner) ? (
                  /* Purchased or Owner State */
                  <div className="p-6">
                    {/* Success Badge */}
                    <div className={`flex items-center gap-3 p-4 rounded-2xl mb-5 border ${
                      isOwner
                        ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100'
                        : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100'
                    }`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                        isOwner
                          ? 'bg-gradient-to-br from-orange-400 to-amber-500 shadow-orange-200'
                          : 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-200'
                      }`}>
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className={`font-bold ${isOwner ? 'text-orange-800' : 'text-emerald-800'}`}>
                          {isOwner ? '내 콘텐츠' : product.price === 0 ? '무료 자료 획득 완료' : '구매 완료'}
                        </p>
                        <p className={`text-sm ${isOwner ? 'text-orange-600' : 'text-emerald-600'}`}>
                          {isOwner ? '직접 등록한 콘텐츠입니다' : '언제든 다운로드할 수 있어요'}
                        </p>
                      </div>
                    </div>

                    {/* Download Button */}
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="w-full flex items-center justify-center gap-3 h-14 text-gray-900 font-semibold text-base rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>다운로드 중...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          <span>다운로드</span>
                        </>
                      )}
                    </button>

                    {/* Download Count */}
                    {product.download_count > 0 && (
                      <p className="text-center text-sm text-gray-400 mt-3">
                        {product.download_count.toLocaleString()}회 다운로드됨
                      </p>
                    )}
                  </div>
                ) : (
                  /* Not Purchased State */
                  <>
                    {/* Price Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-end justify-between">
                        <div>
                          {product.price === 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-3xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                                무료
                              </span>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                FREE
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-3xl font-extrabold text-gray-900">
                                {formatCurrency(product.price)}
                              </span>
                            </div>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            {product.price === 0 ? '누구나 무료로 다운로드' : '한 번 구매로 평생 소장'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-6" />

                    {/* Action Area */}
                    <div className="p-6 pt-4">
                      {/* CTA Button */}
                      {product.price === 0 ? (
                        <button
                          onClick={handleClaimFree}
                          disabled={isClaiming}
                          className="w-full relative overflow-hidden group rounded-2xl"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite] transition-transform group-hover:scale-[1.02]" />
                          <div className="relative flex items-center justify-center gap-2 h-14 text-white font-bold text-base">
                            {isClaiming ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>처리 중...</span>
                              </>
                            ) : (
                              <>
                                <span>무료로 받기</span>
                                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                              </>
                            )}
                          </div>
                        </button>
                      ) : (
                        <Link href={`/purchase/${id}`} className="block">
                          <button className="w-full relative overflow-hidden group rounded-2xl">
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 transition-transform group-hover:scale-[1.02]" />
                            <div className="relative flex items-center justify-center gap-2 h-14 text-white font-bold text-base">
                              <span>구매하기</span>
                              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </div>
                          </button>
                        </Link>
                      )}

                      {/* Trust Signals */}
                      <div className="mt-5 space-y-3">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-3.5 h-3.5 text-orange-500" />
                          </div>
                          <span>한 번 {product.price === 0 ? '받으면' : '구매하면'} 평생 소장</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-3.5 h-3.5 text-orange-500" />
                          </div>
                          <span>{product.price === 0 ? '바로' : '결제 후 바로'} 다운로드 가능</span>
                        </div>
                        {product.price > 0 && (
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-3.5 h-3.5 text-orange-500" />
                            </div>
                            <span>안전한 결제 시스템</span>
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
                className="bg-white rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/50 overflow-hidden"
              >
                <div className="p-5">
                  {/* Creator Header */}
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 p-0.5 shadow-lg shadow-orange-200/50">
                        <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center overflow-hidden">
                          {product.creator?.avatar_url ? (
                            <Image
                              src={product.creator.avatar_url}
                              alt={product.creator?.name || ''}
                              width={56}
                              height={56}
                              className="object-cover rounded-[14px]"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                              <User className="w-7 h-7 text-orange-500" />
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Online indicator (optional decorative) */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-orange-400 rounded-full border-2 border-white shadow-sm" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate text-lg">
                        {product.creator?.name || '익명'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                          크리에이터
                        </span>
                      </div>
                    </div>

                    {/* Follow Button */}
                    <button className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                      팔로우
                    </button>
                  </div>

                  {/* Bio */}
                  {product.creator?.bio && (
                    <p className="mt-4 text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3">
                      {product.creator.bio}
                    </p>
                  )}

                  {/* Quick Stats (optional - can be enabled if stats are available) */}
                  {/*
                  <div className="mt-4 flex items-center gap-4 pt-4 border-t border-gray-100">
                    <div className="flex-1 text-center">
                      <p className="text-lg font-bold text-gray-900">24</p>
                      <p className="text-xs text-gray-500">자료</p>
                    </div>
                    <div className="w-px h-8 bg-gray-100" />
                    <div className="flex-1 text-center">
                      <p className="text-lg font-bold text-gray-900">1.2k</p>
                      <p className="text-xs text-gray-500">팔로워</p>
                    </div>
                    <div className="w-px h-8 bg-gray-100" />
                    <div className="flex-1 text-center">
                      <p className="text-lg font-bold text-gray-900">4.8</p>
                      <p className="text-xs text-gray-500">평점</p>
                    </div>
                  </div>
                  */}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
