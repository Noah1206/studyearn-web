'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, CardContent } from '@/components/ui';
import { pageVariants } from '@/components/ui/motion/variants';
import { Video, GraduationCap, Check, Eye, EyeOff } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

type AccountType = 'creator' | 'runner' | null;

function ProfileSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneNumber = searchParams.get('phone') || '';
  const verificationToken = searchParams.get('token') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nickname, setNickname] = useState('');
  const [selectedType, setSelectedType] = useState<AccountType>(null);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  // 전화번호 또는 토큰이 없으면 회원가입 페이지로 리다이렉트
  useEffect(() => {
    if (!phoneNumber || !verificationToken) {
      router.push('/signup');
    }
  }, [phoneNumber, verificationToken, router]);

  // 이메일 유효성 검사
  const validateEmail = (value: string) => {
    if (!value.trim()) {
      return '이메일을 입력해주세요';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return '올바른 이메일 형식을 입력해주세요';
    }
    return '';
  };

  // 비밀번호 유효성 검사
  const validatePassword = (value: string) => {
    if (!value) {
      return '비밀번호를 입력해주세요';
    }
    if (value.length < 6) {
      return '비밀번호는 6자 이상이어야 합니다';
    }
    return '';
  };

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
    const nicknameRegex = /^[가-힣a-zA-Z0-9_]+$/;
    if (!nicknameRegex.test(value)) {
      return '닉네임은 한글, 영문, 숫자, _만 사용 가능합니다';
    }
    return '';
  };

  // 이메일 변경 처리
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  // 비밀번호 변경 처리
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
  };

  // 닉네임 변경 처리
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    setNicknameError(validateNickname(value));
  };

  // 프로필 저장 및 완료
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const nicknameValidation = validateNickname(nickname);

    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }
    if (nicknameValidation) {
      setNicknameError(nicknameValidation);
      return;
    }

    if (!selectedType) {
      setError('계정 유형을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 회원가입 완료 API 호출
      const response = await fetch(`${SUPABASE_URL}/functions/v1/complete-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationToken,
          nickname: nickname.trim(),
          accountType: selectedType,
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || '회원가입에 실패했습니다.');
        return;
      }

      // 회원가입 성공 - 자동 로그인
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        // 로그인 실패해도 회원가입은 성공
        router.push('/login?message=회원가입이 완료되었습니다. 로그인해주세요.');
        return;
      }

      // 온보딩에서 저장한 데이터 처리
      const onboardingData = localStorage.getItem('studyearn_onboarding');
      if (onboardingData) {
        try {
          const { role, interests, goal } = JSON.parse(onboardingData);
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            await supabase
              .from('profiles')
              .update({
                onboarding_role: role,
                onboarding_interests: interests,
                onboarding_goal: goal,
              })
              .eq('id', user.id);
          }

          localStorage.removeItem('studyearn_onboarding');
        } catch {
          // 온보딩 데이터 저장 실패해도 계속 진행
        }
      }

      // 메인 페이지로 이동
      router.push('/');
    } catch {
      setError('회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    email.trim() &&
    !emailError &&
    password &&
    !passwordError &&
    nickname.trim().length >= 2 &&
    !nicknameError &&
    selectedType;

  if (!phoneNumber || !verificationToken) {
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="example@email.com"
                className={`w-full px-4 py-3.5 text-lg text-gray-900 border-2 rounded-xl focus:outline-none transition-colors ${
                  emailError
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-200 focus:border-gray-900'
                }`}
              />
              {emailError && (
                <p className="mt-2 text-sm text-red-500">{emailError}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="6자 이상 입력해주세요"
                  className={`w-full px-4 py-3.5 text-lg text-gray-900 border-2 rounded-xl focus:outline-none transition-colors pr-12 ${
                    passwordError
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-gray-200 focus:border-gray-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-2 text-sm text-red-500">{passwordError}</p>
              )}
            </div>

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    }>
      <ProfileSetupContent />
    </Suspense>
  );
}
