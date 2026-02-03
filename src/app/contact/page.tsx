'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MessageCircle,
  Mail,
  Phone,
  Clock,
  Send,
  Loader2,
  CheckCircle,
  HelpCircle,
  CreditCard,
  AlertTriangle,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { Button, Card, CardContent, Input } from '@/components/ui';
import { pageVariants } from '@/components/ui/motion/variants';
import { cn } from '@/lib/utils';

// 문의 유형
const INQUIRY_TYPES = [
  { id: 'general', label: '일반 문의', icon: MessageCircle },
  { id: 'payment', label: '결제/환불', icon: CreditCard },
  { id: 'technical', label: '기술적 문제', icon: AlertTriangle },
  { id: 'report', label: '신고/제보', icon: FileText },
  { id: 'partnership', label: '제휴/협력', icon: HelpCircle },
];

// 빠른 링크
const QUICK_LINKS = [
  { label: '자주 묻는 질문', href: '/faq', icon: HelpCircle },
  { label: '이용약관', href: '/terms', icon: FileText },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    inquiryType: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.inquiryType) {
      newErrors.inquiryType = '문의 유형을 선택해주세요';
    }
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = '제목을 입력해주세요';
    } else if (formData.subject.length < 5) {
      newErrors.subject = '제목은 5자 이상 입력해주세요';
    }
    if (!formData.message.trim()) {
      newErrors.message = '내용을 입력해주세요';
    } else if (formData.message.length < 20) {
      newErrors.message = '내용은 20자 이상 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    // 시뮬레이션 (실제로는 API 호출)
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <Card variant="elevated" className="max-w-md w-full">
          <CardContent className="text-center py-12 px-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              문의가 접수되었습니다
            </h2>
            <p className="text-gray-600 mb-6">
              빠른 시일 내에 답변 드리겠습니다.<br />
              답변은 입력하신 이메일로 발송됩니다.
            </p>
            <div className="space-y-3">
              <Link href="/">
                <Button fullWidth className="bg-orange-500 hover:bg-orange-600">
                  홈으로 돌아가기
                </Button>
              </Link>
              <Link href="/faq">
                <Button variant="outline" fullWidth>
                  자주 묻는 질문 보기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <h1 className="text-lg font-bold text-gray-900">고객센터</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* 연락처 정보 */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card variant="outlined" className="text-center p-4">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">이메일</h3>
            <p className="text-sm text-gray-500">ab40905045@gmail.com</p>
          </Card>

          <Card variant="outlined" className="text-center p-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">전화</h3>
            <p className="text-sm text-gray-500">1588-0000</p>
          </Card>

          <Card variant="outlined" className="text-center p-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">운영시간</h3>
            <p className="text-sm text-gray-500">평일 10:00 - 18:00</p>
          </Card>
        </div>

        {/* 빠른 링크 */}
        <Card variant="outlined" className="mb-8">
          <CardContent className="p-0">
            {QUICK_LINKS.map((link, index) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <div className={cn(
                    "flex items-center justify-between p-4 hover:bg-gray-50 transition-colors",
                    index !== QUICK_LINKS.length - 1 && "border-b border-gray-100"
                  )}>
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">{link.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* 문의 폼 */}
        <Card variant="outlined">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">문의하기</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 문의 유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  문의 유형 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {INQUIRY_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleInputChange('inquiryType', type.id)}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left",
                          formData.inquiryType === type.id
                            ? "border-orange-600 bg-orange-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <Icon size={18} className={cn(
                          formData.inquiryType === type.id
                            ? "text-orange-600"
                            : "text-gray-400"
                        )} />
                        <span className={cn(
                          "text-sm font-medium",
                          formData.inquiryType === type.id
                            ? "text-orange-700"
                            : "text-gray-700"
                        )}>
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {errors.inquiryType && (
                  <p className="mt-1 text-sm text-red-500">{errors.inquiryType}</p>
                )}
              </div>

              {/* 이메일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="답변 받으실 이메일을 입력하세요"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="문의 제목을 입력하세요"
                  className={errors.subject ? 'border-red-500' : ''}
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-500">{errors.subject}</p>
                )}
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  문의 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="문의하실 내용을 상세히 입력해주세요"
                  rows={6}
                  className={cn(
                    "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none",
                    errors.message ? 'border-red-500' : 'border-gray-200'
                  )}
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-500">{errors.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {formData.message.length}/2000자
                </p>
              </div>

              {/* 제출 버튼 */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-orange-500 hover:bg-orange-600 py-3"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    제출 중...
                  </>
                ) : (
                  <>
                    <Send size={18} className="mr-2" />
                    문의 제출하기
                  </>
                )}
              </Button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-4">
              문의 내용은 평일 기준 1-2일 내에 답변드립니다.
            </p>
          </CardContent>
        </Card>
      </main>
    </motion.div>
  );
}
