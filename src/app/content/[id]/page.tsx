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
  ShoppingCart,
  Loader2,
  Calendar,
  User,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button, Card, CardContent, Badge } from '@/components/ui';

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

const contentTypeIcons: Record<string, React.ElementType> = {
  video: Play,
  pdf: FileText,
  image: ImageIcon,
};

const contentTypeLabels: Record<string, string> = {
  video: '동영상',
  pdf: 'PDF 자료',
  image: '이미지 자료',
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
  const [isPurchased, setIsPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

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
        setIsPurchased(data.isPurchased || false);
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
        // Create a temporary link and click it to download
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.filename || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Update download count locally
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-500">자료 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              자료를 찾을 수 없습니다
            </h2>
            <p className="text-gray-500 mb-6">
              요청하신 자료가 존재하지 않거나 삭제되었습니다.
            </p>
            <Link href="/content">
              <Button>자료 목록으로</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const TypeIcon = contentTypeIcons[product.type || 'pdf'] || FileText;
  const rating = getAverageRating();

  return (
    <motion.div
      className="min-h-screen bg-gray-50"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-100 sticky top-0 z-20"
      >
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link
            href="/content"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>자료 목록</span>
          </Link>
        </div>
      </motion.header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Thumbnail & Type Badge */}
            <Card className="overflow-hidden">
              <div className="relative aspect-[16/9] bg-gradient-to-br from-orange-50 to-amber-50">
                {product.thumbnail_url ? (
                  <Image
                    src={product.thumbnail_url}
                    alt={product.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <TypeIcon className="w-20 h-20 text-orange-300 mb-4" />
                    <span className="text-orange-400 font-medium">
                      {contentTypeLabels[product.type || 'pdf']}
                    </span>
                  </div>
                )}
                {/* Type Badge */}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 text-gray-700 backdrop-blur-sm px-3 py-1.5">
                    <TypeIcon className="w-4 h-4 mr-1.5" />
                    {contentTypeLabels[product.type || 'pdf']}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Product Info */}
            <Card>
              <CardContent className="p-6">
                {/* Subject & Grade */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.subject && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      {subjectLabels[product.subject] || product.subject}
                    </Badge>
                  )}
                  {product.grade && (
                    <Badge variant="outline">{product.grade}</Badge>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {product.title}
                </h1>

                {/* Stats Row */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
                  {rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-medium text-gray-700">{rating}</span>
                      <span>({product.rating_count})</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{(product.view_count || 0).toLocaleString()}회 조회</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    <span>{(product.download_count || 0).toLocaleString()}회 다운로드</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(product.created_at)}</span>
                  </div>
                </div>

                {/* Creator Info */}
                {product.creator && (
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center overflow-hidden">
                      {product.creator.avatar_url ? (
                        <Image
                          src={product.creator.avatar_url}
                          alt={product.creator.name}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-orange-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{product.creator.name}</p>
                      {product.creator.bio && (
                        <p className="text-sm text-gray-500 line-clamp-1">{product.creator.bio}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                {product.description ? (
                  <div className="prose prose-gray max-w-none">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">자료 소개</h3>
                    <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-400 italic">자료 설명이 없습니다.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar - Purchase/Download Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="sticky top-20">
              <Card className="border-2 border-orange-100 shadow-lg">
                <CardContent className="p-6">
                  {/* Price */}
                  <div className="text-center mb-6">
                    <p className="text-sm text-gray-500 mb-1">가격</p>
                    <p className="text-3xl font-bold text-orange-500">
                      {product.price === 0 ? '무료' : formatCurrency(product.price)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  {isPurchased ? (
                    <div className="space-y-4">
                      {/* Download Button */}
                      <Button
                        fullWidth
                        size="lg"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
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

                      {/* Success Badge */}
                      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">
                          {product.price === 0 ? '무료 자료' : '구매 완료'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Link href={`/purchase/${id}`}>
                        <Button
                          fullWidth
                          size="lg"
                          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                        >
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          {product.price === 0 ? '무료로 받기' : '구매하기'}
                        </Button>
                      </Link>

                      {/* Trust signals */}
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <ul className="space-y-3 text-sm text-gray-500">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            평생 소장 가능
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            구매 후 바로 다운로드
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            안전한 결제
                          </li>
                        </ul>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* File Info */}
              <Card className="mt-4">
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-900 mb-3">파일 정보</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">파일 형식</span>
                      <span className="text-gray-700 font-medium">
                        {(product.type || 'pdf').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">등록일</span>
                      <span className="text-gray-700">
                        {formatDate(product.created_at)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>
    </motion.div>
  );
}
