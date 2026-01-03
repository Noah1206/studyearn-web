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
} from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui';

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
};

const contentTypeLabels: Record<string, string> = {
  video: '동영상',
  pdf: 'PDF',
  image: '이미지',
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
    if (!isPurchased || isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await fetch(`/api/content/${id}/download`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Download failed');
      }

      const data = await response.json();
      if (data.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.filename || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

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
          <Loader2 className="w-8 h-8 animate-spin text-gray-900 mx-auto mb-3" />
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

  const TypeIcon = contentTypeIcons[product.type || 'pdf'] || FileText;
  const rating = getAverageRating();
  const hasStats = (product.view_count > 0) || (product.download_count > 0) || (rating > 0);

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
                <span className="text-sm font-medium text-gray-900">
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
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center overflow-hidden flex-shrink-0">
                {product.creator?.avatar_url ? (
                  <Image
                    src={product.creator.avatar_url}
                    alt={product.creator?.name || ''}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
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
              <button className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
                팔로우
              </button>
            </div>

            {/* Stats */}
            {hasStats && (
              <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
                {rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-semibold text-gray-900">{rating}</span>
                    <span>({product.rating_count})</span>
                  </div>
                )}
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
              </div>
            )}

            {/* File Preview */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 mb-8">
              {/* File type badge */}
              <div className="absolute top-4 left-4 z-10">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700">
                  <TypeIcon className="w-4 h-4" />
                  {contentTypeLabels[product.type || 'pdf']}
                </div>
              </div>

              {/* Content Preview */}
              {(() => {
                const contentUrl = contents[0]?.url;
                const fileType = product.type || 'pdf';

                // Image preview
                if (fileType === 'image' && contentUrl) {
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
                if (fileType === 'pdf' && contentUrl) {
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
                if (fileType === 'video' && contentUrl) {
                  return (
                    <div className="aspect-video relative bg-black">
                      <video
                        src={contentUrl}
                        className="w-full h-full object-contain"
                        controls={isPurchased}
                        poster={product.thumbnail_url || undefined}
                      />
                      {!isPurchased && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                            <Play className="w-8 h-8 text-gray-900 ml-1" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // Thumbnail fallback
                if (product.thumbnail_url) {
                  return (
                    <div className="aspect-[4/3] relative">
                      <Image
                        src={product.thumbnail_url}
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
                    <div className="w-20 h-20 rounded-2xl bg-gray-900 flex items-center justify-center mb-3">
                      <TypeIcon className="w-10 h-10 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {contentTypeLabels[product.type || 'pdf']} 파일
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
                  <span className="text-gray-500">파일 형식</span>
                  <span className="font-medium text-gray-900">
                    {(product.type || 'pdf').toUpperCase()}
                  </span>
                </div>
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
            <div className="lg:sticky lg:top-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Price Section */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-baseline gap-2 mb-1">
                    {product.price === 0 ? (
                      <span className="text-3xl font-bold text-gray-900">무료</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-gray-900">
                          {formatCurrency(product.price)}
                        </span>
                      </>
                    )}
                  </div>
                  {product.price === 0 && (
                    <p className="text-sm text-gray-500">누구나 무료로 다운로드</p>
                  )}
                </div>

                {/* Action Section */}
                <div className="p-6">
                  {isPurchased ? (
                    <div className="space-y-4">
                      <Button
                        fullWidth
                        size="lg"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-14 text-base font-semibold"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            다운로드 중...
                          </>
                        ) : (
                          <>
                            <Download className="w-5 h-5 mr-2" />
                            다운로드
                          </>
                        )}
                      </Button>

                      <div className="flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 rounded-xl">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">
                          {product.price === 0 ? '무료 자료' : '구매 완료'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {product.price === 0 ? (
                        <Button
                          fullWidth
                          size="lg"
                          onClick={handleClaimFree}
                          disabled={isClaiming}
                          className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-14 text-base font-semibold"
                        >
                          {isClaiming ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              처리 중...
                            </>
                          ) : (
                            <>
                              무료로 받기
                              <ChevronRight className="w-5 h-5 ml-1" />
                            </>
                          )}
                        </Button>
                      ) : (
                        <Link href={`/purchase/${id}`} className="block">
                          <Button
                            fullWidth
                            size="lg"
                            className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-14 text-base font-semibold"
                          >
                            구매하기
                            <ChevronRight className="w-5 h-5 ml-1" />
                          </Button>
                        </Link>
                      )}

                      {/* Trust Signals */}
                      <div className="space-y-2.5 pt-2">
                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>한 번 {product.price === 0 ? '받으면' : '구매하면'} 평생 소장</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{product.price === 0 ? '바로' : '결제 후 바로'} 다운로드 가능</span>
                        </div>
                        {product.price > 0 && (
                          <div className="flex items-center gap-2.5 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>안전한 결제 시스템</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Creator Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 bg-gray-50 rounded-2xl p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.creator?.avatar_url ? (
                      <Image
                        src={product.creator.avatar_url}
                        alt={product.creator?.name || ''}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {product.creator?.name || '익명'}
                    </p>
                    <p className="text-sm text-gray-500">크리에이터</p>
                  </div>
                </div>
                {product.creator?.bio && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                    {product.creator.bio}
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
}
