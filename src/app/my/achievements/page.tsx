'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Trophy,
  Flame,
  Star,
  Target,
  BookOpen,
  Clock,
  Medal,
  Award,
  Zap,
  TrendingUp,
  Calendar,
  Lock,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, Badge, Tabs, TabsList, TabsTrigger } from '@/components/ui';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'streak' | 'social' | 'creator';
  is_unlocked: boolean;
  unlocked_at?: string;
  progress?: number;
  max_progress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_study_days: number;
  weekly_activity: boolean[];
  monthly_activity: Record<string, boolean>;
}

const ICON_MAP: Record<string, React.ElementType> = {
  flame: Flame,
  star: Star,
  target: Target,
  book: BookOpen,
  clock: Clock,
  medal: Medal,
  award: Award,
  zap: Zap,
  trending: TrendingUp,
  trophy: Trophy,
};

const RARITY_COLORS = {
  common: 'bg-gray-100 text-gray-600 border-gray-200',
  rare: 'bg-blue-100 text-blue-600 border-blue-200',
  epic: 'bg-purple-100 text-purple-600 border-purple-200',
  legendary: 'bg-orange-100 text-orange-600 border-orange-200',
};

const RARITY_LABELS = {
  common: '일반',
  rare: '레어',
  epic: '에픽',
  legendary: '전설',
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
};

function StreakCard({ streak }: { streak: StreakData }) {
  const today = new Date();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <motion.div variants={itemVariants}>
      <Card className="border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Flame className="w-8 h-8" />
              </div>
              <div>
                <p className="text-white/80 text-sm">현재 스트릭</p>
                <p className="text-3xl font-bold">{streak.current_streak}일</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">최장 기록</p>
              <p className="text-2xl font-bold">{streak.longest_streak}일</p>
            </div>
          </div>

          {/* Weekly Activity */}
          <div className="flex justify-between mt-4">
            {streak.weekly_activity.map((active, index) => {
              const dayIndex = (today.getDay() - 6 + index + 7) % 7;
              return (
                <div key={index} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-white/60">{dayNames[dayIndex]}</span>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      active ? 'bg-white text-orange-500' : 'bg-white/20'
                    }`}
                  >
                    {active && <CheckCircle2 className="w-5 h-5" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex justify-between text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{streak.total_study_days}</p>
              <p className="text-sm text-gray-500">총 학습일</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((streak.weekly_activity.filter(Boolean).length / 7) * 100)}%
              </p>
              <p className="text-sm text-gray-500">이번 주 달성률</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{streak.current_streak * 10}</p>
              <p className="text-sm text-gray-500">보너스 포인트</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const Icon = ICON_MAP[achievement.icon] || Trophy;

  return (
    <motion.div variants={itemVariants}>
      <Card
        className={`border-gray-100 transition-all duration-300 ${
          achievement.is_unlocked
            ? 'hover:shadow-md hover:border-orange-200'
            : 'opacity-60'
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                achievement.is_unlocked
                  ? 'bg-orange-100'
                  : 'bg-gray-100'
              }`}
            >
              {achievement.is_unlocked ? (
                <Icon className="w-7 h-7 text-orange-500" />
              ) : (
                <Lock className="w-7 h-7 text-gray-400" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-semibold ${achievement.is_unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                  {achievement.title}
                </h3>
                <Badge className={`text-xs ${RARITY_COLORS[achievement.rarity]}`}>
                  {RARITY_LABELS[achievement.rarity]}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mb-2">{achievement.description}</p>

              {/* Progress */}
              {!achievement.is_unlocked && achievement.progress !== undefined && achievement.max_progress && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>진행도</span>
                    <span>{achievement.progress}/{achievement.max_progress}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(achievement.progress / achievement.max_progress) * 100}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full bg-orange-500 rounded-full"
                    />
                  </div>
                </div>
              )}

              {/* Unlocked date */}
              {achievement.is_unlocked && achievement.unlocked_at && (
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(achievement.unlocked_at).toLocaleDateString('ko-KR')} 달성
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AchievementsPage() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Try to load streak data
      const { data: streakData, error: streakError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (streakError) {
        // Mock streak data
        setStreak({
          current_streak: 7,
          longest_streak: 15,
          total_study_days: 45,
          weekly_activity: [true, true, true, false, true, true, true],
          monthly_activity: {},
        });
      } else {
        setStreak(streakData);
      }

      // Mock achievements
      setAchievements([
        {
          id: '1',
          title: '첫 발걸음',
          description: '첫 번째 콘텐츠를 시청했습니다',
          icon: 'star',
          category: 'learning',
          is_unlocked: true,
          unlocked_at: new Date(Date.now() - 86400000 * 30).toISOString(),
          rarity: 'common',
        },
        {
          id: '2',
          title: '꾸준한 학습자',
          description: '7일 연속 학습 달성',
          icon: 'flame',
          category: 'streak',
          is_unlocked: true,
          unlocked_at: new Date().toISOString(),
          rarity: 'rare',
        },
        {
          id: '3',
          title: '학습 마스터',
          description: '30일 연속 학습 달성',
          icon: 'trophy',
          category: 'streak',
          is_unlocked: false,
          progress: 7,
          max_progress: 30,
          rarity: 'epic',
        },
        {
          id: '4',
          title: '소셜 버터플라이',
          description: '10명의 크리에이터를 팔로우',
          icon: 'trending',
          category: 'social',
          is_unlocked: true,
          unlocked_at: new Date(Date.now() - 86400000 * 7).toISOString(),
          rarity: 'common',
        },
        {
          id: '5',
          title: '지식 탐험가',
          description: '50개의 콘텐츠 시청',
          icon: 'book',
          category: 'learning',
          is_unlocked: false,
          progress: 23,
          max_progress: 50,
          rarity: 'rare',
        },
        {
          id: '6',
          title: '전설의 학습자',
          description: '100일 연속 학습 달성',
          icon: 'award',
          category: 'streak',
          is_unlocked: false,
          progress: 7,
          max_progress: 100,
          rarity: 'legendary',
        },
        {
          id: '7',
          title: '퀴즈 천재',
          description: '퀴즈 10회 만점',
          icon: 'zap',
          category: 'learning',
          is_unlocked: false,
          progress: 3,
          max_progress: 10,
          rarity: 'epic',
        },
        {
          id: '8',
          title: '시간 관리자',
          description: '총 100시간 학습',
          icon: 'clock',
          category: 'learning',
          is_unlocked: false,
          progress: 45,
          max_progress: 100,
          rarity: 'rare',
        },
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAchievements = achievements.filter((achievement) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'unlocked' && achievement.is_unlocked) ||
      (activeTab === 'locked' && !achievement.is_unlocked);
    const matchesCategory = categoryFilter === 'all' || achievement.category === categoryFilter;
    return matchesTab && matchesCategory;
  });

  const unlockedCount = achievements.filter(a => a.is_unlocked).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-100 sticky top-0 z-20"
      >
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">업적 & 스트릭</h1>
                <p className="text-sm text-gray-500">
                  {unlockedCount}/{achievements.length} 달성
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Streak Card */}
        {streak && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <StreakCard streak={streak} />
          </motion.div>
        )}

        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Medal className="w-5 h-5 text-orange-500" />
                업적
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-4">
                <TabsList className="w-full bg-gray-100 p-1 rounded-xl">
                  <TabsTrigger value="all" className="flex-1 rounded-lg text-sm">
                    전체
                  </TabsTrigger>
                  <TabsTrigger value="unlocked" className="flex-1 rounded-lg text-sm">
                    달성
                  </TabsTrigger>
                  <TabsTrigger value="locked" className="flex-1 rounded-lg text-sm">
                    미달성
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                {[
                  { id: 'all', label: '전체' },
                  { id: 'streak', label: '스트릭' },
                  { id: 'learning', label: '학습' },
                  { id: 'social', label: '소셜' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      categoryFilter === cat.id
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievement List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {filteredAchievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </motion.div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">해당하는 업적이 없습니다</p>
          </div>
        )}
      </main>
    </div>
  );
}
