'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Card, CardContent } from '@/components/ui';
import { pageVariants } from '@/components/ui/motion/variants';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function SignupPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSendVerification = async (e: React.FormEvent) => {
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
      // Solapi를 통한 OTP 발송 (Edge Function 호출)
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: cleanedPhone }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || '인증번호 전송에 실패했습니다.');
        return;
      }

      // 인증번호 입력 화면으로 이동
      router.push(`/signup/verify?phone=${cleanedPhone}`);
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
        <CardContent className="p-0">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">회원가입</h1>
            <p className="text-gray-500">전화번호로 본인 인증을 진행해주세요</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-6">
              {error}
            </div>
          )}

          {/* Phone Input Form */}
          <form onSubmit={handleSendVerification} className="space-y-6">
            <div className="flex items-center gap-3">
              {/* Country Code */}
              <div className="bg-gray-100 px-4 py-3.5 rounded-xl min-w-[70px] text-center">
                <span className="font-semibold text-gray-900">+82</span>
              </div>
              {/* Phone Input */}
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="010-1234-5678"
                maxLength={13}
                className="flex-1 px-4 py-3.5 text-lg text-gray-900 border-b-2 border-gray-200 focus:border-gray-900 focus:outline-none transition-colors bg-transparent"
              />
            </div>

            {/* Terms */}
            <p className="text-center text-xs text-gray-500 leading-relaxed">
              인증을 요청하면 스터플의{' '}
              <Link href="/terms" className="text-gray-700 underline">
                이용약관
              </Link>
              에 동의한 것으로 간주합니다.
            </p>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading || !isValidPhone}
              className="py-3"
            >
              인증번호 받기
            </Button>
          </form>

          {/* Login Link */}
          <p className="mt-8 text-center text-sm text-gray-500">
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
