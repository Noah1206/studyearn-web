'use client';

import { useState, useEffect } from 'react';
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
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
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

function UserCard({ user, onCopyRoutine, copiedRoutineId }: {
  user: StudyanUser;
  onCopyRoutine: (routine: UserRoutine, userName: string) => void;
  copiedRoutineId: string | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-blue-200">
        <CardContent className="p-6">
          {/* Profile Section */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              <Avatar
                src={user.avatar_url}
                alt={user.display_name || '사용자'}
                size="lg"
                className="ring-2 ring-gray-100"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900 truncate">
                  {user.display_name || '익명 사용자'}
                </h3>
              </div>
              {user.bio && (
                <p className="text-sm text-gray-500 line-clamp-1">{user.bio}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">{user.routines.length}개 루틴</span>
            </div>
          </div>

          {/* Routines Preview */}
          {user.routines.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="text-sm font-medium text-gray-700">루틴 목록</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-2">
                      {user.routines.map((routine) => (
                        <div
                          key={routine.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate text-sm">
                              {routine.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {ROUTINE_TYPE_LABELS[routine.routine_type]}
                                {routine.routine_type === 'custom' && routine.routine_days && ` (${routine.routine_days}일)`}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {routine.routine_items.length}개 일정
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCopyRoutine(routine, user.display_name || '익명 사용자');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            {copiedRoutineId === routine.id ? (
                              <>
                                <Check className="w-4 h-4 text-green-500" />
                                <span className="text-green-600">복사됨</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>복사</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function UserSkeleton() {
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

export default function StudyanPage() {
  const [users, setUsers] = useState<StudyanUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedRoutineId, setCopiedRoutineId] = useState<string | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    loadUsersWithRoutines();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser({ id: user.id });
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadUsersWithRoutines = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      // Get all public routines with user info
      const { data: routinesData, error: routinesError } = await supabase
        .from('routines')
        .select(`
          id,
          user_id,
          title,
          routine_type,
          routine_days,
          routine_items,
          created_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (routinesError) throw routinesError;

      // Get unique user IDs
      const userIds = Array.from(new Set((routinesData || []).map((r: { user_id: string }) => r.user_id)));

      // Get profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, bio')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine data
      const usersMap = new Map<string, StudyanUser>();

      (profilesData || []).forEach((profile: { id: string; display_name?: string; avatar_url?: string; bio?: string }) => {
        usersMap.set(profile.id, {
          id: profile.id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          routines: [],
        });
      });

      (routinesData || []).forEach((routine: { id: string; user_id: string; title: string; routine_type: 'day' | 'week' | 'month' | 'custom'; routine_days?: number; routine_items: RoutineItem[]; created_at: string }) => {
        const user = usersMap.get(routine.user_id);
        if (user) {
          user.routines.push({
            id: routine.id,
            title: routine.title,
            routine_type: routine.routine_type,
            routine_days: routine.routine_days,
            routine_items: routine.routine_items || [],
            created_at: routine.created_at,
          });
        }
      });

      setUsers(Array.from(usersMap.values()).filter(u => u.routines.length > 0));
    } catch (error) {
      console.error('Failed to load users with routines:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyRoutineToMyProfile = async (routine: UserRoutine, userName: string) => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
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

  const filteredUsers = users.filter(user =>
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.routines.some(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
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
        className="bg-gradient-to-br from-blue-500 via-blue-600 to-gray-900 text-white"
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
              className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <UserSkeleton key={i} />
            ))}
          </div>
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
              {searchQuery ? '검색 결과가 없습니다' : '아직 공개된 루틴이 없습니다'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? '다른 검색어를 입력해보세요' : '첫 번째로 루틴을 공유해보세요!'}
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
              <Button className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
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
