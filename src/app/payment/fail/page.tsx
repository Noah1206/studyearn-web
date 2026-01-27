'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import { XCircle, AlertTriangle, RefreshCcw, Home, MessageCircle } from 'lucide-react';
import { Button, Card, CardContent, Spinner } from '@/components/ui';

// 에러 코드별 메시지
const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  PAY_PROCESS_CANCELED: {
    title: '결제가 취소되었습니다',
    description: '결제 진행 중 취소하셨습니다. 다시 시도해주세요.',
  },
  PAY_PROCESS_ABORTED: {
    title: '결제가 중단되었습니다',
    description: '결제 과정에서 문제가 발생했습니다. 다시 시도해주세요.',
  },
  REJECT_CARD_COMPANY: {
    title: '카드사에서 거절되었습니다',
    description: '카드 한도 초과 또는 카드사 정책으로 결제가 거절되었습니다. 다른 결제 수단을 이용해주세요.',
  },
  EXCEED_MAX_DAILY_PAYMENT_COUNT: {
    title: '일일 결제 한도 초과',
    description: '오늘 결제 가능 횟수를 초과했습니다. 내일 다시 시도해주세요.',
  },
  EXCEED_MAX_PAYMENT_AMOUNT: {
    title: '결제 금액 한도 초과',
    description: '1회 결제 가능 금액을 초과했습니다. 금액을 확인해주세요.',
  },
  INVALID_CARD_EXPIRATION: {
    title: '카드 유효기간 오류',
    description: '카드 유효기간이 만료되었거나 잘못 입력되었습니다.',
  },
  INVALID_STOPPED_CARD: {
    title: '정지된 카드',
    description: '해당 카드는 사용이 정지된 상태입니다. 카드사에 문의해주세요.',
  },
  INVALID_CARD_LOST: {
    title: '분실 신고된 카드',
    description: '분실 신고된 카드입니다. 카드사에 문의해주세요.',
  },
  NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT: {
    title: '할부 불가',
    description: '해당 카드 또는 상점에서는 할부 결제가 지원되지 않습니다.',
  },
  INVALID_CARD_NUMBER: {
    title: '잘못된 카드 번호',
    description: '카드 번호를 다시 확인해주세요.',
  },
  default: {
    title: '결제에 실패했습니다',
    description: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  },
};

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || 'default';
  const message = searchParams.get('message');
  const orderId = searchParams.get('orderId');
  const type = searchParams.get('type'); // 'subscription' or 'content'
  const contentId = searchParams.get('contentId');
  const creatorId = searchParams.get('creatorId');

  const errorInfo = ERROR_MESSAGES[code] || ERROR_MESSAGES.default;

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      <Card variant="elevated" className="max-w-md w-full">
        <CardContent className="text-center py-12 px-6">
          {/* 아이콘 */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {errorInfo.title}
          </h1>

          {/* 설명 */}
          <p className="text-gray-600 mb-6">
            {message || errorInfo.description}
          </p>

          {/* 에러 정보 박스 */}
          {(code !== 'default' || orderId) && (
            <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left">
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">오류 정보</span>
              </div>
              <div className="space-y-2 text-sm">
                {code !== 'default' && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">오류 코드</span>
                    <span className="text-gray-900 font-mono text-xs">{code}</span>
                  </div>
                )}
                {orderId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">주문 번호</span>
                    <span className="text-gray-900 font-mono text-xs">{orderId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex flex-col gap-3">
            {/* 다시 시도 버튼 */}
            {type === 'content' && contentId ? (
              <Link href={`/purchase/${contentId}`}>
                <Button fullWidth className="bg-orange-500 hover:bg-orange-600">
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  다시 시도하기
                </Button>
              </Link>
            ) : (
              <Link href="/content">
                <Button fullWidth className="bg-orange-500 hover:bg-orange-600">
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  콘텐츠 둘러보기
                </Button>
              </Link>
            )}

            {/* 고객센터 */}
            <Link href="/contact">
              <Button variant="outline" fullWidth>
                <MessageCircle className="w-4 h-4 mr-2" />
                고객센터 문의
              </Button>
            </Link>

            {/* 홈으로 */}
            <Link href="/">
              <Button variant="ghost" fullWidth>
                <Home className="w-4 h-4 mr-2" />
                홈으로 돌아가기
              </Button>
            </Link>
          </div>

          {/* 안내 문구 */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              결제 문제가 계속되면 다른 결제 수단을 이용하시거나<br />
              <Link href="/contact" className="text-orange-600 hover:underline">
                고객센터
              </Link>
              로 문의해주세요.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <PaymentFailContent />
    </Suspense>
  );
}
