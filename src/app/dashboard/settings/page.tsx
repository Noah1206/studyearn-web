'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Camera,
  Link as LinkIcon,
  Globe,
  Shield,
  CreditCard,
  Bell,
  Palette,
  Save,
  Loader2,
  Check,
  X,
  ExternalLink,
  Instagram,
  Youtube,
  Twitter,
  MessageCircle,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Button, Card, CardContent, Input } from '@/components/ui';
import type { CreatorSettings } from '@/types/database';

// Tab Configuration
const TABS = [
  { id: 'profile', label: '프로필', icon: User },
  { id: 'links', label: '링크', icon: LinkIcon },
  { id: 'page', label: '페이지 설정', icon: Palette },
  { id: 'privacy', label: '개인정보', icon: Shield },
];

// Social Platforms
const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@username' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: '채널 URL' },
  { key: 'twitter', label: 'Twitter/X', icon: Twitter, placeholder: '@username' },
  { key: 'discord', label: 'Discord', icon: MessageCircle, placeholder: '서버 초대 링크' },
];

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [creatorSettings, setCreatorSettings] = useState<CreatorSettings | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form States
  const [profileForm, setProfileForm] = useState({
    display_name: '',
    bio: '',
    profile_image_url: '',
    banner_image_url: '',
  });

  const [linksForm, setLinksForm] = useState({
    website: '',
    instagram: '',
    youtube: '',
    twitter: '',
    discord: '',
  });

  const [pageForm, setPageForm] = useState({
    is_accepting_questions: true,
    default_content_access: 'public' as 'public' | 'subscribers' | 'tier' | 'paid',
    show_subscriber_count: true,
    allow_comments: true,
    theme_color: '#3B82F6',
  });

  const [privacyForm, setPrivacyForm] = useState({
    show_in_search: true,
    allow_recommendations: true,
    hide_earnings: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: settings } = await supabase
        .from('creator_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settings) {
        setCreatorSettings(settings);
        setProfileForm({
          display_name: settings.display_name || '',
          bio: settings.bio || '',
          profile_image_url: settings.profile_image_url || '',
          banner_image_url: settings.banner_image_url || '',
        });
        setPageForm({
          is_accepting_questions: settings.is_accepting_questions ?? true,
          default_content_access: settings.default_content_access || 'public',
          show_subscriber_count: true,
          allow_comments: true,
          theme_color: '#3B82F6',
        });
      }

      // Load links from localStorage (or could be separate table)
      const savedLinks = localStorage.getItem('stuple_creator_links');
      if (savedLinks) {
        setLinksForm(JSON.parse(savedLinks));
      }

      const savedPrivacy = localStorage.getItem('stuple_privacy_settings');
      if (savedPrivacy) {
        setPrivacyForm(JSON.parse(savedPrivacy));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    const newErrors: Record<string, string> = {};

    if (!profileForm.display_name.trim()) {
      newErrors.display_name = '닉네임을 입력해주세요';
    } else if (profileForm.display_name.length > 30) {
      newErrors.display_name = '닉네임은 30자 이내로 입력해주세요';
    }

    if (profileForm.bio && profileForm.bio.length > 500) {
      newErrors.bio = '소개는 500자 이내로 입력해주세요';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('creator_settings')
        .update({
          display_name: profileForm.display_name,
          bio: profileForm.bio,
          profile_image_url: profileForm.profile_image_url,
          banner_image_url: profileForm.banner_image_url,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setErrors({});
      alert('프로필이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLinks = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('stuple_creator_links', JSON.stringify(linksForm));
      await new Promise((resolve) => setTimeout(resolve, 300));
      alert('링크가 저장되었습니다.');
    } catch (error) {
      alert('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePageSettings = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('creator_settings')
        .update({
          is_accepting_questions: pageForm.is_accepting_questions,
          default_content_access: pageForm.default_content_access,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
      alert('페이지 설정이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save page settings:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('stuple_privacy_settings', JSON.stringify(privacyForm));
      await new Promise((resolve) => setTimeout(resolve, 300));
      alert('개인정보 설정이 저장되었습니다.');
    } catch (error) {
      alert('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">크리에이터 설정</h1>
              <p className="text-gray-500 text-sm mt-1">채널 설정을 관리하세요</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Tabs */}
          <div className="w-48 flex-shrink-0">
            <nav className="space-y-1">
              {TABS.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
                      activeTab === tab.id
                        ? 'bg-gray-50 text-gray-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <TabIcon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-6">프로필 설정</h2>

                  {/* Profile Image */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      프로필 이미지
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {profileForm.profile_image_url ? (
                          <img
                            src={profileForm.profile_image_url}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <Button variant="outline" size="sm">
                          <Camera className="w-4 h-4 mr-2" />
                          이미지 변경
                        </Button>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG, PNG (최대 2MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Banner Image */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      배너 이미지
                    </label>
                    <div
                      className="w-full h-32 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden relative group cursor-pointer"
                      style={{
                        backgroundImage: profileForm.banner_image_url
                          ? `url(${profileForm.banner_image_url})`
                          : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="sm">
                          <ImageIcon className="w-4 h-4 mr-2" />
                          배너 변경
                        </Button>
                      </div>
                      {!profileForm.banner_image_url && (
                        <div className="text-center">
                          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">배너 이미지 추가</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      권장 크기: 1200 x 300px
                    </p>
                  </div>

                  {/* Display Name */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      닉네임 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={profileForm.display_name}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, display_name: e.target.value }))
                      }
                      placeholder="채널 이름을 입력하세요"
                      error={errors.display_name}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {profileForm.display_name.length}/30
                    </p>
                  </div>

                  {/* Bio */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">소개</label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, bio: e.target.value }))
                      }
                      placeholder="채널에 대해 소개해주세요"
                      rows={4}
                      className={cn(
                        'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none',
                        errors.bio ? 'border-red-300' : 'border-gray-200'
                      )}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {profileForm.bio?.length || 0}/500
                    </p>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full">
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        프로필 저장
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Links Tab */}
            {activeTab === 'links' && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-6">소셜 링크</h2>

                  {/* Website */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Globe className="w-4 h-4 inline mr-2" />
                      웹사이트
                    </label>
                    <Input
                      value={linksForm.website}
                      onChange={(e) =>
                        setLinksForm((prev) => ({ ...prev, website: e.target.value }))
                      }
                      placeholder="https://example.com"
                    />
                  </div>

                  {/* Social Platforms */}
                  {SOCIAL_PLATFORMS.map((platform) => {
                    const PlatformIcon = platform.icon;
                    return (
                      <div key={platform.key} className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <PlatformIcon className="w-4 h-4 inline mr-2" />
                          {platform.label}
                        </label>
                        <Input
                          value={linksForm[platform.key as keyof typeof linksForm] || ''}
                          onChange={(e) =>
                            setLinksForm((prev) => ({
                              ...prev,
                              [platform.key]: e.target.value,
                            }))
                          }
                          placeholder={platform.placeholder}
                        />
                      </div>
                    );
                  })}

                  <Button onClick={handleSaveLinks} disabled={isSaving} className="w-full mt-4">
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        링크 저장
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Page Settings Tab */}
            {activeTab === 'page' && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-6">페이지 설정</h2>

                  <div className="space-y-6">
                    {/* Questions Toggle */}
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">질문 받기</p>
                        <p className="text-sm text-gray-500">
                          팬들이 질문을 보낼 수 있도록 허용합니다
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setPageForm((prev) => ({
                            ...prev,
                            is_accepting_questions: !prev.is_accepting_questions,
                          }))
                        }
                        className={cn(
                          'relative w-12 h-6 rounded-full transition-colors',
                          pageForm.is_accepting_questions ? 'bg-gray-900' : 'bg-gray-200'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                            pageForm.is_accepting_questions ? 'translate-x-7' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>

                    {/* Default Content Access */}
                    <div className="py-3 border-b border-gray-100">
                      <p className="font-medium text-gray-900 mb-2">기본 콘텐츠 공개 범위</p>
                      <p className="text-sm text-gray-500 mb-3">
                        새 콘텐츠의 기본 공개 범위를 설정합니다
                      </p>
                      <select
                        value={pageForm.default_content_access}
                        onChange={(e) =>
                          setPageForm((prev) => ({
                            ...prev,
                            default_content_access: e.target.value as typeof prev.default_content_access,
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                      >
                        <option value="public">공개 - 모든 사람</option>
                        <option value="subscribers">구독자 전용</option>
                        <option value="tier">특정 티어 이상</option>
                        <option value="paid">유료 콘텐츠</option>
                      </select>
                    </div>

                    {/* Show Subscriber Count */}
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">구독자 수 표시</p>
                        <p className="text-sm text-gray-500">
                          프로필에 구독자 수를 표시합니다
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setPageForm((prev) => ({
                            ...prev,
                            show_subscriber_count: !prev.show_subscriber_count,
                          }))
                        }
                        className={cn(
                          'relative w-12 h-6 rounded-full transition-colors',
                          pageForm.show_subscriber_count ? 'bg-gray-900' : 'bg-gray-200'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                            pageForm.show_subscriber_count ? 'translate-x-7' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>

                    {/* Allow Comments */}
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-gray-900">댓글 허용</p>
                        <p className="text-sm text-gray-500">
                          콘텐츠에 댓글을 허용합니다
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setPageForm((prev) => ({
                            ...prev,
                            allow_comments: !prev.allow_comments,
                          }))
                        }
                        className={cn(
                          'relative w-12 h-6 rounded-full transition-colors',
                          pageForm.allow_comments ? 'bg-gray-900' : 'bg-gray-200'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                            pageForm.allow_comments ? 'translate-x-7' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  <Button onClick={handleSavePageSettings} disabled={isSaving} className="w-full mt-6">
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        설정 저장
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-6">개인정보 설정</h2>

                  <div className="space-y-6">
                    {/* Show in Search */}
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">검색 노출</p>
                        <p className="text-sm text-gray-500">
                          검색 결과에 채널이 표시됩니다
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setPrivacyForm((prev) => ({
                            ...prev,
                            show_in_search: !prev.show_in_search,
                          }))
                        }
                        className={cn(
                          'relative w-12 h-6 rounded-full transition-colors',
                          privacyForm.show_in_search ? 'bg-gray-900' : 'bg-gray-200'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                            privacyForm.show_in_search ? 'translate-x-7' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>

                    {/* Allow Recommendations */}
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">추천 허용</p>
                        <p className="text-sm text-gray-500">
                          다른 사용자에게 채널이 추천됩니다
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setPrivacyForm((prev) => ({
                            ...prev,
                            allow_recommendations: !prev.allow_recommendations,
                          }))
                        }
                        className={cn(
                          'relative w-12 h-6 rounded-full transition-colors',
                          privacyForm.allow_recommendations ? 'bg-gray-900' : 'bg-gray-200'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                            privacyForm.allow_recommendations ? 'translate-x-7' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>

                    {/* Hide Earnings */}
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-gray-900">수익 비공개</p>
                        <p className="text-sm text-gray-500">
                          수익 정보를 다른 사람에게 숨깁니다
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setPrivacyForm((prev) => ({
                            ...prev,
                            hide_earnings: !prev.hide_earnings,
                          }))
                        }
                        className={cn(
                          'relative w-12 h-6 rounded-full transition-colors',
                          privacyForm.hide_earnings ? 'bg-gray-900' : 'bg-gray-200'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                            privacyForm.hide_earnings ? 'translate-x-7' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">데이터 삭제 요청</p>
                        <p className="text-yellow-700">
                          계정 및 모든 데이터 삭제를 원하시면 고객센터로 문의해주세요.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleSavePrivacy} disabled={isSaving} className="w-full mt-6">
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        설정 저장
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
