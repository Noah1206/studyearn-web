'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  Users,
  CreditCard,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Card, CardContent, Input } from '@/components/ui';
import { pageVariants } from '@/components/ui/motion/variants';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_CATEGORIES = [
  { id: 'general', label: '일반', icon: HelpCircle },
  { id: 'account', label: '계정', icon: Users },
  { id: 'payment', label: '결제', icon: CreditCard },
  { id: 'creator', label: '크리에이터', icon: FileText },
  { id: 'privacy', label: '개인정보', icon: Shield },
];

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: '스터플은 어떤 서비스인가요?',
    answer: '스터플은 학생 크리에이터들이 자신만의 학습 콘텐츠를 공유하고 수익을 창출할 수 있는 플랫폼입니다. 공부 노트, 강의 영상, 학습 자료 등을 업로드하고 구독자를 모을 수 있습니다.',
    category: 'general',
  },
  {
    id: '2',
    question: '어떤 콘텐츠를 업로드할 수 있나요?',
    answer: '학습에 도움이 되는 다양한 콘텐츠를 업로드할 수 있습니다. 공부 노트, 요약 정리, 강의 영상, 오디오 강의, 문제 풀이, 학습 자료 등이 포함됩니다. 단, 저작권을 침해하거나 부적절한 콘텐츠는 업로드할 수 없습니다.',
    category: 'general',
  },
  {
    id: '3',
    question: '회원가입은 어떻게 하나요?',
    answer: '이메일 주소로 간단하게 가입할 수 있습니다. 누구나 무료로 가입하고 이용할 수 있습니다.',
    category: 'account',
  },
  {
    id: '4',
    question: '비밀번호를 잊어버렸어요.',
    answer: '로그인 페이지에서 "비밀번호 찾기"를 클릭하세요. 가입 시 사용한 이메일로 비밀번호 재설정 링크가 발송됩니다.',
    category: 'account',
  },
  {
    id: '5',
    question: '계정을 삭제하고 싶어요.',
    answer: '프로필 > 설정 > 계정에서 계정 삭제를 진행할 수 있습니다. 삭제 시 모든 데이터가 영구적으로 삭제되며, 이 작업은 되돌릴 수 없습니다.',
    category: 'account',
  },
  {
    id: '6',
    question: '결제 방법은 무엇이 있나요?',
    answer: '신용카드, 체크카드, 카카오페이, 토스페이 등 다양한 결제 수단을 지원합니다.',
    category: 'payment',
  },
  {
    id: '7',
    question: '구독을 취소하면 환불받을 수 있나요?',
    answer: '구독 취소 시 남은 기간에 대한 환불은 원칙적으로 불가합니다. 단, 결제 후 7일 이내에 콘텐츠를 이용하지 않은 경우 전액 환불이 가능합니다.',
    category: 'payment',
  },
  {
    id: '8',
    question: '크리에이터가 되려면 어떻게 해야 하나요?',
    answer: '프로필 페이지에서 "크리에이터 되기" 버튼을 클릭하면 크리에이터 신청을 할 수 있습니다. 간단한 정보 입력 후 바로 크리에이터 활동을 시작할 수 있습니다.',
    category: 'creator',
  },
  {
    id: '9',
    question: '수익은 어떻게 정산받나요?',
    answer: '매월 1일에 전월 수익이 정산됩니다. 최소 출금 금액은 10,000원이며, 등록된 계좌로 입금됩니다. 플랫폼 수수료는 수익의 15%입니다.',
    category: 'creator',
  },
  {
    id: '10',
    question: '개인정보는 안전하게 보호되나요?',
    answer: '네, 스터플은 사용자의 개인정보를 안전하게 보호합니다. 모든 데이터는 암호화되어 저장되며, 개인정보 처리방침에 따라 엄격하게 관리됩니다.',
    category: 'privacy',
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFAQs = FAQ_DATA.filter((faq) => {
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === null || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div
      className="min-h-screen bg-white"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">도움말 및 지원</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="궁금한 내용을 검색하세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              selectedCategory === null
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            )}
          >
            전체
          </button>
          {FAQ_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5',
                  selectedCategory === category.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon className="w-4 h-4" />
                {category.label}
              </button>
            );
          })}
        </div>

        {/* FAQ List */}
        <Card>
          <CardContent className="p-0 divide-y divide-gray-100">
            {filteredFAQs.length === 0 ? (
              <div className="py-12 text-center">
                <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">검색 결과가 없습니다</p>
              </div>
            ) : (
              filteredFAQs.map((faq) => (
                <div key={faq.id} className="border-b border-gray-100 last:border-0">
                  <button
                    onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                    {expandedId === faq.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {expandedId === faq.id && (
                    <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardContent>
            <h2 className="font-semibold text-gray-900 mb-4">관련 링크</h2>
            <div className="space-y-2">
              <Link
                href="/terms"
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span className="text-gray-700">이용약관</span>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center text-sm text-gray-500 py-4">
          <p>Stuple v1.0.0</p>
          <p className="mt-1">© 2024 Stuple. All rights reserved.</p>
        </div>
      </main>
    </motion.div>
  );
}
