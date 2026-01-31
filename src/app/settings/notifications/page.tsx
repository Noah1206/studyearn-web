'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowLeft,
  Bell,
  BellRing,
  Mail,
  MessageSquare,
  Heart,
  Users,
  CreditCard,
  Megaphone,
  Moon,
  Loader2,
  Check,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, Spinner } from '@/components/ui';

interface NotificationSettings {
  email_marketing: boolean;
  email_updates: boolean;
  email_comments: boolean;
  push_likes: boolean;
  push_comments: boolean;
  push_follows: boolean;
  push_messages: boolean;
  push_purchases: boolean;
  push_announcements: boolean;
  quiet_hours: boolean;
  quiet_start: string;
  quiet_end: string;
}

const defaultSettings: NotificationSettings = {
  email_marketing: true,
  email_updates: true,
  email_comments: true,
  push_likes: true,
  push_comments: true,
  push_follows: true,
  push_messages: true,
  push_purchases: true,
  push_announcements: true,
  quiet_hours: false,
  quiet_start: '22:00',
  quiet_end: '08:00',
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
  disabled = false,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
        enabled ? 'bg-orange-500' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
      />
    </motion.button>
  );
}

function SettingItem({
  icon: Icon,
  title,
  description,
  enabled,
  onChange,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} />
    </div>
  );
}

export default function NotificationsSettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

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

        // Load from user_preferences table if exists
        const { data } = await supabase
          .from('user_preferences')
          .select('notification_settings')
          .eq('user_id', user.id)
          .single();

        if (data?.notification_settings) {
          setSettings(prev => ({ ...prev, ...data.notification_settings }));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [supabase, router]);

  const handleChange = async (key: keyof NotificationSettings, value: boolean | string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Auto-save
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            notification_settings: newSettings,
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
                  <Bell className="w-5 h-5 text-orange-500" />
                </div>
                <h1 className="text-lg font-bold text-gray-900">알림 설정</h1>
              </div>
            </div>

            {/* Save indicator */}
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
        {/* Push Notifications */}
        <motion.div variants={itemVariants}>
          <Card className="border-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <BellRing className="w-4 h-4" />
                푸시 알림
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SettingItem
                icon={Heart}
                title="좋아요"
                description="내 콘텐츠에 좋아요가 달렸을 때"
                enabled={settings.push_likes}
                onChange={(v) => handleChange('push_likes', v)}
              />
              <SettingItem
                icon={MessageSquare}
                title="댓글"
                description="내 콘텐츠에 댓글이 달렸을 때"
                enabled={settings.push_comments}
                onChange={(v) => handleChange('push_comments', v)}
              />
              <SettingItem
                icon={Users}
                title="팔로우"
                description="새로운 팔로워가 생겼을 때"
                enabled={settings.push_follows}
                onChange={(v) => handleChange('push_follows', v)}
              />
              <SettingItem
                icon={MessageSquare}
                title="메시지"
                description="새로운 메시지를 받았을 때"
                enabled={settings.push_messages}
                onChange={(v) => handleChange('push_messages', v)}
              />
              <SettingItem
                icon={CreditCard}
                title="구매 및 정산"
                description="구매 완료, 정산 관련 알림"
                enabled={settings.push_purchases}
                onChange={(v) => handleChange('push_purchases', v)}
              />
              <SettingItem
                icon={Megaphone}
                title="공지사항"
                description="서비스 공지 및 이벤트 알림"
                enabled={settings.push_announcements}
                onChange={(v) => handleChange('push_announcements', v)}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Email Notifications */}
        <motion.div variants={itemVariants}>
          <Card className="border-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-4 h-4" />
                이메일 알림
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SettingItem
                icon={MessageSquare}
                title="댓글 알림"
                description="내 콘텐츠에 댓글이 달렸을 때"
                enabled={settings.email_comments}
                onChange={(v) => handleChange('email_comments', v)}
              />
              <SettingItem
                icon={Bell}
                title="서비스 업데이트"
                description="새로운 기능 및 업데이트 소식"
                enabled={settings.email_updates}
                onChange={(v) => handleChange('email_updates', v)}
              />
              <SettingItem
                icon={Megaphone}
                title="마케팅 이메일"
                description="프로모션 및 이벤트 정보"
                enabled={settings.email_marketing}
                onChange={(v) => handleChange('email_marketing', v)}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Quiet Hours */}
        <motion.div variants={itemVariants}>
          <Card className="border-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Moon className="w-4 h-4" />
                방해 금지 모드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Moon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">방해 금지 시간</p>
                    <p className="text-sm text-gray-500">설정한 시간에는 알림을 받지 않습니다</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={settings.quiet_hours}
                  onChange={(v) => handleChange('quiet_hours', v)}
                />
              </div>

              {settings.quiet_hours && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-sm text-gray-500 mb-1 block">시작</label>
                      <input
                        type="time"
                        value={settings.quiet_start}
                        onChange={(e) => handleChange('quiet_start', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm text-gray-500 mb-1 block">종료</label>
                      <input
                        type="time"
                        value={settings.quiet_end}
                        onChange={(e) => handleChange('quiet_end', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Info */}
        <motion.p variants={itemVariants} className="text-sm text-gray-500 text-center">
          알림 설정은 자동으로 저장됩니다
        </motion.p>
      </motion.main>
    </motion.div>
  );
}
