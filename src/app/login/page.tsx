'use client';

import { useState, Suspense, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { LoadingSection } from '@/components/ui';
import { ArrowLeft, Mail, Phone } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

type LoginStep = 'select' | 'email' | 'phone';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';

  const [step, setStep] = useState<LoginStep>('select');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const supabase = useMemo(() => createClient(), []);

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

  const handleGoogleLogin = async () => {
    setError('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo}`,
      },
    });

    if (error) {
      console.error('Google login error:', error);
      setError('구글 로그인에 실패했습니다.');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else {
          setError(error.message);
        }
        return;
      }

      // 세션이 성공적으로 설정되었는지 확인
      if (data.session) {
        // 쿠키가 설정될 시간을 주고 전체 페이지 새로고침으로 이동
        await new Promise(resolve => setTimeout(resolve, 100));
        const separator = redirectTo.includes('?') ? '&' : '?';
        window.location.href = `${redirectTo}${separator}login=success`;
      } else {
        setError('로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } catch {
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
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

      router.push(`/login/verify?phone=${cleanedPhone}&redirectTo=${encodeURIComponent(redirectTo)}`);
    } catch {
      setError('인증번호 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');
  const isValidPhone = cleanedPhone.length >= 10;

  const goBack = () => {
    setStep('select');
    setError('');
    setEmail('');
    setPassword('');
    setPhoneNumber('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-24 px-4 pb-12 bg-white">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex justify-center">
            <Image src="/logo.svg" alt="StuPle" width={80} height={80} priority />
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Title */}
              <p className="text-xl text-center text-gray-500 mb-10 whitespace-pre-line leading-relaxed">
                {'공부가\n너의 가치가 되는 순간'}
              </p>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-6 text-center">
                  {error}
                </div>
              )}

              {/* Login Buttons */}
              <div className="space-y-3">
                {/* Kakao Button */}
                <button
                  type="button"
                  onClick={handleKakaoLogin}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-semibold rounded-lg transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10 2C5.02944 2 1 5.36419 1 9.5C1 12.0645 2.61438 14.3016 5.07563 15.5983L4.15625 18.8494C4.07773 19.1179 4.38266 19.3349 4.61797 19.1779L8.48438 16.6028C8.98125 16.6676 9.48656 16.7 10 16.7C14.9706 16.7 19 13.3358 19 9.2C19 5.06419 14.9706 2 10 2Z"
                      fill="#191919"
                    />
                  </svg>
                  카카오로 시작하기
                </button>

                {/* Naver Button */}
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `/api/auth/naver?redirectTo=${redirectTo}`;
                  }}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[#03C75A] hover:bg-[#02b351] text-white font-semibold rounded-lg transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M16.27 12.85L7.56 0H0v24h7.73V11.15L16.44 24H24V0h-7.73v12.85z" fill="white"/>
                  </svg>
                  네이버로 시작하기
                </button>

                {/* Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-white border border-gray-300 hover:border-gray-400 text-gray-900 font-semibold rounded-lg transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M19.6 10.23c0-.68-.06-1.34-.17-1.97H10v3.73h5.38a4.6 4.6 0 01-2 3.02v2.5h3.24c1.89-1.74 2.98-4.3 2.98-7.28z" fill="#4285F4"/>
                    <path d="M10 20c2.7 0 4.96-.9 6.62-2.42l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.58-4.12H1.07v2.58A9.99 9.99 0 0010 20z" fill="#34A853"/>
                    <path d="M4.42 11.91A6.02 6.02 0 014.1 10c0-.66.11-1.31.32-1.91V5.51H1.07A9.99 9.99 0 000 10c0 1.61.39 3.14 1.07 4.49l3.35-2.58z" fill="#FBBC05"/>
                    <path d="M10 3.96c1.47 0 2.78.5 3.82 1.5l2.86-2.86A9.97 9.97 0 0010 0 9.99 9.99 0 001.07 5.51l3.35 2.58C5.2 5.72 7.4 3.96 10 3.96z" fill="#EA4335"/>
                  </svg>
                  구글로 시작하기
                </button>

                {/* Email Button */}
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-white border border-gray-300 hover:border-gray-400 text-gray-900 font-semibold rounded-lg transition-all"
                >
                  <Mail className="w-5 h-5" />
                  이메일로 시작하기
                </button>

              </div>

              {/* Divider */}
              <div className="my-8 border-t border-gray-200" />

              {/* Signup Link */}
              <p className="text-center text-sm text-gray-500">
                아직 회원이 아니신가요?{' '}
                <Link href="/onboarding" className="text-gray-900 font-semibold hover:underline">
                  회원가입
                </Link>
              </p>
            </motion.div>
          )}

          {step === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Back Button */}
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">뒤로</span>
              </button>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                이메일로 로그인
              </h2>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-6 text-center">
                  {error}
                </div>
              )}

              {/* Email Form */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full px-4 py-3.5 text-gray-900 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-colors"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="w-full px-4 py-3.5 text-gray-900 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full py-4 px-6 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-all mt-6"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      로그인 중...
                    </span>
                  ) : '로그인'}
                </button>
              </form>

              {/* Signup Link */}
              <p className="text-center text-sm text-gray-500 mt-8">
                계정이 없으신가요?{' '}
                <Link href="/signup" className="text-gray-900 font-semibold hover:underline">
                  이메일로 회원가입
                </Link>
              </p>
            </motion.div>
          )}

          {step === 'phone' && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Back Button */}
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">뒤로</span>
              </button>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                전화번호로 로그인
              </h2>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-6 text-center">
                  {error}
                </div>
              )}

              {/* Phone Form */}
              <form onSubmit={handlePhoneLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    전화번호
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 px-4 py-3.5 rounded-lg">
                      <span className="font-semibold text-gray-700">+82</span>
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="010-1234-5678"
                      maxLength={13}
                      className="flex-1 px-4 py-3.5 text-gray-900 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-colors"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !isValidPhone}
                  className="w-full py-4 px-6 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-all mt-6"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      전송 중...
                    </span>
                  ) : '인증번호 받기'}
                </button>

                <p className="text-center text-xs text-gray-400 mt-2">
                  SMS로 인증번호가 전송됩니다
                </p>
              </form>

              {/* Signup Link */}
              <p className="text-center text-sm text-gray-500 mt-8">
                계정이 없으신가요?{' '}
                <Link href="/onboarding" className="text-gray-900 font-semibold hover:underline">
                  회원가입
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSection fullHeight />}>
      <LoginForm />
    </Suspense>
  );
}
