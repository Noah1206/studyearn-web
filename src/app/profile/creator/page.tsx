'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  User,
  Edit2,
  Check,
  X,
  ArrowLeft,
  Camera,
  Settings,
  ChevronRight,
  Trash2,
  LogOut,
  LayoutDashboard,
  FileText,
  Users,
  DollarSign,
  ArrowRightLeft,
  TrendingUp,
  Eye,
  Heart,
  Upload,
  Plus,
  Play,
  Clock,
  Star,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Avatar, Badge, Spinner } from '@/components/ui';
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

interface CreatorStats {
  totalEarnings: number;
  totalViews: number;
  totalLikes: number;
  totalSubscribers: number;
  monthlyEarnings: number;
  totalContents: number;
}

interface UploadedContent {
  id: string;
  title: string;
  thumbnail_url?: string;
  views: number;
  likes: number;
  earnings: number;
  created_at: string;
  type: 'document' | 'video' | 'audio';
  status: 'published' | 'draft' | 'under_review';
}

// 크리에이터 대시보드 메뉴
const CREATOR_MENUS = [
  {
    id: 'dashboard',
    title: '대시보드',
    description: '전체 통계 및 분석',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    id: 'contents',
    title: '콘텐츠 관리',
    description: '업로드한 콘텐츠 관리',
    icon: FileText,
    href: '/dashboard/contents',
  },
  {
    id: 'subscribers',
    title: '구독자',
    description: '구독자 관리',
    icon: Users,
    href: '/dashboard/subscribers',
  },
];

export default function CreatorProfilePage() {
  const router = useRouter();
  // Supabase client를 useMemo로 캐싱
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User Store
  const {
    userType,
    isCreatorOnboarded,
    setProfile: setStoreProfile,
    revertToRunner,
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

  // 크리에이터 통계
  const [creatorStats, setCreatorStats] = useState<CreatorStats>({
    totalEarnings: 0,
    totalViews: 0,
    totalLikes: 0,
    totalSubscribers: 0,
    monthlyEarnings: 0,
    totalContents: 0,
  });

  // 업로드한 콘텐츠
  const [uploadedContents, setUploadedContents] = useState<UploadedContent[]>([]);

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
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      } else {
        // 크리에이터가 아니면 일반 프로필로 리다이렉트
        if (!profileData.is_creator) {
          router.push('/profile');
          return;
        }

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
      }

      // 크리에이터 통계 및 콘텐츠를 DB에서 가져오기
      const [contentsResult, creatorSettingsResult, purchasesResult] = await Promise.all([
        supabase
          .from('contents')
          .select('id, title, thumbnail_url, content_type, is_published, view_count, rating_count, created_at')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('creator_settings')
          .select('total_subscribers, pending_revenue, total_revenue')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('content_purchases')
          .select('amount, creator_revenue, created_at')
          .eq('seller_id', user.id)
          .eq('status', 'completed'),
      ]);

      const contents = contentsResult.data || [];
      const creatorSettings = creatorSettingsResult.data;
      const purchases = purchasesResult.data || [];

      // 좋아요 수 가져오기
      const contentIds = contents.map((c: any) => c.id);
      let likesMap: Record<string, number> = {};
      if (contentIds.length > 0) {
        const { data: likes } = await supabase
          .from('content_likes')
          .select('content_id')
          .in('content_id', contentIds);
        if (likes) {
          likes.forEach((l: any) => {
            likesMap[l.content_id] = (likesMap[l.content_id] || 0) + 1;
          });
        }
      }

      // 수익 per content
      let earningsMap: Record<string, number> = {};
      if (contentIds.length > 0) {
        const { data: contentPurchases } = await supabase
          .from('content_purchases')
          .select('content_id, creator_revenue')
          .in('content_id', contentIds)
          .eq('status', 'completed');
        if (contentPurchases) {
          contentPurchases.forEach((p: any) => {
            earningsMap[p.content_id] = (earningsMap[p.content_id] || 0) + (p.creator_revenue || 0);
          });
        }
      }

      const totalViews = contents.reduce((sum: number, c: any) => sum + (c.view_count || 0), 0);
      const totalLikes = Object.values(likesMap).reduce((sum, v) => sum + v, 0);
      const totalEarnings = creatorSettings?.total_revenue || purchases.reduce((sum: number, p: any) => sum + (p.creator_revenue || 0), 0);

      // 이번 달 수익
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthlyEarnings = purchases
        .filter((p: any) => p.created_at >= monthStart)
        .reduce((sum: number, p: any) => sum + (p.creator_revenue || 0), 0);

      setCreatorStats({
        totalEarnings,
        totalViews,
        totalLikes,
        totalSubscribers: creatorSettings?.total_subscribers || 0,
        monthlyEarnings,
        totalContents: contents.length,
      });

      setUploadedContents(
        contents.map((c: any) => ({
          id: c.id,
          title: c.title,
          thumbnail_url: c.thumbnail_url || undefined,
          views: c.view_count || 0,
          likes: likesMap[c.id] || 0,
          earnings: earningsMap[c.id] || 0,
          created_at: c.created_at,
          type: c.content_type === 'video' ? 'video' : c.content_type === 'audio' ? 'audio' : 'document',
          status: c.is_published ? 'published' : 'draft',
        }))
      );

      setIsLoading(false);
    };

    fetchUserAndProfile();
  }, [supabase, router, setStoreProfile]);

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

    if (file.size > 5 * 1024 * 1024) {
      setError('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

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

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setError('이미지 업로드에 실패했습니다.');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

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
    console.log('🔴 [Creator Profile] Logout button clicked');

    if (!supabase) {
      console.error('❌ Supabase client not available');
      return;
    }

    console.log('🔄 Starting logout process...');

    try {
      // localStorage/sessionStorage 클리어
      if (typeof window !== 'undefined') {
        const localStorageKeys = Object.keys(localStorage).filter(
          key => key.startsWith('sb-') || key.includes('supabase') || key === 'user-storage'
        );
        console.log('🗑️ Clearing localStorage keys:', localStorageKeys);
        localStorageKeys.forEach(key => localStorage.removeItem(key));

        const sessionStorageKeys = Object.keys(sessionStorage).filter(
          key => key.startsWith('sb-') || key.includes('supabase')
        );
        console.log('🗑️ Clearing sessionStorage keys:', sessionStorageKeys);
        sessionStorageKeys.forEach(key => sessionStorage.removeItem(key));
      }

      // 클라이언트 signOut with timeout
      console.log('📤 Calling supabase.auth.signOut...');
      try {
        const signOutPromise = supabase.auth.signOut({ scope: 'global' });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('SignOut timeout')), 2000)
        );

        const { error: signOutError } = await Promise.race([signOutPromise, timeoutPromise]);
        if (signOutError) {
          console.error('❌ SignOut error:', signOutError);
        } else {
          console.log('✅ Client signOut successful');
        }
      } catch (err) {
        console.warn('⚠️ SignOut timed out or failed, continuing with logout...', err);
      }

      // 서버 API 호출
      console.log('📤 Calling /api/auth/logout...');
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      console.log('✅ Server logout response:', response.status, response.statusText);

      // User store 클리어
      console.log('🗑️ Clearing user store...');
      clearUser();
      console.log('✅ User store cleared');
    } catch (err) {
      console.error('❌ Logout error:', err);
    }

    // 홈으로 리다이렉트
    console.log('🏠 Redirecting to home...');
    window.location.href = '/';
  };

  const handleSwitchToRunner = () => {
    revertToRunner();
    router.push('/profile');
  };

  const handleDeleteAccount = async () => {
    if (!user || !supabase) return;

    setIsDeleting(true);
    setError('');

    try {
      await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      await supabase.auth.signOut();
      router.push('/');
    } catch {
      setError('계정 삭제 중 오류가 발생했습니다.');
      setIsDeleting(false);
    }
  };

  // 금액 포맷팅
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  // 숫자 포맷팅
  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '만';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // 상태 뱃지
  const getStatusBadge = (status: UploadedContent['status']) => {
    switch (status) {
      case 'published':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">게시됨</span>;
      case 'draft':
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">임시저장</span>;
      case 'under_review':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">검토 중</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-neutral-light">
        <Spinner size="lg" />
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
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  return (
    <motion.div
      className="min-h-[calc(100vh-4rem)] bg-neutral-light"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* 헤더 배너 */}
      <div className="bg-gradient-to-br from-brand-black via-gray-900 to-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,107,53,0.3) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }} />
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">대시보드</span>
            </Link>
            <div className="w-px h-6 bg-white/20" />
            <span className="px-3 py-1 bg-accent text-white text-xs font-medium rounded-full">
              크리에이터
            </span>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* 프로필 정보 */}
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <Avatar
                  src={profile?.avatar_url}
                  alt={profile?.nickname || user.email || 'Creator'}
                  size="xl"
                  className="ring-4 ring-accent/50"
                />
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-accent rounded-full border-2 border-gray-900 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-white truncate">
                  {profile?.nickname || '크리에이터'}
                </h1>
                <p className="text-white/70 text-sm">
                  {profile?.username ? `@${profile.username}` : user.email}
                </p>
                {profile?.bio && (
                  <p className="text-white/60 text-sm mt-1 line-clamp-1">{profile.bio}</p>
                )}
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                프로필 수정
              </button>
              <Link
                href="/profile/settings"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 text-white" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 통계 카드 그리드 */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 -mt-16 relative z-10"
        >
          <Card variant="elevated" className="text-center py-4 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
              <p className="text-lg font-bold text-accent">{formatCurrency(creatorStats.totalEarnings)}</p>
              <p className="text-xs text-gray-500">총 수익</p>
            </CardContent>
          </Card>

          <Card variant="elevated" className="text-center py-4 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(creatorStats.monthlyEarnings)}</p>
              <p className="text-xs text-gray-500">이번 달</p>
            </CardContent>
          </Card>

          <Card variant="elevated" className="text-center py-4 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Eye className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-lg font-bold text-gray-900">{formatNumber(creatorStats.totalViews)}</p>
              <p className="text-xs text-gray-500">총 조회수</p>
            </CardContent>
          </Card>

          <Card variant="elevated" className="text-center py-4 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Heart className="w-5 h-5 text-pink-500" />
              </div>
              <p className="text-lg font-bold text-gray-900">{formatNumber(creatorStats.totalLikes)}</p>
              <p className="text-xs text-gray-500">총 좋아요</p>
            </CardContent>
          </Card>

          <Card variant="elevated" className="text-center py-4 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-lg font-bold text-gray-900">{formatNumber(creatorStats.totalSubscribers)}</p>
              <p className="text-xs text-gray-500">구독자</p>
            </CardContent>
          </Card>

          <Card variant="elevated" className="text-center py-4 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <FileText className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">{creatorStats.totalContents}</p>
              <p className="text-xs text-gray-500">콘텐츠</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* 메인 콘텐츠 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 콘텐츠 목록 */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            {/* 내 콘텐츠 */}
            <Card variant="elevated">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" />
                    내 콘텐츠
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/dashboard/contents/new"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-cta-hover transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      새 콘텐츠
                    </Link>
                    <Link href="/dashboard/contents" className="text-sm text-gray-500 font-medium hover:text-accent">
                      전체보기
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                {uploadedContents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uploadedContents.map((content) => (
                      <Link
                        key={content.id}
                        href={`/dashboard/contents/${content.id}`}
                        className="flex flex-col rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all"
                      >
                        <div className="aspect-video bg-gray-200 relative">
                          {content.thumbnail_url ? (
                            <Image
                              src={content.thumbnail_url}
                              alt={content.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          {content.type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Play className="w-8 h-8 text-white" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            {getStatusBadge(content.status)}
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium text-gray-900 truncate mb-2">{content.title}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {formatNumber(content.views)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {formatNumber(content.likes)}
                              </span>
                            </div>
                            {content.status === 'published' && (
                              <span className="text-accent font-medium">
                                +{formatCurrency(content.earnings)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-accent" />
                    </div>
                    <p className="text-gray-600 font-medium mb-1">아직 업로드한 콘텐츠가 없어요</p>
                    <p className="text-sm text-gray-400 mb-4">첫 번째 콘텐츠를 업로드해보세요!</p>
                    <Link
                      href="/dashboard/contents/new"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-cta-hover text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      콘텐츠 업로드
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* 오른쪽: 사이드바 */}
          <motion.div variants={itemVariants} className="space-y-6">
            {/* 크리에이터 도구 */}
            <Card variant="elevated">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  크리에이터 도구
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y divide-gray-100">
                  {CREATOR_MENUS.map((menu) => (
                    <Link
                      key={menu.id}
                      href={menu.href}
                      className="flex items-center gap-3 py-3 hover:bg-gray-50 -mx-4 px-4 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                        <menu.icon className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{menu.title}</p>
                        <p className="text-xs text-gray-400 truncate">{menu.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 모드 전환 */}
            <Card variant="outlined">
              <CardContent className="py-4">
                <button
                  onClick={handleSwitchToRunner}
                  className="flex items-center gap-3 w-full text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                    <ArrowRightLeft className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">러너 모드로 전환</p>
                    <p className="text-xs text-gray-400">일반 사용자 프로필</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              </CardContent>
            </Card>

            {/* 계정 관리 */}
            <Card variant="elevated">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-400">계정 관리</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 py-2 w-full text-left hover:bg-gray-50 -mx-4 px-4 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">로그아웃</span>
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-3 py-2 w-full text-left hover:bg-red-50 -mx-4 px-4 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-500">계정 삭제</span>
                </button>
              </CardContent>
            </Card>

            {/* 앱 버전 */}
            <div className="text-center py-2">
              <p className="text-xs text-gray-400">StuPle v1.0.0 (Creator)</p>
            </div>
          </motion.div>
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
                    alt={profile?.nickname || user.email || 'Creator'}
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
                  label="닉네임 (채널명)"
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
                    채널 소개
                  </label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="채널 소개를 입력하세요"
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
                크리에이터 계정과 모든 콘텐츠가 삭제됩니다.
                삭제된 데이터는 복구할 수 없습니다.
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
    </motion.div>
  );
}
