'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Target,
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

// Character avatars for users without profile pictures
const CHARACTER_AVATARS = [
  { gradient: 'from-green-300 to-green-500', emoji: '🌿' },
  { gradient: 'from-yellow-300 to-yellow-500', emoji: '🌻' },
  { gradient: 'from-pink-300 to-pink-500', emoji: '🐰' },
  { gradient: 'from-blue-200 to-blue-400', emoji: '☁️' },
  { gradient: 'from-cyan-300 to-cyan-500', emoji: '💧' },
  { gradient: 'from-purple-300 to-purple-500', emoji: '🔮' },
  { gradient: 'from-orange-300 to-orange-500', emoji: '🍊' },
  { gradient: 'from-red-300 to-red-500', emoji: '🌸' },
];

const ROUTINE_TYPE_LABELS: Record<string, string> = {
  day: '하루',
  week: '일주일',
  month: '한 달',
  custom: '커스텀',
};

const COLORS: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
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

function formatStudyTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
}

function getCharacterAvatar(userId: string) {
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return CHARACTER_AVATARS[Math.abs(hash) % CHARACTER_AVATARS.length];
}

// Days of the week
const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function StudyanUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [copiedRoutineId, setCopiedRoutineId] = useState<string | null>(null);
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUser();
    loadUserProfile();
  }, [userId]);

  const loadCurrentUser = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url, follower_count, following_count, total_study_minutes, streak_days')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        router.push('/studyan');
        return;
      }

      // Get user's public routines
      const { data: routines, error: routinesError } = await supabase
        .from('routines')
        .select('id, title, routine_type, routine_days, routine_items, created_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      // Check if current user follows this user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      let isFollowingUser = false;

      if (currentUser) {
        const { data: followData } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId)
          .single();

        isFollowingUser = !!followData;
      }

      setUser({
        id: profile.id,
        nickname: profile.nickname,
        avatar_url: profile.avatar_url,
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
    } catch (error) {
      console.error('Failed to load user profile:', error);
      router.push('/studyan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUserId) {
      router.push('/login');
      return;
    }

    if (currentUserId === userId) return;

    setFollowLoading(true);
    try {
      const supabase = createClient();

      if (isFollowing) {
        // Unfollow
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', userId);

        setIsFollowing(false);
        setUser(prev => prev ? {
          ...prev,
          follower_count: Math.max(0, prev.follower_count - 1),
          isFollowing: false,
        } : null);
      } else {
        // Follow
        await supabase
          .from('user_follows')
          .insert({
            follower_id: currentUserId,
            following_id: userId,
          });

        setIsFollowing(true);
        setUser(prev => prev ? {
          ...prev,
          follower_count: prev.follower_count + 1,
          isFollowing: true,
        } : null);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setFollowLoading(false);
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

  const characterAvatar = user ? getCharacterAvatar(user.id) : CHARACTER_AVATARS[0];
  const isOwnProfile = currentUserId === userId;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return null;
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
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
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
        {/* Profile Card - Minimal Style */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4 mb-6">
              {/* Avatar */}
              {user.avatar_url ? (
                <Avatar
                  src={user.avatar_url}
                  alt={user.nickname || '사용자'}
                  size="lg"
                  className="w-16 h-16"
                />
              ) : (
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${characterAvatar.gradient} flex items-center justify-center text-2xl flex-shrink-0`}>
                  {characterAvatar.emoji}
                </div>
              )}

              {/* Name & Bio */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {user.nickname || '익명 사용자'}
                  </h2>
                  {isOwnProfile && (
                    <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">
                      나
                    </Badge>
                  )}
                </div>
                {user.bio && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{user.bio}</p>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-around py-4 border-y border-gray-100">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{user.routines.length}</p>
                <p className="text-xs text-gray-500 mt-0.5">루틴</p>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">{user.follower_count}</p>
                <p className="text-xs text-gray-500 mt-0.5">팔로워</p>
              </div>
            </div>

            {/* Follow Button */}
            {currentUserId && !isOwnProfile && (
              <button
                onClick={handleToggleFollow}
                disabled={followLoading}
                className={`w-full mt-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  isFollowing
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
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
          </CardContent>
        </Card>

        {/* Routines Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500">공개 루틴</h3>
            <span className="text-sm text-gray-400">{user.routines.length}개</span>
          </div>

          {user.routines.length === 0 ? (
            <Card className="border-0 shadow-sm">
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
                <Card key={routine.id} className="border border-gray-200 shadow-md overflow-hidden">
                  <CardContent className="p-0">
                    {/* Routine Header */}
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

                    {/* Routine Details */}
                    <AnimatePresence>
                      {expandedRoutineId === routine.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-gray-100"
                        >
                          <div className="p-4 bg-gray-50">
                            {/* Weekly View */}
                            <div className="grid grid-cols-7 gap-1 mb-4">
                              {DAYS.map((day, idx) => {
                                const dayItems = routine.routine_items.filter(item => item.day === idx);
                                const hasItems = dayItems.length > 0;
                                return (
                                  <div key={day} className="text-center">
                                    <div className={`text-xs font-medium mb-1 ${
                                      hasItems ? 'text-blue-600' : 'text-gray-400'
                                    }`}>
                                      {day}
                                    </div>
                                    <div className={`h-2 rounded-full ${
                                      hasItems ? 'bg-blue-500' : 'bg-gray-200'
                                    }`} />
                                  </div>
                                );
                              })}
                            </div>

                            {/* Items List */}
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
