'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Bookmark,
  BookmarkX,
  Play,
  FileText,
  Mic,
  Image as ImageIcon,
  Eye,
  Calendar,
  Loader2,
  FolderOpen,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatNumber, formatDate } from '@/lib/utils';
import { Button, Card, CardContent, Badge, Avatar } from '@/components/ui';

interface SavedContent {
  id: string;
  content_id: string;
  saved_at: string;
  content: {
    id: string;
    title: string;
    description?: string;
    thumbnail_url?: string;
    content_type: string;
    view_count: number;
    like_count: number;
    creator_id: string;
    price?: number;
    access_level: string;
  };
  creator?: {
    display_name: string;
    profile_image_url?: string;
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2 },
  },
};

function SavedContentCard({
  item,
  onRemove,
  isRemoving,
}: {
  item: SavedContent;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}) {
  const TypeIcon = contentTypeIcons[item.content.content_type] || FileText;

  return (
    <motion.div
      variants={itemVariants}
      layout
      exit="exit"
      className="group"
    >
      <Card className="overflow-hidden hover:shadow-md transition-all duration-300 border-gray-100">
        <CardContent className="p-0">
          <div className="flex gap-4 p-4">
            {/* Thumbnail */}
            <Link href={`/content/${item.content.id}`} className="flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-24 h-24 md:w-32 md:h-24 rounded-xl overflow-hidden bg-gray-100"
              >
                {item.content.thumbnail_url ? (
                  <Image
                    src={item.content.thumbnail_url}
                    alt={item.content.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <TypeIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                {/* Play overlay for video */}
                {item.content.content_type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 text-gray-900 ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                )}
              </motion.div>
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {contentTypeLabels[item.content.content_type]}
                    </Badge>
                    {item.content.access_level === 'public' && item.content.price === null && (
                      <Badge className="bg-green-100 text-green-700 border-0 text-xs">무료</Badge>
                    )}
                  </div>
                  <Link href={`/content/${item.content.id}`}>
                    <h3 className="font-semibold text-gray-900 hover:text-orange-500 line-clamp-2 transition-colors">
                      {item.content.title}
                    </h3>
                  </Link>
                </div>

                {/* Remove button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onRemove(item.id)}
                  disabled={isRemoving}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  {isRemoving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Bookmark className="w-5 h-5 fill-current" />
                  )}
                </motion.button>
              </div>

              {/* Creator */}
              {item.creator && (
                <Link
                  href={`/creator/${item.content.creator_id}`}
                  className="flex items-center gap-2 mb-2"
                >
                  <Avatar
                    src={item.creator.profile_image_url}
                    alt={item.creator.display_name}
                    size="xs"
                  />
                  <span className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {item.creator.display_name}
                  </span>
                </Link>
              )}

              {/* Meta */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-auto">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {formatNumber(item.content.view_count)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(item.saved_at)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FolderOpen className="w-10 h-10 text-orange-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        저장한 콘텐츠가 없습니다
      </h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        나중에 볼 콘텐츠를 북마크하면 여기에 저장됩니다
      </p>
      <Link href="/content">
        <Button className="gap-2">
          콘텐츠 둘러보기
          <ChevronRight className="w-4 h-4" />
        </Button>
      </Link>
    </motion.div>
  );
}

export default function SavedContentsPage() {
  const [savedItems, setSavedItems] = useState<SavedContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    loadSavedContents();
  }, []);

  const loadSavedContents = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Note: This assumes a 'content_bookmarks' or 'saved_contents' table exists
      // If not, this will return empty array
      // For now, using mock data to demonstrate the UI
      const mockData: SavedContent[] = [
        {
          id: '1',
          content_id: 'c1',
          saved_at: new Date().toISOString(),
          content: {
            id: 'c1',
            title: '수능 수학 킬러문항 완벽 분석',
            description: '어려운 문제도 쉽게 풀 수 있는 비법',
            thumbnail_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop',
            content_type: 'video',
            view_count: 12500,
            like_count: 890,
            creator_id: 'creator1',
            access_level: 'public',
          },
          creator: {
            display_name: '수학왕',
            profile_image_url: undefined,
          },
        },
        {
          id: '2',
          content_id: 'c2',
          saved_at: new Date(Date.now() - 86400000).toISOString(),
          content: {
            id: 'c2',
            title: '영어 문법 완벽 정리 노트',
            description: '수능 영어 문법 핵심만 모았습니다',
            thumbnail_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop',
            content_type: 'document',
            view_count: 8900,
            like_count: 567,
            creator_id: 'creator2',
            price: 3900,
            access_level: 'paid',
          },
          creator: {
            display_name: '영어천재',
            profile_image_url: undefined,
          },
        },
        {
          id: '3',
          content_id: 'c3',
          saved_at: new Date(Date.now() - 172800000).toISOString(),
          content: {
            id: 'c3',
            title: '집중력 향상 ASMR 공부 음악',
            description: '백색소음과 함께하는 공부 시간',
            thumbnail_url: undefined,
            content_type: 'audio',
            view_count: 45000,
            like_count: 2300,
            creator_id: 'creator3',
            access_level: 'public',
          },
          creator: {
            display_name: '스터디뮤직',
            profile_image_url: undefined,
          },
        },
      ];

      setSavedItems(mockData);
    } catch (error) {
      console.error('Failed to load saved contents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setSavedItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to remove saved content:', error);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-100 sticky top-0 z-20"
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Bookmark className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">저장한 콘텐츠</h1>
                <p className="text-sm text-gray-500">{savedItems.length}개의 콘텐츠</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Quick Actions */}
        {savedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between mb-6"
          >
            <p className="text-sm text-gray-500">
              최근 저장한 순서로 정렬됩니다
            </p>
          </motion.div>
        )}

        {/* Saved Contents List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-gray-100">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-xl animate-pulse" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-gray-100 rounded animate-pulse w-3/4" />
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-1/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : savedItems.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {savedItems.map((item) => (
                <SavedContentCard
                  key={item.id}
                  item={item}
                  onRemove={handleRemove}
                  isRemoving={removingId === item.id}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}
