'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  School,
  BookOpen,
  Shield,
  Users,
  ChevronLeft,
  Check,
  PenTool,
  Calculator,
  Languages,
  FlaskConical,
  Code,
  FileText,
  Award,
  Lightbulb,
} from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

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

// 파스텔 블루 테마
const THEME = {
  primary: '#5CBFD9',
  primaryDark: '#3BA8C4',
  primaryLight: '#E8F6F9',
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [role, setRole] = useState<'student' | 'creator' | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

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
        // 로컬 스토리지에 온보딩 완료 저장
        localStorage.setItem('onboarding_completed', 'true');
        localStorage.setItem('onboarding_role', role || 'student');
        localStorage.setItem('onboarding_interests', JSON.stringify(selectedInterests));
        localStorage.setItem('onboarding_goal', selectedGoal || '');
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      {step !== 'welcome' && (
        <header className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="max-w-lg mx-auto flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: THEME.primary }}
                initial={{ width: 0 }}
                animate={{ width: `${getProgress()}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="w-10" />
          </div>
        </header>
      )}

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <WelcomeStep key="welcome" />
          )}
          {step === 'role' && (
            <RoleStep key="role" role={role} setRole={setRole} theme={THEME} />
          )}
          {step === 'interests' && (
            <InterestsStep
              key="interests"
              selectedInterests={selectedInterests}
              toggleInterest={toggleInterest}
              theme={THEME}
            />
          )}
          {step === 'goal' && (
            <GoalStep
              key="goal"
              selectedGoal={selectedGoal}
              setSelectedGoal={setSelectedGoal}
              theme={THEME}
            />
          )}
          {step === 'complete' && (
            <CompleteStep
              key="complete"
              role={role}
              selectedInterests={selectedInterests}
              theme={THEME}
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
            className="py-3"
          >
            {step === 'complete' ? '시작하기' : '계속'}
          </Button>
          {step === 'welcome' && (
            <button
              onClick={() => {
                localStorage.setItem('onboarding_completed', 'true');
                router.push('/signup');
              }}
              className="w-full text-center text-gray-500 text-sm py-2 hover:text-gray-700 transition-colors"
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
function WelcomeStep() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-lg text-center"
    >
      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
        <School className="w-12 h-12 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">StuPle</h1>
      <p className="text-lg text-gray-500 mb-10 whitespace-pre-line">
        {'공부가\n너의 가치가 되는 순간'}
      </p>

      <div className="space-y-4">
        <FeatureItem
          icon={<BookOpen className="w-5 h-5 text-cyan-500" />}
          bgColor="bg-cyan-50"
          title="학습 자료 거래"
          description="나만의 노하우를 공유하고 수익을 얻어요"
        />
        <FeatureItem
          icon={<Shield className="w-5 h-5 text-amber-500" />}
          bgColor="bg-amber-50"
          title="검증된 콘텐츠"
          description="실제 성적 향상에 도움이 된 자료만"
        />
        <FeatureItem
          icon={<Users className="w-5 h-5 text-cyan-500" />}
          bgColor="bg-cyan-50"
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
      <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
      <div className="text-left">
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}

// Role Step
function RoleStep({ role, setRole, theme }: {
  role: 'student' | 'creator' | null;
  setRole: (role: 'student' | 'creator') => void;
  theme: typeof THEME;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-lg"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        어떤 목적으로<br />사용하실 건가요?
      </h2>
      <p className="text-gray-500 mb-8">나중에 언제든 변경할 수 있어요</p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setRole('student')}
          className={`relative p-5 rounded-2xl border-2 transition-all text-center ${
            role === 'student'
              ? 'border-cyan-400 bg-cyan-50'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300'
          }`}
        >
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            role === 'student'
              ? 'bg-gradient-to-br from-blue-500 to-blue-600'
              : 'bg-gray-200'
          }`}>
            <School className={`w-8 h-8 ${role === 'student' ? 'text-white' : 'text-gray-400'}`} />
          </div>
          <p className={`font-bold text-lg mb-1 ${role === 'student' ? 'text-cyan-600' : 'text-gray-900'}`}>
            학습자
          </p>
          <p className={`text-sm ${role === 'student' ? 'text-cyan-600' : 'text-gray-500'}`}>
            다른 학생들의 학습 자료를<br />구매하고 싶어요
          </p>
          {role === 'student' && (
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </button>

        <button
          onClick={() => setRole('creator')}
          className={`relative p-5 rounded-2xl border-2 transition-all text-center ${
            role === 'creator'
              ? 'border-purple-400 bg-purple-50'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300'
          }`}
        >
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            role === 'creator'
              ? 'bg-gradient-to-br from-purple-500 to-purple-600'
              : 'bg-gray-200'
          }`}>
            <PenTool className={`w-8 h-8 ${role === 'creator' ? 'text-white' : 'text-gray-400'}`} />
          </div>
          <p className={`font-bold text-lg mb-1 ${role === 'creator' ? 'text-purple-600' : 'text-gray-900'}`}>
            크리에이터
          </p>
          <p className={`text-sm ${role === 'creator' ? 'text-purple-600' : 'text-gray-500'}`}>
            나만의 학습 자료를<br />판매하고 싶어요
          </p>
          {role === 'creator' && (
            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// Interests Step
function InterestsStep({ selectedInterests, toggleInterest, theme }: {
  selectedInterests: string[];
  toggleInterest: (id: string) => void;
  theme: typeof THEME;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-lg"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        어떤 분야에<br />관심이 있으세요?
      </h2>
      <p className="text-gray-500 mb-8">여러 개 선택할 수 있어요</p>

      <div className="flex flex-wrap gap-3">
        {INTERESTS.map((interest) => {
          const isSelected = selectedInterests.includes(interest.id);
          const Icon = interest.icon;
          return (
            <button
              key={interest.id}
              onClick={() => toggleInterest(interest.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-full transition-all ${
                isSelected
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{interest.label}</span>
            </button>
          );
        })}
      </div>

      {selectedInterests.length > 0 && (
        <p className="text-center text-cyan-600 font-medium mt-6">
          {selectedInterests.length}개 선택됨
        </p>
      )}
    </motion.div>
  );
}

// Goal Step
function GoalStep({ selectedGoal, setSelectedGoal, theme }: {
  selectedGoal: string | null;
  setSelectedGoal: (id: string) => void;
  theme: typeof THEME;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-lg"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        스터플에서<br />무엇을 하고 싶으세요?
      </h2>
      <p className="text-gray-500 mb-8">맞춤 추천을 위해 알려주세요</p>

      <div className="space-y-3">
        {GOALS.map((goal) => {
          const isSelected = selectedGoal === goal.id;
          return (
            <button
              key={goal.id}
              onClick={() => setSelectedGoal(goal.id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
            >
              <div className="text-left">
                <p className={`font-semibold ${isSelected ? 'text-cyan-600' : 'text-gray-900'}`}>
                  {goal.label}
                </p>
                <p className={`text-sm ${isSelected ? 'text-cyan-600' : 'text-gray-500'}`}>
                  {goal.description}
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                isSelected ? 'border-cyan-400' : 'border-gray-300'
              }`}>
                {isSelected && (
                  <div className="w-3 h-3 rounded-full bg-cyan-400" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// Complete Step
function CompleteStep({ role, selectedInterests, theme }: {
  role: 'student' | 'creator' | null;
  selectedInterests: string[];
  theme: typeof THEME;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-lg text-center"
    >
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}
      >
        <Check className="w-12 h-12 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">준비 완료!</h2>
      <p className="text-gray-500 mb-8 whitespace-pre-line">
        {role === 'creator'
          ? '크리에이터로서 여정을 시작해보세요.\n나만의 학습 자료로 수익을 창출할 수 있어요!'
          : '학습자로서 여정을 시작해보세요.\n검증된 학습 자료를 만나보세요!'}
      </p>

      <Card className="text-left">
        <CardContent className="p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">선택한 역할</span>
            <span className="font-semibold text-gray-900">
              {role === 'creator' ? '크리에이터' : '학습자'}
            </span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex justify-between items-center">
            <span className="text-gray-500">관심 분야</span>
            <span className="font-semibold text-gray-900">
              {selectedInterests.map(id => INTERESTS.find(i => i.id === id)?.label).join(', ')}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
