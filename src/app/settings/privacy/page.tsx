'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Modal } from '@/components/ui';

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

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from('user_preferences')
        .select('privacy_settings')
        .eq('user_id', user.id)
        .single();

      if (data?.privacy_settings) {
        setSettings({ ...defaultSettings, ...data.privacy_settings });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = async (key: keyof PrivacySettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    setIsSaving(true);
    try {
      const supabase = createClient();
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
      const supabase = createClient();
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
    // TODO: Implement data export
    alert('데이터 내보내기 기능은 준비 중입니다');
  };

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
                className="w-full flex items-center justify-between py-4 border-b border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Download className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">내 데이터 내보내기</p>
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
        onClose={() => setShow2FAModal(false)}
        title="2단계 인증 설정"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-gray-600 mb-6">
            2단계 인증 기능은 곧 지원될 예정입니다.
          </p>
          <Button onClick={() => setShow2FAModal(false)} className="w-full">
            확인
          </Button>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="계정 삭제"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            정말 계정을 삭제하시겠습니까?
          </h3>
          <p className="text-gray-500 mb-6">
            계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1">
              취소
            </Button>
            <Button
              onClick={() => {
                // TODO: Implement account deletion
                setShowDeleteModal(false);
              }}
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              삭제하기
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
