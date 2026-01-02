'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowLeft,
  Lock,
  Play,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  ShoppingCart,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button, Card, CardContent, Badge } from '@/components/ui';

interface Content {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'image';
  url: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  sort_order: number;
}

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: string;
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
  pdf: 'PDF',
  image: '이미지',
};

function ContentItem({
  content,
  isPurchased,
  productId,
}: {
  content: Content;
  isPurchased: boolean;
  productId: string;
}) {
  const Icon = contentTypeIcons[content.type] || FileText;
  const router = useRouter();

  const handleContentClick = async () => {
    if (!isPurchased) return;

    try {
      const response = await fetch(`/api/content/${content.id}`);
      if (!response.ok) throw new Error('Failed to fetch content');

      const data = await response.json();
      if (data.content?.url) {
        window.open(data.content.url, '_blank');
      }
    } catch (error) {
      console.error('Failed to access content:', error);
    }
  };

  return (
    <div
      onClick={handleContentClick}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
        isPurchased
          ? 'border-gray-200 hover:border-orange-300 hover:bg-orange-50 cursor-pointer'
          : 'border-gray-100 bg-gray-50 cursor-not-allowed'
      }`}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isPurchased ? 'bg-orange-100' : 'bg-gray-200'
        }`}
      >
        {isPurchased ? (
          <Icon className="w-5 h-5 text-orange-500" />
        ) : (
          <Lock className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4
          className={`font-medium line-clamp-1 ${
            isPurchased ? 'text-gray-900' : 'text-gray-500'
          }`}
        >
          {content.title}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {contentTypeLabels[content.type]}
          </Badge>
          {content.duration && (
            <span className="text-xs text-gray-400">
              {Math.floor(content.duration / 60)}분
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      {isPurchased && <CheckCircle className="w-5 h-5 text-green-500" />}
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
        setIsAuthenticated(true); // If we get data, user might be authenticated
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-500">상품 정보를 불러오는 중...</p>
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
              상품을 찾을 수 없습니다
            </h2>
            <p className="text-gray-500 mb-6">
              요청하신 상품이 존재하지 않거나 삭제되었습니다.
            </p>
            <Link href="/content">
              <Button>상품 목록으로</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/content"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>상품 목록</span>
          </Link>
        </div>
      </motion.header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Thumbnail */}
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-gray-100">
                {product.thumbnail_url ? (
                  <Image
                    src={product.thumbnail_url}
                    alt={product.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-16 h-16 text-gray-300" />
                  </div>
                )}
              </div>
            </Card>

            {/* Product Info */}
            <Card>
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  {product.title}
                </h1>

                {/* Creator Info */}
                {product.creator && (
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      {product.creator.avatar_url ? (
                        <Image
                          src={product.creator.avatar_url}
                          alt={product.creator.name}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-gray-500 text-sm font-medium">
                          {product.creator.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.creator.name}</p>
                      {product.creator.bio && (
                        <p className="text-sm text-gray-500 line-clamp-1">{product.creator.bio}</p>
                      )}
                    </div>
                  </div>
                )}

                {product.description && (
                  <p className="text-gray-600 whitespace-pre-line">
                    {product.description}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Contents List */}
            {contents.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    포함된 콘텐츠 ({contents.length}개)
                  </h2>
                  <div className="space-y-3">
                    {contents.map((content) => (
                      <ContentItem
                        key={content.id}
                        content={content}
                        isPurchased={isPurchased}
                        productId={id}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Sidebar - Purchase Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="sticky top-20">
              <Card className="border-2 border-orange-100">
                <CardContent className="p-6">
                  {/* Price */}
                  <div className="text-center mb-6">
                    <p className="text-sm text-gray-500 mb-1">가격</p>
                    <p className="text-3xl font-bold text-orange-500">
                      {product.price === 0
                        ? '무료'
                        : formatCurrency(product.price)}
                    </p>
                  </div>

                  {/* Purchase Status & Action */}
                  {isPurchased ? (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full mb-4">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">구매 완료</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        위 콘텐츠 목록에서 원하는 콘텐츠를 클릭하여 시청하세요.
                      </p>
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
                          {product.price === 0
                            ? '무료로 받기'
                            : '구매하기'}
                        </Button>
                      </Link>

                      {/* Trust signals */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <ul className="space-y-2 text-sm text-gray-500">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            평생 소장 가능
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            7일 이내 환불 가능
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            안전한 결제
                          </li>
                        </ul>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>
    </motion.div>
  );
}
