'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Flame } from 'lucide-react';
import { Button } from '@/components/ui';
import { recordAttendance, dismissForToday, setAttendancePending } from '@/lib/attendance';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  userName: string | null;
  initialConsecutiveDays?: number;
  isLoggedIn?: boolean;
}

type StampStage = 'ready' | 'stamping' | 'stamped' | 'success';

// 요일 레이블
const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

export function AttendanceModal({
  isOpen,
  onClose,
  userId,
  userName,
  initialConsecutiveDays = 0,
  isLoggedIn = true,
}: AttendanceModalProps) {
  const router = useRouter();
  const [stage, setStage] = useState<StampStage>('ready');
  const [consecutiveDays, setConsecutiveDays] = useState(initialConsecutiveDays);
  const [error, setError] = useState('');

  // 오늘 요일 (0 = 월요일)
  const today = new Date();
  const todayIndex = (today.getDay() + 6) % 7; // 일요일(0) -> 6, 월요일(1) -> 0

  useEffect(() => {
    if (isOpen) {
      setStage('ready');
      setError('');
      setConsecutiveDays(initialConsecutiveDays);
    }
  }, [isOpen, initialConsecutiveDays]);

  const handleStamp = async () => {
    if (!isLoggedIn || !userId) {
      setAttendancePending();
      onClose();
      router.push('/login?redirectTo=/');
      return;
    }

    setStage('stamping');
    setError('');

    try {
      const result = await recordAttendance(userId);

      if (!result) {
        setError('출석 체크에 실패했습니다. 다시 시도해주세요.');
        setStage('ready');
        return;
      }

      if (result.already_checked) {
        setError('오늘은 이미 출석 체크를 완료했습니다!');
        setStage('ready');
        return;
      }

      setConsecutiveDays(result.consecutive_days);
      setStage('stamped');

      setTimeout(() => {
        setStage('success');
      }, 600);
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
      setStage('ready');
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleDismissToday = () => {
    dismissForToday();
    onClose();
  };

  // 각 요일의 스탬프 상태 계산
  const getStampStatus = (dayIndex: number) => {
    if (stage === 'success' || stage === 'stamped') {
      // 출석 완료 후: 오늘까지 연속 출석일만큼 스탬프 표시
      const daysFromToday = todayIndex - dayIndex;
      if (daysFromToday >= 0 && daysFromToday < consecutiveDays) {
        return 'checked';
      }
    } else {
      // 출석 전: 어제까지 연속 출석일만큼 스탬프 표시
      const daysFromToday = todayIndex - dayIndex;
      if (daysFromToday > 0 && daysFromToday <= consecutiveDays) {
        return 'checked';
      }
    }

    if (dayIndex === todayIndex) {
      return stage === 'success' || stage === 'stamped' ? 'checked' : 'today';
    }

    if (dayIndex > todayIndex) {
      return 'future';
    }

    return 'missed';
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
            className="bg-gradient-to-b from-orange-500 to-orange-600 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4">
              <button
                onClick={handleDismissToday}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5 text-white/80" />
              </button>

              {/* Streak Badge */}
              {(consecutiveDays > 0 || stage === 'success') && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 left-4 flex items-center gap-1.5 bg-gray-900 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg"
                >
                  <Flame className="w-4 h-4 text-orange-300" />
                  <span>{stage === 'success' ? consecutiveDays : consecutiveDays}일</span>
                </motion.div>
              )}

              <div className="text-center pt-6">
                {stage === 'success' ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <h2 className="text-2xl font-bold text-white mb-1">출석 완료! 🎉</h2>
                    <p className="text-white/80 text-sm">
                      오늘도 스터플과 함께해요
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {isLoggedIn ? `${userName || '회원'}님` : '출석 체크'}
                    </h2>
                    <p className="text-white/80 text-sm">
                      {isLoggedIn ? '오늘의 출석 스탬프를 찍어주세요!' : '로그인하고 출석해주세요!'}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* 7-Day Calendar Grid */}
            <div className="px-6 pb-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="grid grid-cols-7 gap-2">
                  {WEEKDAYS.map((day, index) => {
                    const status = getStampStatus(index);
                    return (
                      <motion.div
                        key={day}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex flex-col items-center"
                      >
                        {/* 요일 레이블 */}
                        <span className={`text-xs font-medium mb-2 ${
                          index === todayIndex ? 'text-white font-bold' : 'text-white/60'
                        }`}>
                          {day}
                        </span>

                        {/* 스탬프 영역 */}
                        <motion.div
                          animate={
                            status === 'today' && stage === 'stamping'
                              ? { scale: [1, 1.2, 1], rotate: [0, -10, 0] }
                              : {}
                          }
                          transition={{ duration: 0.3 }}
                          className={`
                            w-10 h-10 rounded-xl flex items-center justify-center
                            transition-all duration-300
                            ${status === 'checked'
                              ? 'bg-gray-900 shadow-lg shadow-black/30'
                              : status === 'today'
                                ? 'bg-white shadow-lg shadow-white/30 ring-2 ring-gray-900/30'
                                : status === 'future'
                                  ? 'bg-white/10 border-2 border-dashed border-white/20'
                                  : 'bg-white/5 border border-white/10'
                            }
                          `}
                        >
                          {status === 'checked' ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                            >
                              <Check className="w-5 h-5 text-white" strokeWidth={3} />
                            </motion.div>
                          ) : status === 'today' ? (
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                              className="w-3 h-3 rounded-full bg-orange-500"
                            />
                          ) : null}
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Motivation Message */}
            <div className="px-6 pb-4">
              <div className="bg-white/5 rounded-xl px-4 py-3 text-center">
                <p className="text-white/90 text-sm font-medium">
                  {stage === 'success'
                    ? '꾸준한 출석이 실력을 만들어요 💪'
                    : '스터플과 함께 꾸준한 공부를 시작해보세요!'}
                </p>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mx-6 mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl text-sm text-red-200 text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="px-6 pb-6">
              {stage === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <button
                    onClick={handleClose}
                    className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-colors shadow-lg"
                  >
                    확인
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-3"
                >
                  <button
                    onClick={handleStamp}
                    disabled={stage === 'stamping'}
                    className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {stage === 'stamping' ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>출석 중...</span>
                      </>
                    ) : (
                      <span>{isLoggedIn ? '오늘 출석하기' : '로그인하고 출석하기'}</span>
                    )}
                  </button>
                  <button
                    onClick={handleDismissToday}
                    className="w-full text-center text-sm text-white/50 hover:text-white/80 transition-colors py-2"
                  >
                    오늘 하루 보지 않기
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
