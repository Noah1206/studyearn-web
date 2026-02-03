'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  Search,
  Users,
  Calendar,
  Clock,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Sparkles,
  User,
  UserPlus,
  UserMinus,
  Loader2,
  Flame,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Badge, Avatar, Card, CardContent, Skeleton } from '@/components/ui';

interface RoutineItem {
  id: string;
  day: number;
  startTime: number;
  endTime: number;
  title: string;
  color: string;
}

interface UserRoutine {
  id: string;
  title: string;
  routine_type: 'day' | 'week' | 'month' | 'custom';
  routine_days?: number;
  routine_items: RoutineItem[];
  created_at: string;
}

interface StudyanUser {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  routines: UserRoutine[];
  isFollowing?: boolean;
  follower_count?: number;
  streak_days?: number;
  total_study_minutes?: number;
}

// Character avatars for users without profile pictures
const CHARACTER_AVATARS = [
  { gradient: 'from-green-300 to-green-500', emoji: '🌿' },
  { gradient: 'from-yellow-300 to-yellow-500', emoji: '🌻' },
  { gradient: 'from-pink-300 to-pink-500', emoji: '🐰' },
  { gradient: 'from-orange-200 to-orange-400', emoji: '☁️' },
  { gradient: 'from-cyan-300 to-cyan-500', emoji: '💧' },
  { gradient: 'from-purple-300 to-purple-500', emoji: '🔮' },
  { gradient: 'from-orange-300 to-orange-500', emoji: '🍊' },
  { gradient: 'from-red-300 to-red-500', emoji: '🌸' },
];

function getCharacterAvatar(userId: string) {
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return CHARACTER_AVATARS[Math.abs(hash) % CHARACTER_AVATARS.length];
}

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

// Color mapping
const COLORS: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
};

const ROUTINE_TYPE_LABELS: Record<string, string> = {
  day: '하루',
  week: '일주일',
  month: '한 달',
  custom: '커스텀',
};

function formatTime(hour: number): string {
  if (hour === 24) return '24:00';
  return `${hour.toString().padStart(2, '0')}:00`;
}

function UserCard({ user, onCopyRoutine, copiedRoutineId, onToggleFollow, followingUserId, currentUserId }: {
  user: StudyanUser;
  onCopyRoutine: (routine: UserRoutine, userName: string) => void;
  copiedRoutineId: string | null;
  onToggleFollow: (userId: string, isFollowing: boolean) => void;
  followingUserId: string | null;
  currentUserId: string | null;
}) {
  const isOwnProfile = currentUserId === user.id;
  const characterAvatar = getCharacterAvatar(user.id);

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, transition: { duration: 0.15, ease: "easeOut" } }}
      className="relative"
    >
      {/* Follow Button - Link 바깥에 배치 */}
      {currentUserId && !isOwnProfile && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFollow(user.id, !!user.isFollowing);
            }}
            disabled={followingUserId === user.id}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
              user.isFollowing
                ? 'bg-white text-gray-700 border border-gray-300 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {followingUserId === user.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : user.isFollowing ? (
              <>
                <User className="w-4 h-4" />
                팔로잉
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                팔로우
              </>
            )}
          </button>
        </div>
      )}
      {isOwnProfile && (
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-orange-50 text-orange-600 border-orange-200">
            나
          </Badge>
        </div>
      )}

      <Link href={`/studyan/${user.id}`}>
        <Card className="h-full overflow-hidden transition-all duration-200 cursor-pointer group hover:shadow-md">
          <CardContent className="pt-4 pb-4 px-4 relative">
            {/* Avatar */}
            <div className="flex items-start justify-between mb-4">
              {user.avatar_url ? (
                <Avatar
                  src={user.avatar_url}
                  alt={user.display_name || '사용자'}
                  size="lg"
                  className="w-14 h-14 ring-2 ring-gray-100"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-400">
                  {user.display_name?.charAt(0) || '?'}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="mb-3">
              <h3 className="font-bold text-gray-900 truncate text-lg">
                {user.display_name || '익명 사용자'}
              </h3>
              {user.bio && (
                <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{user.bio}</p>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1 text-gray-500">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{user.routines.length}개 루틴</span>
              </div>
              {user.follower_count !== undefined && user.follower_count > 0 && (
                <div className="flex items-center gap-1 text-gray-500">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{user.follower_count}</span>
                </div>
              )}
              {user.streak_days !== undefined && user.streak_days > 0 && (
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-medium">{user.streak_days}일</span>
                </div>
              )}
            </div>

            {/* Routines Preview - just show tags */}
            {user.routines.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {user.routines.slice(0, 3).map((routine) => (
                  <Badge
                    key={routine.id}
                    variant="outline"
                    className="text-xs bg-gray-50 border-gray-200 truncate max-w-[120px]"
                  >
                    {routine.title}
                  </Badge>
                ))}
                {user.routines.length > 3 && (
                  <Badge variant="outline" className="text-xs bg-gray-50 border-gray-200">
                    +{user.routines.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {user.routines.length === 0 && (
              <p className="text-sm text-gray-400">아직 공개 루틴이 없습니다</p>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function UserSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <Skeleton className="w-14 h-14 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <div className="flex gap-4 pt-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudyanPage() {
  const router = useRouter();
  const [users, setUsers] = useState<StudyanUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedRoutineId, setCopiedRoutineId] = useState<string | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [followingUserId, setFollowingUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (retry = 0) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/studyan/users', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();

      if (data.currentUserId) {
        setCurrentUser({ id: data.currentUserId });
      }

      const usersData: StudyanUser[] = (data.users || []).map((u: any) => ({
        ...u,
        avatar_url: u.avatar_url || undefined,
        bio: u.bio || undefined,
      }));

      // Build followingIds from server response
      const fIds = new Set<string>();
      usersData.forEach(u => { if (u.isFollowing) fIds.add(u.id); });
      setFollowingIds(fIds);

      setUsers(usersData);
      setError(null);
      setRetryCount(0);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load users:', err);

      if (retry < MAX_RETRIES) {
        setRetryCount(retry + 1);
        setTimeout(() => loadUsers(retry + 1), 1500);
        return;
      }

      setError('데이터를 불러오지 못했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.');
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    loadUsers(0);
  };

  const copyRoutineToMyProfile = async (routine: UserRoutine, userName: string) => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    try {
      const supabase = createClient();

      // Create a copy of the routine for the current user
      const { error } = await supabase
        .from('routines')
        .insert({
          user_id: currentUser.id,
          title: `${routine.title} (${userName}님 루틴 복사)`,
          routine_type: routine.routine_type,
          routine_days: routine.routine_days,
          routine_items: routine.routine_items,
          is_active: true,
        });

      if (error) throw error;

      setCopiedRoutineId(routine.id);
      setShowCopyToast(true);

      setTimeout(() => {
        setCopiedRoutineId(null);
        setShowCopyToast(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to copy routine:', error);
      alert('루틴 복사에 실패했습니다.');
    }
  };

  const toggleFollow = async (userId: string, isCurrentlyFollowing: boolean) => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // 낙관적 업데이트: API 응답 전에 즉시 UI 반영
    if (isCurrentlyFollowing) {
      setFollowingIds(prev => { const next = new Set(prev); next.delete(userId); return next; });
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, isFollowing: false, follower_count: Math.max(0, (u.follower_count || 0) - 1) } : u
      ));
    } else {
      setFollowingIds(prev => { const next = new Set(prev); next.add(userId); return next; });
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, isFollowing: true, follower_count: (u.follower_count || 0) + 1 } : u
      ));
    }

    try {
      const res = await fetch('/api/follow', {
        method: isCurrentlyFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_id: userId }),
      });

      if (!res.ok) throw new Error('Failed');
    } catch (error) {
      // 실패 시 롤백
      console.error('Failed to toggle follow:', error);
      if (isCurrentlyFollowing) {
        setFollowingIds(prev => { const next = new Set(prev); next.add(userId); return next; });
        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, isFollowing: true, follower_count: (u.follower_count || 0) + 1 } : u
        ));
      } else {
        setFollowingIds(prev => { const next = new Set(prev); next.delete(userId); return next; });
        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, isFollowing: false, follower_count: Math.max(0, (u.follower_count || 0) - 1) } : u
        ));
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.routines.some(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div
      className="min-h-screen bg-white"
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
              <Users className="w-3.5 h-3.5 mr-1.5" />
              스터디언 커뮤니티
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              다른 사람들의 루틴을<br />참고해보세요
            </h1>
            <p className="text-white/80 text-base md:text-lg max-w-md">
              다양한 스터디언들의 학습 루틴을 살펴보고, 마음에 드는 루틴을 복사해서 사용해보세요.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Search Section */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="사용자 또는 루틴 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div>
            {retryCount > 0 && (
              <div className="text-center mb-4 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                재시도 중... ({retryCount}/{MAX_RETRIES})
              </div>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <UserSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              데이터를 불러오지 못했습니다
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {error}
            </p>
            <Button onClick={handleRetry} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </Button>
          </motion.div>
        ) : filteredUsers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? '검색 결과가 없습니다' : '아직 가입한 유저가 없습니다'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? '다른 검색어를 입력해보세요' : '첫 번째 스터디언이 되어보세요!'}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                검색 초기화
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onCopyRoutine={copyRoutineToMyProfile}
                copiedRoutineId={copiedRoutineId}
                onToggleFollow={toggleFollow}
                followingUserId={followingUserId}
                currentUserId={currentUser?.id || null}
              />
            ))}
          </motion.div>
        )}

        {/* CTA Section */}
        {!isLoading && currentUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-center"
          >
            <h2 className="text-xl font-bold text-white mb-2">
              나만의 루틴을 공유해보세요
            </h2>
            <p className="text-gray-400 mb-6">
              다른 스터디언들과 함께 성장하세요
            </p>
            <Link href="/profile">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                <Calendar className="w-4 h-4" />
                내 프로필에서 루틴 만들기
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        )}
      </main>

      {/* Copy Toast */}
      <AnimatePresence>
        {showCopyToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-sm">루틴이 내 프로필에 복사되었습니다</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
