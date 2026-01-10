'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowLeft,
  Bell,
  Shield,
  Smartphone,
  Mail,
  Lock,
  Key,
  Eye,
  ChevronRight,
  HelpCircle,
  MessageCircle,
  FileText,
  LogOut,
  Trash2,
  User,
  CreditCard,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, Avatar, Spinner } from '@/components/ui';
import { useUserStore } from '@/store/userStore';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  newContent: boolean;
  marketing: boolean;
}

interface PrivacySettings {
  profilePublic: boolean;
  showStudyStatus: boolean;
  showSchool: boolean;
}

type SettingsSection = 'notifications' | 'privacy' | 'payment' | 'help' | 'account';
const validSections: SettingsSection[] = ['notifications', 'privacy', 'payment', 'help', 'account'];

// useSearchParams를 사용하는 내부 컴포넌트
function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Supabase client를 useMemo로 캐싱
  const supabase = useMemo(() => createClient(), []);
  const { clearUser, userType, profile } = useUserStore();

  // URL 쿼리 파라미터에서 초기 섹션 가져오기
  const tabParam = searchParams.get('tab') as SettingsSection | null;
  const initialSection = tabParam && validSections.includes(tabParam) ? tabParam : 'notifications';

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 섹션 변경 시 URL 업데이트
  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section);
    router.replace(`/profile/settings?tab=${section}`, { scroll: false });
  };

  // URL 변경 시 섹션 업데이트
  useEffect(() => {
    if (tabParam && validSections.includes(tabParam)) {
      setActiveSection(tabParam);
    }
  }, [tabParam]);

  // 알림 설정
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    emailEnabled: true,
    newContent: true,
    marketing: false,
  });

  // 개인정보 설정
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profilePublic: true,
    showStudyStatus: true,
    showSchool: false,
  });

  useEffect(() => {
    const fetchUserAndSettings = async () => {
      if (!supabase) return;

      // getSession()으로 빠르게 확인 (미들웨어에서 이미 getUser()로 검증 완료)
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Load user preferences from database
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('notification_settings, privacy_settings')
        .eq('user_id', session.user.id)
        .single();

      if (preferences) {
        if (preferences.notification_settings) {
          setNotificationSettings(prev => ({
            ...prev,
            ...preferences.notification_settings,
          }));
        }
        if (preferences.privacy_settings) {
          setPrivacySettings(prev => ({
            ...prev,
            ...preferences.privacy_settings,
          }));
        }
      }

      setIsLoading(false);
    };

    fetchUserAndSettings();
  }, [supabase, router]);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    clearUser();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (!user || !supabase) return;

    setIsDeleting(true);

    try {
      await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      await supabase.auth.signOut();
      clearUser();
      router.push('/');
    } catch {
      setIsDeleting(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user || !supabase) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          notification_settings: notificationSettings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    if (!user || !supabase) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          privacy_settings: privacySettings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-neutral-light">
        <Spinner size="lg" />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
    },
  };

  // 토글 스위치 컴포넌트
  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-accent' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  // 사이드바 메뉴 아이템
  const menuItems = [
    { id: 'notifications' as const, icon: Bell, label: '알림', description: '푸시, 이메일 알림 설정' },
    { id: 'privacy' as const, icon: Shield, label: '개인정보 및 보안', description: '프로필 공개, 비밀번호' },
    ...(userType === 'creator' ? [{ id: 'payment' as const, icon: CreditCard, label: '결제 및 정산', description: '정산 계좌 관리' }] : []),
    { id: 'help' as const, icon: HelpCircle, label: '도움말', description: 'FAQ, 문의하기' },
    { id: 'account' as const, icon: AlertTriangle, label: '계정 관리', description: '로그아웃, 탈퇴' },
  ];

  // 섹션별 콘텐츠 렌더링
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'notifications':
        return (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">알림 설정</h2>
              <p className="text-sm text-gray-500 mt-1">앱과 이메일 알림을 관리합니다</p>
            </div>
            <div className="space-y-4">
              <Card variant="outlined">
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">푸시 알림</p>
                          <p className="text-xs text-gray-400">앱 푸시 알림 받기</p>
                        </div>
                      </div>
                      <Toggle
                        enabled={notificationSettings.pushEnabled}
                        onChange={() => setNotificationSettings(prev => ({
                          ...prev,
                          pushEnabled: !prev.pushEnabled
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">이메일 알림</p>
                          <p className="text-xs text-gray-400">이메일로 알림 받기</p>
                        </div>
                      </div>
                      <Toggle
                        enabled={notificationSettings.emailEnabled}
                        onChange={() => setNotificationSettings(prev => ({
                          ...prev,
                          emailEnabled: !prev.emailEnabled
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">마케팅 정보</p>
                          <p className="text-xs text-gray-400">이벤트, 할인 정보 받기</p>
                        </div>
                      </div>
                      <Toggle
                        enabled={notificationSettings.marketing}
                        onChange={() => setNotificationSettings(prev => ({
                          ...prev,
                          marketing: !prev.marketing
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        );

      case 'privacy':
        return (
          <motion.div
            key="privacy"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">개인정보 및 보안</h2>
              <p className="text-sm text-gray-500 mt-1">프로필 공개 설정과 계정 보안을 관리합니다</p>
            </div>
            <div className="space-y-4">
              {/* 프로필 공개 설정 */}
              <Card variant="outlined">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-500">프로필 공개</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y divide-gray-100">
                    <div className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">프로필 공개</p>
                          <p className="text-xs text-gray-400">다른 사용자가 프로필 볼 수 있음</p>
                        </div>
                      </div>
                      <Toggle
                        enabled={privacySettings.profilePublic}
                        onChange={() => setPrivacySettings(prev => ({
                          ...prev,
                          profilePublic: !prev.profilePublic
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                          <Eye className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">공부 상태 공개</p>
                          <p className="text-xs text-gray-400">스터디룸에서 내 상태 보이기</p>
                        </div>
                      </div>
                      <Toggle
                        enabled={privacySettings.showStudyStatus}
                        onChange={() => setPrivacySettings(prev => ({
                          ...prev,
                          showStudyStatus: !prev.showStudyStatus
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 보안 설정 */}
              <Card variant="outlined">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-500">보안</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y divide-gray-100">
                    <Link
                      href="/profile/settings/password"
                      className="flex items-center gap-4 py-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">비밀번호 변경</p>
                        <p className="text-xs text-gray-400">계정 비밀번호 변경</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </Link>

                    <Link
                      href="/profile/settings/2fa"
                      className="flex items-center gap-4 py-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Key className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">2단계 인증</p>
                        <p className="text-xs text-gray-400">추가 보안 설정</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        );

      case 'payment':
        return (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">결제 및 정산</h2>
              <p className="text-sm text-gray-500 mt-1">수익 정산과 결제 정보를 관리합니다</p>
            </div>
            <div className="space-y-4">
              <Card variant="outlined">
                <CardContent className="p-0">
                  <Link
                    href="/dashboard/payout/settings"
                    className="flex items-center gap-4 p-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">정산 계좌 관리</p>
                      <p className="text-xs text-gray-400">수익 정산 받을 계좌 설정</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        );

      case 'help':
        return (
          <motion.div
            key="help"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">도움말</h2>
              <p className="text-sm text-gray-500 mt-1">자주 묻는 질문과 문의하기</p>
            </div>
            <div className="space-y-4">
              <Card variant="outlined">
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    <Link
                      href="/help/faq"
                      className="flex items-center gap-4 p-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <HelpCircle className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">자주 묻는 질문</p>
                        <p className="text-xs text-gray-400">FAQ</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </Link>

                    <Link
                      href="/help/contact"
                      className="flex items-center gap-4 p-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">문의하기</p>
                        <p className="text-xs text-gray-400">1:1 문의</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-500">약관</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y divide-gray-100">
                    <Link
                      href="/terms"
                      className="flex items-center gap-4 py-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">이용약관</p>
                        <p className="text-xs text-gray-400">서비스 이용약관</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </Link>

                    <Link
                      href="/privacy"
                      className="flex items-center gap-4 py-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">개인정보처리방침</p>
                        <p className="text-xs text-gray-400">개인정보 처리 안내</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        );

      case 'account':
        return (
          <motion.div
            key="account"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">계정 관리</h2>
              <p className="text-sm text-gray-500 mt-1">로그아웃 및 계정 삭제</p>
            </div>
            <div className="space-y-4">
              <Card variant="outlined">
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-4 p-4 w-full text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <LogOut className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">로그아웃</p>
                        <p className="text-xs text-gray-400">현재 계정에서 로그아웃</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card variant="outlined" className="border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-red-500">위험 구역</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-4 py-4 w-full text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-500">계정 삭제</p>
                      <p className="text-xs text-gray-400">계정과 모든 데이터가 영구 삭제됩니다</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-red-300" />
                  </button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
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
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-brand-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">프로필</span>
            </Link>
            <div className="w-px h-6 bg-white/20" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">설정</h1>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 사이드바 */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            {/* 사용자 정보 카드 */}
            <Card variant="elevated" className="mb-4">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={profile?.avatar_url}
                    alt={profile?.nickname || '사용자'}
                    size="md"
                    fallback={profile?.nickname?.charAt(0) || 'U'}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{profile?.nickname || '사용자'}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 네비게이션 메뉴 */}
            <Card variant="elevated">
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSectionChange(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                        activeSection === item.id
                          ? 'bg-accent text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${
                        activeSection === item.id ? 'text-white' : 'text-gray-400'
                      }`} />
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-medium ${
                          activeSection === item.id ? 'text-white' : 'text-gray-700'
                        }`}>
                          {item.label}
                        </p>
                        <p className={`text-xs ${
                          activeSection === item.id ? 'text-white/70' : 'text-gray-400'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>

            {/* 저작권 */}
            <div className="text-center py-4">
              <p className="text-xs text-gray-400">© 2024 StuPle. All rights reserved.</p>
            </div>
          </motion.div>

          {/* 메인 콘텐츠 */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <Card variant="elevated" className="min-h-[600px]">
              <CardContent className="p-6 lg:p-8">
                {renderSectionContent()}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* 계정 삭제 모달 */}
      {showDeleteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              정말 탈퇴하시겠습니까?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
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
                {isDeleting ? '삭제 중...' : '탈퇴하기'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Suspense로 감싸서 export
export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-neutral-light">
        <Spinner size="lg" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
