'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowLeft,
  HelpCircle,
  ChevronDown,
  Search,
  BookOpen,
  CreditCard,
  Users,
  Shield,
  Smartphone,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    id: 'general',
    title: '일반',
    icon: BookOpen,
    items: [
      {
        question: '스터플(StuPle)은 어떤 서비스인가요?',
        answer: '스터플은 학생들이 함께 공부하고 성장할 수 있는 플랫폼입니다. 스터디 그룹, 실시간 공부 세션, 콘텐츠 공유 등 다양한 기능을 제공합니다.',
      },
      {
        question: '서비스 이용 연령 제한이 있나요?',
        answer: '연령 제한 없이 누구나 이용할 수 있습니다.',
      },
      {
        question: '모바일 앱도 있나요?',
        answer: '현재 웹 서비스로 운영 중이며, Android 앱은 곧 Google Play에서 출시 예정입니다. 모바일 웹에서도 최적화된 경험을 제공합니다.',
      },
    ],
  },
  {
    id: 'account',
    title: '계정',
    icon: Users,
    items: [
      {
        question: '회원가입은 어떻게 하나요?',
        answer: '휴대폰 번호로 간편하게 가입할 수 있습니다. 인증 후 프로필을 설정하면 바로 서비스를 이용할 수 있습니다.',
      },
      {
        question: '비밀번호를 잊어버렸어요.',
        answer: '로그인 페이지에서 "비밀번호 찾기"를 클릭하세요. 가입 시 등록한 휴대폰 번호로 인증 후 새 비밀번호를 설정할 수 있습니다.',
      },
      {
        question: '계정을 삭제하고 싶어요.',
        answer: '설정 > 계정 관리에서 계정 삭제를 진행할 수 있습니다. 삭제 후에는 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.',
      },
      {
        question: '닉네임을 변경할 수 있나요?',
        answer: '프로필 페이지에서 언제든지 닉네임을 변경할 수 있습니다. 단, 부적절한 닉네임은 서비스 이용이 제한될 수 있습니다.',
      },
    ],
  },
  {
    id: 'payment',
    title: '결제/정산',
    icon: CreditCard,
    items: [
      {
        question: '유료 콘텐츠는 어떻게 구매하나요?',
        answer: '콘텐츠 상세 페이지에서 "구매하기" 버튼을 클릭하면 결제 페이지로 이동합니다. 신용카드, 간편결제 등 다양한 결제 수단을 지원합니다.',
      },
      {
        question: '환불은 어떻게 받나요?',
        answer: '구매 후 7일 이내, 콘텐츠를 50% 이상 이용하지 않은 경우 환불이 가능합니다. 고객센터로 문의해주세요.',
      },
      {
        question: '크리에이터 수익은 어떻게 정산되나요?',
        answer: '매월 1일 전월 수익이 정산됩니다. 정산 금액이 10,000원 이상인 경우 등록된 계좌로 입금됩니다. 수수료는 판매 금액의 20%입니다.',
      },
      {
        question: '정산 계좌는 어떻게 등록하나요?',
        answer: '설정 > 결제 및 정산 > 정산 계좌 관리에서 본인 명의의 계좌를 등록할 수 있습니다.',
      },
    ],
  },
  {
    id: 'security',
    title: '보안',
    icon: Shield,
    items: [
      {
        question: '2단계 인증이 뭔가요?',
        answer: '로그인 시 비밀번호 외에 추가 인증 단계를 거치는 보안 기능입니다. Google Authenticator 등의 앱을 사용하여 설정할 수 있습니다.',
      },
      {
        question: '내 개인정보는 안전하게 보호되나요?',
        answer: '모든 데이터는 암호화되어 저장되며, 업계 표준 보안 프로토콜을 준수합니다. 자세한 내용은 개인정보처리방침을 참고해주세요.',
      },
      {
        question: '의심스러운 로그인 시도가 감지됐어요.',
        answer: '즉시 비밀번호를 변경하고 2단계 인증을 설정하세요. 필요시 고객센터로 연락해주시면 추가 조치를 안내해드립니다.',
      },
    ],
  },
  {
    id: 'features',
    title: '기능',
    icon: Smartphone,
    items: [
      {
        question: '스터디윗미는 어떻게 참여하나요?',
        answer: '스터디윗미 탭에서 현재 진행 중인 공부 세션에 참여하거나, 직접 세션을 만들 수 있습니다. 실시간으로 함께 공부하는 경험을 제공합니다.',
      },
      {
        question: '콘텐츠를 저장하고 싶어요.',
        answer: '각 콘텐츠의 북마크 아이콘을 클릭하면 저장됩니다. 저장한 콘텐츠는 프로필 > 저장한 콘텐츠에서 확인할 수 있습니다.',
      },
      {
        question: '알림이 안 와요.',
        answer: '설정 > 알림에서 알림 설정이 켜져 있는지 확인하세요. 브라우저 알림 권한도 허용되어 있어야 합니다.',
      },
    ],
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('general');
  const [openQuestions, setOpenQuestions] = useState<string[]>([]);

  const toggleQuestion = (question: string) => {
    setOpenQuestions(prev =>
      prev.includes(question)
        ? prev.filter(q => q !== question)
        : [...prev, question]
    );
  };

  // Filter FAQs based on search query
  const filteredFAQs = searchQuery
    ? faqData.map(category => ({
        ...category,
        items: category.items.filter(
          item =>
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(category => category.items.length > 0)
    : faqData.filter(category => category.id === activeCategory);

  return (
    <motion.div
      className="min-h-[calc(100vh-4rem)] bg-neutral-light"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-brand-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }} />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/profile/settings"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">설정</span>
            </Link>
            <div className="w-px h-6 bg-white/20" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">자주 묻는 질문</h1>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="질문 검색..."
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!searchQuery && (
          /* Category Tabs */
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            {faqData.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  activeCategory === category.id
                    ? 'bg-accent text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <category.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{category.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFAQs.map(category => (
            <div key={category.id}>
              {searchQuery && (
                <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                  <category.icon className="w-4 h-4" />
                  {category.title}
                </h3>
              )}
              <Card variant="elevated">
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {category.items.map((item, index) => (
                      <div key={index}>
                        <button
                          onClick={() => toggleQuestion(item.question)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-900 pr-4">
                            {item.question}
                          </span>
                          <ChevronDown
                            className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                              openQuestions.includes(item.question) ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        <AnimatePresence>
                          {openQuestions.includes(item.question) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">
                                {item.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>

        {/* Contact CTA */}
        <Card variant="elevated" className="mt-8">
          <CardContent className="py-8 text-center">
            <MessageCircle className="w-12 h-12 text-accent mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              원하는 답변을 찾지 못하셨나요?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              1:1 문의를 통해 궁금한 점을 질문해주세요.
            </p>
            <Link
              href="/help/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              문의하기
            </Link>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
