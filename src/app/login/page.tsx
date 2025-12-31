'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, CardContent, CardHeader, CardTitle, LoadingSection } from '@/components/ui';
import { pageVariants } from '@/components/ui/motion/variants';
import { ChevronDown, ChevronUp } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';

  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);

  const supabase = createClient();

  // 전화번호 포맷팅 (010-1234-5678 형식)
  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;

    if (cleaned.length > 3 && cleaned.length <= 7) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else if (cleaned.length > 7) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
    }

    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(e.target.value));
  };

  const handleKakaoLogin = async () => {
    setError('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo}`,
      },
    });

    if (error) {
      console.error('Kakao login error:', error);
      setError('카카오 로그인에 실패했습니다.');
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');

    if (!cleanedPhone) {
      setError('전화번호를 입력해주세요.');
      return;
    }

    if (cleanedPhone.length < 10) {
      setError('올바른 전화번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // Solapi Edge Function으로 OTP 발송
      const response = await fetch(`${SUPABASE_URL}/functions/v1/login-send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: cleanedPhone }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.isNotRegistered) {
          setError('가입되지 않은 전화번호입니다. 회원가입을 진행해주세요.');
        } else if (response.status === 429) {
          setError('잠시 후 다시 시도해주세요.');
        } else {
          setError(result.error || '인증번호 전송에 실패했습니다.');
        }
        return;
      }

      // 인증번호 입력 화면으로 이동
      router.push(`/login/verify?phone=${cleanedPhone}&redirectTo=${encodeURIComponent(redirectTo)}`);
    } catch {
      setError('인증번호 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');
  const isValidPhone = cleanedPhone.length >= 10;

  return (
    <motion.div
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gray-50"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      <Card variant="elevated" className="w-full max-w-lg px-8 py-16 md:px-12 md:py-20">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-2xl">로그인</CardTitle>
          <p className="text-gray-500 mt-3">스터플에 다시 오신 것을 환영합니다</p>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-6">
              {error}
            </div>
          )}

          {/* Kakao Login Button - 메인 강조 */}
          <button
            type="button"
            onClick={handleKakaoLogin}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-bold rounded-xl transition-all text-lg"
          >
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 2C5.02944 2 1 5.36419 1 9.5C1 12.0645 2.61438 14.3016 5.07563 15.5983L4.15625 18.8494C4.07773 19.1179 4.38266 19.3349 4.61797 19.1779L8.48438 16.6028C8.98125 16.6676 9.48656 16.7 10 16.7C14.9706 16.7 19 13.3358 19 9.2C19 5.06419 14.9706 2 10 2Z"
                fill="#191919"
              />
            </svg>
            카카오로 시작하기
          </button>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400">또는</span>
            </div>
          </div>

          {/* Phone Login Toggle */}
          <button
            type="button"
            onClick={() => setShowPhoneLogin(!showPhoneLogin)}
            className="w-full flex items-center justify-center gap-2 py-3 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span className="text-sm">전화번호로 로그인</span>
            {showPhoneLogin ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Phone Login Form - 접힌 상태 */}
          {showPhoneLogin && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handlePhoneLogin}
              className="space-y-4 mt-4"
            >
              <div className="flex items-center gap-3">
                {/* Country Code */}
                <div className="bg-gray-100 px-4 py-3 rounded-xl min-w-[70px] text-center">
                  <span className="font-semibold text-gray-900">+82</span>
                </div>
                {/* Phone Input */}
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="010-1234-5678"
                  maxLength={13}
                  className="flex-1 px-4 py-3 text-lg text-gray-900 border-b-2 border-gray-200 focus:border-gray-900 focus:outline-none transition-colors bg-transparent"
                />
              </div>

              <Button
                type="submit"
                fullWidth
                variant="secondary"
                isLoading={isLoading}
                disabled={isLoading || !isValidPhone}
                className="py-3"
              >
                인증번호 받기
              </Button>

              <p className="text-center text-xs text-gray-400">
                SMS 인증 비용이 발생할 수 있습니다
              </p>
            </motion.form>
          )}

          {/* 회원가입 링크 */}
          <p className="mt-8 text-center text-sm text-gray-500">
            계정이 없으신가요?{' '}
            <Link href="/onboarding" className="text-gray-900 hover:text-gray-700 font-semibold underline">
              회원가입
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSection fullHeight />}>
      <LoginForm />
    </Suspense>
  );
}
