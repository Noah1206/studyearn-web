'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail } from 'lucide-react';
import { dismissForToday } from '@/lib/attendance';
import { createClient } from '@/lib/supabase/client';

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
  const [error, setError] = useState('');
  const supabase = useMemo(() => createClient(), []);

  // 로그인 상태면 팝업 표시 안 함
  if (isLoggedIn) {
    return null;
  }

  const handleKakaoLogin = async () => {
    setError('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=/`,
      },
    });

    if (error) {
      console.error('Kakao login error:', error);
      setError('카카오 로그인에 실패했습니다.');
    }
  };

  const handleEmailLogin = () => {
    onClose();
    router.push('/login');
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
            <div className="relative px-6 pt-6 pb-4">
              <button
                onClick={handleDismissToday}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5 text-gray-400" />
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

            {/* Error */}
            {error && (
              <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="px-6 pt-2 pb-8 space-y-3">
              {/* Kakao Button */}
              <button
                onClick={handleKakaoLogin}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-semibold rounded-xl transition-all"
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

              {/* Email Button */}
              <button
                onClick={handleEmailLogin}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-900 font-semibold rounded-xl transition-all"
              >
                <Mail className="w-5 h-5" />
                이메일로 시작하기
              </button>

              <button
                onClick={handleDismissToday}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors pt-2"
              >
                오늘 하루 보지 않기
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
