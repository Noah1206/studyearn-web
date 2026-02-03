'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Mail,
  MessageCircle,
  Heart,
  Users,
  DollarSign,
  Settings,
  Smartphone,
  Globe,
  Check,
  Loader2,
  Info,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Button, Card, CardContent, Badge, Spinner, useToastActions } from '@/components/ui';

// Notification Categories
const NOTIFICATION_CATEGORIES = [
  {
    id: 'subscribers',
    title: '구독 알림',
    description: '새로운 구독자, 구독 취소, 티어 변경 알림',
    icon: Users,
    color: 'bg-orange-100 text-orange-600',
    settings: [
      { key: 'new_subscriber', label: '새 구독자', description: '누군가 구독을 시작했을 때' },
      { key: 'subscription_cancelled', label: '구독 취소', description: '구독자가 구독을 취소했을 때' },
      { key: 'tier_upgrade', label: '티어 업그레이드', description: '구독자가 더 높은 티어로 변경했을 때' },
    ],
  },
  {
    id: 'engagement',
    title: '참여 알림',
    description: '댓글, 좋아요, 공유 알림',
    icon: Heart,
    color: 'bg-pink-100 text-pink-600',
    settings: [
      { key: 'new_comment', label: '새 댓글', description: '콘텐츠에 댓글이 달렸을 때' },
      { key: 'new_like', label: '좋아요', description: '콘텐츠에 좋아요가 눌렸을 때' },
      { key: 'mention', label: '멘션', description: '누군가 나를 언급했을 때' },
    ],
  },
  {
    id: 'earnings',
    title: '수익 알림',
    description: '결제, 정산, 후원 알림',
    icon: DollarSign,
    color: 'bg-green-100 text-green-600',
    settings: [
      { key: 'new_payment', label: '새 결제', description: '콘텐츠 구매나 구독 결제가 완료됐을 때' },
      { key: 'payout_completed', label: '정산 완료', description: '정산금이 입금됐을 때' },
      { key: 'tip_received', label: '후원 받음', description: '팬으로부터 후원을 받았을 때' },
    ],
  },
  {
    id: 'messages',
    title: '메시지 알림',
    description: 'DM, 문의 알림',
    icon: MessageCircle,
    color: 'bg-purple-100 text-purple-600',
    settings: [
      { key: 'new_message', label: '새 메시지', description: '새 다이렉트 메시지를 받았을 때' },
      { key: 'support_inquiry', label: '문의', description: '팬으로부터 문의가 왔을 때' },
    ],
  },
  {
    id: 'system',
    title: '시스템 알림',
    description: '공지사항, 정책 변경, 보안 알림',
    icon: Bell,
    color: 'bg-gray-100 text-gray-600',
    settings: [
      { key: 'announcements', label: '공지사항', description: '스터플 공지사항 및 업데이트' },
      { key: 'security_alerts', label: '보안 알림', description: '계정 보안 관련 알림' },
      { key: 'policy_updates', label: '정책 변경', description: '서비스 정책 변경 안내' },
    ],
  },
];

// Notification Channels
const NOTIFICATION_CHANNELS = [
  { key: 'push', label: '푸시 알림', icon: Smartphone, description: '앱 푸시 알림' },
  { key: 'email', label: '이메일', icon: Mail, description: '이메일 알림' },
  { key: 'inApp', label: '인앱 알림', icon: Globe, description: '사이트 내 알림' },
];

interface NotificationSettings {
  [category: string]: {
    [setting: string]: {
      push: boolean;
      email: boolean;
      inApp: boolean;
    };
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const toast = useToastActions();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({});
  const [globalSettings, setGlobalSettings] = useState({
    muteAll: false,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    emailDigest: 'daily',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);

    // Initialize default settings
    const defaultSettings: NotificationSettings = {};
    NOTIFICATION_CATEGORIES.forEach((category) => {
      defaultSettings[category.id] = {};
      category.settings.forEach((setting) => {
        defaultSettings[category.id][setting.key] = {
          push: true,
          email: category.id !== 'engagement', // Default: engagement emails off
          inApp: true,
        };
      });
    });

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Load from user_preferences table
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('creator_notification_settings')
          .eq('user_id', user.id)
          .maybeSingle();

        if (preferences?.creator_notification_settings) {
          const saved = preferences.creator_notification_settings;
          setSettings({ ...defaultSettings, ...saved.settings });
          setGlobalSettings(prev => ({ ...prev, ...saved.globalSettings }));
        } else {
          setSettings(defaultSettings);
        }
      } else {
        setSettings(defaultSettings);
      }
    } catch {
      setSettings(defaultSettings);
    }

    setIsLoading(false);
  };

  const toggleSetting = (categoryId: string, settingKey: string, channel: 'push' | 'email' | 'inApp') => {
    setSettings((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [settingKey]: {
          ...prev[categoryId][settingKey],
          [channel]: !prev[categoryId][settingKey][channel],
        },
      },
    }));
  };

  const toggleAllForCategory = (categoryId: string, channel: 'push' | 'email' | 'inApp', value: boolean) => {
    const category = NOTIFICATION_CATEGORIES.find((c) => c.id === categoryId);
    if (!category) return;

    setSettings((prev) => {
      const newCategorySettings = { ...prev[categoryId] };
      category.settings.forEach((setting) => {
        newCategorySettings[setting.key] = {
          ...newCategorySettings[setting.key],
          [channel]: value,
        };
      });
      return { ...prev, [categoryId]: newCategorySettings };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          creator_notification_settings: { settings, globalSettings },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success('저장 완료', '설정이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('오류', '설정 저장에 실패했습니다.');
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">알림 설정</h1>
                <p className="text-gray-500 text-sm mt-1">알림 수신 방식을 설정하세요</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  저장
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Global Settings */}
        <Card className="border-0 shadow-sm mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">전체 설정</h2>
                <p className="text-sm text-gray-500">알림 전체에 적용되는 설정</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Mute All */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">모든 알림 끄기</p>
                  <p className="text-sm text-gray-500">일시적으로 모든 알림을 받지 않습니다</p>
                </div>
                <button
                  onClick={() => setGlobalSettings((prev) => ({ ...prev, muteAll: !prev.muteAll }))}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-colors',
                    globalSettings.muteAll ? 'bg-gray-900' : 'bg-gray-200'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                      globalSettings.muteAll ? 'translate-x-7' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Quiet Hours */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">방해 금지 시간</p>
                  <p className="text-sm text-gray-500">
                    {globalSettings.quietHoursEnabled
                      ? `${globalSettings.quietHoursStart} ~ ${globalSettings.quietHoursEnd}`
                      : '설정된 시간에 알림을 받지 않습니다'}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setGlobalSettings((prev) => ({
                      ...prev,
                      quietHoursEnabled: !prev.quietHoursEnabled,
                    }))
                  }
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-colors',
                    globalSettings.quietHoursEnabled ? 'bg-gray-900' : 'bg-gray-200'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                      globalSettings.quietHoursEnabled ? 'translate-x-7' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Quiet Hours Time Selection */}
              {globalSettings.quietHoursEnabled && (
                <div className="flex items-center gap-4 py-3 pl-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">시작</label>
                    <input
                      type="time"
                      value={globalSettings.quietHoursStart}
                      onChange={(e) =>
                        setGlobalSettings((prev) => ({
                          ...prev,
                          quietHoursStart: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">종료</label>
                    <input
                      type="time"
                      value={globalSettings.quietHoursEnd}
                      onChange={(e) =>
                        setGlobalSettings((prev) => ({
                          ...prev,
                          quietHoursEnd: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Email Digest */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">이메일 요약</p>
                  <p className="text-sm text-gray-500">알림을 요약해서 이메일로 받습니다</p>
                </div>
                <select
                  value={globalSettings.emailDigest}
                  onChange={(e) =>
                    setGlobalSettings((prev) => ({ ...prev, emailDigest: e.target.value }))
                  }
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="realtime">실시간</option>
                  <option value="daily">매일</option>
                  <option value="weekly">매주</option>
                  <option value="never">받지 않음</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Settings */}
        <div className="space-y-6">
          {NOTIFICATION_CATEGORIES.map((category) => {
            const CategoryIcon = category.icon;
            const categorySettings = settings[category.id] || {};

            return (
              <Card key={category.id} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', category.color)}>
                        <CategoryIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">{category.title}</h2>
                        <p className="text-sm text-gray-500">{category.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Settings Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 pr-4 text-sm font-medium text-gray-500">
                            알림 유형
                          </th>
                          {NOTIFICATION_CHANNELS.map((channel) => (
                            <th
                              key={channel.key}
                              className="px-4 py-3 text-center text-sm font-medium text-gray-500"
                            >
                              <div className="flex flex-col items-center gap-1">
                                <channel.icon className="w-4 h-4" />
                                <span className="text-xs">{channel.label}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {category.settings.map((setting) => {
                          const settingValues = categorySettings[setting.key] || {
                            push: true,
                            email: true,
                            inApp: true,
                          };

                          return (
                            <tr key={setting.key} className="border-b border-gray-50 last:border-0">
                              <td className="py-4 pr-4">
                                <p className="font-medium text-gray-900 text-sm">{setting.label}</p>
                                <p className="text-xs text-gray-500">{setting.description}</p>
                              </td>
                              {NOTIFICATION_CHANNELS.map((channel) => (
                                <td key={channel.key} className="px-4 py-4 text-center">
                                  <button
                                    onClick={() =>
                                      toggleSetting(
                                        category.id,
                                        setting.key,
                                        channel.key as 'push' | 'email' | 'inApp'
                                      )
                                    }
                                    disabled={globalSettings.muteAll}
                                    className={cn(
                                      'relative w-10 h-5 rounded-full transition-colors',
                                      settingValues[channel.key as keyof typeof settingValues] &&
                                        !globalSettings.muteAll
                                        ? 'bg-gray-900'
                                        : 'bg-gray-200',
                                      globalSettings.muteAll && 'opacity-50 cursor-not-allowed'
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        'absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform',
                                        settingValues[channel.key as keyof typeof settingValues] &&
                                          !globalSettings.muteAll
                                          ? 'translate-x-5'
                                          : 'translate-x-0.5'
                                      )}
                                    />
                                  </button>
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Notice */}
        <Card className="border-0 shadow-sm mt-8 bg-orange-50 border border-orange-100">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-1">알림 설정 안내</p>
                <p className="text-orange-700">
                  푸시 알림을 받으려면 브라우저 알림 권한을 허용해야 합니다.
                  이메일 알림은 계정에 등록된 이메일 주소로 발송됩니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
