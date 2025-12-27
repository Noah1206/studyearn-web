'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Edit2,
  Check,
  X,
  ArrowLeft,
  Camera,
  AtSign,
  School,
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
  Users,
  DollarSign,
  BarChart3,
  ArrowRightLeft
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Avatar, Badge } from '@/components/ui';
import { CreatorConversionModal } from '@/components/modals';
import { useUserStore } from '@/store/userStore';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Profile {
  id: string;
  nickname: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  school?: string;
  is_creator: boolean;
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
    href: '/settings/notifications',
  },
  {
    id: 'privacy',
    title: '개인정보 및 보안',
    description: '비밀번호, 2단계 인증',
    icon: Shield,
    href: '/settings/privacy',
  },
  {
    id: 'account',
    title: '계정',
    description: '언어, 로그아웃, 계정 삭제',
    icon: Settings,
    href: '/settings/account',
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
    clearUser,
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
  const [showCreatorModal, setShowCreatorModal] = useState(false);

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

  const handleSwitchToCreator = () => {
    if (hasBeenCreator && isCreatorOnboarded) {
      switchToCreator();
      router.push('/dashboard');
    } else {
      setShowCreatorModal(true);
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

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
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
        staggerChildren: 0.1,
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
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8">
      <motion.div
        className="max-w-2xl mx-auto px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 뒤로 가기 */}
        <motion.div variants={itemVariants}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">홈으로</span>
          </Link>
        </motion.div>

        {/* 프로필 카드 */}
        <motion.div variants={itemVariants}>
          <Card variant="elevated" className="mb-4">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">프로필 정보</CardTitle>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-medium text-gray-900 hover:text-gray-900"
                >
                  수정
                </button>
              ) : (
                <button
                  onClick={handleCancelEdit}
                  className="text-sm font-medium text-red-500 hover:text-red-600"
                >
                  취소
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6">
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
              <div className="relative">
                <div
                  onClick={handleAvatarClick}
                  className={`relative ${isEditing ? 'cursor-pointer' : ''}`}
                >
                  <Avatar
                    src={profile?.avatar_url}
                    alt={profile?.nickname || user.email || 'User'}
                    size="xl"
                  />
                  {isEditing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              {isEditing && (
                <p className="text-xs text-gray-400 mt-2">탭하여 사진 변경</p>
              )}
            </div>

            {isEditing ? (
              /* 편집 모드 */
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
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-all"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    취소
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    isLoading={isSaving}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    저장
                  </Button>
                </div>
              </div>
            ) : (
              /* 보기 모드 */
              <div className="space-y-4">
                {/* 이메일 (읽기 전용) */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">이메일</p>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                </div>

                {/* 닉네임 */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">닉네임</p>
                    <p className="text-gray-900">{profile?.nickname || '설정되지 않음'}</p>
                  </div>
                </div>

                {/* 사용자 이름 */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <AtSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">사용자 이름</p>
                    <p className="text-gray-900">
                      {profile?.username ? `@${profile.username}` : '설정되지 않음'}
                    </p>
                  </div>
                </div>

                {/* 학교 */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <School className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">학교</p>
                    <p className="text-gray-900">{profile?.school || '설정되지 않음'}</p>
                  </div>
                </div>

                {/* 자기소개 */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">자기소개</p>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {profile?.bio || '자기소개가 없습니다.'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          </Card>
        </motion.div>

        {/* 크리에이터 메뉴 */}
        <motion.div variants={itemVariants}>
          <Card variant="elevated" className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-400">크리에이터</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-gray-100">
              {isCreatorMode ? (
                <>
                  {/* 크리에이터 모드 - 메뉴 아이템들 */}
                  {CREATOR_MENUS.map((menu) => (
                    <Link
                      key={menu.id}
                      href={menu.href}
                      className="flex items-center gap-4 py-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                        <menu.icon className="w-5 h-5 text-gray-900" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{menu.title}</p>
                        <p className="text-xs text-gray-400">{menu.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </Link>
                  ))}
                  {/* 일반 모드로 전환 */}
                  <button
                    onClick={handleSwitchToRunner}
                    className="flex items-center gap-4 py-4 w-full text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <ArrowRightLeft className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">일반 모드로 전환</p>
                      <p className="text-xs text-gray-400">러너 모드로 돌아가기</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </button>
                </>
              ) : (
                /* 일반 모드 - 크리에이터 시작 메뉴 */
                <button
                  onClick={handleSwitchToCreator}
                  className="flex items-center gap-4 py-4 w-full text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-gray-900" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {hasBeenCreator ? '크리에이터 모드로 전환' : '크리에이터 시작하기'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {hasBeenCreator ? '다시 크리에이터 모드로 돌아가기' : '콘텐츠를 공유하고 수익을 만들어보세요'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </button>
              )}
            </div>
          </CardContent>
          </Card>
        </motion.div>

        {/* 내 콘텐츠 메뉴 */}
        <motion.div variants={itemVariants}>
          <Card variant="elevated" className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-400">내 콘텐츠</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-gray-100">
              {CONTENT_MENUS.map((menu) => (
                <Link
                  key={menu.id}
                  href={menu.href}
                  className="flex items-center gap-4 py-4"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <menu.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{menu.title}</p>
                    <p className="text-xs text-gray-400">{menu.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </Link>
              ))}
            </div>
          </CardContent>
          </Card>
        </motion.div>

        {/* 설정 메뉴 */}
        <motion.div variants={itemVariants}>
          <Card variant="elevated" className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-400">설정</CardTitle>
            </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-gray-100">
              {SETTINGS_MENUS.map((menu) => (
                <Link
                  key={menu.id}
                  href={menu.href}
                  className="flex items-center gap-4 py-4"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <menu.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{menu.title}</p>
                    <p className="text-xs text-gray-400">{menu.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </Link>
              ))}
            </div>
          </CardContent>
          </Card>
        </motion.div>

        {/* 계정 관리 버튼들 */}
        <motion.div variants={itemVariants} className="flex gap-3 mb-6">
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 text-gray-700" />
            <span className="text-sm font-medium text-gray-700">로그아웃</span>
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-500">계정 삭제</span>
          </button>
        </motion.div>

        {/* 앱 버전 */}
        <motion.div variants={itemVariants} className="text-center py-4">
          <p className="text-xs text-gray-400">StuPle v1.0.0</p>
        </motion.div>
      </motion.div>

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

      {/* 크리에이터 전환 모달 */}
      <CreatorConversionModal
        isOpen={showCreatorModal}
        onClose={() => setShowCreatorModal(false)}
      />
    </div>
  );
}
