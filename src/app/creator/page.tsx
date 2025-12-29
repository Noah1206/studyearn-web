'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  Search,
  Users,
  Star,
  TrendingUp,
  Sparkles,
  Filter,
  ChevronRight,
  BookOpen,
  Award,
  Heart,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Badge, Avatar, Card, CardContent, Skeleton } from '@/components/ui';
import { formatNumber } from '@/lib/utils';

interface Creator {
  id: string;
  user_id: string;
  display_name: string;
  username?: string;
  profile_image_url?: string;
  bio?: string;
  subject?: string;
  total_subscribers: number;
  total_content_count: number;
  rating?: number;
  is_verified: boolean;
}

const CATEGORIES = [
  { id: 'all', label: '전체', emoji: '✨' },
  { id: 'korean', label: '국어', emoji: '📚' },
  { id: 'english', label: '영어', emoji: '🌍' },
  { id: 'math', label: '수학', emoji: '🔢' },
  { id: 'science', label: '과학', emoji: '🔬' },
  { id: 'social', label: '사회', emoji: '🗺️' },
  { id: 'coding', label: '코딩', emoji: '💻' },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

function CreatorCard({ creator, index }: { creator: Creator; index: number }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      <Link href={`/creator/${creator.user_id}`}>
        <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-orange-200">
          <CardContent className="p-6">
            {/* Profile Section */}
            <div className="flex items-start gap-4 mb-4">
              <div className="relative">
                <Avatar
                  src={creator.profile_image_url}
                  alt={creator.display_name}
                  size="lg"
                  className="ring-2 ring-gray-100"
                />
                {creator.is_verified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <Award className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 truncate">
                    {creator.display_name}
                  </h3>
                  {index < 3 && (
                    <Badge className="bg-orange-100 text-orange-600 border-0 text-xs">
                      TOP {index + 1}
                    </Badge>
                  )}
                </div>
                {creator.username && (
                  <p className="text-sm text-gray-500 truncate">@{creator.username}</p>
                )}
                {creator.subject && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    {creator.subject}
                  </Badge>
                )}
              </div>
            </div>

            {/* Bio */}
            {creator.bio && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                {creator.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">{formatNumber(creator.total_subscribers)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm font-medium">{creator.total_content_count}</span>
                </div>
              </div>
              {creator.rating && (
                <div className="flex items-center gap-1 text-orange-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-semibold">{creator.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function CreatorSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <Skeleton className="w-14 h-14 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <div className="flex gap-4 pt-4 border-t border-gray-100">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadCreators();
  }, [selectedCategory]);

  const loadCreators = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      let query = supabase
        .from('creator_settings')
        .select('*')
        .order('total_subscribers', { ascending: false })
        .limit(20);

      if (selectedCategory !== 'all') {
        const categoryLabel = CATEGORIES.find(c => c.id === selectedCategory)?.label;
        if (categoryLabel) {
          query = query.eq('subject', categoryLabel);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setCreators(data || []);
    } catch (error) {
      console.error('Failed to load creators:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCreators = creators.filter(creator =>
    creator.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      className="min-h-screen bg-gray-50"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-orange-500 via-orange-600 to-gray-900 text-white"
      >
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Badge className="bg-white/20 text-white border-0 mb-4">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              인기 크리에이터
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              최고의 크리에이터를<br />만나보세요
            </h1>
            <p className="text-white/80 text-base md:text-lg max-w-md">
              다양한 분야의 전문 크리에이터들이 여러분의 학습을 도와드립니다.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Search & Filter Section */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="크리에이터 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:bg-white transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{category.emoji}</span>
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Creators Grid */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <CreatorSkeleton key={i} />
            ))}
          </div>
        ) : filteredCreators.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              크리에이터를 찾을 수 없습니다
            </h3>
            <p className="text-gray-500 mb-6">
              다른 검색어나 카테고리를 선택해보세요
            </p>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
              필터 초기화
            </Button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredCreators.map((creator, index) => (
              <CreatorCard key={creator.id} creator={creator} index={index} />
            ))}
          </motion.div>
        )}

        {/* CTA Section */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-center"
          >
            <h2 className="text-xl font-bold text-white mb-2">
              당신도 크리에이터가 되어보세요
            </h2>
            <p className="text-gray-400 mb-6">
              지식을 공유하고 수익을 창출하세요
            </p>
            <Link href="/become-creator">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                <Sparkles className="w-4 h-4" />
                크리에이터 시작하기
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        )}
      </main>
    </motion.div>
  );
}
