'use client';

import { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, CardContent } from '@/components/ui';
import { pageVariants } from '@/components/ui/motion/variants';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

function VerifyLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneNumber = searchParams.get('phone') || '';
  const redirectTo = searchParams.get('redirectTo') || '/';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(180); // 3분 (180초)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const supabase = useMemo(() => createClient(), []);

  // 타이머 카운트다운
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // 타이머 포맷 (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 인증번호 입력 처리
  const handleCodeChange = (text: string, index: number) => {
    // 숫자만 입력 가능
    if (text && !/^\d+$/.test(text)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // 자동으로 다음 입력 필드로 이동
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // 백스페이스 처리
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // 붙여넣기 처리
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  // 인증번호 재전송 (Solapi Edge Function 사용)
  const handleResendCode = async () => {
    if (timer > 0) {
      return;
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/login-send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || '인증번호 재전송에 실패했습니다.');
        return;
      }

      setTimer(180);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setError('');
    } catch {
      setError('인증번호 재전송에 실패했습니다.');
    }
  };

  // 인증 확인 (Solapi Edge Function + Supabase Session 설정)
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    const verificationCode = code.join('');

    if (verificationCode.length !== 6) {
      setError('인증번호 6자리를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Edge Function으로 OTP 검증
      const response = await fetch(`${SUPABASE_URL}/functions/v1/login-verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          code: verificationCode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.remainingAttempts !== undefined) {
          setError(`${result.error} (남은 시도: ${result.remainingAttempts}회)`);
        } else {
          setError(result.error || '인증번호가 올바르지 않습니다.');
        }
        setIsLoading(false);
        return;
      }

      // Magic Link 토큰으로 세션 설정
      if (result.access_token && result.refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('로그인 세션 설정에 실패했습니다.');
          setIsLoading(false);
          return;
        }

        // 로그인 성공 - 하드 리다이렉트로 세션 반영
        // setTimeout으로 React 상태 업데이트 완료 후 리다이렉트
        const targetUrl = decodeURIComponent(redirectTo);
        setTimeout(() => {
          window.location.replace(targetUrl);
        }, 100);
        return;
      }

      setError('로그인에 실패했습니다. 다시 시도해주세요.');
      setIsLoading(false);
    } catch {
      setError('인증에 실패했습니다. 다시 시도해주세요.');
      setIsLoading(false);
    }
  };

  const isCodeComplete = code.every((digit) => digit !== '');

  // 전화번호가 없으면 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!phoneNumber) {
      router.push('/login');
    }
  }, [phoneNumber, router]);

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
      <Card variant="elevated" className="w-full max-w-lg px-8 py-16 md:px-12 md:py-20">
        <CardContent className="p-0">
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">문자로 받은</h1>
            <h1 className="text-2xl font-bold text-gray-900">인증번호를 입력해주세요</h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-6">
              {error}
            </div>
          )}

          {/* OTP Input Form */}
          <form onSubmit={handleVerify} className="space-y-6">
            {/* Code Input */}
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none transition-colors ${
                    digit
                      ? 'border-gray-900 text-gray-900'
                      : 'border-gray-300 text-gray-900'
                  } focus:border-gray-900`}
                />
              ))}
            </div>

            {/* Timer & Resend */}
            <div className="flex justify-between items-center px-2">
              <span className="text-sm text-red-500 font-medium">
                남은 시간: {formatTime(timer)}
              </span>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={timer > 0}
                className={`text-sm font-semibold underline ${
                  timer > 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-900 hover:text-gray-700'
                }`}
              >
                인증번호 재전송
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading || !isCodeComplete}
              className="py-3"
            >
              로그인
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function VerifyLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    }>
      <VerifyLoginContent />
    </Suspense>
  );
}
