'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Key,
  Smartphone,
  Globe,
  UserX,
  Download,
  Trash2,
  AlertTriangle,
  Check,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Modal, Spinner, useToastActions } from '@/components/ui';

interface PrivacySettings {
  profile_visibility: 'public' | 'followers' | 'private';
  show_online_status: boolean;
  show_activity: boolean;
  allow_messages: 'everyone' | 'followers' | 'none';
  two_factor_enabled: boolean;
}

const defaultSettings: PrivacySettings = {
  profile_visibility: 'public',
  show_online_status: true,
  show_activity: true,
  allow_messages: 'everyone',
  two_factor_enabled: false,
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
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

function ToggleSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
        enabled ? 'bg-orange-500' : 'bg-gray-200'
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
      />
    </motion.button>
  );
}

function VisibilitySelector({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; description: string }[];
}) {
  return (
    <div className="space-y-2 mt-3">
      {options.map((option) => (
        <motion.button
          key={option.value}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange(option.value)}
          className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
            value === option.value
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{option.label}</p>
              <p className="text-sm text-gray-500">{option.description}</p>
            </div>
            {value === option.value && (
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </motion.button>
      ))}
    </div>
  );
}

export default function PrivacySettingsPage() {
  const router = useRouter();
  const toast = useToastActions();
  const supabase = useMemo(() => createClient(), []);

  const [settings, setSettings] = useState<PrivacySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Data export state
  const [isExporting, setIsExporting] = useState(false);

  // 2FA state
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFAError, setTwoFAError] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [twoFASecret, setTwoFASecret] = useState('');

  // Delete account state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // getSession()으로 빠르게 확인 (미들웨어에서 이미 getUser()로 검증 완료)
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          router.push('/login');
          return;
        }

        const user = session.user;

        const { data } = await supabase
          .from('user_preferences')
          .select('privacy_settings')
          .eq('user_id', user.id)
          .single();

        if (data?.privacy_settings) {
          setSettings(prev => ({ ...prev, ...data.privacy_settings }));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [supabase, router]);

  const handleChange = async (key: keyof PrivacySettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            privacy_settings: newSettings,
            updated_at: new Date().toISOString(),
          });
      }

      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('비밀번호는 8자 이상이어야 합니다');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (error) {
      setPasswordError('비밀번호 변경에 실패했습니다');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDownloadData = async () => {
    setIsExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // 사용자 관련 모든 데이터 수집
      const exportData: Record<string, any> = {
        exportedAt: new Date().toISOString(),
        userId: user.id,
        email: user.email,
      };

      // 프로필 정보
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      exportData.profile = profile;

      // 크리에이터 설정
      const { data: creatorSettings } = await supabase
        .from('creator_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      exportData.creatorSettings = creatorSettings;

      // 사용자 환경설정
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      exportData.preferences = preferences;

      // 내 콘텐츠
      const { data: contents } = await supabase
        .from('contents')
        .select('*')
        .eq('creator_id', user.id);
      exportData.contents = contents || [];

      // 좋아요 목록
      const { data: likes } = await supabase
        .from('content_likes')
        .select('*')
        .eq('user_id', user.id);
      exportData.likes = likes || [];

      // 저장 목록
      const { data: saves } = await supabase
        .from('content_saves')
        .select('*')
        .eq('user_id', user.id);
      exportData.saves = saves || [];

      // 구매 내역
      const { data: purchases } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id);
      exportData.purchases = purchases || [];

      // 구독 정보
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('subscriber_id', user.id);
      exportData.subscriptions = subscriptions || [];

      // 메시지
      const { data: messages } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      exportData.messages = messages || [];

      // 조회 기록
      const { data: views } = await supabase
        .from('content_views')
        .select('*')
        .eq('user_id', user.id);
      exportData.views = views || [];

      // JSON 파일 다운로드
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studyearn-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('오류', '데이터 내보내기에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '계정 삭제') {
      toast.warning('입력 오류', '"계정 삭제"를 정확히 입력해주세요.');
      return;
    }

    setIsDeleting(true);
    try {
      // 사용자 데이터 삭제 (RPC 함수 호출)
      const { error: deleteError } = await supabase.rpc('delete_user_account');

      if (deleteError) {
        console.error('Failed to delete user data:', deleteError);
        throw deleteError;
      }

      // 로그아웃 처리
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('오류', '계정 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
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
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-100 sticky top-0 z-20"
      >
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-orange-500" />
                </div>
                <h1 className="text-lg font-bold text-gray-900">개인정보 및 보안</h1>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: showSaved ? 1 : 0, scale: showSaved ? 1 : 0.8 }}
              className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg"
            >
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">저장됨</span>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-2xl mx-auto px-4 py-6 space-y-6"
      >
        {/* Security */}
        <motion.div variants={itemVariants}>
          <Card className="border-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4" />
                보안
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-between py-4 border-b border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Key className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">비밀번호 변경</p>
                    <p className="text-sm text-gray-500">계정 비밀번호를 변경합니다</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">2단계 인증</p>
                      {settings.two_factor_enabled && (
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs">활성화</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">추가 보안 계층을 설정합니다</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={settings.two_factor_enabled}
                  onChange={(v) => {
                    if (v) {
                      setShow2FAModal(true);
                    } else {
                      handleChange('two_factor_enabled', false);
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Privacy */}
        <motion.div variants={itemVariants}>
          <Card className="border-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4" />
                프로필 공개 범위
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VisibilitySelector
                value={settings.profile_visibility}
                onChange={(v) => handleChange('profile_visibility', v)}
                options={[
                  { value: 'public', label: '전체 공개', description: '모든 사람이 프로필을 볼 수 있습니다' },
                  { value: 'followers', label: '팔로워만', description: '팔로워만 프로필을 볼 수 있습니다' },
                  { value: 'private', label: '비공개', description: '본인만 프로필을 볼 수 있습니다' },
                ]}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity */}
        <motion.div variants={itemVariants}>
          <Card className="border-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4" />
                활동 상태
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">온라인 상태 표시</p>
                    <p className="text-sm text-gray-500">다른 사람이 내 접속 상태를 볼 수 있습니다</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={settings.show_online_status}
                  onChange={(v) => handleChange('show_online_status', v)}
                />
              </div>
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Eye className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">활동 내역 공개</p>
                    <p className="text-sm text-gray-500">좋아요, 댓글 등의 활동을 공개합니다</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={settings.show_activity}
                  onChange={(v) => handleChange('show_activity', v)}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data & Account */}
        <motion.div variants={itemVariants}>
          <Card className="border-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Download className="w-4 h-4" />
                데이터
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <button
                onClick={handleDownloadData}
                disabled={isExporting}
                className="w-full flex items-center justify-between py-4 border-b border-gray-100 disabled:opacity-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    {isExporting ? (
                      <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">
                      {isExporting ? '데이터 수집 중...' : '내 데이터 내보내기'}
                    </p>
                    <p className="text-sm text-gray-500">모든 데이터를 다운로드합니다</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-between py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-red-600">계정 삭제</p>
                    <p className="text-sm text-gray-500">계정과 모든 데이터를 삭제합니다</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.main>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="비밀번호 변경"
      >
        <div className="space-y-4">
          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {passwordError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">현재 비밀번호</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowPasswordModal(false)} className="flex-1">
              취소
            </Button>
            <Button onClick={handlePasswordChange} isLoading={isChangingPassword} className="flex-1">
              변경하기
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2FA Modal */}
      <Modal
        isOpen={show2FAModal}
        onClose={() => {
          setShow2FAModal(false);
          setVerificationCode('');
          setTwoFAError('');
        }}
        title="2단계 인증 설정"
      >
        <div className="py-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              추가 보안 설정
            </h3>
            <p className="text-gray-500 text-sm">
              2단계 인증을 활성화하면 로그인 시 추가 인증이 필요합니다.
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-orange-800 mb-1">보안 강화 기능</p>
                <p className="text-sm text-orange-700">
                  2단계 인증은 현재 개발 중입니다. 곧 Google Authenticator,
                  SMS 인증 등 다양한 방식을 지원할 예정입니다.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                <Key className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">인증 앱</p>
                <p className="text-xs text-gray-500">Google Authenticator 등</p>
              </div>
              <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">준비 중</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">SMS 인증</p>
                <p className="text-xs text-gray-500">휴대폰 문자 인증</p>
              </div>
              <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">준비 중</Badge>
            </div>
          </div>

          <Button
            onClick={() => {
              setShow2FAModal(false);
              setVerificationCode('');
              setTwoFAError('');
            }}
            className="w-full"
          >
            확인
          </Button>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmText('');
        }}
        title="계정 삭제"
      >
        <div className="py-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              정말 계정을 삭제하시겠습니까?
            </h3>
            <p className="text-gray-500 text-sm">
              계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-700 mb-3">
              계정 삭제를 확인하려면 아래에 <strong>&quot;계정 삭제&quot;</strong>를 입력하세요.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="계정 삭제"
              className="w-full px-4 py-3 border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmText('');
              }}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmText !== '계정 삭제'}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                '삭제하기'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
