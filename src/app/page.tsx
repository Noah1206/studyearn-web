'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowRight,
  FileText,
  BookOpen,
  TrendingUp,
  Users,
  Star,
  Timer,
  ChevronDown,
  Heart,
  Share2,
  Search,
  Home,
  User,
  Plus,
  Wallet,
  Camera,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui';

// Intersection Observer Hook for scroll animations
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    // Support all animation classes
    const animationClasses = [
      '.animate-on-scroll',
      '.animate-fade-left',
      '.animate-fade-right',
      '.animate-scale-up',
      '.animate-blur-in',
      '.animate-bar'
    ];

    animationClasses.forEach(className => {
      const elements = ref.current?.querySelectorAll(className);
      elements?.forEach((el) => observer.observe(el));
    });

    return () => observer.disconnect();
  }, []);

  return ref;
}

// Hero scroll reveal hook - auto-reveals on mobile, scroll-triggered on desktop
function useHeroScrollReveal() {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile on mount
    const checkMobile = () => window.innerWidth < 768;
    setIsMobile(checkMobile());

    // On mobile, auto-reveal immediately
    if (checkMobile()) {
      setIsRevealed(true);
      return;
    }

    if (isRevealed) return;

    // Lock scroll initially (desktop only)
    document.body.style.overflow = 'hidden';

    let triggered = false;

    const triggerReveal = () => {
      if (triggered) return;
      triggered = true;
      setIsRevealed(true);

      // Allow scrolling after animation completes
      setTimeout(() => {
        document.body.style.overflow = '';
      }, 800);
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) {
        e.preventDefault();
        triggerReveal();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isRevealed]);

  return isRevealed;
}

// Rotating Problem Card Data
const sellerProblems = [
  {
    emoji: '😩',
    title: '"공부 잘하는데, 돈이 없어요"',
    desc: '전교 1등인데 용돈은 쥐꼬리. 알바할 시간도 없고, 내 실력을 돈으로 바꿀 방법이 없었어요.',
    points: ['과외는 시간이 너무 많이 들어요', '노트 정리하는 건 어차피 하는 건데...', '내 공부법을 공유하고 싶어요'],
  },
  {
    emoji: '😤',
    title: '"과외는 체력이 안 돼요"',
    desc: '시험 기간에도 과외 가야하고, 이동 시간도 아깝고. 좀 더 효율적으로 돈 벌고 싶어요.',
    points: ['왕복 2시간이 너무 아까워요', '시험 기간에도 빠질 수가 없어요', '한 번만 정리하면 계속 팔리면 좋겠어요'],
  },
  {
    emoji: '🥺',
    title: '"나만의 공부법이 있는데..."',
    desc: '친구들한테 알려주면 다들 신기해해요. 이걸 더 많은 사람들한테 전하고 싶은데 방법을 몰랐어요.',
    points: ['SNS에 올리기엔 너무 길어요', '블로그는 수익화가 어려워요', '직접 판매하고 싶어요'],
  },
  {
    emoji: '😫',
    title: '"부모님한테 손 벌리기 싫어요"',
    desc: '갖고 싶은 것도 많고, 하고 싶은 것도 많은데. 내 능력으로 돈을 벌고 싶어요.',
    points: ['용돈으로는 부족해요', '알바는 공부에 지장이 가요', '내 실력으로 벌고 싶어요'],
  },
  {
    emoji: '😮‍💨',
    title: '"시간은 없고 돈은 필요해요"',
    desc: '공부하면서 돈도 벌고 싶은데, 둘 다 하기엔 하루가 24시간이 부족해요.',
    points: ['공부 시간은 줄이고 싶지 않아요', '짧은 시간에 효율적으로 벌고 싶어요', '수동적 소득이면 좋겠어요'],
  },
];

const buyerProblems = [
  {
    emoji: '😢',
    title: '"좋은 자료를 구하기 힘들어요"',
    desc: '인터넷 자료는 질이 들쑥날쑥. 진짜 잘하는 애들의 노트랑 공부법을 직접 보고 싶은데 방법이 없었어요.',
    points: ['유튜브 공부법은 너무 일반적이에요', '진짜 1등 노트를 보고 싶어요', '선배들의 실제 루틴이 궁금해요'],
  },
  {
    emoji: '😰',
    title: '"어떻게 공부해야 할지 모르겠어요"',
    desc: '열심히는 하는데 성적이 안 올라요. 잘하는 애들은 뭐가 다른지 알고 싶어요.',
    points: ['공부 시간은 긴데 효율이 안 나요', '뭘 먼저 해야 할지 모르겠어요', '실제 사례가 궁금해요'],
  },
  {
    emoji: '🥲',
    title: '"과외비가 너무 비싸요"',
    desc: '1시간에 5만원... 부담스러워서 부모님한테 말도 못하겠어요. 더 저렴한 방법이 없을까요?',
    points: ['인강은 질문을 못해요', '학원은 내 속도에 안 맞아요', '1:1 피드백이 필요해요'],
  },
  {
    emoji: '😓',
    title: '"혼자 공부하면 집중이 안 돼요"',
    desc: '카페 가면 돈 아깝고, 집에 있으면 침대가 날 불러요. 같이 공부하는 환경이 필요해요.',
    points: ['스터디 카페 비용이 부담돼요', '친구들은 다 다른 시간에 공부해요', '누군가 같이 공부하면 좋겠어요'],
  },
  {
    emoji: '😵',
    title: '"정보가 너무 많아서 뭐가 맞는지..."',
    desc: '인터넷에 공부법이 너무 많아요. 뭐가 진짜 효과 있는 건지, 검증된 방법을 알고 싶어요.',
    points: ['공부법 유튜브만 보다 하루가 가요', '결국 뭘 따라야 할지 모르겠어요', '실제 성공 사례가 궁금해요'],
  },
];

// Individual Problem Card Component
function ProblemCard({ problem }: { problem: typeof sellerProblems[0] }) {
  return (
    <div className="bg-gray-50 rounded-3xl p-6 md:p-10 min-w-[280px] sm:min-w-[320px] md:min-w-[450px] max-w-[320px] md:max-w-[450px] flex-shrink-0">
      <div className="w-14 h-14 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-sm">
        <span className="text-3xl md:text-5xl">{problem.emoji}</span>
      </div>
      <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">
        {problem.title}
      </h3>
      <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-3 md:mb-4">
        {problem.desc}
      </p>
      <ul className="space-y-1.5 md:space-y-2">
        {problem.points.map((point, i) => (
          <li key={i} className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Horizontal Auto-Scrolling Carousel Component
function HorizontalProblemCarousel({ problems, direction = 'left' }: { problems: typeof sellerProblems; direction?: 'left' | 'right' }) {
  const duplicatedProblems = [...problems, ...problems];

  return (
    <div className="relative overflow-hidden py-4">
      {/* Gradient masks for smooth edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      {/* Scrolling container */}
      <div
        className={direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right'}
        style={{ width: 'max-content' }}
      >
        <div className="flex gap-4 md:gap-8">
          {/* Duplicate items for seamless loop */}
          {duplicatedProblems.map((problem, i) => (
            <ProblemCard key={`${problem.title}-${i}`} problem={problem} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Phone Frame Component
function PhoneFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-[280px] h-[560px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl ${className}`}>
      <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-900 rounded-b-2xl z-10" />
        {children}
      </div>
    </div>
  );
}

// Bottom Nav Component
function BottomNav({ active = 'home' }: { active?: string }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center justify-around px-4">
      <div className={`flex flex-col items-center ${active === 'home' ? 'text-gray-900' : 'text-gray-400'}`}>
        <Home className="w-5 h-5" />
        <span className="text-[10px] mt-1">홈</span>
      </div>
      <div className={`flex flex-col items-center ${active === 'search' ? 'text-gray-900' : 'text-gray-400'}`}>
        <Search className="w-5 h-5" />
        <span className="text-[10px] mt-1">탐색</span>
      </div>
      <div className="flex flex-col items-center text-gray-400">
        <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center -mt-4">
          <Plus className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className={`flex flex-col items-center ${active === 'wallet' ? 'text-gray-900' : 'text-gray-400'}`}>
        <Wallet className="w-5 h-5" />
        <span className="text-[10px] mt-1">수익</span>
      </div>
      <div className={`flex flex-col items-center ${active === 'profile' ? 'text-gray-900' : 'text-gray-400'}`}>
        <User className="w-5 h-5" />
        <span className="text-[10px] mt-1">내정보</span>
      </div>
    </div>
  );
}

// Provocative Question Section
function WhyNotSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Gradient background - Deep Orange to White */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-600 via-orange-500 to-white" />

      <div className="relative py-28 md:py-36 lg:py-44">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Main provocative question */}
          <p className="text-white/80 font-semibold mb-6 text-base md:text-lg tracking-wide">🤔 잠깐, 생각해봐</p>

          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-10">
            공부 잘하면 뭐가 남아?
          </h2>

          {/* Harsh reality */}
          <div className="space-y-3 mb-12">
            <p className="text-xl md:text-2xl text-white/90">
              게임 잘하면 <span className="font-bold">스트리머</span>,
              그림 잘 그리면 <span className="font-bold">작가</span>
            </p>
            <p className="text-2xl md:text-3xl text-white font-bold">
              근데 공부 잘하면? <span className="line-through opacity-60">과외</span>밖에 없었잖아
            </p>
          </div>

          {/* Emotional hook */}
          <div className="bg-white/15 backdrop-blur-sm rounded-3xl p-8 md:p-10 max-w-2xl mx-auto mb-12">
            <p className="text-white/90 text-lg md:text-xl lg:text-2xl leading-relaxed">
              <span className="text-3xl md:text-4xl mr-3">😤</span>
              밤새 정리한 노트, 시험 끝나면 <span className="font-bold text-white">쓰레기통</span>행.
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              피눈물로 터득한 공부법, 친구한테 <span className="font-bold text-white">공짜</span>로 알려주고.
              <br />
              <span className="text-white/70 text-base md:text-lg mt-4 block">진짜 이게 맞아?</span>
            </p>
          </div>

          {/* Transition to solution */}
          <p className="text-white font-bold text-2xl md:text-3xl lg:text-4xl">
            이제 <span className="underline decoration-4 underline-offset-8">네 공부가 돈이 된다</span> 💰
          </p>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const scrollRef = useScrollAnimation();
  const isHeroRevealed = useHeroScrollReveal();

  return (
    <motion.div
      ref={scrollRef}
      className="bg-white overflow-hidden"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* Hero Section - Minimal with Scroll Animation */}
      <section className="min-h-screen flex flex-col bg-white relative overflow-hidden">

        {/* Background gradient - appears on scroll */}
        <div className={`absolute inset-0 bg-gradient-to-b from-white via-orange-50/30 to-white transition-opacity duration-1000 ${isHeroRevealed ? 'opacity-100' : 'opacity-0'}`} />

        {/* Background Objects - Appear on scroll */}
        <div className={`absolute inset-0 pointer-events-none animate-hero-bg ${isHeroRevealed ? 'is-revealed' : ''}`} style={{ transitionDelay: '200ms' }}>
          {/* Study-related shapes - warmer colors */}
          <div className="absolute top-[15%] left-[8%] w-16 h-20 bg-orange-100 rounded-2xl rotate-[-8deg]" style={{ transitionDelay: '300ms' }} />
          <div className="absolute top-[12%] left-[12%] w-14 h-18 bg-amber-50 rounded-2xl rotate-[4deg]" style={{ transitionDelay: '400ms' }} />

          {/* Stacked cards - organization */}
          <div className="absolute top-[25%] right-[10%] w-20 h-14 bg-orange-100/60 rounded-xl rotate-[6deg]" style={{ transitionDelay: '350ms' }} />
          <div className="absolute top-[23%] right-[12%] w-20 h-14 bg-orange-50 rounded-xl rotate-[2deg]" style={{ transitionDelay: '400ms' }} />
          <div className="absolute top-[21%] right-[14%] w-20 h-14 bg-white rounded-xl border border-orange-200 rotate-[-2deg] shadow-sm" style={{ transitionDelay: '450ms' }} />

          {/* Coin-like circles - value (more vibrant) */}
          <div className="absolute bottom-[30%] left-[6%] w-14 h-14 bg-cta/20 rounded-full" style={{ transitionDelay: '500ms' }} />
          <div className="absolute bottom-[25%] left-[10%] w-10 h-10 bg-cta/30 rounded-full" style={{ transitionDelay: '550ms' }} />
          <div className="absolute bottom-[22%] left-[8%] w-6 h-6 bg-cta/40 rounded-full" style={{ transitionDelay: '600ms' }} />

          {/* Check mark block */}
          <div className="absolute bottom-[35%] right-[8%] w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center shadow-sm" style={{ transitionDelay: '450ms' }}>
            <div className="w-6 h-6 border-2 border-green-400 rounded-lg flex items-center justify-center">
              <div className="w-3 h-2 border-l-2 border-b-2 border-green-500 rotate-[-45deg] -mt-0.5" />
            </div>
          </div>

          {/* Layered blocks - warmer */}
          <div className="absolute top-[55%] left-[15%] w-24 h-4 bg-orange-100 rounded-full" style={{ transitionDelay: '600ms' }} />
          <div className="absolute top-[58%] left-[13%] w-20 h-4 bg-amber-200/50 rounded-full" style={{ transitionDelay: '650ms' }} />
          <div className="absolute top-[61%] left-[17%] w-16 h-4 bg-orange-100 rounded-full" style={{ transitionDelay: '700ms' }} />

          {/* Accent dots - vibrant */}
          <div className="absolute top-[40%] right-[20%] w-4 h-4 bg-cta/50 rounded-full" style={{ transitionDelay: '400ms' }} />
          <div className="absolute bottom-[45%] left-[25%] w-3 h-3 bg-cta/40 rounded-full" style={{ transitionDelay: '550ms' }} />
          <div className="absolute top-[70%] right-[15%] w-5 h-5 bg-amber-300/50 rounded-full" style={{ transitionDelay: '650ms' }} />

          {/* Abstract note shape */}
          <div className="absolute bottom-[20%] right-[25%] w-16 h-20 bg-orange-50 rounded-xl rotate-[12deg] shadow-sm" style={{ transitionDelay: '700ms' }}>
            <div className="mt-3 mx-2 space-y-1.5">
              <div className="h-1.5 bg-orange-200 rounded-full w-10" />
              <div className="h-1.5 bg-orange-300/60 rounded-full w-8" />
              <div className="h-1.5 bg-orange-200 rounded-full w-11" />
            </div>
          </div>

          {/* Value indicator */}
          <div className="absolute top-[45%] left-[5%] w-10 h-10 border-2 border-cta/30 rounded-xl rotate-[15deg]" style={{ transitionDelay: '500ms' }} />
        </div>

        {/* Main Content - Slides up from bottom on scroll */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 -mt-16">
          <div className={`animate-hero-content ${isHeroRevealed ? 'is-revealed' : ''}`}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight text-center leading-tight">
              공부 잘하는 애들,<br />
              이제 <span className="text-cta">돈</span>도 번다.
            </h1>

            {/* Subtitle appears after main text */}
            <p className="mt-6 text-lg sm:text-xl text-gray-500 text-center max-w-lg mx-auto">
              전교일등의 공부법·루틴·노트.<br className="sm:hidden" />
              배우고 싶었던 모든 것.
            </p>

            {/* App Store Button */}
            <div className="mt-8 flex justify-center">
              <a
                href={process.env.NEXT_PUBLIC_APP_STORE_URL || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl transition-colors"
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span className="text-lg font-medium">App Store</span>
              </a>
            </div>
          </div>

        </div>

        {/* Scroll Indicator - fades out when scrolled */}
        <div className={`pb-24 flex flex-col items-center gap-2 relative z-10 transition-opacity duration-500 ${isHeroRevealed ? 'opacity-0' : 'opacity-100'}`}>
          <span className="text-xs text-gray-400">스크롤</span>
          <div className="w-6 h-10 border-2 border-cta/40 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-2.5 bg-cta rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Why Not Section - Provocative Question */}
      <WhyNotSection />

      {/* Problem Section */}
      <section className="py-24 md:py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="text-center animate-on-scroll">
            <p className="text-cta font-semibold mb-4 text-sm">PROBLEM</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              학생들의 고민
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              공부 잘하는 학생과 공부하고 싶은 학생,
              둘 다 해결되지 않는 고민이 있었어요.
            </p>
          </div>
        </div>

        {/* Seller Problems - Horizontal Carousel (Full Width) */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <span className="inline-block px-5 py-2.5 bg-emerald-100 text-emerald-700 rounded-full text-base font-medium">
              공부 잘하는 학생
            </span>
          </div>
          <HorizontalProblemCarousel problems={sellerProblems} direction="left" />
        </div>

        {/* Buyer Problems - Horizontal Carousel (Full Width, opposite direction) */}
        <div className="mb-20">
          <div className="text-center mb-8">
            <span className="inline-block px-5 py-2.5 bg-blue-100 text-blue-700 rounded-full text-base font-medium">
              공부하고 싶은 학생
            </span>
          </div>
          <HorizontalProblemCarousel problems={buyerProblems} direction="right" />
        </div>

        {/* Transition - Vertical Scroll Indicator */}
        <div className="text-center animate-on-scroll">
          <div className="inline-flex flex-col items-center gap-3">
            <span className="text-gray-900 font-bold text-xl">그래서 스터플을 만들었어요</span>
            <ChevronDown className="w-7 h-7 text-gray-900" />
          </div>
        </div>
      </section>

      {/* Creator Section - White to Black Gradient */}
      <section className="relative overflow-hidden">
        {/* Gradient Background - White to Black */}
        <div className="absolute inset-0 bg-gradient-to-b from-white from-20% to-gray-900" />

        <div className="relative z-10 w-full pt-32 pb-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Main Question */}
            <div className="text-center mb-32">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                공부 좀 한다는 소리 듣는데,<br />
                <span className="text-cta">돈은 못 벌고 있나요?</span>
              </h2>
            </div>

            {/* Two Column - Painpoint & Needs */}
            <div className="grid md:grid-cols-2 gap-12 md:gap-20 mb-32">
              {/* Left - Painpoint */}
              <div>
                <span className="inline-block px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded mb-4">
                  Painpoint
                </span>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
                  시험 끝나면 버릴 노트,<br />
                  그냥 쌓아두기만 해요
                </h3>
                <p className="text-gray-500">
                  열심히 정리한 노트가 책상 서랍에서 먼지만 쌓이고 있진 않나요?
                </p>
              </div>

              {/* Right - Needs */}
              <div>
                <span className="inline-block px-3 py-1 bg-gray-600 text-white text-xs font-semibold rounded mb-4">
                  Needs
                </span>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
                  내 노트가 누군가에겐<br />
                  진짜 도움이 될 수 있어요
                </h3>
                <p className="text-gray-500">
                  같은 고민을 하는 후배들에게 내 노트가 큰 가치가 될 수 있어요.
                </p>
              </div>
            </div>

            {/* Timeline with Growth Graph */}
            <div className="relative mb-32">

              {/* Growth Graph Card */}
              <div className="bg-gray-800/90 backdrop-blur-sm rounded-3xl p-10 mb-16">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 bg-cta/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-cta" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">수익이 꾸준히 쌓여요</p>
                    <p className="text-gray-400">올려놓으면 자동으로 판매, 수익은 계속 증가</p>
                  </div>
                </div>

                {/* Simple Growth Graph */}
                <div className="relative h-64 flex items-end justify-between px-6">
                  {/* Graph Bars */}
                  <div className="flex-1 flex items-end justify-around gap-6">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 sm:w-20 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-xl h-12 opacity-40 animate-bar" style={{ transitionDelay: '0ms' }}></div>
                      <span className="text-sm text-gray-500">첫 주</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 sm:w-20 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-xl h-24 opacity-55 animate-bar" style={{ transitionDelay: '100ms' }}></div>
                      <span className="text-sm text-gray-500">한 달</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 sm:w-20 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-xl h-36 opacity-70 animate-bar" style={{ transitionDelay: '200ms' }}></div>
                      <span className="text-sm text-gray-500">세 달</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 sm:w-20 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-xl h-44 opacity-85 animate-bar" style={{ transitionDelay: '300ms' }}></div>
                      <span className="text-sm text-gray-500">여섯 달</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 sm:w-20 bg-gradient-to-t from-orange-600 to-cta rounded-t-xl h-52 animate-bar" style={{ transitionDelay: '400ms' }}></div>
                      <span className="text-sm text-gray-400 font-medium">계속 성장</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Steps */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Step 1 */}
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-cta rounded-full flex items-center justify-center text-white font-bold">1</div>
                    <p className="text-white font-semibold text-lg">업로드</p>
                  </div>
                  <p className="text-gray-400">
                    노트 사진만 찍어서 올리면 끝
                  </p>
                </div>

                {/* Step 2 */}
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-cta/80 rounded-full flex items-center justify-center text-white font-bold">2</div>
                    <p className="text-white font-semibold text-lg">판매 시작</p>
                  </div>
                  <p className="text-gray-400">
                    바로 스토어에 등록돼요
                  </p>
                </div>

                {/* Step 3 */}
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-cta/60 rounded-full flex items-center justify-center text-white font-bold">3</div>
                    <p className="text-white font-semibold text-lg">자동 판매</p>
                  </div>
                  <p className="text-gray-400">
                    자는 동안에도 팔려요
                  </p>
                </div>

                {/* Step 4 */}
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-cta/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">✓</div>
                    <p className="text-white font-semibold text-lg">수익 정산</p>
                  </div>
                  <p className="text-gray-400">
                    매주 통장으로 입금
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Card - Bottom */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-cta rounded-3xl p-8 text-center">
                <span className="inline-block px-4 py-1.5 bg-white/20 text-white text-sm font-medium rounded-full mb-4">
                  높은 수익 배분
                </span>
                <h4 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  업로드만 하면 자동으로 판매,<br />
                  수익 대부분이 내 통장으로
                </h4>
                <p className="text-white/70 text-sm">
                  The platform automatically handles sales and deposits most of the revenue to creators.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="relative bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-4">
            <div className="w-16 h-px bg-gray-700" />
            <span className="text-gray-500 text-sm font-medium tracking-widest">OR</span>
            <div className="w-16 h-px bg-gray-700" />
          </div>
        </div>
      </div>

      {/* Student Section - Solid Black top + Black to White Gradient bottom */}
      <section className="relative overflow-hidden">
        {/* Background: Solid Black on top, then gradient to white */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 from-50% to-white" />

        <div className="relative z-10 w-full pt-32 pb-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Main Question */}
            <div className="text-center mb-32">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                성적 올리고 싶은데,<br />
                <span className="text-cta">뭘 해야 할지 모르겠나요?</span>
              </h2>
            </div>

            {/* Two Column - Painpoint & Needs */}
            <div className="grid md:grid-cols-2 gap-12 md:gap-20 mb-32">
              {/* Left - Painpoint */}
              <div>
                <span className="inline-block px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded mb-4">
                  Painpoint
                </span>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
                  유튜브 공부법은<br />
                  너무 일반적이에요
                </h3>
                <p className="text-gray-400">
                  수많은 공부법 영상을 봐도 내 상황에 맞는 건 찾기 어려워요.
                </p>
              </div>

              {/* Right - Needs */}
              <div>
                <span className="inline-block px-3 py-1 bg-gray-600 text-white text-xs font-semibold rounded mb-4">
                  Needs
                </span>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
                  실제로 성적 올린 사람의<br />
                  진짜 비법이 필요해요
                </h3>
                <p className="text-gray-400">
                  SKY 간 선배가 실제로 쓴 노트, 그대로 따라하면 돼요.
                </p>
              </div>
            </div>

            {/* Before / After Comparison */}
            <div className="relative mb-32">
              <div className="grid md:grid-cols-2 gap-8">

                {/* BEFORE Card */}
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-3xl p-8 relative overflow-hidden animate-fade-left">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />
                  <span className="inline-block px-4 py-1.5 bg-red-500/20 text-red-400 text-sm font-semibold rounded-full mb-6">
                    BEFORE
                  </span>
                  <h4 className="text-2xl font-bold text-white mb-6">혼란스러운 공부</h4>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4 animate-on-scroll" style={{ transitionDelay: '100ms' }}>
                      <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-red-400">✕</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">유튜브 알고리즘에 휘둘림</p>
                        <p className="text-gray-500 text-sm">추천 영상만 보다가 시간 낭비</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 animate-on-scroll" style={{ transitionDelay: '200ms' }}>
                      <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-red-400">✕</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">검증 안 된 공부법</p>
                        <p className="text-gray-500 text-sm">누가 만들었는지도 모르는 정보</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 animate-on-scroll" style={{ transitionDelay: '300ms' }}>
                      <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-red-400">✕</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">비싼 과외비 부담</p>
                        <p className="text-gray-500 text-sm">한 시간에 몇 만원씩</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AFTER Card */}
                <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 backdrop-blur-sm rounded-3xl p-8 relative overflow-hidden border border-cta/30 animate-fade-right">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cta/20 rounded-full blur-3xl" />
                  <span className="inline-block px-4 py-1.5 bg-cta/20 text-cta text-sm font-semibold rounded-full mb-6">
                    AFTER
                  </span>
                  <h4 className="text-2xl font-bold text-white mb-6">검증된 방법으로 성적 UP</h4>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4 animate-on-scroll" style={{ transitionDelay: '150ms' }}>
                      <div className="w-8 h-8 bg-cta/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-cta">✓</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">실제 성적 올린 선배 노트</p>
                        <p className="text-gray-400 text-sm">SKY 합격생이 직접 쓴 노트</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 animate-on-scroll" style={{ transitionDelay: '250ms' }}>
                      <div className="w-8 h-8 bg-cta/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-cta">✓</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">평점과 리뷰로 검증</p>
                        <p className="text-gray-400 text-sm">구매 전 다른 학생들의 후기 확인</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 animate-on-scroll" style={{ transitionDelay: '350ms' }}>
                      <div className="w-8 h-8 bg-cta/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-cta">✓</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">커피 한 잔 가격</p>
                        <p className="text-gray-400 text-sm">과외비의 1/10도 안 되는 가격</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Feature Card - Bottom */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-3xl p-8 text-center border-2 border-orange-200 shadow-lg shadow-orange-100/50">
                <span className="inline-block px-4 py-1.5 bg-white border border-orange-400 text-gray-900 text-sm font-medium rounded-full mb-4">
                  검증된 콘텐츠
                </span>
                <h4 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  실제 성적 올린 학생들의 노트와 공부법,<br />
                  <span className="text-cta">커피 한 잔 가격</span>으로 시작하세요
                </h4>
                <p className="text-gray-500 text-sm">
                  Over 15,000 verified study materials from top-performing students.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Contents Section - With App Screens */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-scale-up">
            <p className="text-cta font-semibold mb-4 text-sm">CONTENTS</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
              이런 걸 사고팔 수 있어요
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              직접 만든 노트부터 공부법, 루틴표까지
              다양한 콘텐츠를 거래할 수 있어요.
            </p>
          </div>

          {/* Content Type 1 - Notes */}
          <div className="border-b border-gray-100 pb-20 mb-20">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="animate-fade-left">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    01
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">손글씨 노트</h3>
                </div>
              <p className="text-gray-500 leading-relaxed mb-6">
                과목별 정리노트, 오답노트, 암기노트 등
                직접 정리한 노트를 판매하세요.
                사진만 찍어서 올리면 끝!
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">수학 오답노트</span>
                <span className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">영어 문법정리</span>
                <span className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">한국사 암기노트</span>
                <span className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">과학 개념정리</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-gray-300 fill-gray-300" />
                  <span>평균 평점 4.8</span>
                </div>
                <div>|</div>
                <div>평균 가격 4,900원</div>
              </div>
            </div>
            <div className="flex justify-center animate-fade-right animate-delay-200">
              <div className="hover-scale">
                <PhoneFrame>
                  <div className="pt-10 h-full bg-white">
                    {/* Note Detail Header */}
                    <div className="px-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
                        <div className="flex items-center gap-3">
                          <Heart className="w-5 h-5 text-gray-400" />
                          <Share2 className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    {/* Note Preview */}
                    <div className="px-4 py-4">
                      <div className="aspect-[3/4] bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl mb-4 flex items-center justify-center">
                        <div className="text-center">
                          <FileText className="w-16 h-16 text-cta mx-auto mb-2 animate-float-slow" />
                          <p className="text-sm text-gray-500">노트 미리보기</p>
                        </div>
                      </div>

                      <h4 className="text-lg font-bold text-gray-900 mb-2">수학 오답노트 - 미적분</h4>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-gray-200 rounded-full" />
                        <span className="text-sm text-gray-600">민지 · 고3</span>
                        <div className="flex items-center gap-1 ml-auto">
                          <Star className="w-4 h-4 text-gray-300 fill-gray-300" />
                          <span className="text-sm text-gray-600">4.9</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-2xl font-bold text-gray-900">4,900원</div>
                        <button className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-full">
                          구매하기
                        </button>
                      </div>
                    </div>
                  </div>
                </PhoneFrame>
              </div>
            </div>
          </div>
          </div>

          {/* Content Type 2 - Study Methods */}
          <div className="border-b border-gray-100 pb-20 mb-20">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="flex justify-center order-2 lg:order-1 animate-fade-left">
                <div className="hover-scale">
                  <PhoneFrame>
                  <div className="pt-10 h-full bg-white">
                    {/* Study Method Detail */}
                    <div className="px-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
                        <div className="flex items-center gap-3">
                          <Heart className="w-5 h-5 text-gray-400" />
                          <Share2 className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-4">
                      <div className="aspect-video bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl mb-4 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-cta" />
                      </div>

                      <h4 className="text-lg font-bold text-gray-900 mb-2">전교 1등의 공부법</h4>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-gray-200 rounded-full" />
                        <span className="text-sm text-gray-600">준호 · 서울대 재학</span>
                      </div>

                      {/* Table of Contents */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <div className="text-sm font-semibold text-gray-900 mb-3">목차</div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-orange-100 rounded text-cta flex items-center justify-center text-xs font-medium">1</div>
                            <span>시간 관리의 기본</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-orange-100 rounded text-cta flex items-center justify-center text-xs font-medium">2</div>
                            <span>과목별 공부 순서</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-orange-100 rounded text-cta flex items-center justify-center text-xs font-medium">3</div>
                            <span>효율적인 암기법</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-orange-100 rounded text-cta flex items-center justify-center text-xs font-medium">4</div>
                            <span>시험 직전 전략</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-2xl font-bold text-gray-900">9,900원</div>
                        <button className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-full">
                          구매하기
                        </button>
                      </div>
                    </div>
                  </div>
                  </PhoneFrame>
                </div>
              </div>
              <div className="order-1 lg:order-2 animate-fade-right animate-delay-200">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    02
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">공부법 가이드</h3>
                </div>
              <p className="text-gray-500 leading-relaxed mb-6">
                성적을 올린 비법, 과목별 공략법,
                시험 대비 전략을 글로 공유하세요.
                실제로 효과 본 방법만 올려주세요!
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">전교1등 공부법</span>
                <span className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">수능 국어 전략</span>
                <span className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">내신 올리는 법</span>
                <span className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">집중력 높이기</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-gray-300 fill-gray-300" />
                  <span>평균 평점 4.7</span>
                </div>
                <div>|</div>
                <div>평균 가격 7,900원</div>
              </div>
              </div>
            </div>
          </div>

          {/* Content Type 3 - Routines */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-left">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  03
                </div>
                <h3 className="text-2xl font-bold text-gray-900">공부 루틴표</h3>
              </div>
              <p className="text-gray-500 leading-relaxed mb-6">
                하루 시간표, 주간 플래너, 시험기간 루틴 등
                효율적인 시간관리 비법을 공유하세요.
                템플릿 형태로 바로 사용 가능!
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">새벽형 루틴</span>
                <span className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">시험기간 플래너</span>
                <span className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">방학 계획표</span>
                <span className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">일일 체크리스트</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-gray-300 fill-gray-300" />
                  <span>평균 평점 4.6</span>
                </div>
                <div>|</div>
                <div>평균 가격 3,900원</div>
              </div>
            </div>
            <div className="flex justify-center animate-fade-right animate-delay-200">
              <div className="hover-scale">
                <PhoneFrame>
                  <div className="pt-10 h-full bg-white">
                    {/* Routine Detail */}
                    <div className="px-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
                        <div className="flex items-center gap-3">
                          <Heart className="w-5 h-5 text-gray-400" />
                          <Share2 className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-4">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">재수생 하루 루틴표</h4>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-gray-200 rounded-full" />
                        <span className="text-sm text-gray-600">서연 · 재수생</span>
                      </div>

                      {/* Routine Preview */}
                    <div className="bg-orange-50 rounded-xl p-4 mb-4">
                      <div className="text-sm font-semibold text-gray-900 mb-3">하루 일과</div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-14 text-gray-500">06:00</span>
                          <div className="flex-1 bg-white rounded px-2 py-1.5 text-gray-700">기상 & 운동</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-14 text-gray-500">07:00</span>
                          <div className="flex-1 bg-white rounded px-2 py-1.5 text-gray-700">아침 식사</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-14 text-gray-500">08:00</span>
                          <div className="flex-1 bg-orange-100 rounded px-2 py-1.5 text-cta">국어 공부</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-14 text-gray-500">10:00</span>
                          <div className="flex-1 bg-gray-900 rounded px-2 py-1.5 text-white">수학 공부</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-14 text-gray-500">12:00</span>
                          <div className="flex-1 bg-white rounded px-2 py-1.5 text-gray-700">점심 & 휴식</div>
                        </div>
                      </div>
                    </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-2xl font-bold text-gray-900">3,900원</div>
                        <button className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-full">
                          구매하기
                        </button>
                      </div>
                    </div>
                  </div>
                </PhoneFrame>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Study With Me Section - Inspired by Sru Design */}
      {/* Solution Part - White Background */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16 animate-on-scroll">
            <p className="text-orange-500 font-medium mb-4 text-sm tracking-wider">Solution</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              스터플에서는 공부 시간을 내가 주도적으로 만들고<br />
              <span className="text-orange-500">다른 이들과 함께</span> 목표를 달성할 수 있어요
            </h2>
          </div>

          {/* As is → To be Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-20 animate-on-scroll">
            {/* Card 1 */}
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-3">As is</p>
              <div className="border border-gray-200 rounded-full px-6 py-3 mb-4 inline-block">
                <span className="text-gray-600 text-sm">혼자 공부하면 금방 지침</span>
              </div>
              <div className="flex justify-center mb-4">
                <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm mb-3">To be</p>
              <div className="border-2 border-orange-400 rounded-full px-6 py-3 mb-6 inline-block">
                <span className="text-orange-600 font-medium">Less burdensome</span>
              </div>
              <div className="bg-orange-50 rounded-2xl p-6">
                <h4 className="text-orange-600 font-bold mb-2">함께라서 덜 지치는 공부</h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  크리에이터와 함께 공부하면<br />
                  혼자보다 오래 집중할 수 있어요
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-3">As is</p>
              <div className="border border-gray-200 rounded-full px-6 py-3 mb-4 inline-block">
                <span className="text-gray-600 text-sm">동기부여가 부족함</span>
              </div>
              <div className="flex justify-center mb-4">
                <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm mb-3">To be</p>
              <div className="border-2 border-orange-400 rounded-full px-6 py-3 mb-6 inline-block">
                <span className="text-orange-600 font-medium">Motivating</span>
              </div>
              <div className="bg-orange-50 rounded-2xl p-6">
                <h4 className="text-orange-600 font-bold mb-2">실시간 응원과 소통</h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  이모지 리액션과 채팅으로<br />
                  서로 동기부여를 주고받아요
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-3">As is</p>
              <div className="border border-gray-200 rounded-full px-6 py-3 mb-4 inline-block">
                <span className="text-gray-600 text-sm">공부 기록이 흩어져 있음</span>
              </div>
              <div className="flex justify-center mb-4">
                <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm mb-3">To be</p>
              <div className="border-2 border-orange-400 rounded-full px-6 py-3 mb-6 inline-block">
                <span className="text-orange-600 font-medium">Track & Share</span>
              </div>
              <div className="bg-orange-50 rounded-2xl p-6">
                <h4 className="text-orange-600 font-bold mb-2">공부 기록 자동 저장</h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  얼마나 공부했는지 자동으로<br />
                  기록되고 친구와 공유할 수 있어요
                </p>
              </div>
            </div>
          </div>

          {/* Core Value Service */}
          <div className="mb-16 animate-on-scroll">
            <p className="text-orange-500 font-medium mb-8 text-sm tracking-wider text-center">Core Value Service</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-6 p-6 rounded-2xl border border-gray-100 hover:border-orange-200 transition-colors">
                <span className="text-orange-500 font-bold text-lg">01</span>
                <div>
                  <h4 className="text-gray-900 font-bold mb-2">실시간 스트리밍으로 함께 공부</h4>
                  <p className="text-gray-500 text-sm">크리에이터의 공부 모습을 실시간으로 시청하며 같이 집중해요</p>
                </div>
              </div>
              <div className="flex gap-6 p-6 rounded-2xl border border-gray-100 hover:border-orange-200 transition-colors">
                <span className="text-orange-500 font-bold text-lg">02</span>
                <div>
                  <h4 className="text-gray-900 font-bold mb-2">포모도로 타이머로 집중 관리</h4>
                  <p className="text-gray-500 text-sm">25분 집중, 5분 휴식을 반복하며 효율적으로 공부해요</p>
                </div>
              </div>
              <div className="flex gap-6 p-6 rounded-2xl border border-gray-100 hover:border-orange-200 transition-colors">
                <span className="text-orange-500 font-bold text-lg">03</span>
                <div>
                  <h4 className="text-gray-900 font-bold mb-2">이모지 리액션과 채팅</h4>
                  <p className="text-gray-500 text-sm">실시간으로 응원하고 소통하며 동기부여를 받아요</p>
                </div>
              </div>
              <div className="flex gap-6 p-6 rounded-2xl border border-gray-100 hover:border-orange-200 transition-colors">
                <span className="text-orange-500 font-bold text-lg">04</span>
                <div>
                  <h4 className="text-gray-900 font-bold mb-2">집중력 높이는 배경음악</h4>
                  <p className="text-gray-500 text-sm">Lofi, 자연, 카페 등 다양한 배경음악을 선택해요</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App & Web Preview - Dark Orange Background */}
      <section className="py-24 bg-gradient-to-b from-orange-600 to-orange-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll">
            <p className="text-orange-200 font-medium mb-4 text-sm tracking-wider">App & Web</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
              앱과 웹 어디서든<br />
              Study With Me를 시작하세요
            </h2>
            <p className="text-orange-100/70 max-w-xl mx-auto">
              모바일에서는 앱으로, 데스크탑에서는 웹으로 끊김없이 공부하세요
            </p>
          </div>

          {/* Device Preview */}
          <div className="relative flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 animate-on-scroll">
            {/* Web Preview */}
            <div className="relative order-2 lg:order-1">
              <div className="w-[500px] max-w-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
                {/* Browser Bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-700 rounded-md px-3 py-1 text-gray-400 text-xs">
                      stufl.com/study-with-me
                    </div>
                  </div>
                </div>
                {/* Web Content */}
                <div className="p-6 bg-gradient-to-br from-gray-800 to-gray-900">
                  <div className="flex gap-4">
                    {/* Video Area */}
                    <div className="flex-1 aspect-video bg-gray-700/50 rounded-lg relative">
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500 rounded text-white text-xs font-bold">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                          LIVE
                        </div>
                        <div className="px-2 py-1 bg-black/50 rounded text-white text-xs">
                          1,247명
                        </div>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-500" />
                          <div>
                            <p className="text-white text-sm font-medium">공부하는 정민</p>
                            <p className="text-gray-400 text-xs">수능 국어</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Sidebar */}
                    <div className="w-32 space-y-3">
                      <div className="bg-orange-500/20 rounded-lg p-3 text-center">
                        <p className="text-orange-400 text-xs mb-1">집중 시간</p>
                        <p className="text-white font-mono font-bold">24:59</p>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-2">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {['🔥', '💪', '👏'].map((e, i) => (
                            <span key={i} className="text-sm">{e}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-orange-200 mt-4 text-sm font-medium">웹 버전</p>
            </div>

            {/* App Preview */}
            <div className="relative order-1 lg:order-2">
              <div className="w-56 bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-gray-800">
                {/* Status Bar */}
                <div className="flex justify-between items-center px-6 py-2 bg-gray-900">
                  <span className="text-white text-xs">9:41</span>
                  <div className="w-16 h-5 bg-black rounded-full" />
                  <div className="flex gap-1">
                    <div className="w-4 h-2 bg-white/50 rounded-sm" />
                  </div>
                </div>
                {/* App Content */}
                <div className="p-4 bg-gradient-to-b from-gray-800 to-gray-900 min-h-[380px]">
                  <div className="bg-gray-700/50 rounded-xl p-3 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500 rounded text-white text-[10px] font-bold">
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                        LIVE
                      </div>
                      <span className="text-gray-400 text-[10px]">1,247명</span>
                    </div>
                    <div className="aspect-video bg-gray-600/50 rounded-lg mb-2" />
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-orange-500" />
                      <div>
                        <p className="text-white text-xs font-medium">공부하는 정민</p>
                        <p className="text-gray-400 text-[10px]">수능 국어</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-500/20 rounded-xl p-3 text-center mb-3">
                    <p className="text-orange-400 text-[10px] mb-1">포모도로 타이머</p>
                    <p className="text-white font-mono text-xl font-bold">24:59</p>
                  </div>
                  <div className="flex justify-center gap-2">
                    {['🔥', '💪', '👏', '❤️'].map((e, i) => (
                      <div key={i} className="w-10 h-10 bg-gray-700/50 rounded-full flex items-center justify-center">
                        <span className="text-base">{e}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-center text-orange-200 mt-4 text-sm font-medium">앱 버전</p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16 animate-on-scroll">
            <Link
              href="/study-with-me"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-orange-600 font-medium rounded-full hover:bg-orange-50 transition-colors"
            >
              <span>Study With Me 시작하기</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section - With App Screens */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll">
            <p className="text-cta font-semibold mb-4 text-sm">HOW IT WORKS</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
              3분이면 시작할 수 있어요
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              복잡한 절차 없이 바로 시작하세요.
            </p>
          </div>

          {/* Steps with App Screen */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-on-scroll">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    1
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">앱 다운로드 & 가입</h4>
                  <p className="text-gray-500">
                    앱스토어에서 스터플을 다운받고
                    간단하게 가입하세요. 1분이면 충분해요.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    2
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">콘텐츠 등록</h4>
                  <p className="text-gray-500">
                    노트 사진을 찍거나, 공부법을 작성하거나,
                    루틴표를 업로드하세요.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    3
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">가격 설정</h4>
                  <p className="text-gray-500">
                    원하는 가격을 자유롭게 설정하세요.
                    추천 가격도 제공해드려요.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    4
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">수익 받기</h4>
                  <p className="text-gray-500">
                    판매되면 수익의 80%가 쌓여요.
                    매주 월요일 자동으로 정산됩니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Screen */}
            <div className="flex justify-center animate-on-scroll animate-delay-200">
              <PhoneFrame>
                <div className="pt-10 h-full bg-gray-50">
                  <div className="px-4 pb-20">
                    <div className="text-lg font-bold text-gray-900 mb-6">콘텐츠 등록</div>

                    {/* Upload Type Selection */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-white rounded-xl p-4 border-2 border-gray-900">
                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-2">
                          <FileText className="w-5 h-5 text-cta" />
                        </div>
                        <div className="text-sm font-semibold text-gray-900">노트</div>
                        <div className="text-xs text-gray-500">사진 업로드</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-2">
                          <BookOpen className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="text-sm font-semibold text-gray-900">공부법</div>
                        <div className="text-xs text-gray-500">글 작성</div>
                      </div>
                    </div>

                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center mb-4 bg-white">
                      <Camera className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <div className="text-sm text-gray-600 mb-1">사진을 업로드하세요</div>
                      <div className="text-xs text-gray-400">최대 20장까지 가능</div>
                    </div>

                    {/* Title Input */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
                      <div className="text-xs text-gray-500 mb-1">제목</div>
                      <input
                        type="text"
                        placeholder="예: 수학 오답노트"
                        className="w-full text-sm text-gray-900 outline-none"
                        readOnly
                      />
                    </div>

                    {/* Price Input */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
                      <div className="text-xs text-gray-500 mb-1">판매 가격</div>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="4,900"
                          className="w-full text-sm text-gray-900 outline-none"
                          readOnly
                        />
                        <span className="text-sm text-gray-500">원</span>
                      </div>
                    </div>

                    <button className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl">
                      등록하기
                    </button>
                  </div>
                </div>
                <BottomNav />
              </PhoneFrame>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll">
            <p className="text-cta font-semibold mb-4 text-sm">SUCCESS STORIES</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
              이미 많은 학생이 성공했어요
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              크리에이터는 월 평균 50만원 수익.<br className="sm:hidden" />
              학습자는 평균 성적 15% 상승.
            </p>
          </div>

          {/* Creator Success Stories */}
          <div className="mb-16">
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                크리에이터 성공 사례
              </span>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Case 1 */}
              <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow animate-on-scroll">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    김
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">김서연</h4>
                    <p className="text-sm text-gray-500">고3 · 전교 1등</p>
                  </div>
                </div>
                <blockquote className="text-gray-600 mb-6 leading-relaxed">
                  "내 노트로 첫 달에 <span className="text-cta font-bold">37만원</span> 벌었어요.
                  어차피 정리하는 노트인데, 이제는 돈이 돼요!"
                </blockquote>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">영어 독해 노트</span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">화학 개념정리</span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">월 평균 수익</span>
                  <span className="text-lg font-bold text-cta">50만원</span>
                </div>
              </div>

              {/* Case 2 */}
              <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow animate-on-scroll" style={{ transitionDelay: '100ms' }}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    박
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">박지훈</h4>
                    <p className="text-sm text-gray-500">의대생 1학년</p>
                  </div>
                </div>
                <blockquote className="text-gray-600 mb-6 leading-relaxed">
                  "Study With Me로 월 <span className="text-cta font-bold">150만원</span> 수입.
                  매일 아침 6시 스터디가 인기 많아요."
                </blockquote>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">매일 6AM 스터디</span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">의대 공부법</span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">월 평균 수익</span>
                  <span className="text-lg font-bold text-cta">120만원</span>
                </div>
              </div>

              {/* Case 3 */}
              <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow animate-on-scroll" style={{ transitionDelay: '200ms' }}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    이
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">이수진</h4>
                    <p className="text-sm text-gray-500">서울대 경영학과</p>
                  </div>
                </div>
                <blockquote className="text-gray-600 mb-6 leading-relaxed">
                  "공부법 구독자 <span className="text-cta font-bold">200명</span>으로 안정 수입.
                  주간 뉴스레터 형식으로 운영해요."
                </blockquote>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">주간 공부법</span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">수능 전략</span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">월 평균 수익</span>
                  <span className="text-lg font-bold text-cta">300만원</span>
                </div>
              </div>
            </div>
          </div>

          {/* Learner Success Stories */}
          <div>
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                학습자 성공 사례
              </span>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Learner 1 */}
              <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow animate-on-scroll">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    정
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">정민수</h4>
                    <p className="text-sm text-gray-500">고2 · 수학 3등급</p>
                  </div>
                </div>
                <blockquote className="text-gray-600 mb-6 leading-relaxed">
                  "전교 1등 노트 따라하다 보니 수학 <span className="text-cta font-bold">3등급 → 1등급</span>으로 올랐어요!"
                </blockquote>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">성적 변화</span>
                  <span className="text-lg font-bold text-green-500">+2등급</span>
                </div>
              </div>

              {/* Learner 2 */}
              <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow animate-on-scroll" style={{ transitionDelay: '100ms' }}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    최
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">최유진</h4>
                    <p className="text-sm text-gray-500">고3 · 재수생</p>
                  </div>
                </div>
                <blockquote className="text-gray-600 mb-6 leading-relaxed">
                  "서울대 합격생 루틴 그대로 따라했더니 <span className="text-cta font-bold">수능 30점</span> 올랐어요."
                </blockquote>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">수능 점수</span>
                  <span className="text-lg font-bold text-green-500">+30점</span>
                </div>
              </div>

              {/* Learner 3 */}
              <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow animate-on-scroll" style={{ transitionDelay: '200ms' }}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    한
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">한소희</h4>
                    <p className="text-sm text-gray-500">고1 · 집중력 부족</p>
                  </div>
                </div>
                <blockquote className="text-gray-600 mb-6 leading-relaxed">
                  "Study With Me 덕분에 하루 공부시간 <span className="text-cta font-bold">2시간 → 6시간</span>으로 늘었어요."
                </blockquote>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">공부시간</span>
                  <span className="text-lg font-bold text-green-500">+4시간</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section - Price Comparison */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll">
            <p className="text-cta font-semibold mb-4 text-sm">COMPARISON</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
              현명한 선택
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              학원 100만원 vs 전교1등 노트 9,900원.<br className="sm:hidden" />
              진짜 1등이 쓴 노트가 더 효과적일 수 있습니다.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="grid md:grid-cols-2 gap-8 animate-on-scroll">
            {/* Traditional */}
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🏫</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">기존 학습 방법</h3>
                  <p className="text-sm text-gray-500">학원, 과외</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">월 비용</span>
                  <span className="font-bold text-gray-900">50~100만원</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">1:1 피드백</span>
                  <span className="text-gray-400">제한적</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">커리큘럼</span>
                  <span className="text-gray-400">획일적</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">이동 시간</span>
                  <span className="text-gray-400">왕복 1~2시간</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600">콘텐츠 검증</span>
                  <span className="text-gray-400">불명확</span>
                </div>
              </div>
            </div>

            {/* Stuple */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8 border-2 border-cta relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 bg-cta text-white text-xs font-bold rounded-full">
                추천
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-cta rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📚</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">스터플</h3>
                  <p className="text-sm text-gray-500">전교 1등의 모든 것</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between py-3 border-b border-orange-200">
                  <span className="text-gray-600">월 비용</span>
                  <span className="font-bold text-cta">9,900원~</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-orange-200">
                  <span className="text-gray-600">1:1 피드백</span>
                  <span className="font-medium text-gray-900">DM 질문 가능</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-orange-200">
                  <span className="text-gray-600">커리큘럼</span>
                  <span className="font-medium text-gray-900">내게 맞는 선택</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-orange-200">
                  <span className="text-gray-600">이동 시간</span>
                  <span className="font-medium text-gray-900">없음 (온라인)</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600">콘텐츠 검증</span>
                  <span className="font-medium text-gray-900">평점 & 리뷰</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">과외비의 <span className="font-bold text-cta">1/100</span> 가격으로</p>
                <p className="text-lg font-bold text-gray-900">실제 1등의 노하우를 배우세요</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-b from-white to-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-on-scroll">
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              오늘부터 1등에게 배우세요
            </h2>

            <p className="text-lg text-gray-500 mb-10 max-w-lg mx-auto">
              공부 잘하는 학생이라면 누구나
              <br />
              크리에이터가 될 수 있어요.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <a
                href={process.env.NEXT_PUBLIC_APP_STORE_URL || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl transition-colors"
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span className="text-lg font-medium">App Store</span>
              </a>
            </div>

            <p className="text-sm text-gray-400">
              iOS 지원
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-gray-900 font-bold mb-4">StuPle</h4>
              <p className="text-sm text-gray-500 leading-relaxed">
                학생 크리에이터 마켓플레이스
                <br />
                공부 잘하는 학생이 돈 버는 방법
              </p>
            </div>
            <div>
              <h4 className="text-gray-900 font-bold mb-4">서비스</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/content" className="text-gray-500 hover:text-gray-900 transition-colors">노트 마켓</Link></li>
                <li><Link href="/explore" className="text-gray-500 hover:text-gray-900 transition-colors">탐색</Link></li>
                <li><Link href="/study-with-me" className="text-gray-500 hover:text-gray-900 transition-colors">Study With Me</Link></li>
                <li><Link href="/become-creator" className="text-gray-500 hover:text-gray-900 transition-colors">크리에이터 신청</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 font-bold mb-4">고객지원</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/faq" className="text-gray-500 hover:text-gray-900 transition-colors">자주 묻는 질문</Link></li>
                <li><Link href="/contact" className="text-gray-500 hover:text-gray-900 transition-colors">1:1 문의</Link></li>
                <li><Link href="/help" className="text-gray-500 hover:text-gray-900 transition-colors">이용가이드</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 font-bold mb-4">법적 고지</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="text-gray-500 hover:text-gray-900 transition-colors">이용약관</Link></li>
                <li><Link href="/privacy" className="text-gray-500 hover:text-gray-900 transition-colors">개인정보처리방침</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 StuPle. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
