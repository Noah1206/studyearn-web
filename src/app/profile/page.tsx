'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  Check,
  X,
  ArrowLeft,
  Camera,
  Bookmark,
  Heart,
  Bell,
  Shield,
  Settings,
  HelpCircle,
  ChevronRight,
  Trash2,
  LogOut,
  Sparkles,
  LayoutDashboard,
  FileText,
  DollarSign,
  BarChart3,
  ArrowRightLeft,
  Calendar,
  ChevronLeft,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Avatar, Spinner } from '@/components/ui';
import { useUserStore } from '@/store/userStore';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';

// 루틴 관련 상수
const ROUTINE_TYPES = [
  { id: 'day', label: '하루', description: '시간표 형식' },
  { id: 'week', label: '일주일', description: '주간 플래너' },
  { id: 'month', label: '한 달', description: '월간 캘린더' },
  { id: 'custom', label: '직접 설정', description: 'N일 커스텀' },
];

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];
const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => i + 6); // 6시 ~ 20시

const ROUTINE_COLORS = [
  'bg-rose-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-pink-500',
];

// 루틴 아이템 인터페이스
interface RoutineItem {
  id: string;
  day: number;
  startHour?: number;
  endHour?: number;
  title: string;
  color: string;
}

// 루틴 데이터 인터페이스
interface UserRoutine {
  id: string;
  title: string;
  description?: string;
  routine_type: 'day' | 'week' | 'month' | 'custom';
  routine_days?: number;
  routine_items: RoutineItem[];
  created_at: string;
}

interface Profile {
  id: string;
  nickname: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  school?: string;
  is_creator: boolean;
}

interface StudySession {
  room_id: string;
  room_name: string;
  seat_number: number;
  status: 'studying' | 'break' | 'away';
  joined_at: string;
  current_session_minutes: number;
}

interface PurchasedContent {
  id: string;
  title: string;
  thumbnail_url?: string;
  creator_name: string;
  purchased_at: string;
  type: 'document' | 'video' | 'audio';
}

interface StudyStats {
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  totalMinutes: number;
  streak: number;
  bestStreak: number;
  joinedRooms: number;
}

// 설정 메뉴 아이템
const CONTENT_MENUS = [
  {
    id: 'saved',
    title: '저장한 콘텐츠',
    description: '나중에 볼 콘텐츠 목록',
    icon: Bookmark,
    href: '/my/saved',
  },
  {
    id: 'liked',
    title: '좋아요한 콘텐츠',
    description: '좋아요를 누른 콘텐츠 목록',
    icon: Heart,
    href: '/my/liked',
  },
];

const SETTINGS_MENUS = [
  {
    id: 'notifications',
    title: '알림 설정',
    description: '푸시 알림, 이메일 알림 설정',
    icon: Bell,
    href: '/profile/settings',
  },
  {
    id: 'privacy',
    title: '개인정보 및 보안',
    description: '비밀번호, 2단계 인증',
    icon: Shield,
    href: '/profile/settings',
  },
  {
    id: 'help',
    title: '도움말 및 지원',
    description: 'FAQ, 문의하기',
    icon: HelpCircle,
    href: '/help',
  },
];

// 크리에이터 메뉴
const CREATOR_MENUS = [
  {
    id: 'dashboard',
    title: '크리에이터 대시보드',
    description: '콘텐츠 관리 및 통계',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    id: 'contents',
    title: '내 콘텐츠',
    description: '업로드한 콘텐츠 관리',
    icon: FileText,
    href: '/dashboard/contents',
  },
  {
    id: 'earnings',
    title: '수익',
    description: '수익 현황 및 정산',
    icon: DollarSign,
    href: '/dashboard/payout',
  },
  {
    id: 'analytics',
    title: '분석',
    description: '콘텐츠 성과 분석',
    icon: BarChart3,
    href: '/dashboard/analytics',
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User Store
  const {
    userType,
    hasBeenCreator,
    isCreatorOnboarded,
    setProfile: setStoreProfile,
    setUserType,
    revertToRunner,
    switchToCreator,
    completeCreatorOnboarding,
    clearUser,
    profile: storeProfile,
  } = useUserStore();

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // 스터디 세션 상태
  const [currentStudySession, setCurrentStudySession] = useState<StudySession | null>(null);
  const [studyStats, setStudyStats] = useState<StudyStats>({
    todayMinutes: 0,
    weekMinutes: 0,
    monthMinutes: 0,
    totalMinutes: 0,
    streak: 0,
    bestStreak: 0,
    joinedRooms: 0,
  });

  // 구매한 콘텐츠
  const [purchasedContents, setPurchasedContents] = useState<PurchasedContent[]>([]);

  // 내 루틴
  const [userRoutines, setUserRoutines] = useState<UserRoutine[]>([]);
  const [selectedRoutineIndex, setSelectedRoutineIndex] = useState(0);
  const [routineMonth, setRoutineMonth] = useState(new Date().getMonth());
  const [routineYear, setRoutineYear] = useState(new Date().getFullYear());

  // 루틴 생성 상태
  const [isCreatingRoutine, setIsCreatingRoutine] = useState(false);
  const [newRoutineType, setNewRoutineType] = useState<'day' | 'week' | 'month' | 'custom'>('week');
  const [newRoutineItems, setNewRoutineItems] = useState<RoutineItem[]>([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{day: number; startHour?: number; endHour?: number;} | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemColor, setNewItemColor] = useState(ROUTINE_COLORS[0]);
  const [customDays, setCustomDays] = useState(30);
  const [newRoutineTitle, setNewRoutineTitle] = useState('');
  const [isSavingRoutine, setIsSavingRoutine] = useState(false);

  // Check if user is in creator mode
  const isCreatorMode = userType === 'creator' && isCreatorOnboarded;

  // 편집 폼 상태
  const [editNickname, setEditNickname] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSchool, setEditSchool] = useState('');

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      // 프로필 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      } else {
        setProfile(profileData);
        setEditNickname(profileData.nickname || '');
        setEditUsername(profileData.username || '');
        setEditBio(profileData.bio || '');
        setEditSchool(profileData.school || '');

        // Sync with user store
        setStoreProfile({
          id: profileData.id,
          email: user.email || '',
          nickname: profileData.nickname || '',
          username: profileData.username,
          avatar_url: profileData.avatar_url,
          bio: profileData.bio,
          school: profileData.school,
        });

        // Set user type based on is_creator flag
        if (profileData.is_creator && !userType) {
          setUserType('creator');
        } else if (!userType) {
          setUserType('runner');
        }
      }

      // 현재 스터디 세션 가져오기
      const { data: sessionData } = await supabase
        .from('study_with_me_participants')
        .select(`
          room_id,
          seat_number,
          status,
          joined_at,
          current_session_minutes,
          study_with_me_rooms!inner(name)
        `)
        .eq('user_id', user.id)
        .is('left_at', null)
        .single();

      if (sessionData) {
        setCurrentStudySession({
          room_id: sessionData.room_id,
          room_name: (sessionData.study_with_me_rooms as any)?.name || '스터디룸',
          seat_number: sessionData.seat_number,
          status: sessionData.status,
          joined_at: sessionData.joined_at,
          current_session_minutes: sessionData.current_session_minutes || 0,
        });
      }

      // 공부 통계 - 실제 데이터 가져오기
      try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // 전체 스터디 참여 기록 가져오기
        const { data: allParticipations } = await supabase
          .from('study_with_me_participants')
          .select('room_id, current_session_minutes, joined_at')
          .eq('user_id', user.id);

        type Participation = { room_id: string; current_session_minutes: number | null; joined_at: string };
        if (allParticipations && allParticipations.length > 0) {
          // 오늘 분
          const todayMinutes = allParticipations
            .filter((p: Participation) => p.joined_at >= todayStart)
            .reduce((sum: number, p: Participation) => sum + (p.current_session_minutes || 0), 0);

          // 이번 주 분
          const weekMinutes = allParticipations
            .filter((p: Participation) => p.joined_at >= weekStart)
            .reduce((sum: number, p: Participation) => sum + (p.current_session_minutes || 0), 0);

          // 이번 달 분
          const monthMinutes = allParticipations
            .filter((p: Participation) => p.joined_at >= monthStart)
            .reduce((sum: number, p: Participation) => sum + (p.current_session_minutes || 0), 0);

          // 전체 분
          const totalMinutes = allParticipations
            .reduce((sum: number, p: Participation) => sum + (p.current_session_minutes || 0), 0);

          // 고유 방 수
          const uniqueRooms = new Set(allParticipations.map((p: Participation) => p.room_id));

          // 연속 출석 계산 (최근 날짜부터 확인)
          const studyDates: string[] = Array.from(new Set<string>(allParticipations.map((p: Participation) =>
            new Date(p.joined_at).toISOString().split('T')[0]
          ))).sort((a, b) => b.localeCompare(a)); // 최신순 정렬

          let streak = 0;
          let checkDate = new Date();
          checkDate.setHours(0, 0, 0, 0);

          for (const dateStr of studyDates) {
            const studyDate = new Date(dateStr);
            studyDate.setHours(0, 0, 0, 0);

            const diffDays = Math.floor((checkDate.getTime() - studyDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 0 || diffDays === 1) {
              streak++;
              checkDate = studyDate;
            } else {
              break;
            }
          }

          // 최고 연속 출석 (전체 기간에서 계산)
          let bestStreak = 0;
          let currentStreak = 0;
          const sortedDates: string[] = Array.from(new Set<string>(allParticipations.map((p: Participation) =>
            new Date(p.joined_at).toISOString().split('T')[0]
          ))).sort();

          for (let i = 0; i < sortedDates.length; i++) {
            if (i === 0) {
              currentStreak = 1;
            } else {
              const prevDate = new Date(sortedDates[i - 1]);
              const currDate = new Date(sortedDates[i]);
              const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

              if (diffDays === 1) {
                currentStreak++;
              } else {
                currentStreak = 1;
              }
            }
            bestStreak = Math.max(bestStreak, currentStreak);
          }

          setStudyStats({
            todayMinutes,
            weekMinutes,
            monthMinutes,
            totalMinutes,
            streak,
            bestStreak,
            joinedRooms: uniqueRooms.size,
          });
        } else {
          // 참여 기록이 없으면 0으로 설정
          setStudyStats({
            todayMinutes: 0,
            weekMinutes: 0,
            monthMinutes: 0,
            totalMinutes: 0,
            streak: 0,
            bestStreak: 0,
            joinedRooms: 0,
          });
        }
      } catch (statsError) {
        console.error('Failed to fetch study stats:', statsError);
        // 에러 시 기본값 유지
      }

      // 구매한 콘텐츠 가져오기 (실제 API 호출)
      try {
        const purchaseRes = await fetch('/api/me/purchases');
        if (purchaseRes.ok) {
          const purchaseData = await purchaseRes.json();
          const mappedPurchases: PurchasedContent[] = (purchaseData.purchases || []).map((purchase: {
            id: string;
            product_id: string;
            created_at: string;
            product: {
              id: string;
              title: string;
              thumbnail_url: string | null;
              price: number;
            } | null;
          }) => ({
            id: purchase.id,
            title: purchase.product?.title || '삭제된 상품',
            thumbnail_url: purchase.product?.thumbnail_url || undefined,
            creator_name: 'StudyEarn', // TODO: products 테이블에 creator 정보 추가 필요
            purchased_at: purchase.created_at.split('T')[0],
            type: 'document' as const, // TODO: products 테이블에 type 정보 추가 필요
          }));
          setPurchasedContents(mappedPurchases);
        }
      } catch (error) {
        console.error('Failed to fetch purchases:', error);
      }

      // 내 루틴 가져오기
      try {
        const { data: routineData, error: routineError } = await supabase
          .from('contents')
          .select('id, title, description, routine_type, routine_days, routine_items, created_at')
          .eq('creator_id', user.id)
          .eq('content_type', 'routine')
          .order('created_at', { ascending: false });

        if (!routineError && routineData) {
          const mappedRoutines: UserRoutine[] = routineData.map((r: {
            id: string;
            title: string;
            description?: string;
            routine_type: string;
            routine_days?: number;
            routine_items: RoutineItem[] | null;
            created_at: string;
          }) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            routine_type: (r.routine_type || 'week') as UserRoutine['routine_type'],
            routine_days: r.routine_days,
            routine_items: r.routine_items || [],
            created_at: r.created_at,
          }));
          setUserRoutines(mappedRoutines);
        }
      } catch (error) {
        console.error('Failed to fetch routines:', error);
      }

      setIsLoading(false);
    };

    fetchUserAndProfile();
  }, [supabase, router, setStoreProfile, setUserType, userType]);

  const handleSaveProfile = async () => {
    if (!user || !supabase) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          nickname: editNickname,
          username: editUsername,
          bio: editBio,
          school: editSchool,
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        setError('프로필 저장에 실패했습니다.');
        return;
      }

      setProfile(prev => prev ? {
        ...prev,
        nickname: editNickname,
        username: editUsername,
        bio: editBio,
        school: editSchool
      } : null);
      setSuccess('프로필이 저장되었습니다.');
      setIsEditing(false);
    } catch {
      setError('프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditNickname(profile?.nickname || '');
    setEditUsername(profile?.username || '');
    setEditBio(profile?.bio || '');
    setEditSchool(profile?.school || '');
    setIsEditing(false);
    setError('');
  };

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !supabase) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // 스토리지에 업로드
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setError('이미지 업로드에 실패했습니다.');
        return;
      }

      // 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 프로필 업데이트
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) {
        setError('프로필 업데이트에 실패했습니다.');
        return;
      }

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      setSuccess('프로필 사진이 변경되었습니다.');
    } catch {
      setError('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    clearUser();
    router.push('/');
  };

  // Handle mode switching
  const handleSwitchToRunner = () => {
    revertToRunner();
    router.push('/profile');
  };

  const handleSwitchToCreator = async () => {
    // 이미 크리에이터인 경우 바로 대시보드로 이동
    if (hasBeenCreator && isCreatorOnboarded) {
      switchToCreator();
      router.push('/dashboard');
      return;
    }

    // 새로운 크리에이터: 직접 전환 (로딩 애니메이션 표시)
    if (!profile) return;

    setIsConverting(true);
    setError('');

    try {
      // Update profiles table to set is_creator = true
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_creator: true, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (profileError) {
        setError('크리에이터 전환에 실패했습니다.');
        setIsConverting(false);
        return;
      }

      // Create creator_settings record
      const { error: settingsError } = await supabase
        .from('creator_settings')
        .upsert({
          user_id: profile.id,
          display_name: profile.nickname || storeProfile?.email || '',
          bio: profile.bio || '',
          profile_image_url: profile.avatar_url || null,
          is_verified: false,
          total_subscribers: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (settingsError) {
        console.error('Creator settings error:', settingsError);
        // Not critical, continue anyway
      }

      // Update local state
      completeCreatorOnboarding({
        display_name: profile.nickname || storeProfile?.email || '',
        bio: profile.bio,
        school: profile.school,
        profile_image_url: profile.avatar_url,
        is_verified: false,
        total_subscribers: 0,
      });

      router.push('/dashboard');
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
      setIsConverting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !supabase) return;

    setIsDeleting(true);
    setError('');

    try {
      // 프로필 삭제
      await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      // 로그아웃
      await supabase.auth.signOut();

      router.push('/');
    } catch {
      setError('계정 삭제 중 오류가 발생했습니다.');
      setIsDeleting(false);
    }
  };

  // 시간 포맷팅
  const formatStudyTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  };

  // 월간 캘린더 날짜 계산
  const getMonthDays = () => {
    const firstDay = new Date(routineYear, routineMonth, 1);
    const lastDay = new Date(routineYear, routineMonth + 1, 0);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const totalDays = lastDay.getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);

    return days;
  };

  // 현재 선택된 루틴
  const currentRoutine = userRoutines[selectedRoutineIndex];

  // Day 타입 시간표 렌더링 (보기 전용)
  const renderDayScheduleView = (routineItems: RoutineItem[]) => (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[280px]">
          {TIME_SLOTS.map(hour => {
            const item = routineItems.find(i => i.day === 0 && i.startHour === hour);
            return (
              <div key={hour} className="flex border-b border-gray-100 last:border-b-0">
                <div className="w-14 py-2 px-2 text-xs text-gray-500 bg-gray-50 flex-shrink-0 border-r border-gray-100">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 py-2 px-2 min-h-[36px]">
                  {item && (
                    <div className={cn('px-2 py-1 rounded text-white text-xs', item.color)}>
                      {item.title}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Week 타입 주간 시간표 렌더링 (보기 전용)
  const renderWeekScheduleView = (routineItems: RoutineItem[]) => (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* 요일 헤더 */}
          <div className="flex border-b border-gray-200">
            <div className="w-12 bg-gray-50 flex-shrink-0" />
            {WEEKDAYS.map((day, idx) => (
              <div
                key={day}
                className={cn(
                  'flex-1 py-2 text-center text-xs font-medium border-l border-gray-100',
                  idx >= 5 ? 'text-red-500' : 'text-gray-700'
                )}
              >
                {day}
              </div>
            ))}
          </div>
          {/* 시간 슬롯 */}
          {TIME_SLOTS.map(hour => (
            <div key={hour} className="flex border-b border-gray-100 last:border-b-0">
              <div className="w-12 py-1.5 px-1 text-[10px] text-gray-500 bg-gray-50 flex-shrink-0 border-r border-gray-100">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {WEEKDAYS.map((_, dayIdx) => {
                const item = routineItems.find(i => i.day === dayIdx && i.startHour === hour);
                return (
                  <div key={dayIdx} className="flex-1 min-h-[32px] border-l border-gray-100 p-0.5">
                    {item && (
                      <div className={cn('px-1 py-0.5 rounded text-white text-[10px] truncate', item.color)}>
                        {item.title}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Month 타입 월간 캘린더 렌더링 (보기 전용)
  const renderMonthCalendarView = (routineItems: RoutineItem[]) => {
    const days = getMonthDays();
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* 월 네비게이션 */}
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
          <button
            onClick={() => {
              if (routineMonth === 0) {
                setRoutineMonth(11);
                setRoutineYear(prev => prev - 1);
              } else {
                setRoutineMonth(prev => prev - 1);
              }
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-900">
            {routineYear}년 {monthNames[routineMonth]}
          </span>
          <button
            onClick={() => {
              if (routineMonth === 11) {
                setRoutineMonth(0);
                setRoutineYear(prev => prev + 1);
              } else {
                setRoutineMonth(prev => prev + 1);
              }
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {WEEKDAYS.map((day, idx) => (
            <div
              key={day}
              className={cn(
                'py-1.5 text-center text-xs font-medium',
                idx >= 5 ? 'text-red-500' : 'text-gray-700'
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayItems = day ? routineItems.filter(i => i.day === day) : [];
            return (
              <div
                key={idx}
                className={cn(
                  'min-h-[60px] border-b border-r border-gray-100 p-1',
                  !day && 'bg-gray-50',
                  (idx + 1) % 7 === 0 && 'border-r-0'
                )}
              >
                {day && (
                  <>
                    <div className={cn(
                      'text-xs mb-0.5',
                      (idx % 7) >= 5 ? 'text-red-500' : 'text-gray-700'
                    )}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayItems.slice(0, 2).map(item => (
                        <div
                          key={item.id}
                          className={cn('px-1 py-0.5 rounded text-white text-[9px] truncate', item.color)}
                        >
                          {item.title}
                        </div>
                      ))}
                      {dayItems.length > 2 && (
                        <div className="text-[9px] text-gray-500">+{dayItems.length - 2}</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Custom 타입 N일 플래너 렌더링 (보기 전용)
  const renderCustomPlannerView = (routineItems: RoutineItem[], customDays: number = 30) => (
    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
      {Array.from({ length: Math.min(customDays, 30) }, (_, i) => i + 1).map(day => {
        const dayItems = routineItems.filter(i => i.day === day);
        return (
          <div key={day} className="flex border-b border-gray-100 last:border-b-0">
            <div className="w-16 py-2 px-2 text-xs font-medium text-gray-700 bg-gray-50 flex-shrink-0 border-r border-gray-100">
              Day {day}
            </div>
            <div className="flex-1 py-2 px-2 min-h-[40px]">
              {dayItems.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {dayItems.map(item => (
                    <div
                      key={item.id}
                      className={cn('px-2 py-0.5 rounded text-white text-xs', item.color)}
                    >
                      {item.title}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-300 text-xs">-</div>
              )}
            </div>
          </div>
        );
      })}
      {customDays > 30 && (
        <div className="p-2 text-center text-xs text-gray-500 bg-gray-50">
          {customDays - 30}일 더 있음
        </div>
      )}
    </div>
  );

  // ===== 루틴 생성용 인터랙티브 함수들 =====

  // 시간 슬롯 클릭 핸들러 (day, week 타입)
  const handleTimeSlotClick = (day: number, hour: number) => {
    setEditingItem({ day, startHour: hour, endHour: hour + 1 });
    setNewItemTitle('');
    setNewItemColor(ROUTINE_COLORS[newRoutineItems.length % ROUTINE_COLORS.length]);
    setShowAddItemModal(true);
  };

  // 날짜 클릭 핸들러 (month, custom 타입)
  const handleDateClick = (day: number) => {
    setEditingItem({ day });
    setNewItemTitle('');
    setNewItemColor(ROUTINE_COLORS[newRoutineItems.length % ROUTINE_COLORS.length]);
    setShowAddItemModal(true);
  };

  // 아이템 추가
  const addRoutineItem = () => {
    if (!newItemTitle.trim() || !editingItem) return;

    const newItem: RoutineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      day: editingItem.day,
      startHour: editingItem.startHour,
      endHour: editingItem.endHour,
      title: newItemTitle.trim(),
      color: newItemColor,
    };

    setNewRoutineItems(prev => [...prev, newItem]);
    setShowAddItemModal(false);
    setNewItemTitle('');
    setEditingItem(null);
  };

  // 아이템 제거
  const removeRoutineItem = (itemId: string) => {
    setNewRoutineItems(prev => prev.filter(item => item.id !== itemId));
  };

  // 루틴 저장
  const saveRoutine = async () => {
    if (!user || !newRoutineTitle.trim()) return;

    setIsSavingRoutine(true);
    try {
      const { data, error } = await supabase
        .from('routines')
        .insert({
          user_id: user.id,
          title: newRoutineTitle.trim(),
          routine_type: newRoutineType,
          routine_days: newRoutineType === 'custom' ? customDays : null,
          routine_items: newRoutineItems,
        })
        .select()
        .single();

      if (error) throw error;

      // 목록에 추가
      setUserRoutines(prev => [...prev, {
        id: data.id,
        title: data.title,
        routine_type: data.routine_type,
        routine_days: data.routine_days,
        routine_items: data.routine_items || [],
        created_at: data.created_at,
      }]);

      // 상태 초기화
      setIsCreatingRoutine(false);
      setNewRoutineTitle('');
      setNewRoutineItems([]);
      setNewRoutineType('week');
      setCustomDays(30);

      setSuccess('루틴이 저장되었습니다!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Error saving routine:', err);
      setError('루틴 저장에 실패했습니다.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsSavingRoutine(false);
    }
  };

  // 루틴 생성 취소
  const cancelRoutineCreation = () => {
    setIsCreatingRoutine(false);
    setNewRoutineTitle('');
    setNewRoutineItems([]);
    setNewRoutineType('week');
    setCustomDays(30);
  };

  // Day 타입 시간표 렌더링 (생성용 - 인터랙티브)
  const renderDayScheduleCreate = () => (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[280px]">
          {TIME_SLOTS.map(hour => {
            const item = newRoutineItems.find(i => i.day === 0 && i.startHour === hour);
            return (
              <div key={hour} className="flex border-b border-gray-100 last:border-b-0">
                <div className="w-14 py-2 px-2 text-xs text-gray-500 bg-gray-50 flex-shrink-0 border-r border-gray-100">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div
                  className="flex-1 py-2 px-2 min-h-[36px] cursor-pointer hover:bg-orange-50 transition-colors"
                  onClick={() => !item && handleTimeSlotClick(0, hour)}
                >
                  {item ? (
                    <div className={cn('px-2 py-1 rounded text-white text-xs flex items-center justify-between', item.color)}>
                      <span>{item.title}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeRoutineItem(item.id); }}
                        className="ml-1 hover:bg-white/20 rounded p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-gray-300 text-xs">+ 클릭하여 추가</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Week 타입 주간 시간표 렌더링 (생성용 - 인터랙티브)
  const renderWeekScheduleCreate = () => (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* 요일 헤더 */}
          <div className="flex border-b border-gray-200">
            <div className="w-12 bg-gray-50 flex-shrink-0" />
            {WEEKDAYS.map((day, idx) => (
              <div
                key={day}
                className={cn(
                  'flex-1 py-2 text-center text-xs font-medium border-l border-gray-100',
                  idx >= 5 ? 'text-red-500' : 'text-gray-700'
                )}
              >
                {day}
              </div>
            ))}
          </div>
          {/* 시간 슬롯 */}
          {TIME_SLOTS.map(hour => (
            <div key={hour} className="flex border-b border-gray-100 last:border-b-0">
              <div className="w-12 py-1.5 px-1 text-[10px] text-gray-500 bg-gray-50 flex-shrink-0 border-r border-gray-100">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {WEEKDAYS.map((_, dayIdx) => {
                const item = newRoutineItems.find(i => i.day === dayIdx && i.startHour === hour);
                return (
                  <div
                    key={dayIdx}
                    className="flex-1 min-h-[32px] border-l border-gray-100 p-0.5 cursor-pointer hover:bg-orange-50 transition-colors"
                    onClick={() => !item && handleTimeSlotClick(dayIdx, hour)}
                  >
                    {item ? (
                      <div className={cn('px-1 py-0.5 rounded text-white text-[10px] truncate flex items-center justify-between group', item.color)}>
                        <span className="truncate">{item.title}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeRoutineItem(item.id); }}
                          className="opacity-0 group-hover:opacity-100 ml-0.5 hover:bg-white/20 rounded"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Month 타입 월간 캘린더 렌더링 (생성용 - 인터랙티브)
  const renderMonthCalendarCreate = () => {
    const days = getMonthDays();
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* 월 네비게이션 */}
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
          <button
            onClick={() => {
              if (routineMonth === 0) {
                setRoutineMonth(11);
                setRoutineYear(prev => prev - 1);
              } else {
                setRoutineMonth(prev => prev - 1);
              }
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-900">
            {routineYear}년 {monthNames[routineMonth]}
          </span>
          <button
            onClick={() => {
              if (routineMonth === 11) {
                setRoutineMonth(0);
                setRoutineYear(prev => prev + 1);
              } else {
                setRoutineMonth(prev => prev + 1);
              }
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {WEEKDAYS.map((day, idx) => (
            <div
              key={day}
              className={cn(
                'py-1.5 text-center text-xs font-medium',
                idx >= 5 ? 'text-red-500' : 'text-gray-700'
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayItems = day ? newRoutineItems.filter(i => i.day === day) : [];
            return (
              <div
                key={idx}
                className={cn(
                  'min-h-[60px] border-b border-r border-gray-100 p-1 cursor-pointer hover:bg-orange-50 transition-colors',
                  !day && 'bg-gray-50 cursor-default hover:bg-gray-50',
                  (idx + 1) % 7 === 0 && 'border-r-0'
                )}
                onClick={() => day && handleDateClick(day)}
              >
                {day && (
                  <>
                    <div className={cn(
                      'text-xs mb-0.5',
                      (idx % 7) >= 5 ? 'text-red-500' : 'text-gray-700'
                    )}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayItems.slice(0, 2).map(item => (
                        <div
                          key={item.id}
                          className={cn('px-1 py-0.5 rounded text-white text-[9px] truncate flex items-center justify-between group', item.color)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="truncate">{item.title}</span>
                          <button
                            onClick={() => removeRoutineItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 ml-0.5"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                      {dayItems.length > 2 && (
                        <div className="text-[9px] text-gray-500">+{dayItems.length - 2}</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Custom 타입 N일 플래너 렌더링 (생성용 - 인터랙티브)
  const renderCustomPlannerCreate = () => (
    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
      {Array.from({ length: Math.min(customDays, 30) }, (_, i) => i + 1).map(day => {
        const dayItems = newRoutineItems.filter(i => i.day === day);
        return (
          <div key={day} className="flex border-b border-gray-100 last:border-b-0">
            <div className="w-16 py-2 px-2 text-xs font-medium text-gray-700 bg-gray-50 flex-shrink-0 border-r border-gray-100">
              Day {day}
            </div>
            <div
              className="flex-1 py-2 px-2 min-h-[40px] cursor-pointer hover:bg-orange-50 transition-colors"
              onClick={() => handleDateClick(day)}
            >
              {dayItems.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {dayItems.map(item => (
                    <div
                      key={item.id}
                      className={cn('px-2 py-0.5 rounded text-white text-xs flex items-center gap-1 group', item.color)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>{item.title}</span>
                      <button
                        onClick={() => removeRoutineItem(item.id)}
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-300 text-xs">+ 클릭하여 추가</div>
              )}
            </div>
          </div>
        );
      })}
      {customDays > 30 && (
        <div className="p-2 text-center text-xs text-gray-500 bg-gray-50">
          {customDays - 30}일 더 있음
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-neutral-light">
        <Spinner size="lg" />
      </div>
    );
  }

  // 크리에이터 전환 중 로딩 화면
  if (isConverting) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center mb-6"
        >
          <Sparkles className="w-10 h-10 text-white animate-pulse" />
        </motion.div>
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold text-gray-900 mb-2"
        >
          크리에이터로 전환 중...
        </motion.h2>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-500"
        >
          잠시만 기다려주세요
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Spinner size="md" />
        </motion.div>
      </motion.div>
    );
  }

  if (!user) {
    return null;
  }

  // 애니메이션 variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  return (
    <motion.div
      className="min-h-[calc(100vh-4rem)] bg-gray-50"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">홈</span>
            </Link>
            <Link
              href="/profile/settings"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-500" />
            </Link>
          </div>
        </div>
      </header>

      <motion.div
        className="max-w-6xl mx-auto px-4 sm:px-6 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 2단 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 프로필 카드 */}
          <div className="lg:col-span-1">
            <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 sticky top-24">
              {/* 프로필 정보 */}
              <div className="text-center mb-6">
                <div className="relative inline-block mb-4">
                  <Avatar
                    src={profile?.avatar_url}
                    alt={profile?.nickname || user.email || 'User'}
                    size="lg"
                    className="w-24 h-24"
                  />
                  {currentStudySession && (
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white" />
                  )}
                </div>
                <div className="mb-2">
                  <h1 className="text-xl font-bold text-gray-900">{profile?.nickname || '이름 없음'}</h1>
                  <p className="text-sm text-gray-500">
                    {profile?.username ? `@${profile.username}` : user.email}
                  </p>
                </div>
                {profile?.bio && (
                  <p className="text-sm text-gray-600 mb-2">{profile.bio}</p>
                )}
                {profile?.school && (
                  <p className="text-sm text-gray-400">{profile.school}</p>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 w-full py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  프로필 수정
                </button>
              </div>

              {/* 통계 */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{studyStats.streak}</p>
                  <p className="text-xs text-gray-500">연속 출석</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{purchasedContents.length}</p>
                  <p className="text-xs text-gray-500">구매 자료</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{studyStats.joinedRooms}</p>
                  <p className="text-xs text-gray-500">참여한 방</p>
                </div>
              </div>
            </motion.div>

            {/* 내 루틴 - 왼쪽 컬럼 */}
            {userRoutines.length > 0 ? (
              <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">내 루틴</p>
                  <Link
                    href="/dashboard/upload"
                    className="text-xs text-orange-500 hover:text-orange-600 font-medium"
                  >
                    + 새 루틴
                  </Link>
                </div>

                {/* 루틴 선택 탭 (여러 개일 때) */}
                {userRoutines.length > 1 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {userRoutines.map((routine, idx) => (
                      <button
                        key={routine.id}
                        onClick={() => setSelectedRoutineIndex(idx)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                          selectedRoutineIndex === idx
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                      >
                        {routine.title.slice(0, 15)}{routine.title.length > 15 ? '...' : ''}
                      </button>
                    ))}
                  </div>
                )}

                {/* 현재 루틴 */}
                {currentRoutine && (
                  <div>
                    {/* 루틴 제목 및 정보 */}
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{currentRoutine.title}</h3>
                      {currentRoutine.description && (
                        <p className="text-sm text-gray-500 mb-2">{currentRoutine.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-full">
                          <Calendar className="w-3 h-3" />
                          {ROUTINE_TYPES.find(t => t.id === currentRoutine.routine_type)?.label || '루틴'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {currentRoutine.routine_items.length}개 일정
                        </span>
                      </div>
                    </div>

                    {/* 루틴 스케줄 뷰 */}
                    <div>
                      {currentRoutine.routine_type === 'day' && renderDayScheduleView(currentRoutine.routine_items)}
                      {currentRoutine.routine_type === 'week' && renderWeekScheduleView(currentRoutine.routine_items)}
                      {currentRoutine.routine_type === 'month' && renderMonthCalendarView(currentRoutine.routine_items)}
                      {currentRoutine.routine_type === 'custom' && renderCustomPlannerView(currentRoutine.routine_items, currentRoutine.routine_days)}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 mt-6">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">내 루틴</p>

                {isCreatingRoutine ? (
                  // 루틴 생성 UI
                  <div className="space-y-4">
                    {/* 루틴 제목 입력 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">루틴 이름</label>
                      <input
                        type="text"
                        value={newRoutineTitle}
                        onChange={(e) => setNewRoutineTitle(e.target.value)}
                        placeholder="예: 수능 대비 일정"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    {/* 루틴 타입 선택 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">루틴 형식</label>
                      <div className="grid grid-cols-2 gap-2">
                        {ROUTINE_TYPES.map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setNewRoutineType(type.id as 'day' | 'week' | 'month' | 'custom')}
                            className={cn(
                              'p-2 rounded-lg border text-left transition-all',
                              newRoutineType === type.id
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                            )}
                          >
                            <div className="text-xs font-medium">{type.label}</div>
                            <div className="text-[10px] text-gray-500">{type.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 커스텀 일수 설정 */}
                    {newRoutineType === 'custom' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">기간 (일)</label>
                        <input
                          type="number"
                          value={customDays}
                          onChange={(e) => setCustomDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 30)))}
                          min={1}
                          max={365}
                          className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    {/* 스케줄 에디터 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">일정 추가</label>
                      <p className="text-xs text-gray-500 mb-2">시간/날짜를 클릭하여 일정을 추가하세요</p>
                      {newRoutineType === 'day' && renderDayScheduleCreate()}
                      {newRoutineType === 'week' && renderWeekScheduleCreate()}
                      {newRoutineType === 'month' && renderMonthCalendarCreate()}
                      {newRoutineType === 'custom' && renderCustomPlannerCreate()}
                    </div>

                    {/* 버튼들 */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={cancelRoutineCreation}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={saveRoutine}
                        disabled={!newRoutineTitle.trim() || newRoutineItems.length === 0 || isSavingRoutine}
                        className={cn(
                          'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          newRoutineTitle.trim() && newRoutineItems.length > 0 && !isSavingRoutine
                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        )}
                      >
                        {isSavingRoutine ? '저장 중...' : '저장하기'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // 빈 상태 (루틴 없음)
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 mb-3">아직 등록한 루틴이 없어요</p>
                    <button
                      onClick={() => setIsCreatingRoutine(true)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <Calendar className="w-3 h-3" />
                      루틴 만들기
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* 오른쪽: 메뉴 섹션들 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 현재 스터디 세션 */}
            {currentStudySession && (
              <motion.div variants={itemVariants}>
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <div>
                        <p className="font-medium text-gray-900">{currentStudySession.room_name}</p>
                        <p className="text-sm text-gray-500">
                          {currentStudySession.seat_number}번 좌석 · {formatStudyTime(currentStudySession.current_session_minutes)} 진행
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/study-room/${currentStudySession.room_id}`}
                      className="text-sm text-green-600 font-medium hover:text-green-700"
                    >
                      이어하기 →
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 크리에이터 섹션 */}
            {isCreatorMode ? (
              <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">크리에이터</p>
                <div className="space-y-1">
                  {CREATOR_MENUS.map((menu) => (
                    <Link
                      key={menu.id}
                      href={menu.href}
                      className="flex items-center justify-between py-3 hover:text-orange-500 transition-colors group"
                    >
                      <span className="text-gray-900 group-hover:text-orange-500">{menu.title}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500" />
                    </Link>
                  ))}
                  <button
                    onClick={handleSwitchToRunner}
                    className="flex items-center justify-between py-3 w-full text-left text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <span>러너 모드로 전환</span>
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div variants={itemVariants}>
                <button
                  onClick={handleSwitchToCreator}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-6 text-left group hover:from-orange-600 hover:to-orange-500 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold text-lg mb-1">크리에이터 되기</p>
                      <p className="text-orange-100 text-sm">콘텐츠를 공유하고 수익을 만들어보세요</p>
                    </div>
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </button>
              </motion.div>
            )}

            {/* 내 콘텐츠 */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">내 콘텐츠</p>
              <div className="space-y-1">
                {CONTENT_MENUS.map((menu) => (
                  <Link
                    key={menu.id}
                    href={menu.href}
                    className="flex items-center justify-between py-3 hover:text-orange-500 transition-colors group"
                  >
                    <span className="text-gray-900 group-hover:text-orange-500">{menu.title}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500" />
                  </Link>
                ))}
                <Link
                  href="/my/purchases"
                  className="flex items-center justify-between py-3 hover:text-orange-500 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 group-hover:text-orange-500">구매한 콘텐츠</span>
                    {purchasedContents.length > 0 && (
                      <span className="text-xs text-orange-500 font-medium">{purchasedContents.length}</span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500" />
                </Link>
              </div>
            </motion.div>

            {/* 설정 */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">설정</p>
              <div className="space-y-1">
                {SETTINGS_MENUS.map((menu) => (
                  <Link
                    key={menu.id}
                    href={menu.href}
                    className="flex items-center justify-between py-3 hover:text-orange-500 transition-colors group"
                  >
                    <span className="text-gray-900 group-hover:text-orange-500">{menu.title}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500" />
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* 계정 */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">계정</p>
              <div className="space-y-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-between py-3 w-full text-left text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <span>로그아웃</span>
                  <LogOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center justify-between py-3 w-full text-left text-red-500 hover:text-red-600 transition-colors"
                >
                  <span>계정 삭제</span>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            {/* 앱 버전 */}
            <motion.div variants={itemVariants} className="text-center py-4">
              <p className="text-xs text-gray-400">StuPle v1.0.0</p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* 프로필 편집 모달 */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && handleCancelEdit()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">프로필 수정</h3>
                <button onClick={handleCancelEdit} className="p-1 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* 성공/에러 메시지 */}
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
                  {success}
                </div>
              )}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* 아바타 섹션 */}
              <div className="flex flex-col items-center mb-6">
                <div
                  onClick={handleAvatarClick}
                  className="relative cursor-pointer"
                >
                  <Avatar
                    src={profile?.avatar_url}
                    alt={profile?.nickname || user.email || 'User'}
                    size="xl"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                    {isUploading ? (
                      <Spinner size="sm" className="border-white/30 border-t-white" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <p className="text-xs text-gray-400 mt-2">탭하여 사진 변경</p>
              </div>

              <div className="space-y-4">
                <Input
                  label="닉네임"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  placeholder="닉네임을 입력하세요"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    사용자 이름
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="username"
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                  </div>
                </div>

                <Input
                  label="학교"
                  value={editSchool}
                  onChange={(e) => setEditSchool(e.target.value)}
                  placeholder="학교를 입력하세요"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    자기소개
                  </label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="자기소개를 입력하세요"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    isLoading={isSaving}
                    className="flex-1 bg-accent hover:bg-cta-hover"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    저장
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 계정 삭제 모달 */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
            >
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                계정을 삭제하시겠습니까?
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                삭제된 계정과 데이터는 복구할 수 없습니다.
                정말 삭제하시겠습니까?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                >
                  {isDeleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 루틴 아이템 추가 모달 */}
      <AnimatePresence>
        {showAddItemModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowAddItemModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">일정 추가</h3>
                <button
                  onClick={() => setShowAddItemModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* 시간 정보 표시 */}
              {editingItem && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {newRoutineType === 'day' && editingItem.startHour !== undefined && (
                      <span>{editingItem.startHour.toString().padStart(2, '0')}:00 - {(editingItem.endHour || editingItem.startHour + 1).toString().padStart(2, '0')}:00</span>
                    )}
                    {newRoutineType === 'week' && editingItem.startHour !== undefined && (
                      <span>{WEEKDAYS[editingItem.day]} {editingItem.startHour.toString().padStart(2, '0')}:00</span>
                    )}
                    {newRoutineType === 'month' && (
                      <span>{editingItem.day}일</span>
                    )}
                    {newRoutineType === 'custom' && (
                      <span>Day {editingItem.day}</span>
                    )}
                  </div>
                </div>
              )}

              {/* 일정 제목 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">일정 이름</label>
                <input
                  type="text"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="예: 수학 공부"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newItemTitle.trim()) {
                      addRoutineItem();
                    }
                  }}
                />
              </div>

              {/* 색상 선택 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">색상</label>
                <div className="flex flex-wrap gap-2">
                  {ROUTINE_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewItemColor(color)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        color,
                        newItemColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddItemModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={addRoutineItem}
                  disabled={!newItemTitle.trim()}
                  className={cn(
                    'flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    newItemTitle.trim()
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  추가
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
