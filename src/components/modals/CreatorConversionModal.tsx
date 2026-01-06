'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, TrendingUp, Users, FileText, DollarSign, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { useUserStore } from '@/store/userStore';
import { createClient } from '@/lib/supabase/client';

interface CreatorConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BENEFITS = [
  {
    icon: FileText,
    title: '콘텐츠 업로드',
    description: '학습 자료, 노트, 영상 등을 업로드하세요',
  },
  {
    icon: Users,
    title: '구독자 관리',
    description: '팔로워와 구독자를 관리하고 소통하세요',
  },
  {
    icon: DollarSign,
    title: '수익 창출',
    description: '유료 콘텐츠와 구독으로 수익을 만들어보세요',
  },
  {
    icon: TrendingUp,
    title: '통계 분석',
    description: '콘텐츠 성과와 구독자 통계를 확인하세요',
  },
];

export function CreatorConversionModal({ isOpen, onClose }: CreatorConversionModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const { profile, completeCreatorOnboarding } = useUserStore();
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState('');

  const handleConvert = async () => {
    if (!profile) return;

    setIsConverting(true);
    setError('');

    try {
      // Update profiles table to set is_creator = true
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_creator: true, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (profileError) {
        setError('크리에이터 전환에 실패했습니다.');
        setIsConverting(false);
        return;
      }

      // Create creator_settings record
      const { error: settingsError } = await supabase
        .from('creator_settings')
        .upsert({
          user_id: profile.id,
          display_name: profile.nickname || profile.email,
          bio: profile.bio || '',
          profile_image_url: profile.avatar_url || null,
          is_verified: false,
          total_subscribers: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (settingsError) {
        console.error('Creator settings error:', settingsError);
        // Not critical, continue anyway
      }

      // Update local state
      completeCreatorOnboarding({
        display_name: profile.nickname || profile.email,
        bio: profile.bio,
        school: profile.school,
        profile_image_url: profile.avatar_url,
        is_verified: false,
        total_subscribers: 0,
      });

      onClose();
      router.push('/dashboard');
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
      setIsConverting(false);
    }
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
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="relative p-6 pb-4 border-b border-gray-100">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">크리에이터 되기</h2>
                  <p className="text-sm text-gray-500">나만의 학습 콘텐츠를 공유하세요</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Benefits */}
              <div className="space-y-4 mb-6">
                {BENEFITS.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-5 h-5 text-gray-900" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                      <p className="text-sm text-gray-500">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Terms */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-gray-50 rounded-lg p-4 mb-6"
              >
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900 mb-1">크리에이터 약관 동의</p>
                    <p>크리에이터로 전환 시 콘텐츠 가이드라인 및 커뮤니티 정책에 동의하게 됩니다.</p>
                  </div>
                </div>
              </motion.div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.35 }}
                className="flex gap-3"
              >
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  나중에
                </Button>
                <Button
                  onClick={handleConvert}
                  isLoading={isConverting}
                  className="flex-1"
                >
                  크리에이터 시작하기
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
