'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { pageVariants } from '@/components/ui/motion/variants';
import { Mail } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const supabase = createClient();

  // 앱과 동일한 유효성 검사
  const isValidEmail = email.includes('@') && email.includes('.');
  const isValidPassword = password.length >= 6;

  const handleKakaoSignup = async () => {
    setError('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=/content`,
      },
    });

    if (error) {
      console.error('Kakao signup error:', error);
      setError('카카오 회원가입에 실패했습니다.');
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사 (앱과 동일)
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      // 회원가입 (앱의 signUpWithEmail과 동일한 로직)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('이미 가입된 이메일입니다.');
        } else {
          setError(signUpError.message || '회원가입에 실패했습니다.');
        }
        return;
      }

      const userId = data.user?.id;

      // 이메일 확인이 필요한 경우 (세션이 없음)
      if (data.user && !data.session) {
        // 프로필 먼저 생성 (이메일 확인 후 로그인 시 필요)
        if (userId) {
          const nickname = email.split('@')[0];
          await supabase.from('profiles').upsert({
            id: userId,
            nickname: nickname,
            is_creator: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        // 이메일 확인 안내 화면 표시
        setIsEmailSent(true);
        return;
      }

      // 이메일 확인이 비활성화된 경우 (세션이 바로 생성됨)
      if (userId && data.session) {
        const nickname = email.split('@')[0];
        await supabase.from('profiles').upsert({
          id: userId,
          nickname: nickname,
          is_creator: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        console.log('Profile created for user:', userId);

        // 메인 화면으로 이동
        router.push('/content');
        router.refresh();
      }
    } catch {
      setError('회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 이메일 확인 안내 화면
  if (isEmailSent) {
    return (
      <motion.div
        className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gray-50"
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
      >
        <Card variant="elevated" className="w-full max-w-lg px-12 py-20">
          <CardContent className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">이메일을 확인해주세요</h2>
            <p className="text-gray-600 mb-2">
              <span className="font-medium text-gray-900">{email}</span>
            </p>
            <p className="text-gray-500 mb-8">
              위 이메일로 확인 링크를 보냈습니다.<br />
              이메일의 링크를 클릭하면 가입이 완료됩니다.
            </p>
            <div className="space-y-3">
              <Link href="/login">
                <Button fullWidth>
                  로그인 페이지로 이동
                </Button>
              </Link>
              <p className="text-sm text-gray-500">
                이메일이 오지 않았나요?{' '}
                <button
                  onClick={() => setIsEmailSent(false)}
                  className="text-gray-900 underline font-medium"
                >
                  다시 시도
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gray-50"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      <Card variant="elevated" className="w-full max-w-lg px-12 py-20">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <p className="text-gray-500 mt-3">스터플과 함께 성장하세요</p>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-6">
              {error}
            </div>
          )}

          {/* Kakao Signup Button */}
          <button
            type="button"
            onClick={handleKakaoSignup}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-medium rounded-lg transition-colors"
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

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">또는</span>
            </div>
          </div>

          {/* Email Signup Form */}
          <form onSubmit={handleEmailSignup} className="space-y-5">

            <Input
              label="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              autoComplete="email"
            />

            <Input
              label="비밀번호"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상 입력하세요"
              required
              autoComplete="new-password"
              helperText="6자 이상의 비밀번호를 입력하세요"
            />

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading || !isValidEmail || !isValidPassword}
              className="mt-2"
            >
              회원가입
            </Button>
          </form>

          {/* 약관 동의 텍스트 (앱과 동일) */}
          <p className="mt-8 text-center text-xs text-gray-500">
            회원가입을 요청하면 14세 이상이며, 스터플의{' '}
            <Link href="/privacy" className="text-gray-700 underline">
              개인정보처리방침
            </Link>
            {' '}및{' '}
            <Link href="/terms" className="text-gray-700 underline">
              이용약관
            </Link>
            에 동의한 것으로 간주합니다.
          </p>

          {/* 로그인 링크 */}
          <p className="mt-6 text-center text-sm text-gray-500">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-gray-900 hover:text-gray-700 font-semibold underline">
              로그인
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
