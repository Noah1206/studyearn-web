'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Users,
  ArrowLeft,
  Check,
  Pencil,
  Calculator,
  Languages,
  FlaskConical,
  Code,
  FileText,
  Award,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui';

// 온보딩 스텝
type OnboardingStep = 'welcome' | 'role' | 'interests' | 'goal' | 'complete';

// 관심 분야
const INTERESTS = [
  { id: 'korean', label: '국어', icon: BookOpen },
  { id: 'math', label: '수학', icon: Calculator },
  { id: 'english', label: '영어', icon: Languages },
  { id: 'science', label: '과학', icon: FlaskConical },
  { id: 'coding', label: '코딩', icon: Code },
  { id: 'essay', label: '논술', icon: FileText },
  { id: 'exam', label: '자격증', icon: Award },
  { id: 'study', label: '학습법', icon: Lightbulb },
];

// 목표
const GOALS = [
  { id: 'learn', label: '학습 자료 구매하기', description: '다른 학생들의 노하우를 배워요' },
  { id: 'share', label: '내 자료 공유하기', description: '나만의 학습 방법을 나눠요' },
  { id: 'earn', label: '수익 창출하기', description: '학습 자료로 수익을 얻어요' },
  { id: 'both', label: '배우고 공유하기', description: '둘 다 하고 싶어요!' },
];

// 애니메이션 variants
const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [role, setRole] = useState<'student' | 'creator' | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [error, setError] = useState('');
  const supabase = useMemo(() => createClient(), []);

  // 소셜 로그인 핸들러
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

  const handleGoogleLogin = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=/`,
      },
    });
    if (error) {
      console.error('Google login error:', error);
      setError('구글 로그인에 실패했습니다.');
    }
  };

  // 다음 스텝
  const handleNext = () => {
    switch (step) {
      case 'welcome':
        setStep('role');
        break;
      case 'role':
        if (role) setStep('interests');
        break;
      case 'interests':
        if (selectedInterests.length > 0) setStep('goal');
        break;
      case 'goal':
        if (selectedGoal) setStep('complete');
        break;
      case 'complete':
        // 로컬 스토리지에 온보딩 데이터 저장
        localStorage.setItem('studyearn_onboarding', JSON.stringify({
          role,
          interests: selectedInterests,
          goal: selectedGoal,
        }));
        router.push('/signup');
        break;
    }
  };

  // 이전 스텝
  const handleBack = () => {
    switch (step) {
      case 'role':
        setStep('welcome');
        break;
      case 'interests':
        setStep('role');
        break;
      case 'goal':
        setStep('interests');
        break;
      case 'complete':
        setStep('goal');
        break;
    }
  };

  // 관심분야 토글
  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // 버튼 활성화 여부
  const isNextEnabled = () => {
    switch (step) {
      case 'welcome': return true;
      case 'role': return role !== null;
      case 'interests': return selectedInterests.length > 0;
      case 'goal': return selectedGoal !== null;
      case 'complete': return true;
      default: return false;
    }
  };

  // 프로그레스
  const getProgress = () => {
    switch (step) {
      case 'welcome': return 0;
      case 'role': return 25;
      case 'interests': return 50;
      case 'goal': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header - 프로그레스바 */}
      {step !== 'welcome' && (
        <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 px-4 py-4">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button
              onClick={handleBack}
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                initial={{ width: 0 }}
                animate={{ width: `${getProgress()}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <div className="w-10" />
          </div>
        </header>
      )}

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <WelcomeStep
              key="welcome"
              error={error}
              onKakaoLogin={handleKakaoLogin}
              onGoogleLogin={handleGoogleLogin}
            />
          )}
          {step === 'role' && (
            <RoleStep key="role" role={role} setRole={setRole} />
          )}
          {step === 'interests' && (
            <InterestsStep
              key="interests"
              selectedInterests={selectedInterests}
              toggleInterest={toggleInterest}
            />
          )}
          {step === 'goal' && (
            <GoalStep
              key="goal"
              selectedGoal={selectedGoal}
              setSelectedGoal={setSelectedGoal}
            />
          )}
          {step === 'complete' && (
            <CompleteStep
              key="complete"
              role={role}
              selectedInterests={selectedInterests}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 px-6 py-6">
        <div className="max-w-lg mx-auto space-y-3">
          <Button
            onClick={handleNext}
            disabled={!isNextEnabled()}
            fullWidth
            className="py-3.5 text-base font-semibold"
          >
            {step === 'complete' ? '시작하기' : '계속'}
          </Button>
          {step === 'welcome' && (
            <button
              onClick={() => {
                localStorage.setItem('studyearn_onboarding', JSON.stringify({ skipped: true }));
                router.push('/signup');
              }}
              className="w-full text-center text-gray-500 text-sm py-3 hover:text-gray-700 transition-colors font-medium"
            >
              건너뛰기
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

// Welcome Step
function WelcomeStep({
  error,
  onKakaoLogin,
  onGoogleLogin,
}: {
  error: string;
  onKakaoLogin: () => void;
  onGoogleLogin: () => void;
}) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full max-w-lg text-center"
    >
      {/* Logo */}
      <div className="w-[100px] h-[100px] bg-white rounded-[28px] flex items-center justify-center mx-auto mb-5 shadow-xl shadow-orange-500/20 border border-gray-100">
        <Image
          src="/logo.svg"
          alt="StuPle"
          width={64}
          height={64}
          className="w-16 h-16"
        />
      </div>

      {/* Title */}
      <h1 className="text-[32px] font-bold text-gray-900 mb-2 tracking-tight">StuPle</h1>
      <p className="text-lg text-gray-500 mb-8 whitespace-pre-line leading-relaxed">
        {'공부가\n너의 가치가 되는 순간'}
      </p>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-4 text-center">
          {error}
        </div>
      )}

      {/* Social Login Buttons */}
      <div className="space-y-3 mb-8">
        {/* Kakao Button */}
        <button
          type="button"
          onClick={onKakaoLogin}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-semibold rounded-xl transition-all"
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

        {/* Google Button */}
        <button
          type="button"
          onClick={onGoogleLogin}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-white border border-gray-300 hover:border-gray-400 text-gray-900 font-semibold rounded-xl transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M19.6 10.23c0-.68-.06-1.34-.17-1.97H10v3.73h5.38a4.6 4.6 0 01-2 3.02v2.5h3.24c1.89-1.74 2.98-4.3 2.98-7.28z" fill="#4285F4"/>
            <path d="M10 20c2.7 0 4.96-.9 6.62-2.42l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.58-4.12H1.07v2.58A9.99 9.99 0 0010 20z" fill="#34A853"/>
            <path d="M4.42 11.91A6.02 6.02 0 014.1 10c0-.66.11-1.31.32-1.91V5.51H1.07A9.99 9.99 0 000 10c0 1.61.39 3.14 1.07 4.49l3.35-2.58z" fill="#FBBC05"/>
            <path d="M10 3.96c1.47 0 2.78.5 3.82 1.5l2.86-2.86A9.97 9.97 0 0010 0 9.99 9.99 0 001.07 5.51l3.35 2.58C5.2 5.72 7.4 3.96 10 3.96z" fill="#EA4335"/>
          </svg>
          구글로 시작하기
        </button>
      </div>

      {/* Divider */}
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-[#F8FAFC] text-gray-500">또는</span>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-4">
        <FeatureItem
          icon={<BookOpen className="w-5 h-5 text-[#FF5500]" />}
          bgColor="bg-[#FFF5F0]"
          title="학습 자료 거래"
          description="나만의 노하우를 공유하고 수익을 얻어요"
        />
        <FeatureItem
          icon={<ShieldCheck className="w-5 h-5 text-amber-500" />}
          bgColor="bg-amber-50"
          title="검증된 콘텐츠"
          description="실제 성적 향상에 도움이 된 자료만"
        />
        <FeatureItem
          icon={<Users className="w-5 h-5 text-[#FF5500]" />}
          bgColor="bg-[#FFF5F0]"
          title="청소년 안전"
          description="13-29세 학생 전용, 부모님 동의 시스템"
        />
      </div>
    </motion.div>
  );
}

function FeatureItem({ icon, bgColor, title, description }: {
  icon: React.ReactNode;
  bgColor: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
      <div className={`w-12 h-12 ${bgColor} rounded-[14px] flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="text-left">
        <p className="font-semibold text-gray-900 mb-0.5">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}

// Role Step
function RoleStep({ role, setRole }: {
  role: 'student' | 'creator' | null;
  setRole: (role: 'student' | 'creator') => void;
}) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full max-w-lg"
    >
      <h2 className="text-[28px] font-bold text-gray-900 mb-2 leading-[38px]">
        어떤 목적으로<br />사용하실 건가요?
      </h2>
      <p className="text-gray-500 mb-8">나중에 언제든 변경할 수 있어요</p>

      <div className="grid grid-cols-2 gap-3">
        {/* 학습자 카드 */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setRole('student')}
          className={`relative p-5 rounded-2xl border-2 transition-all text-center ${
            role === 'student'
              ? 'border-[#FF5500] bg-[#FFF5F0]'
              : 'border-transparent bg-gray-50 hover:bg-gray-100'
          }`}
        >
          <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-4 ${
            role === 'student'
              ? 'bg-gradient-to-br from-orange-500 to-orange-600'
              : 'bg-gray-200'
          }`}>
            <GraduationCap className={`w-8 h-8 ${role === 'student' ? 'text-white' : 'text-gray-400'}`} />
          </div>
          <p className={`font-bold text-lg mb-2 ${role === 'student' ? 'text-[#FF5500]' : 'text-gray-900'}`}>
            학습자
          </p>
          <p className={`text-[13px] leading-[18px] ${role === 'student' ? 'text-[#E64A00]' : 'text-gray-500'}`}>
            다른 학생들의 학습 자료를<br />구매하고 싶어요
          </p>
          {role === 'student' && (
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#FF5500] flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </motion.button>

        {/* 크리에이터 카드 */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setRole('creator')}
          className={`relative p-5 rounded-2xl border-2 transition-all text-center ${
            role === 'creator'
              ? 'border-purple-400 bg-purple-50'
              : 'border-transparent bg-gray-50 hover:bg-gray-100'
          }`}
        >
          <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-4 ${
            role === 'creator'
              ? 'bg-gradient-to-br from-purple-500 to-purple-600'
              : 'bg-gray-200'
          }`}>
            <Pencil className={`w-8 h-8 ${role === 'creator' ? 'text-white' : 'text-gray-400'}`} />
          </div>
          <p className={`font-bold text-lg mb-2 ${role === 'creator' ? 'text-purple-600' : 'text-gray-900'}`}>
            크리에이터
          </p>
          <p className={`text-[13px] leading-[18px] ${role === 'creator' ? 'text-purple-600' : 'text-gray-500'}`}>
            나만의 학습 자료를<br />판매하고 싶어요
          </p>
          {role === 'creator' && (
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

// Interests Step
function InterestsStep({ selectedInterests, toggleInterest }: {
  selectedInterests: string[];
  toggleInterest: (id: string) => void;
}) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full max-w-lg flex flex-col min-h-[60vh]"
    >
      <div>
        <h2 className="text-[28px] font-bold text-gray-900 mb-2 leading-[38px]">
          어떤 분야에<br />관심이 있으세요?
        </h2>
        <p className="text-gray-500 mb-8">여러 개 선택할 수 있어요</p>

        <div className="flex flex-wrap gap-[10px]">
          {INTERESTS.map((interest) => {
            const isSelected = selectedInterests.includes(interest.id);
            const Icon = interest.icon;
            return (
              <motion.button
                key={interest.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleInterest(interest.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-full transition-all ${
                  isSelected
                    ? 'bg-[#FF5500] text-white shadow-lg shadow-[#FF5500]/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-semibold text-[15px]">{interest.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {selectedInterests.length > 0 && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-[#FF5500] font-medium mt-auto"
        >
          {selectedInterests.length}개 선택됨
        </motion.p>
      )}
    </motion.div>
  );
}

// Goal Step
function GoalStep({ selectedGoal, setSelectedGoal }: {
  selectedGoal: string | null;
  setSelectedGoal: (id: string) => void;
}) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full max-w-lg"
    >
      <h2 className="text-[28px] font-bold text-gray-900 mb-2 leading-[38px]">
        스터플에서<br />무엇을 하고 싶으세요?
      </h2>
      <p className="text-gray-500 mb-8">맞춤 추천을 위해 알려주세요</p>

      <div className="space-y-3">
        {GOALS.map((goal) => {
          const isSelected = selectedGoal === goal.id;
          return (
            <motion.button
              key={goal.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelectedGoal(goal.id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-[#FF5500] bg-[#FFF5F0]'
                  : 'border-transparent bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="text-left">
                <p className={`font-semibold mb-0.5 ${isSelected ? 'text-[#FF5500]' : 'text-gray-900'}`}>
                  {goal.label}
                </p>
                <p className={`text-sm ${isSelected ? 'text-[#E64A00]' : 'text-gray-500'}`}>
                  {goal.description}
                </p>
              </div>
              <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isSelected ? 'border-[#FF5500]' : 'border-gray-300'
              }`}>
                {isSelected && (
                  <div className="w-3 h-3 rounded-full bg-[#FF5500]" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// Complete Step
function CompleteStep({ role, selectedInterests }: {
  role: 'student' | 'creator' | null;
  selectedInterests: string[];
}) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full max-w-lg text-center"
    >
      {/* Check Badge */}
      <div className="w-24 h-24 bg-gradient-to-br from-[#FF5500] to-[#E64A00] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#FF5500]/30">
        <Check className="w-12 h-12 text-white" strokeWidth={3} />
      </div>

      <h2 className="text-[28px] font-bold text-gray-900 mb-3">준비 완료!</h2>
      <p className="text-gray-500 mb-8 whitespace-pre-line leading-relaxed">
        {role === 'creator'
          ? '크리에이터로서 여정을 시작해보세요.\n나만의 학습 자료로 수익을 창출할 수 있어요!'
          : '학습자로서 여정을 시작해보세요.\n검증된 학습 자료를 만나보세요!'}
      </p>

      {/* Summary Card */}
      <div className="bg-gray-50 rounded-2xl p-5">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">선택한 역할</span>
          <span className="font-semibold text-gray-900">
            {role === 'creator' ? '크리에이터' : '학습자'}
          </span>
        </div>
        <div className="h-px bg-gray-200 my-3" />
        <div className="flex justify-between items-start">
          <span className="text-gray-500 text-sm">관심 분야</span>
          <span className="font-semibold text-gray-900 text-right max-w-[60%]">
            {selectedInterests.map(id => INTERESTS.find(i => i.id === id)?.label).join(', ')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
