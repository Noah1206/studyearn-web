'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Upload,
  Loader2,
  Users,
  MessageCircle,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Camera,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, CardContent, Input, Badge, LoadingInline } from '@/components/ui';
import { LoadingPage } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

// 전문분야 옵션
const CATEGORY_OPTIONS = [
  { id: 'korean', label: '국어' },
  { id: 'math', label: '수학' },
  { id: 'english', label: '영어' },
  { id: 'science', label: '과학' },
  { id: 'social', label: '사회' },
  { id: 'history', label: '역사' },
  { id: 'coding', label: '코딩' },
  { id: 'art', label: '예술' },
  { id: 'music', label: '음악' },
  { id: 'study-tips', label: '공부법' },
  { id: 'exam-prep', label: '시험대비' },
  { id: 'language', label: '외국어' },
];

// 대상 연령대 옵션
const TARGET_AGE_OPTIONS = [
  { id: 'elementary', label: '초등학생' },
  { id: 'middle', label: '중학생' },
  { id: 'high', label: '고등학생' },
  { id: 'university', label: '대학생' },
  { id: 'adult', label: '성인' },
];

// 크리에이터 혜택
const CREATOR_BENEFITS = [
  { icon: Upload, title: '콘텐츠 업로드', desc: '영상, 문서, 노트 등 다양한 학습 자료 공유' },
  { icon: Users, title: '팔로워 관리', desc: '팔로워 현황과 통계 확인' },
  { icon: MessageCircle, title: '1:1 질문방', desc: '다른 학생들과 직접 소통' },
  { icon: BarChart3, title: '분석 대시보드', desc: '콘텐츠 조회수와 반응 분석' },
];

// 온보딩 단계
const STEPS = [
  { id: 1, title: '기본 정보', desc: '크리에이터 프로필 설정' },
  { id: 2, title: '전문 분야', desc: '콘텐츠 카테고리 선택' },
  { id: 3, title: '프로필 완성', desc: '프로필 사진 및 소개' },
];

export default function BecomeCreatorPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0); // 0: 소개, 1-3: 온보딩 단계
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(null);

  // 폼 데이터
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    categories: [] as string[],
    targetAges: [] as string[],
    speciality: '',
    profileImage: null as File | null,
    profileImagePreview: '',
  });

  // 에러 상태
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login?redirect=/become-creator');
      return;
    }

    // 이미 크리에이터인지 확인
    const { data: creatorSettings } = await supabase
      .from('creator_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (creatorSettings) {
      router.push('/dashboard');
      return;
    }

    // 기존 프로필 정보 가져오기
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url, nickname')
      .eq('id', user.id)
      .single();

    // 프로필 사진: profiles 테이블 → user_metadata (카카오 등 OAuth) 순서로 확인
    const existingAvatar = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture;
    if (existingAvatar) {
      setExistingAvatarUrl(existingAvatar);
    }

    setUser(user);
    setFormData(prev => ({
      ...prev,
      displayName: profile?.nickname || user.user_metadata?.full_name || user.user_metadata?.name || '',
    }));
    setIsLoading(false);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => {
      const categories = prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : prev.categories.length < 3
          ? [...prev.categories, categoryId]
          : prev.categories;
      return { ...prev, categories };
    });
  };

  const handleTargetAgeToggle = (ageId: string) => {
    setFormData(prev => {
      const targetAges = prev.targetAges.includes(ageId)
        ? prev.targetAges.filter(a => a !== ageId)
        : [...prev.targetAges, ageId];
      return { ...prev, targetAges };
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profileImage: file,
        profileImagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleUseExistingAvatar = () => {
    if (existingAvatarUrl) {
      setFormData(prev => ({
        ...prev,
        profileImage: null,
        profileImagePreview: existingAvatarUrl,
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.displayName.trim()) {
        newErrors.displayName = '크리에이터 이름을 입력해주세요';
      } else if (formData.displayName.length < 2) {
        newErrors.displayName = '2자 이상 입력해주세요';
      }
    }

    if (step === 2) {
      if (formData.categories.length === 0) {
        newErrors.categories = '최소 1개 이상의 전문분야를 선택해주세요';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 0) {
      setCurrentStep(1);
      return;
    }

    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      // 프로필 이미지 처리
      let avatarUrl: string | null = null;

      if (formData.profileImage) {
        // 새 이미지 업로드
        const fileExt = formData.profileImage.name.split('.').pop();
        const fileName = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, formData.profileImage, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatarUrl = publicUrl;
        }
      } else if (formData.profileImagePreview && existingAvatarUrl && formData.profileImagePreview === existingAvatarUrl) {
        // 기존 프로필 사진 사용
        avatarUrl = existingAvatarUrl;
      } else {
        // 기본값: 기존 메타데이터 또는 null
        avatarUrl = user.user_metadata?.avatar_url || null;
      }

      // API를 통해 크리에이터 등록
      const res = await fetch('/api/creator/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: formData.displayName,
          bio: formData.bio || null,
          profile_image_url: avatarUrl,
          categories: formData.categories,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || '크리에이터 등록에 실패했습니다.');
      }

      // 대시보드로 이동
      router.push('/dashboard?welcome=true');
    } catch (error) {
      console.error('Error creating creator profile:', error);
      setErrors({ submit: '크리에이터 등록 중 오류가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  // 소개 화면 (Step 0)
  if (currentStep === 0) {
    return (
      <motion.div
        className="min-h-screen bg-white"
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
      >
        {/* 헤더 */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center">
            <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-gray-600">
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">홈으로</span>
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-12">
          {/* 히어로 섹션 */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-orange-500">크리에이터 되기</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              당신의 지식을<br />
              <span className="text-orange-500">가치</span>로 바꾸세요
            </h1>
            <p className="text-gray-500 text-lg max-w-md mx-auto">
              공부 콘텐츠를 만들고, 구독자를 모으고,
              수익을 창출하세요.
            </p>
          </div>

          {/* 혜택 그리드 */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {CREATOR_BENEFITS.map((benefit, index) => (
              <Card key={index} variant="outlined" className="hover:shadow-md transition-shadow border-gray-200">
                <CardContent className="p-5">
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-3">
                    <benefit.icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                  <p className="text-sm text-gray-500">{benefit.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 주의사항 */}
          <Card variant="outlined" className="mb-8 bg-gray-50 border-gray-200">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  크리에이터 전환 후에는 일반 유저로 되돌릴 수 없습니다.
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  크리에이터 기능을 사용하지 않아도 일반 학습 기능은 그대로 이용 가능합니다.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={handleNext}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-base"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              크리에이터 시작하기
            </Button>
            <Link href="/">
              <Button variant="ghost" className="text-gray-500 hover:text-gray-900">
                나중에 할게요
              </Button>
            </Link>
          </div>
        </main>
      </motion.div>
    );
  }

  // 온보딩 단계 (Step 1-3)
  return (
    <motion.div
      className="min-h-screen bg-white"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm font-medium text-gray-900">
            {currentStep} / 3 단계
          </span>
          <div className="w-6" />
        </div>
      </header>

      {/* 진행 바 */}
      <div className="bg-white">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex-1 flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    currentStep > index
                      ? "bg-orange-500 text-white"
                      : currentStep === index + 1
                        ? "bg-orange-100 text-orange-500 ring-2 ring-orange-500"
                        : "bg-gray-100 text-gray-400"
                  )}
                >
                  {currentStep > index ? <Check size={16} /> : step.id}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-1 rounded-full transition-colors",
                      currentStep > index + 1 ? "bg-orange-500" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3">
            <h2 className="font-semibold text-gray-900">{STEPS[currentStep - 1]?.title}</h2>
            <p className="text-sm text-gray-500">{STEPS[currentStep - 1]?.desc}</p>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Step 1: 기본 정보 */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                크리에이터 이름 <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="구독자에게 보여질 이름을 입력하세요"
                className={errors.displayName ? 'border-red-500' : ''}
              />
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-500">{errors.displayName}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                2자 이상, 나중에 변경할 수 있습니다
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                특기 / 전문 분야
              </label>
              <Input
                value={formData.speciality}
                onChange={(e) => setFormData(prev => ({ ...prev, speciality: e.target.value }))}
                placeholder="예: 서울대 수학과, 수능 만점자, 10년 경력 강사"
              />
            </div>
          </div>
        )}

        {/* Step 2: 전문 분야 */}
        {currentStep === 2 && (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                콘텐츠 카테고리 <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-4">
                주로 다룰 주제를 선택하세요 (최대 3개)
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {CATEGORY_OPTIONS.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.id)}
                    className={cn(
                      "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all",
                      formData.categories.includes(category.id)
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-medium",
                      formData.categories.includes(category.id) ? "text-orange-500" : "text-gray-700"
                    )}>
                      {category.label}
                    </span>
                    {formData.categories.includes(category.id) && (
                      <CheckCircle className="w-4 h-4 text-orange-500" />
                    )}
                  </button>
                ))}
              </div>
              {errors.categories && (
                <p className="mt-2 text-sm text-red-500">{errors.categories}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                대상 연령대
              </label>
              <p className="text-sm text-gray-500 mb-4">
                주요 타겟 학습자를 선택하세요 (복수 선택 가능)
              </p>
              <div className="flex flex-wrap gap-2">
                {TARGET_AGE_OPTIONS.map((age) => (
                  <button
                    key={age.id}
                    onClick={() => handleTargetAgeToggle(age.id)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      formData.targetAges.includes(age.id)
                        ? "bg-orange-500 text-white"
                        : "bg-white text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {age.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: 프로필 완성 */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                프로필 사진
              </label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {formData.profileImagePreview ? (
                    <div className="relative w-24 h-24">
                      <img
                        src={formData.profileImagePreview}
                        alt="Profile preview"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                      <button
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          profileImage: null,
                          profileImagePreview: '',
                        }))}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {existingAvatarUrl && (
                    <button
                      type="button"
                      onClick={handleUseExistingAvatar}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg text-sm font-medium text-orange-600 transition-colors w-full justify-center"
                    >
                      <img
                        src={existingAvatarUrl}
                        alt="기존 프로필"
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      기존 프로필 사진 사용
                    </button>
                  )}
                  <label className="cursor-pointer block">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors w-full justify-center">
                      <Upload size={16} />
                      새 사진 업로드
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 text-center">
                    JPG, PNG (최대 5MB)
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                자기 소개
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="구독자에게 보여질 소개글을 작성해주세요"
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
              <p className="mt-1 text-xs text-gray-400">
                {formData.bio.length}/300자
              </p>
            </div>

            {/* 최종 확인 */}
            <Card variant="outlined" className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-orange-900 mb-2">거의 다 됐어요!</h4>
                <p className="text-sm text-orange-700">
                  완료 버튼을 누르면 크리에이터로 전환됩니다.
                  나만의 노트, 공부법, 학습 자료를 업로드하고 다른 학생들에게 도움을 줄 수 있어요.
                  크리에이터 대시보드에서 콘텐츠를 관리하고, 팔로워들과 소통해보세요.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 에러 메시지 */}
        {errors.submit && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="mt-8 flex gap-3">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
            >
              이전
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={isSubmitting}
            className={cn(
              "flex-1 bg-orange-500 hover:bg-orange-600 text-white",
              currentStep === 1 && "flex-[2]"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                처리 중...
              </>
            ) : currentStep === 3 ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                크리에이터 시작하기
              </>
            ) : (
              <>
                다음
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </main>
    </motion.div>
  );
}
