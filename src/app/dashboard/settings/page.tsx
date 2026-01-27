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
  Wallet,
  Banknote,
  Smartphone,
  Building2,
  Copy,
  CheckCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Button, Card, CardContent, Input, Spinner, useToastActions } from '@/components/ui';
import type { CreatorSettings } from '@/types/database';

// Tab Configuration
const TABS = [
  { id: 'profile', label: '프로필', icon: User },
  { id: 'links', label: '링크', icon: LinkIcon },
  { id: 'payment', label: '결제수단', icon: Wallet },
  { id: 'page', label: '페이지 설정', icon: Palette },
  { id: 'privacy', label: '개인정보', icon: Shield },
];

// Payment Method Options
const PAYMENT_METHODS = [
  {
    id: 'toss_id',
    label: '토스 아이디',
    icon: Smartphone,
    description: '토스 앱에서 사용하는 아이디로 송금받을 수 있어요',
    placeholder: '토스 아이디 입력 (예: studycreator)',
  },
  {
    id: 'kakaopay',
    label: '카카오페이',
    icon: Banknote,
    description: '카카오페이 송금 링크로 결제받을 수 있어요',
    placeholder: '카카오페이 송금 링크 (예: https://qr.kakaopay.com/xxx)',
  },
  {
    id: 'bank_account',
    label: '계좌이체',
    icon: Building2,
    description: '은행 계좌로 직접 송금받을 수 있어요',
    placeholder: '',
  },
];

// Korean Bank List
const BANKS = [
  '카카오뱅크', '토스뱅크', '국민은행', '신한은행', '우리은행',
  '하나은행', 'NH농협', '기업은행', 'SC제일은행', '새마을금고',
  '우체국', '대구은행', '부산은행', '경남은행', '광주은행',
];

// Social Platforms
const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@username' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: '채널 URL' },
  { key: 'twitter', label: 'Twitter/X', icon: Twitter, placeholder: '@username' },
  { key: 'discord', label: 'Discord', icon: MessageCircle, placeholder: '서버 초대 링크' },
];

export default function SettingsPage() {
  const toast = useToastActions();
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
    theme_color: '#F97316',
  });

  const [privacyForm, setPrivacyForm] = useState({
    show_in_search: true,
    allow_recommendations: true,
    hide_earnings: false,
  });

  const [paymentForm, setPaymentForm] = useState({
    payment_method: '' as '' | 'toss_id' | 'kakaopay' | 'bank_account',
    toss_id: '',
    kakaopay_link: '',
    bank_name: '',
    bank_account: '',
    account_holder: '',
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
          theme_color: '#F97316',
        });
        // Load payment settings
        setPaymentForm({
          payment_method: (settings.payment_method as typeof paymentForm.payment_method) || '',
          toss_id: settings.toss_id || '',
          kakaopay_link: settings.kakaopay_link || '',
          bank_name: settings.bank_name || '',
          bank_account: settings.bank_account || '',
          account_holder: settings.account_holder || '',
        });
      }

      // Load links and privacy from user_preferences table
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('social_links, privacy_settings')
        .eq('user_id', user.id)
        .single();

      if (preferences) {
        if (preferences.social_links) {
          setLinksForm(prev => ({ ...prev, ...preferences.social_links }));
        }
        if (preferences.privacy_settings) {
          setPrivacyForm(prev => ({ ...prev, ...preferences.privacy_settings }));
        }
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
      toast.success('저장 완료', '프로필이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('오류', '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLinks = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          social_links: linksForm,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('저장 완료', '링크가 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save links:', error);
      toast.error('오류', '저장에 실패했습니다.');
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
      toast.success('저장 완료', '페이지 설정이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save page settings:', error);
      toast.error('오류', '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          privacy_settings: privacyForm,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('저장 완료', '개인정보 설정이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      toast.error('오류', '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePayment = async () => {
    const newErrors: Record<string, string> = {};

    // Validation based on selected payment method
    if (paymentForm.payment_method === 'toss_id') {
      if (!paymentForm.toss_id.trim()) {
        newErrors.toss_id = '토스 아이디를 입력해주세요';
      }
    } else if (paymentForm.payment_method === 'kakaopay') {
      if (!paymentForm.kakaopay_link.trim()) {
        newErrors.kakaopay_link = '카카오페이 송금 링크를 입력해주세요';
      } else if (!paymentForm.kakaopay_link.includes('kakaopay.com')) {
        newErrors.kakaopay_link = '올바른 카카오페이 링크를 입력해주세요';
      }
    } else if (paymentForm.payment_method === 'bank_account') {
      if (!paymentForm.bank_name) {
        newErrors.bank_name = '은행을 선택해주세요';
      }
      if (!paymentForm.bank_account.trim()) {
        newErrors.bank_account = '계좌번호를 입력해주세요';
      }
      if (!paymentForm.account_holder.trim()) {
        newErrors.account_holder = '예금주명을 입력해주세요';
      }
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
          payment_method: paymentForm.payment_method || null,
          toss_id: paymentForm.toss_id || null,
          kakaopay_link: paymentForm.kakaopay_link || null,
          bank_name: paymentForm.bank_name || null,
          bank_account: paymentForm.bank_account || null,
          account_holder: paymentForm.account_holder || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setErrors({});
      toast.success('저장 완료', '결제수단이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save payment settings:', error);
      toast.error('오류', '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
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

            {/* Payment Tab */}
            {activeTab === 'payment' && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">결제수단 설정</h2>
                  <p className="text-sm text-gray-500 mb-6">
                    유료 콘텐츠 판매 시 구매자에게 표시될 결제수단을 설정하세요.
                    구매자가 직접 송금하는 방식이에요.
                  </p>

                  {/* Payment Method Selection */}
                  <div className="space-y-3 mb-6">
                    {PAYMENT_METHODS.map((method) => {
                      const MethodIcon = method.icon;
                      const isSelected = paymentForm.payment_method === method.id;
                      return (
                        <button
                          key={method.id}
                          onClick={() =>
                            setPaymentForm((prev) => ({
                              ...prev,
                              payment_method: method.id as typeof prev.payment_method,
                            }))
                          }
                          className={cn(
                            'w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left',
                            isSelected
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          )}
                        >
                          <div
                            className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                              isSelected ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'
                            )}
                          >
                            <MethodIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                'font-medium',
                                isSelected ? 'text-orange-600' : 'text-gray-900'
                              )}
                            >
                              {method.label}
                            </p>
                            <p className="text-sm text-gray-500">{method.description}</p>
                          </div>
                          <div
                            className={cn(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1',
                              isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                            )}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Toss ID Input */}
                  {paymentForm.payment_method === 'toss_id' && (
                    <div className="p-4 bg-orange-50 rounded-xl mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        토스 아이디
                      </label>
                      <Input
                        value={paymentForm.toss_id}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({ ...prev, toss_id: e.target.value }))
                        }
                        placeholder="토스 아이디 입력 (예: studycreator)"
                        error={errors.toss_id}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        💡 토스 앱 → 더보기 → 설정 → 내 토스 아이디에서 확인할 수 있어요
                      </p>
                    </div>
                  )}

                  {/* KakaoPay Link Input */}
                  {paymentForm.payment_method === 'kakaopay' && (
                    <div className="p-4 bg-yellow-50 rounded-xl mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        카카오페이 송금 링크
                      </label>
                      <Input
                        value={paymentForm.kakaopay_link}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({ ...prev, kakaopay_link: e.target.value }))
                        }
                        placeholder="https://qr.kakaopay.com/xxx"
                        error={errors.kakaopay_link}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        💡 카카오페이 앱 → 더보기 → 송금 → 송금 링크 만들기에서 생성할 수 있어요
                      </p>
                    </div>
                  )}

                  {/* Bank Account Input */}
                  {paymentForm.payment_method === 'bank_account' && (
                    <div className="p-4 bg-green-50 rounded-xl mb-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          은행 선택
                        </label>
                        <select
                          value={paymentForm.bank_name}
                          onChange={(e) =>
                            setPaymentForm((prev) => ({ ...prev, bank_name: e.target.value }))
                          }
                          className={cn(
                            'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent',
                            errors.bank_name ? 'border-red-300' : 'border-gray-200'
                          )}
                        >
                          <option value="">은행을 선택하세요</option>
                          {BANKS.map((bank) => (
                            <option key={bank} value={bank}>
                              {bank}
                            </option>
                          ))}
                        </select>
                        {errors.bank_name && (
                          <p className="text-xs text-red-500 mt-1">{errors.bank_name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          계좌번호
                        </label>
                        <Input
                          value={paymentForm.bank_account}
                          onChange={(e) =>
                            setPaymentForm((prev) => ({
                              ...prev,
                              bank_account: e.target.value.replace(/[^0-9-]/g, ''),
                            }))
                          }
                          placeholder="'-' 없이 숫자만 입력"
                          error={errors.bank_account}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          예금주명
                        </label>
                        <Input
                          value={paymentForm.account_holder}
                          onChange={(e) =>
                            setPaymentForm((prev) => ({ ...prev, account_holder: e.target.value }))
                          }
                          placeholder="예금주 이름"
                          error={errors.account_holder}
                        />
                      </div>
                    </div>
                  )}

                  {/* Preview Section */}
                  {paymentForm.payment_method && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">미리보기</h3>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-sm text-gray-600 mb-2">구매자에게 이렇게 보여요:</p>
                        <div className="bg-white rounded-lg p-4 border border-gray-100">
                          {paymentForm.payment_method === 'toss_id' && paymentForm.toss_id && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                  <Smartphone className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">토스로 송금</p>
                                  <p className="text-sm text-gray-500">
                                    토스 아이디: {paymentForm.toss_id}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => copyToClipboard(paymentForm.toss_id, 'toss_id')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                {copiedField === 'toss_id' ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Copy className="w-5 h-5 text-gray-400" />
                                )}
                              </button>
                            </div>
                          )}
                          {paymentForm.payment_method === 'kakaopay' && paymentForm.kakaopay_link && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                  <Banknote className="w-5 h-5 text-yellow-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">카카오페이로 송금</p>
                                  <p className="text-sm text-gray-500 truncate max-w-[200px]">
                                    {paymentForm.kakaopay_link}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  copyToClipboard(paymentForm.kakaopay_link, 'kakaopay_link')
                                }
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                {copiedField === 'kakaopay_link' ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Copy className="w-5 h-5 text-gray-400" />
                                )}
                              </button>
                            </div>
                          )}
                          {paymentForm.payment_method === 'bank_account' &&
                            paymentForm.bank_name &&
                            paymentForm.bank_account && (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">계좌이체</p>
                                    <p className="text-sm text-gray-500">
                                      {paymentForm.bank_name} {paymentForm.bank_account}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      예금주: {paymentForm.account_holder}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    copyToClipboard(paymentForm.bank_account, 'bank_account')
                                  }
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  {copiedField === 'bank_account' ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <Copy className="w-5 h-5 text-gray-400" />
                                  )}
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notice */}
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 mb-6">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium mb-1">안내사항</p>
                        <ul className="text-amber-700 space-y-1 list-disc list-inside">
                          <li>구매자가 직접 송금하면 입금 확인 알림을 받게 됩니다</li>
                          <li>입금 확인 후 콘텐츠 접근 권한이 부여됩니다</li>
                          <li>결제수단 정보는 유료 콘텐츠 구매자에게만 표시됩니다</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleSavePayment}
                    disabled={isSaving || !paymentForm.payment_method}
                    className="w-full"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        결제수단 저장
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
