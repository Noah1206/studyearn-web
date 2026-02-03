'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { dismissForToday } from '@/lib/attendance';
import { createClient } from '@/lib/supabase/client';
import { useToastActions } from '@/components/ui/Toast';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  userName: string | null;
  initialConsecutiveDays?: number;
  isLoggedIn?: boolean;
}

export function AttendanceModal({
  isOpen,
  onClose,
  isLoggedIn = false,
}: AttendanceModalProps) {
  const router = useRouter();
  const toast = useToastActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  // 로그인 상태면 팝업 표시 안 함
  if (isLoggedIn) {
    return null;
  }

  const handleKakaoLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=/`,
      },
    });
    if (error) {
      console.error('Kakao login error:', error);
      toast.error('카카오 로그인에 실패했습니다.');
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=/`,
      },
    });
    if (error) {
      console.error('Google login error:', error);
      toast.error('구글 로그인에 실패했습니다.');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('이메일과 비밀번호를 입력해주세요.');
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
          toast.error('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.session) {
        await new Promise(resolve => setTimeout(resolve, 100));
        window.location.href = '/';
      }
    } catch {
      toast.error('로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissToday = () => {
    dismissForToday();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && handleDismissToday()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-2">
              <button
                onClick={handleDismissToday}
                className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="닫기"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>

              <div className="text-center pt-6 pb-4">
                <h2 className="text-2xl font-bold text-orange-500 mb-2">
                  스터플에 오신 것을 환영합니다
                </h2>
                <p className="text-gray-500 text-sm">
                  로그인하고 다양한 학습 콘텐츠를 만나보세요!
                </p>
              </div>
            </div>

            <div className="px-6 pb-6">
              {/* Social Login */}
              <div className="space-y-2.5 mb-5">
                <button
                  onClick={handleKakaoLogin}
                  className="w-full flex items-center justify-center gap-2.5 py-3 bg-[#FEE500] font-semibold text-sm text-[#191919] rounded-xl transition-all duration-200 hover:brightness-95 active:scale-[0.98]"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10 2C5.02944 2 1 5.36419 1 9.5C1 12.0645 2.61438 14.3016 5.07563 15.5983L4.15625 18.8494C4.07773 19.1179 4.38266 19.3349 4.61797 19.1779L8.48438 16.6028C8.98125 16.6676 9.48656 16.7 10 16.7C14.9706 16.7 19 13.3358 19 9.2C19 5.06419 14.9706 2 10 2Z"
                      fill="#191919"
                    />
                  </svg>
                  카카오로 시작하기
                </button>
                <button
                  onClick={() => {
                    window.location.href = '/api/auth/naver?redirectTo=/';
                  }}
                  className="w-full flex items-center justify-center gap-2.5 py-3 bg-[#03C75A] font-semibold text-sm text-white rounded-xl transition-all duration-200 hover:brightness-95 active:scale-[0.98]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M16.27 12.85L7.56 0H0v24h7.73V11.15L16.44 24H24V0h-7.73v12.85z" fill="white"/>
                  </svg>
                  네이버로 시작하기
                </button>
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2.5 py-3 bg-white border border-gray-200 font-semibold text-sm text-gray-700 rounded-xl transition-all duration-200 hover:border-gray-300 active:scale-[0.98]"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M19.6 10.23c0-.68-.06-1.34-.17-1.97H10v3.73h5.38a4.6 4.6 0 01-2 3.02v2.5h3.24c1.89-1.74 2.98-4.3 2.98-7.28z" fill="#4285F4"/>
                    <path d="M10 20c2.7 0 4.96-.9 6.62-2.42l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.58-4.12H1.07v2.58A9.99 9.99 0 0010 20z" fill="#34A853"/>
                    <path d="M4.42 11.91A6.02 6.02 0 014.1 10c0-.66.11-1.31.32-1.91V5.51H1.07A9.99 9.99 0 000 10c0 1.61.39 3.14 1.07 4.49l3.35-2.58z" fill="#FBBC05"/>
                    <path d="M10 3.96c1.47 0 2.78.5 3.82 1.5l2.86-2.86A9.97 9.97 0 0010 0 9.99 9.99 0 001.07 5.51l3.35 2.58C5.2 5.72 7.4 3.96 10 3.96z" fill="#EA4335"/>
                  </svg>
                  구글로 시작하기
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-xs text-gray-400">또는</span>
                </div>
              </div>

              {/* Email Login Form */}
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일"
                  className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl focus:border-gray-900 focus:ring-0 focus:outline-none transition-all placeholder:text-gray-400"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  className="w-full px-4 py-3 text-sm text-gray-900 bg-white border border-gray-200 rounded-xl focus:border-gray-900 focus:ring-0 focus:outline-none transition-all placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full py-3 bg-transparent text-gray-700 hover:bg-gray-900 hover:text-white active:bg-gray-800 active:text-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] border border-gray-200 hover:border-transparent"
                >
                  {isLoading ? '로그인 중...' : '로그인'}
                </button>
              </form>

              {/* Signup Link */}
              <p className="text-center text-xs text-gray-400 mt-6 mb-2">
                계정이 없으신가요?{' '}
                <button
                  onClick={() => {
                    onClose();
                    router.push('/onboarding');
                  }}
                  className="text-gray-700 font-semibold hover:underline"
                >
                  시작하기
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
