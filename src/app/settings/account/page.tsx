'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowLeft,
  Settings,
  Globe,
  LogOut,
  Trash2,
  AlertTriangle,
  Check,
  Loader2,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Button, Card, CardContent, Spinner, useToastActions } from '@/components/ui';

// Animation variants
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

interface AccountSettings {
  language: string;
  theme: 'light' | 'dark' | 'system';
}

const LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
];

export default function AccountSettingsPage() {
  const router = useRouter();
  const toast = useToastActions();
  const supabase = useMemo(() => createClient(), []);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [settings, setSettings] = useState<AccountSettings>({
    language: 'ko',
    theme: 'system',
  });

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

        // DB에서 설정 로드
        const { data } = await supabase
          .from('user_preferences')
          .select('account_settings')
          .eq('user_id', user.id)
          .single();

        if (data?.account_settings) {
          setSettings(prev => ({ ...prev, ...data.account_settings }));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [supabase, router]);

  const handleLanguageChange = (code: string) => {
    setSettings(prev => ({ ...prev, language: code }));
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            account_settings: settings,
            updated_at: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Failed to logout:', error);
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
        className="bg-white border-b border-gray-200 sticky top-0 z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }}
      >
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">계정</h1>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <motion.main
        className="max-w-2xl mx-auto px-4 py-6 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Language Settings */}
        <motion.div variants={itemVariants}>
        <Card>
          <CardContent>
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              언어
            </h2>

            <div className="space-y-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={cn(
                    'w-full p-4 rounded-lg border-2 text-left transition-colors flex items-center justify-between',
                    settings.language === lang.code
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <span className="font-medium text-gray-900">{lang.label}</span>
                  {settings.language === lang.code && (
                    <Check className="w-5 h-5 text-gray-900" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Theme Settings */}
        <motion.div variants={itemVariants}>
        <Card>
          <CardContent>
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sun className="w-5 h-5" />
              테마
            </h2>

            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'light', label: '라이트', icon: Sun },
                { value: 'dark', label: '다크', icon: Moon },
                { value: 'system', label: '시스템', icon: Settings },
              ].map((theme) => {
                const Icon = theme.icon;
                return (
                  <button
                    key={theme.value}
                    onClick={() => handleThemeChange(theme.value as 'light' | 'dark' | 'system')}
                    className={cn(
                      'p-4 rounded-lg border-2 text-center transition-colors',
                      settings.theme === theme.value
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <Icon className={cn(
                      'w-6 h-6 mx-auto mb-2',
                      settings.theme === theme.value ? 'text-gray-900' : 'text-gray-400'
                    )} />
                    <span className={cn(
                      'text-sm font-medium',
                      settings.theme === theme.value ? 'text-gray-900' : 'text-gray-600'
                    )}>
                      {theme.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div variants={itemVariants}>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          fullWidth
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              설정 저장
            </>
          )}
        </Button>
        </motion.div>

        {/* Logout */}
        <motion.div variants={itemVariants}>
        <Card>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleLogout}
              fullWidth
              className="justify-between"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-5 h-5" />
                로그아웃
              </span>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </CardContent>
        </Card>
        </motion.div>

        {/* Delete Account */}
        <motion.div variants={itemVariants}>
        <Card className="border-red-200">
          <CardContent>
            <h2 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              위험 구역
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>

            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                계정 삭제
              </Button>
            ) : (
              <div className="space-y-4 p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700 font-medium">
                  계정 삭제를 확인하려면 &quot;계정 삭제&quot;를 입력하세요.
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="계정 삭제"
                  className="w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmText !== '계정 삭제'}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      '삭제 확인'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>
      </motion.main>
    </motion.div>
  );
}
