'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronDown,
  Search,
  HelpCircle,
  CreditCard,
  User,
  Shield,
  Smartphone,
  Users,
  MessageCircle,
  BookOpen,
} from 'lucide-react';
import { Button, Card, CardContent, Input } from '@/components/ui';
import { pageVariants } from '@/components/ui/motion/variants';
import { cn } from '@/lib/utils';

// FAQ 카테고리
const FAQ_CATEGORIES = [
  { id: 'all', label: '전체', icon: HelpCircle },
  { id: 'account', label: '계정', icon: User },
  { id: 'payment', label: '결제/환불', icon: CreditCard },
  { id: 'subscription', label: '구독', icon: Users },
  { id: 'content', label: '콘텐츠', icon: BookOpen },
  { id: 'creator', label: '크리에이터', icon: Smartphone },
  { id: 'security', label: '보안', icon: Shield },
];

// FAQ 데이터
const FAQ_DATA = [
  // 계정
  {
    id: 1,
    category: 'account',
    question: '회원가입은 어떻게 하나요?',
    answer: '홈페이지 우측 상단의 "회원가입" 버튼을 클릭하시면 됩니다. 이메일 또는 소셜 계정(구글, 카카오, 네이버)으로 간편하게 가입하실 수 있습니다.',
  },
  {
    id: 2,
    category: 'account',
    question: '비밀번호를 잊어버렸어요.',
    answer: '로그인 페이지에서 "비밀번호 찾기"를 클릭하시면 가입하신 이메일로 비밀번호 재설정 링크가 발송됩니다. 소셜 로그인을 사용하신 경우 해당 서비스에서 비밀번호를 관리해주세요.',
  },
  {
    id: 3,
    category: 'account',
    question: '회원 탈퇴는 어떻게 하나요?',
    answer: '설정 > 계정 관리 > 회원 탈퇴에서 진행하실 수 있습니다. 탈퇴 시 구매한 콘텐츠와 구독 정보가 모두 삭제되며 복구가 불가능하니 신중히 결정해주세요.',
  },
  // 결제/환불
  {
    id: 4,
    category: 'payment',
    question: '결제 수단은 무엇이 있나요?',
    answer: '신용카드, 체크카드, 계좌이체, 간편결제(카카오페이, 네이버페이, 토스) 등 다양한 결제 수단을 지원합니다.',
  },
  {
    id: 5,
    category: 'payment',
    question: '환불은 어떻게 받나요?',
    answer: '콘텐츠를 시청하지 않은 경우 구매 후 7일 이내에 환불 요청이 가능합니다. 설정 > 구매 내역에서 환불 요청을 하시거나 고객센터로 문의해주세요.',
  },
  {
    id: 6,
    category: 'payment',
    question: '결제가 실패했어요.',
    answer: '카드 한도, 잔액 부족, 결제 정보 오류 등의 원인일 수 있습니다. 다른 결제 수단을 이용하시거나, 카드사에 문의해주세요. 문제가 지속되면 고객센터로 연락주세요.',
  },
  // 구독
  {
    id: 7,
    category: 'subscription',
    question: '구독은 어떻게 하나요?',
    answer: '원하는 크리에이터의 프로필 페이지에서 구독 버튼을 클릭하시면 됩니다. 티어별로 다양한 혜택이 제공되니 확인 후 선택해주세요.',
  },
  {
    id: 8,
    category: 'subscription',
    question: '구독을 해지하고 싶어요.',
    answer: '설정 > 구독 관리에서 해지하실 수 있습니다. 해지하셔도 결제 기간이 끝날 때까지는 구독 혜택을 이용하실 수 있습니다.',
  },
  {
    id: 9,
    category: 'subscription',
    question: '구독료는 언제 결제되나요?',
    answer: '최초 구독 시점을 기준으로 매월 같은 날짜에 자동 결제됩니다. 예를 들어 1월 15일에 구독하셨다면 매월 15일에 결제됩니다.',
  },
  // 콘텐츠
  {
    id: 10,
    category: 'content',
    question: '구매한 콘텐츠는 어디서 볼 수 있나요?',
    answer: '"내 구매 내역" 또는 "내 라이브러리"에서 구매한 모든 콘텐츠를 확인하실 수 있습니다. 앱과 웹 모두에서 이용 가능합니다.',
  },
  {
    id: 11,
    category: 'content',
    question: '콘텐츠 다운로드가 가능한가요?',
    answer: '일부 콘텐츠는 오프라인 학습을 위해 다운로드가 가능합니다. 다운로드 가능 여부는 각 콘텐츠 상세 페이지에서 확인하실 수 있습니다.',
  },
  {
    id: 12,
    category: 'content',
    question: '동영상이 재생되지 않아요.',
    answer: '인터넷 연결 상태를 확인하시고, 브라우저 캐시를 삭제해보세요. 문제가 지속되면 다른 브라우저나 앱으로 시도해주세요.',
  },
  // 크리에이터
  {
    id: 13,
    category: 'creator',
    question: '크리에이터가 되려면 어떻게 하나요?',
    answer: '"크리에이터 되기" 페이지에서 신청하실 수 있습니다. 간단한 프로필 정보를 입력하시면 바로 콘텐츠를 업로드하실 수 있습니다.',
  },
  {
    id: 14,
    category: 'creator',
    question: '수익은 어떻게 정산되나요?',
    answer: '매월 1일에 전월 수익이 정산됩니다. 정산금은 등록하신 계좌로 15일 이내에 입금됩니다. 최소 정산 금액은 10,000원입니다.',
  },
  {
    id: 15,
    category: 'creator',
    question: '크리에이터 수수료는 얼마인가요?',
    answer: '기본 수수료는 10%입니다. 구독료와 콘텐츠 판매 수익 모두 동일한 수수료가 적용됩니다.',
  },
  // 보안
  {
    id: 16,
    category: 'security',
    question: '개인정보는 안전하게 보호되나요?',
    answer: '모든 개인정보는 암호화되어 저장되며, 엄격한 보안 정책에 따라 관리됩니다. 자세한 내용은 개인정보처리방침을 확인해주세요.',
  },
  {
    id: 17,
    category: 'security',
    question: '계정 보안을 강화하고 싶어요.',
    answer: '설정에서 2단계 인증을 활성화하시면 계정 보안을 강화할 수 있습니다. 또한 정기적으로 비밀번호를 변경하시는 것을 권장합니다.',
  },
];

// FAQ 아이템 컴포넌트
function FAQItem({ question, answer, isOpen, onToggle }: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full py-4 flex items-start justify-between gap-4 text-left"
      >
        <span className="font-medium text-gray-900">{question}</span>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-gray-400 flex-shrink-0 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="pb-4 pr-8">
          <p className="text-gray-600 text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openItems, setOpenItems] = useState<number[]>([]);

  // 필터링된 FAQ
  const filteredFAQs = FAQ_DATA.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleItem = (id: number) => {
    setOpenItems(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  return (
    <motion.div
      className="min-h-screen bg-white"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <div className="h-14 flex items-center gap-4">
            <Link href="/" className="p-2 -ml-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-lg font-bold text-gray-900">자주 묻는 질문</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* 검색 */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="궁금한 내용을 검색해보세요"
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {FAQ_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  activeCategory === category.id
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
              >
                <Icon size={16} />
                {category.label}
              </button>
            );
          })}
        </div>

        {/* FAQ 목록 */}
        <Card variant="outlined">
          <CardContent className="p-4">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq) => (
                <FAQItem
                  key={faq.id}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openItems.includes(faq.id)}
                  onToggle={() => toggleItem(faq.id)}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">검색 결과가 없습니다</p>
                <p className="text-sm text-gray-400 mt-1">
                  다른 키워드로 검색해보세요
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 추가 도움 */}
        <Card variant="outlined" className="mt-6 bg-orange-50 border-orange-200">
          <CardContent className="p-6 text-center">
            <MessageCircle className="w-10 h-10 text-orange-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">
              원하는 답변을 찾지 못하셨나요?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              고객센터에 문의하시면 친절하게 안내해드리겠습니다.
            </p>
            <Link href="/contact">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <MessageCircle size={16} className="mr-2" />
                고객센터 문의하기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </motion.div>
  );
}
