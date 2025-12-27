'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  // 앱과 동일한 유효성 검사
  const isValidEmail = email.includes('@') && email.includes('.');
  const isValidPassword = password.length >= 6;

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

      let userId = data.user?.id;

      // 회원가입 후 바로 로그인 시도 (앱과 동일)
      if (data.user && !data.session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message || '자동 로그인에 실패했습니다.');
          return;
        }
        userId = signInData.user?.id;
      }

      // 프로필 자동 생성 (앱과 동일 - 이메일 앞부분을 닉네임으로 사용)
      if (userId) {
        const nickname = email.split('@')[0];
        await supabase.from('profiles').upsert({
          id: userId,
          nickname: nickname,
          is_creator: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        console.log('Profile created for user:', userId);
      }

      // 메인 화면으로 이동 (앱과 동일)
      router.push('/content');
      router.refresh();
    } catch {
      setError('회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <Card variant="elevated" className="w-full max-w-lg px-12 py-20">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <p className="text-gray-500 mt-3">Earn과 함께 성장하세요</p>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Email Signup Form */}
          <form onSubmit={handleEmailSignup} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

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
            회원가입을 요청하면 14세 이상이며, Earn의{' '}
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
    </div>
  );
}
