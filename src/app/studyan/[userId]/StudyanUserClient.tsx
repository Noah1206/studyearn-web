'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowLeft,
  Calendar,
  Copy,
  Check,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button, Badge, Avatar, Card, CardContent } from '@/components/ui';
import { LoadingPage } from '@/components/ui/Spinner';
import { FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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

interface UserProfile {
  id: string;
  nickname?: string;
  avatar_url?: string;
  bio?: string;
  follower_count: number;
  following_count: number;
  total_study_minutes?: number;
  streak_days?: number;
  routines: UserRoutine[];
  isFollowing: boolean;
}

interface StudyanUserClientProps {
  userId: string;
  serverAvatar: string | null;
  serverNickname: string | null;
  serverBio: string | null;
}

const ROUTINE_TYPE_LABELS: Record<string, string> = {
  day: '하루',
  week: '일주일',
  month: '한 달',
  custom: '커스텀',
};

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

function formatTime(hour: number): string {
  if (hour === 24) return '24:00';
  return `${hour.toString().padStart(2, '0')}:00`;
}

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function StudyanUserClient({ userId, serverAvatar, serverNickname, serverBio }: StudyanUserClientProps) {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [copiedRoutineId, setCopiedRoutineId] = useState<string | null>(null);
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);
  const [userContents, setUserContents] = useState<any[]>([]);

  useEffect(() => {
    loadCurrentUser();
    loadUserProfile();
    loadUserContents();
  }, [userId]);

  const loadCurrentUser = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, nickname, username, avatar_url, bio, follower_count, following_count, total_study_minutes, streak_days')
        .eq('id', userId)
        .maybeSingle();

      if (profileError || !profile) {
        setIsLoading(false);
        router.replace('/studyan');
        return;
      }

      // Get user's public routines
      const { data: routines } = await supabase
        .from('routines')
        .select('id, title, routine_type, routine_days, routine_items, created_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      // Check follow status via user_subscriptions
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      let isFollowingUser = false;

      if (currentUser) {
        const { data: followData } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('subscriber_id', currentUser.id)
          .eq('creator_id', userId)
          .maybeSingle();

        isFollowingUser = !!followData;
      }

      // Use server-resolved data with client fallbacks
      const nickname = serverNickname
        || (profile.nickname?.includes('@') ? (profile.username || profile.nickname.split('@')[0]) : profile.nickname)
        || profile.username
        || '익명 사용자';

      setUser({
        id: profile.id,
        nickname,
        avatar_url: serverAvatar || profile.avatar_url || null,
        bio: serverBio || profile.bio || null,
        follower_count: profile.follower_count || 0,
        following_count: profile.following_count || 0,
        total_study_minutes: profile.total_study_minutes || 0,
        streak_days: profile.streak_days || 0,
        routines: (routines || []).map((r: any) => ({
          id: r.id,
          title: r.title,
          routine_type: r.routine_type,
          routine_days: r.routine_days,
          routine_items: r.routine_items || [],
          created_at: r.created_at,
        })),
        isFollowing: isFollowingUser,
      });
      setIsFollowing(isFollowingUser);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      router.replace('/studyan');
    }
  };

  const loadUserContents = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        const contents = (data.products || []).filter((p: any) => p.creator_id === userId);
        setUserContents(contents);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUserId) {
      router.push('/login');
      return;
    }
    if (currentUserId === userId) return;

    // 낙관적 업데이트: 즉시 UI 반영
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setUser(prev => prev ? {
      ...prev,
      follower_count: wasFollowing ? Math.max(0, prev.follower_count - 1) : prev.follower_count + 1,
      isFollowing: !wasFollowing,
    } : null);

    try {
      const res = await fetch('/api/follow', {
        method: wasFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_id: userId }),
      });

      if (!res.ok) throw new Error('Failed');
    } catch (error) {
      // 실패 시 롤백
      console.error('Failed to toggle follow:', error);
      setIsFollowing(wasFollowing);
      setUser(prev => prev ? {
        ...prev,
        follower_count: wasFollowing ? prev.follower_count + 1 : Math.max(0, prev.follower_count - 1),
        isFollowing: wasFollowing,
      } : null);
    }
  };

  const handleCopyRoutine = async (routine: UserRoutine) => {
    if (!currentUserId) {
      router.push('/login');
      return;
    }

    try {
      const supabase = createClient();

      await supabase
        .from('routines')
        .insert({
          user_id: currentUserId,
          title: `${routine.title} (${user?.nickname || '익명'}님 루틴)`,
          routine_type: routine.routine_type,
          routine_days: routine.routine_days,
          routine_items: routine.routine_items,
          is_active: true,
          is_public: false,
        });

      setCopiedRoutineId(routine.id);
      setTimeout(() => setCopiedRoutineId(null), 3000);
    } catch (error) {
      console.error('Failed to copy routine:', error);
    }
  };

  const isOwnProfile = currentUserId === userId;

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!user) {
    return null;
  }

  return (
    <motion.div
      className="min-h-screen bg-white"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* Header */}
      <div className="bg-white sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="font-semibold text-gray-900">스터디언 프로필</h1>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Section */}
        <div className="mb-8">
          <div className="flex flex-col items-center text-center mb-5">
            <div className="mb-3">
              <Avatar
                src={user.avatar_url || undefined}
                alt={user.nickname || '사용자'}
                size="lg"
                className="w-20 h-20 text-2xl"
              />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">
                {user.nickname || '익명 사용자'}
              </h2>
              {isOwnProfile && (
                <Badge className="bg-orange-50 text-orange-500 border-0 text-xs">
                  나
                </Badge>
              )}
            </div>
            {user.bio && (
              <p className="text-sm text-gray-500 mt-1 max-w-xs">{user.bio}</p>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-8 mb-5">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{userContents.length}</p>
              <p className="text-xs text-gray-500">콘텐츠</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{user.routines.length}</p>
              <p className="text-xs text-gray-500">루틴</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{user.follower_count}</p>
              <p className="text-xs text-gray-500">팔로워</p>
            </div>
          </div>

          {/* Follow Button */}
          {currentUserId && !isOwnProfile && (
            <button
              onClick={handleToggleFollow}
              disabled={followLoading}
              className={`w-full py-2.5 text-sm font-medium rounded transition-all ${
                isFollowing
                  ? 'bg-white text-gray-700 border border-gray-300 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {followLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : isFollowing ? (
                '팔로잉 중'
              ) : (
                '팔로우'
              )}
            </button>
          )}
        </div>

        {/* Contents Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500">콘텐츠</h3>
            <span className="text-sm text-gray-400">{userContents.length}개</span>
          </div>

          {userContents.length === 0 ? (
            <Card className="border-0 shadow-none bg-gray-50 rounded-xl">
              <CardContent className="py-10 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">아직 등록된 콘텐츠가 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {userContents.map((item: any) => (
                <Link key={item.id} href={`/content/${item.id}`} className="group">
                  <div className="aspect-[4/3] rounded-sm overflow-hidden bg-gray-100 mb-2">
                    {item.thumbnail_url ? (
                      <Image
                        src={item.thumbnail_url}
                        alt={item.title}
                        width={300}
                        height={225}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <FileText className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-orange-500 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.price === 0 ? '무료' : formatCurrency(item.price)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Routines Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500">공개 루틴</h3>
            <span className="text-sm text-gray-400">{user.routines.length}개</span>
          </div>

          {user.routines.length === 0 ? (
            <Card className="border-0 shadow-none bg-gray-50 rounded-xl">
              <CardContent className="py-10 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">아직 공개된 루틴이 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {user.routines.map((routine) => (
                <Card key={routine.id} className="border-0 shadow-none bg-gray-50 overflow-hidden rounded-xl">
                  <CardContent className="p-0">
                    <button
                      onClick={() => setExpandedRoutineId(
                        expandedRoutineId === routine.id ? null : routine.id
                      )}
                      className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-gray-900 truncate mb-2">
                          {routine.title}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                            {ROUTINE_TYPE_LABELS[routine.routine_type]}
                            {routine.routine_type === 'custom' && routine.routine_days && ` ${routine.routine_days}일`}
                          </span>
                          <span className="text-sm text-gray-500">
                            {routine.routine_items.length}개 일정
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyRoutine(routine);
                          }}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                            copiedRoutineId === routine.id
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-900 text-white hover:bg-gray-800'
                          }`}
                        >
                          {copiedRoutineId === routine.id ? (
                            <>
                              <Check className="w-4 h-4" />
                              복사됨
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              복사
                            </>
                          )}
                        </button>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                          expandedRoutineId === routine.id ? 'rotate-180' : ''
                        }`} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedRoutineId === routine.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-gray-50">
                            <div className="grid grid-cols-7 gap-1 mb-4">
                              {DAYS.map((day, idx) => {
                                const dayItems = routine.routine_items.filter(item => item.day === idx);
                                const hasItems = dayItems.length > 0;
                                return (
                                  <div key={day} className="text-center">
                                    <div className={`text-xs font-medium mb-1 ${
                                      hasItems ? 'text-orange-600' : 'text-gray-400'
                                    }`}>
                                      {day}
                                    </div>
                                    <div className={`h-2 rounded-full ${
                                      hasItems ? 'bg-orange-500' : 'bg-gray-200'
                                    }`} />
                                  </div>
                                );
                              })}
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {routine.routine_items
                                .sort((a, b) => a.day - b.day || a.startTime - b.startTime)
                                .map((item, idx) => {
                                  const color = COLORS[item.color] || COLORS.blue;
                                  return (
                                    <div
                                      key={item.id || idx}
                                      className={`flex items-center gap-3 p-2 rounded-lg ${color.bg} ${color.border} border`}
                                    >
                                      <div className={`text-xs font-medium ${color.text} w-6`}>
                                        {DAYS[item.day]}
                                      </div>
                                      <div className={`text-xs ${color.text}`}>
                                        {formatTime(item.startTime)} - {formatTime(item.endTime)}
                                      </div>
                                      <div className={`flex-1 text-sm font-medium ${color.text} truncate`}>
                                        {item.title}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Toast */}
      <AnimatePresence>
        {copiedRoutineId && (
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
