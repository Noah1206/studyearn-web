'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, CardContent } from '@/components/ui';
import { pageVariants } from '@/components/ui/motion/variants';
import { Video, GraduationCap, Check } from 'lucide-react';

type AccountType = 'creator' | 'runner' | null;

function ProfileSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneNumber = searchParams.get('phone') || '';

  const [nickname, setNickname] = useState('');
  const [selectedType, setSelectedType] = useState<AccountType>(null);
  const [error, setError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  // 전화번호가 없으면 회원가입 페이지로 리다이렉트
  useEffect(() => {
    if (!phoneNumber) {
      router.push('/signup');
    }
  }, [phoneNumber, router]);

  // 닉네임 유효성 검사
  const validateNickname = (value: string) => {
    if (!value.trim()) {
      return '닉네임을 입력해주세요';
    }
    if (value.length < 2) {
      return '닉네임은 최소 2자 이상이어야 합니다';
    }
    if (value.length > 20) {
      return '닉네임은 20자 이하여야 합니다';
    }
    // 특수문자 제한 (한글, 영문, 숫자, 언더스코어만 허용)
    const nicknameRegex = /^[가-힣a-zA-Z0-9_]+$/;
    if (!nicknameRegex.test(value)) {
      return '닉네임은 한글, 영문, 숫자, _만 사용 가능합니다';
    }
    return '';
  };

  // 닉네임 변경 처리
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    const validationError = validateNickname(value);
    setNicknameError(validationError);
  };

  // 프로필 저장 및 완료
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 닉네임 유효성 검사
    const validationError = validateNickname(nickname);
    if (validationError) {
      setNicknameError(validationError);
      return;
    }

    if (!selectedType) {
      setError('계정 유형을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        router.push('/signup');
        return;
      }

      // profiles 테이블에 프로필 저장
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          nickname: nickname.trim(),
          phone_number: phoneNumber,
          is_creator: selectedType === 'creator',
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Profile save error:', profileError);
        setError(profileError.message || '프로필 저장에 실패했습니다.');
        return;
      }

      // 크리에이터인 경우 creator_settings 테이블에도 저장
      if (selectedType === 'creator') {
        const { error: creatorError } = await supabase
          .from('creator_settings')
          .upsert({
            user_id: user.id,
            display_name: nickname.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (creatorError) {
          console.error('Creator settings error:', creatorError);
          // 크리에이터 설정 저장 실패해도 계속 진행
        }
      }

      // 온보딩에서 저장한 데이터 가져오기
      const onboardingData = localStorage.getItem('studyearn_onboarding');
      if (onboardingData) {
        try {
          const { role, interests, goal } = JSON.parse(onboardingData);

          // 온보딩 데이터를 profiles 테이블에 저장
          await supabase
            .from('profiles')
            .update({
              onboarding_role: role,
              onboarding_interests: interests,
              onboarding_goal: goal,
            })
            .eq('id', user.id);

          // 저장 후 localStorage 정리
          localStorage.removeItem('studyearn_onboarding');
        } catch {
          // 온보딩 데이터 저장 실패해도 계속 진행
        }
      }

      // 메인 페이지로 이동
      router.push('/');
    } catch {
      setError('프로필 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = nickname.trim().length >= 2 && !nicknameError && selectedType;

  if (!phoneNumber) {
    return null;
  }

  return (
    <motion.div
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gray-50"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      <Card variant="elevated" className="w-full max-w-lg px-8 py-12 md:px-12 md:py-16">
        <CardContent className="p-0">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">프로필 설정</h1>
            <p className="text-gray-500">스터플에서 사용할 정보를 입력해주세요</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Nickname Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                닉네임
              </label>
              <input
                type="text"
                value={nickname}
                onChange={handleNicknameChange}
                placeholder="닉네임을 입력해주세요"
                maxLength={20}
                className={`w-full px-4 py-3.5 text-lg text-gray-900 border-2 rounded-xl focus:outline-none transition-colors ${
                  nicknameError
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-200 focus:border-gray-900'
                }`}
              />
              {nicknameError && (
                <p className="mt-2 text-sm text-red-500">{nicknameError}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                한글, 영문, 숫자, _ 사용 가능 (2~20자)
              </p>
            </div>

            {/* Account Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                계정 유형
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* Creator Card */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedType('creator')}
                  className={`relative p-6 rounded-2xl border-2 text-left transition-colors ${
                    selectedType === 'creator'
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {selectedType === 'creator' && (
                    <div className="absolute top-3 right-3">
                      <Check className="w-5 h-5 text-gray-900" />
                    </div>
                  )}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                      selectedType === 'creator'
                        ? 'bg-gray-900'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Video
                      className={`w-6 h-6 ${
                        selectedType === 'creator'
                          ? 'text-white'
                          : 'text-gray-600'
                      }`}
                    />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">크리에이터</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    콘텐츠를 만들고 수익을 창출해요
                  </p>
                </motion.button>

                {/* Runner Card */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedType('runner')}
                  className={`relative p-6 rounded-2xl border-2 text-left transition-colors ${
                    selectedType === 'runner'
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {selectedType === 'runner' && (
                    <div className="absolute top-3 right-3">
                      <Check className="w-5 h-5 text-gray-900" />
                    </div>
                  )}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                      selectedType === 'runner'
                        ? 'bg-gray-900'
                        : 'bg-gray-100'
                    }`}
                  >
                    <GraduationCap
                      className={`w-6 h-6 ${
                        selectedType === 'runner'
                          ? 'text-white'
                          : 'text-gray-600'
                      }`}
                    />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">러너</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    콘텐츠를 학습하고 성장해요
                  </p>
                </motion.button>
              </div>
              <p className="mt-3 text-xs text-gray-500 text-center">
                나중에 설정에서 변경할 수 있어요
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading || !isFormValid}
              className="py-3"
            >
              시작하기
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ProfileSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    }>
      <ProfileSetupContent />
    </Suspense>
  );
}
