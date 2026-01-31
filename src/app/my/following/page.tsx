'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowLeft,
  Users,
  Search,
  UserMinus,
  Bell,
  BellOff,
  ChevronRight,
  Loader2,
  BookOpen,
  Star,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatNumber } from '@/lib/utils';
import { Button, Badge, Avatar, Card, CardContent, Tabs, TabsList, TabsTrigger, Spinner } from '@/components/ui';

interface FollowUser {
  id: string;
  user_id: string;
  display_name: string;
  username?: string;
  profile_image_url?: string;
  bio?: string;
  is_creator?: boolean;
  subject?: string;
  content_count?: number;
  subscriber_count?: number;
  is_notified: boolean;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2 },
  },
};

function FollowCard({
  user,
  onUnfollow,
  onToggleNotification,
  isUnfollowing,
}: {
  user: FollowUser;
  onUnfollow: (id: string) => void;
  onToggleNotification: (id: string, notify: boolean) => void;
  isUnfollowing: boolean;
}) {
  return (
    <motion.div variants={itemVariants} layout exit="exit">
      <Card className="border-gray-100 hover:border-gray-200 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <Link href={`/creator/${user.user_id}`}>
              <Avatar
                src={user.profile_image_url}
                alt={user.display_name}
                size="lg"
                className="ring-2 ring-gray-100"
              />
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Link href={`/creator/${user.user_id}`}>
                  <h3 className="font-semibold text-gray-900 hover:text-orange-500 transition-colors">
                    {user.display_name}
                  </h3>
                </Link>
                {user.is_creator && (
                  <Badge className="bg-orange-100 text-orange-600 border-0 text-xs">
                    크리에이터
                  </Badge>
                )}
              </div>
              {user.username && (
                <p className="text-sm text-gray-500 mb-1">@{user.username}</p>
              )}
              {user.bio && (
                <p className="text-sm text-gray-600 line-clamp-1">{user.bio}</p>
              )}

              {/* Creator stats */}
              {user.is_creator && (
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                  {user.subject && (
                    <Badge variant="outline" className="text-xs">
                      {user.subject}
                    </Badge>
                  )}
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {formatNumber(user.content_count || 0)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {formatNumber(user.subscriber_count || 0)}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onToggleNotification(user.id, !user.is_notified)}
                className={`p-2 rounded-lg transition-colors ${
                  user.is_notified
                    ? 'bg-orange-100 text-orange-500'
                    : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                }`}
              >
                {user.is_notified ? (
                  <Bell className="w-5 h-5" />
                ) : (
                  <BellOff className="w-5 h-5" />
                )}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onUnfollow(user.id)}
                disabled={isUnfollowing}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                {isUnfollowing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <UserMinus className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState({ type }: { type: 'following' | 'followers' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users className="w-10 h-10 text-orange-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {type === 'following' ? '팔로우한 사용자가 없습니다' : '팔로워가 없습니다'}
      </h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        {type === 'following'
          ? '관심 있는 크리에이터를 팔로우해보세요'
          : '콘텐츠를 공유하면 팔로워가 생길 거예요'}
      </p>
      {type === 'following' && (
        <Link href="/studyan">
          <Button className="gap-2">
            스터디언 둘러보기
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      )}
    </motion.div>
  );
}

export default function FollowingPage() {
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>('following');
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Load following
      const { data: followingData, error: followingError } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          creator_id,
          is_notified,
          creator:creator_settings(
            user_id,
            display_name,
            username,
            profile_image_url,
            bio,
            subject,
            total_content_count,
            total_subscribers
          )
        `)
        .eq('subscriber_id', user.id);

      if (followingError) {
        console.error('Failed to load following:', followingError);
      } else {
        const transformedFollowing = (followingData || []).map((item: any) => ({
          id: item.id,
          user_id: item.creator?.user_id || item.creator_id,
          display_name: item.creator?.display_name || 'Unknown',
          username: item.creator?.username,
          profile_image_url: item.creator?.profile_image_url,
          bio: item.creator?.bio,
          is_creator: true,
          subject: item.creator?.subject,
          content_count: item.creator?.total_content_count,
          subscriber_count: item.creator?.total_subscribers,
          is_notified: item.is_notified,
        }));
        setFollowing(transformedFollowing);
      }

      // Load followers (if user is a creator)
      const { data: followerData } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          subscriber_id,
          subscriber:profiles(
            id,
            nickname,
            username,
            avatar_url,
            bio
          )
        `)
        .eq('creator_id', user.id);

      if (followerData) {
        const transformedFollowers = followerData.map((item: any) => ({
          id: item.id,
          user_id: item.subscriber?.id || item.subscriber_id,
          display_name: item.subscriber?.nickname || 'Unknown',
          username: item.subscriber?.username,
          profile_image_url: item.subscriber?.avatar_url,
          bio: item.subscriber?.bio,
          is_creator: false,
          is_notified: false,
        }));
        setFollowers(transformedFollowers);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async (id: string) => {
    setUnfollowingId(id);
    try {
      const supabase = createClient();
      await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', id);

      setFollowing(prev => prev.filter(u => u.id !== id));
    } catch (error) {
      console.error('Failed to unfollow:', error);
    } finally {
      setUnfollowingId(null);
    }
  };

  const handleToggleNotification = async (id: string, notify: boolean) => {
    try {
      const supabase = createClient();
      await supabase
        .from('user_subscriptions')
        .update({ is_notified: notify })
        .eq('id', id);

      setFollowing(prev =>
        prev.map(u => u.id === id ? { ...u, is_notified: notify } : u)
      );
    } catch (error) {
      console.error('Failed to toggle notification:', error);
    }
  };

  const currentList = activeTab === 'following' ? following : followers;
  const filteredList = currentList.filter((user) =>
    user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      className="min-h-screen bg-white"
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
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">팔로우 관리</h1>
                <p className="text-sm text-gray-500">
                  {following.length}명 팔로잉 · {followers.length}명 팔로워
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:bg-white transition-all"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'following' | 'followers')}>
            <TabsList className="w-full bg-gray-100 p-1 rounded-xl">
              <TabsTrigger value="following" className="flex-1 rounded-lg">
                팔로잉 {following.length}
              </TabsTrigger>
              <TabsTrigger value="followers" className="flex-1 rounded-lg">
                팔로워 {followers.length}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </motion.header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filteredList.length === 0 ? (
          <EmptyState type={activeTab} />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredList.map((user) => (
                <FollowCard
                  key={user.id}
                  user={user}
                  onUnfollow={handleUnfollow}
                  onToggleNotification={handleToggleNotification}
                  isUnfollowing={unfollowingId === user.id}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </motion.div>
  );
}
