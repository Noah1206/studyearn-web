'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Star } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { ContentThumbnail } from './ContentThumbnail';

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: string;
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

interface ContentCardProps {
  product: DisplayProduct;
  index?: number;
  likedIds?: Set<string>;
  onToggleLike?: (id: string) => void;
}

// 과목 색상
function getSubjectStyle(subject?: string) {
  const styles: Record<string, { bg: string; text: string }> = {
    '국어': { bg: 'bg-rose-50', text: 'text-rose-600' },
    '수학': { bg: 'bg-orange-50', text: 'text-orange-600' },
    '영어': { bg: 'bg-purple-50', text: 'text-purple-600' },
    '과학': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    '물리': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    '화학': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    '생물': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    '지구과학': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    '사회': { bg: 'bg-yellow-50', text: 'text-yellow-600' },
    '한국사': { bg: 'bg-orange-50', text: 'text-orange-600' },
    '세계사': { bg: 'bg-orange-50', text: 'text-orange-600' },
    '루틴': { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    '플래너': { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  };
  return styles[subject || ''] || { bg: 'bg-gray-50', text: 'text-gray-600' };
}

export function ContentCard({ product, index = 0, likedIds, onToggleLike }: ContentCardProps) {
  const isLiked = likedIds?.has(product.id) ?? false;
  const subjectStyle = getSubjectStyle(product.subject);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleLike?.(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative group"
    >
      {/* 찜 버튼 - Link 바깥에 배치 */}
      <button
        type="button"
        onClick={handleLikeClick}
        className="absolute top-2 right-2 z-10 p-1.5 transition-all duration-200"
      >
        <Heart
          className={cn(
            'w-4 h-4 transition-colors',
            isLiked ? 'text-red-500 fill-red-500' : 'text-gray-300 hover:text-gray-400'
          )}
        />
      </button>

      <Link href={`/content/${product.id}`} className="block">
        <div className="flex flex-col h-full">
          {/* 썸네일 영역 */}
          <div className="relative rounded-sm overflow-hidden shadow-toss-2 group-hover:shadow-toss-4 transition-shadow duration-300">
            <ContentThumbnail
              thumbnailUrl={product.thumbnail_url}
              subject={product.subject}
              title={product.title}
              aspectRatio="4/3"
            />
          </div>

          {/* 정보 영역 */}
          <div className="pt-3.5 flex flex-col flex-1">
            {/* 제목 */}
            <h3 className="text-[15px] font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug mb-1 flex-grow">
              {product.title}
            </h3>

            {/* 크리에이터 */}
            <span className="text-sm text-gray-900">
              {product.creator?.name || '익명'}
            </span>

            {/* 가격 */}
            {product.price === 0 ? (
              <span className="text-sm font-medium text-orange-500 mt-0.5">무료</span>
            ) : (
              <span className="text-sm font-normal text-gray-900 mt-0.5">
                {formatCurrency(product.price)}
              </span>
            )}

            {/* 별점 + 리뷰 수 */}
            <div className="flex items-center gap-1.5 mt-1">
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
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default ContentCard;
