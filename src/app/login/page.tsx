'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, LoadingSection } from '@/components/ui';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/content';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 이메일/비밀번호 검증 (앱과 동일)
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError('이메일 또는 비밀번호를 확인해주세요.');
        return;
      }

      // 로그인 성공 - 메인 화면으로 이동 (앱과 동일)
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError('이메일 또는 비밀번호를 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <Card variant="elevated" className="w-full max-w-lg px-12 py-20">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-2xl">로그인</CardTitle>
          <p className="text-gray-500 mt-3">Earn에 다시 오신 것을 환영합니다</p>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
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
              placeholder="비밀번호를 입력하세요"
              required
              autoComplete="current-password"
            />

            <Button type="submit" fullWidth isLoading={isLoading} className="mt-2">
              로그인
            </Button>
          </form>

          {/* 회원가입 링크 */}
          <p className="mt-8 text-center text-sm text-gray-500">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="text-gray-900 hover:text-gray-700 font-semibold underline">
              회원가입
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSection />}>
      <LoginForm />
    </Suspense>
  );
}
