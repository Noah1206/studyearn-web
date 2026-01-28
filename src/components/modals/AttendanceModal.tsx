'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { dismissForToday } from '@/lib/attendance';

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

  // 로그인 상태면 팝업 표시 안 함
  if (isLoggedIn) {
    return null;
  }

  const handleLogin = () => {
    onClose();
    router.push('/login?redirectTo=/');
  };

  const handleSignup = () => {
    onClose();
    router.push('/signup');
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

            {/* Actions */}
            <div className="px-6 pt-4 pb-8 space-y-3">
              <button
                onClick={handleLogin}
                className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
              >
                로그인
              </button>
              <button
                onClick={handleSignup}
                className="w-full py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                회원가입
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
