'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Award, Sparkles, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { recordAttendance, dismissForToday } from '@/lib/attendance';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  initialConsecutiveDays?: number;
}

// Stamp animation stages
type StampStage = 'ready' | 'stamping' | 'stamped' | 'success';

export function AttendanceModal({
  isOpen,
  onClose,
  userId,
  userName,
  initialConsecutiveDays = 0,
}: AttendanceModalProps) {
  const [stage, setStage] = useState<StampStage>('ready');
  const [consecutiveDays, setConsecutiveDays] = useState(initialConsecutiveDays);
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStage('ready');
      setError('');
      setConsecutiveDays(initialConsecutiveDays);
    }
  }, [isOpen, initialConsecutiveDays]);

  const handleStamp = async () => {
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

      // Success! Update consecutive days and show stamped state
      setConsecutiveDays(result.consecutive_days);
      setStage('stamped');

      // After stamp animation, show success
      setTimeout(() => {
        setStage('success');
      }, 800);
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

  // Stamp variants for animation
  const stampVariants = {
    ready: { scale: 1, rotate: 0, y: 0 },
    stamping: { scale: 1.3, rotate: -15, y: -30 },
    stamped: { scale: 1, rotate: 0, y: 0 },
  };

  const stampImpactVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: [0, 1.5, 1],
      opacity: [0, 1, 1],
      transition: { duration: 0.4, ease: 'easeOut' as const },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && handleDismissToday()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-6 pb-4">
              <button
                onClick={handleDismissToday}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              <div className="text-center">
                {stage === 'success' ? (
                  <>
                    <h2 className="text-xl font-bold text-gray-900">출석 완료!</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {consecutiveDays}일 연속 출석 중!
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-blue-600 font-medium mb-1">
                      {userName}님, 안녕하세요!
                    </p>
                    <h2 className="text-xl font-bold text-gray-900">
                      오늘의 출석 스탬프
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">
                      매일 출석하고 포인트를 모아보세요
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              {/* Stamp Area */}
              <div className="relative flex items-center justify-center h-48 mb-6">
                {/* Background calendar grid */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-gray-50 flex items-center justify-center">
                    <Calendar className="w-16 h-16 text-gray-200" />
                  </div>
                </div>

                {/* Stamp impact effect */}
                <AnimatePresence>
                  {(stage === 'stamped' || stage === 'success') && (
                    <motion.div
                      variants={stampImpactVariants}
                      initial="hidden"
                      animate="visible"
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <div className="w-36 h-36 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-20 h-20 text-green-500" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Stamp icon */}
                {stage !== 'success' && stage !== 'stamped' && (
                  <motion.div
                    variants={stampVariants}
                    animate={stage}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 15,
                    }}
                    className="relative z-10"
                  >
                    <div
                      className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                        stage === 'stamping'
                          ? 'bg-green-500'
                          : 'bg-gradient-to-br from-blue-500 to-blue-600'
                      }`}
                    >
                      <Award className="w-12 h-12 text-white" />
                    </div>
                  </motion.div>
                )}

                {/* Success celebration */}
                {stage === 'success' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    {/* Confetti-like particles */}
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                        animate={{
                          scale: [0, 1, 0.8],
                          x: Math.cos((i * Math.PI * 2) / 8) * 60,
                          y: Math.sin((i * Math.PI * 2) / 8) * 60,
                          opacity: [1, 1, 0],
                        }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="absolute"
                      >
                        <Sparkles
                          className={`w-5 h-5 ${
                            i % 2 === 0 ? 'text-yellow-400' : 'text-blue-400'
                          }`}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Consecutive Days Display */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-50 rounded-xl p-4 mb-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">연속 출석</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {consecutiveDays}
                    </span>
                    <span className="text-sm text-gray-500">일</span>
                  </div>
                </div>
                {consecutiveDays >= 7 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-xs text-blue-600 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    1주일 연속 출석 달성!
                  </motion.div>
                )}
              </motion.div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              {stage === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button onClick={handleClose} fullWidth>
                    확인
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-3"
                >
                  <Button
                    onClick={handleStamp}
                    isLoading={stage === 'stamping'}
                    fullWidth
                    size="lg"
                  >
                    출석 스탬프 찍기
                  </Button>
                  <button
                    onClick={handleDismissToday}
                    className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
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
