'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowLeft,
  Heart,
  HeartOff,
  Play,
  FileText,
  Mic,
  Image as ImageIcon,
  Eye,
  Calendar,
  Loader2,
  HeartCrack,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatNumber, formatDate, cn } from '@/lib/utils';
import { Button, Card, CardContent, Badge, Avatar, Spinner } from '@/components/ui';
import type { Content } from '@/types/database';

interface LikedContent extends Content {
  liked_at: string;
  creator?: {
    display_name: string | null;
    profile_image_url: string | null;
  };
}

const contentTypeIcons: Record<string, React.ElementType> = {
  video: Play,
  pdf: FileText,
  image: ImageIcon,
};

const contentTypeLabels: Record<string, string> = {
  video: '동영상',
  pdf: '문서',
  image: '이미지',
};

export default function LikedContentsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [likedContents, setLikedContents] = useState<LikedContent[]>([]);
  const [unlikingId, setUnlikingId] = useState<string | null>(null);

  useEffect(() => {
    loadLikedContents();
  }, []);

  const loadLikedContents = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // content_likes 테이블에서 좋아요한 콘텐츠 조회
      const { data: likes, error } = await supabase
        .from('content_likes')
        .select(`
          id,
          created_at,
          content_id,
          contents (
            id,
            product_id,
            creator_id,
            title,
            description,
            type,
            content_type,
            url,
            thumbnail_url,
            duration,
            sort_order,
            is_active,
            access_level,
            price,
            view_count,
            like_count,
            is_published,
            published_at,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load liked contents:', error);
        setLikedContents([]);
        return;
      }

      // 크리에이터 정보 조회
      const transformedContents: LikedContent[] = await Promise.all(
        (likes || []).map(async (like: any) => {
          const content = like.contents;
          if (!content) return null;

          // 크리에이터 정보 가져오기
          let creator = null;
          if (content.creator_id) {
            const { data: creatorData } = await supabase
              .from('creator_settings')
              .select('display_name, profile_image_url')
              .eq('user_id', content.creator_id)
              .single();
            creator = creatorData;
          }

          return {
            ...content,
            liked_at: like.created_at,
            creator: creator ? {
              display_name: creator.display_name,
              profile_image_url: creator.profile_image_url,
            } : null,
          };
        })
      );

      setLikedContents(transformedContents.filter(Boolean) as LikedContent[]);
    } catch (error) {
      console.error('Failed to load liked contents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlike = async (contentId: string) => {
    setUnlikingId(contentId);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // content_likes 테이블에서 좋아요 삭제
      const { error } = await supabase
        .from('content_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('content_id', contentId);

      if (error) throw error;

      // 콘텐츠 like_count 감소
      await supabase.rpc('decrement_content_likes', { p_content_id: contentId });

      // UI에서 제거
      setLikedContents(prev => prev.filter(c => c.id !== contentId));
    } catch (error) {
      console.error('Failed to unlike content:', error);
    } finally {
      setUnlikingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              <h1 className="text-xl font-bold">찜한 콘텐츠</h1>
            </div>
            <span className="text-sm text-gray-500 ml-auto">
              {likedContents.length}개
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {likedContents.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <HeartCrack className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                찜한 콘텐츠가 없습니다
              </h3>
              <p className="text-gray-500 mb-6">
                마음에 드는 콘텐츠를 찜해보세요
              </p>
              <Link href="/content">
                <Button>콘텐츠 둘러보기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {likedContents.map((content) => {
              const TypeIcon = content.content_type ? contentTypeIcons[content.content_type] || FileText : FileText;

              return (
                <Card key={content.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gray-100 relative">
                      {content.thumbnail_url ? (
                        <Image
                          src={content.thumbnail_url}
                          alt={content.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <TypeIcon className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <Badge className="absolute top-2 left-2 text-xs">
                        {contentTypeLabels[content.content_type]}
                      </Badge>
                      <button
                        onClick={() => handleUnlike(content.id)}
                        disabled={unlikingId === content.id}
                        className="absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                      >
                        {unlikingId === content.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        ) : (
                          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                        )}
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <Link href={`/content/${content.id}`}>
                        <h3 className="font-medium text-gray-900 hover:text-gray-900 line-clamp-2 mb-2">
                          {content.title}
                        </h3>
                      </Link>

                      {/* Creator */}
                      <Link href={`/creator/${content.creator_id}`} className="flex items-center gap-2 mb-3">
                        <Avatar
                          src={content.creator?.profile_image_url}
                          alt={content.creator?.display_name || ''}
                          size="xs"
                        />
                        <span className="text-sm text-gray-600 hover:text-gray-900">
                          {content.creator?.display_name || '크리에이터'}
                        </span>
                      </Link>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {formatNumber(content.view_count ?? 0)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {formatNumber(content.like_count ?? 0)}
                          </span>
                        </div>
                        <span className="text-xs">
                          {formatDate(content.liked_at)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </motion.div>
  );
}
