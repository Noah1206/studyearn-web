'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { Button, Card, CardContent, Badge, Avatar } from '@/components/ui';
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
  audio: Mic,
  image: ImageIcon,
  document: FileText,
};

const contentTypeLabels: Record<string, string> = {
  video: '동영상',
  audio: '오디오',
  image: '이미지',
  document: '문서',
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

      // 실제로는 content_likes 테이블에서 조회
      // 현재는 Mock 데이터 사용
      const mockLikedContents: LikedContent[] = [
        {
          id: '1',
          creator_id: 'creator1',
          title: '영어 단어 암기법 총정리',
          description: '효과적인 영단어 암기 방법',
          content_type: 'video',
          thumbnail_url: null,
          content_url: null,
          content_data: {},
          access_level: 'public',
          price: null,
          required_tier_id: null,
          view_count: 3420,
          like_count: 234,
          comment_count: 56,
          is_published: true,
          published_at: '2024-12-22T10:00:00Z',
          is_pinned: false,
          tags: ['영어', '암기법'],
          created_at: '2024-12-22T09:00:00Z',
          updated_at: '2024-12-22T10:00:00Z',
          liked_at: '2024-12-23T14:30:00Z',
          creator: {
            display_name: '영어왕',
            profile_image_url: null,
          },
        },
        {
          id: '2',
          creator_id: 'creator2',
          title: '고등학교 과학 실험 모음',
          description: '집에서 할 수 있는 과학 실험',
          content_type: 'video',
          thumbnail_url: null,
          content_url: null,
          content_data: {},
          access_level: 'subscribers',
          price: null,
          required_tier_id: null,
          view_count: 1890,
          like_count: 312,
          comment_count: 28,
          is_published: true,
          published_at: '2024-12-19T16:00:00Z',
          is_pinned: false,
          tags: ['과학', '실험'],
          created_at: '2024-12-19T15:00:00Z',
          updated_at: '2024-12-19T16:00:00Z',
          liked_at: '2024-12-21T11:20:00Z',
          creator: {
            display_name: '과학쌤',
            profile_image_url: null,
          },
        },
        {
          id: '3',
          creator_id: 'creator3',
          title: '시험 전 마인드 컨트롤',
          description: '긴장을 풀고 집중하는 방법',
          content_type: 'audio',
          thumbnail_url: null,
          content_url: null,
          content_data: {},
          access_level: 'public',
          price: null,
          required_tier_id: null,
          view_count: 5670,
          like_count: 892,
          comment_count: 134,
          is_published: true,
          published_at: '2024-12-17T09:00:00Z',
          is_pinned: false,
          tags: ['멘탈', '시험'],
          created_at: '2024-12-17T08:00:00Z',
          updated_at: '2024-12-17T09:00:00Z',
          liked_at: '2024-12-20T08:45:00Z',
          creator: {
            display_name: '멘탈코치',
            profile_image_url: null,
          },
        },
        {
          id: '4',
          creator_id: 'creator4',
          title: '필기 노트 정리 템플릿',
          description: '깔끔한 노트 정리를 위한 템플릿',
          content_type: 'document',
          thumbnail_url: null,
          content_url: null,
          content_data: {},
          access_level: 'public',
          price: 1000,
          required_tier_id: null,
          view_count: 2340,
          like_count: 456,
          comment_count: 67,
          is_published: true,
          published_at: '2024-12-15T14:00:00Z',
          is_pinned: false,
          tags: ['노트', '템플릿'],
          created_at: '2024-12-15T13:00:00Z',
          updated_at: '2024-12-15T14:00:00Z',
          liked_at: '2024-12-18T16:30:00Z',
          creator: {
            display_name: '노트마스터',
            profile_image_url: null,
          },
        },
      ];

      setLikedContents(mockLikedContents);
    } catch (error) {
      console.error('Failed to load liked contents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlike = async (contentId: string) => {
    setUnlikingId(contentId);
    try {
      // 실제로는 Supabase에서 좋아요 취소
      await new Promise(resolve => setTimeout(resolve, 500));
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
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              <h1 className="text-xl font-bold">좋아요한 콘텐츠</h1>
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
                좋아요한 콘텐츠가 없습니다
              </h3>
              <p className="text-gray-500 mb-6">
                마음에 드는 콘텐츠에 좋아요를 눌러보세요
              </p>
              <Link href="/content">
                <Button>콘텐츠 둘러보기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {likedContents.map((content) => {
              const TypeIcon = contentTypeIcons[content.content_type] || FileText;

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
                            {formatNumber(content.view_count)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {formatNumber(content.like_count)}
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
    </div>
  );
}
