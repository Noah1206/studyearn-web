'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import { CheckCircle2, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button, Card, CardContent, Spinner } from '@/components/ui';
import { FallingCoins } from '@/components/animations';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [orderInfo, setOrderInfo] = useState<{
    orderId: string;
    amount: number;
    productId?: string;
  } | null>(null);

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');
      const productId = searchParams.get('productId');

      if (!paymentKey || !orderId || !amount) {
        setStatus('error');
        setErrorMessage('결제 정보가 올바르지 않습니다.');
        return;
      }

      try {
        const response = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '결제 확인에 실패했습니다.');
        }

        const data = await response.json();
        setOrderInfo({
          orderId: data.orderId,
          amount: data.amount,
          productId: productId || undefined,
        });
        setStatus('success');
      } catch (err) {
        console.error('Payment confirmation error:', err);
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : '결제 확인 중 오류가 발생했습니다.');
      }
    };

    confirmPayment();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center"
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center shadow-lg shadow-orange-200">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">결제를 확인하고 있어요...</p>
        </div>
      </motion.div>
    );
  }

  if (status === 'error') {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-b from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center px-4"
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
      >
        <Card variant="elevated" className="max-w-md w-full text-center py-8 border-2 border-red-100">
          <CardContent>
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">😢</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">결제 확인 실패</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="flex flex-col gap-3">
              <Link href="/content">
                <Button fullWidth variant="outline">
                  콘텐츠 둘러보기
                </Button>
              </Link>
              <Link href="/support">
                <Button fullWidth>
                  고객센터 문의
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center relative overflow-hidden px-4"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* Falling coins animation */}
      <FallingCoins />

      {/* Success sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            <Sparkles className="w-6 h-6 text-green-300" />
          </div>
        ))}
      </div>

      <Card variant="elevated" className="max-w-md w-full text-center py-8 relative z-10 border-2 border-green-100">
        <CardContent>
          {/* Success icon with animation */}
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200 animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">결제 완료!</h2>
          <p className="text-gray-600 mb-6">구매가 성공적으로 완료되었어요</p>

          {/* Order summary */}
          {orderInfo && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 text-sm">결제 금액</span>
                <span className="font-bold text-gray-900">{formatCurrency(orderInfo.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">주문 번호</span>
                <span className="text-gray-700 text-sm font-mono">{orderInfo.orderId.slice(-12)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {orderInfo?.productId ? (
              <Link href={`/content/${orderInfo.productId}`}>
                <Button fullWidth className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                  콘텐츠 보기
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <Link href="/my/purchases">
                <Button fullWidth className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                  구매 내역 보기
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
            <Link href="/content">
              <Button variant="outline" fullWidth>
                더 둘러보기
              </Button>
            </Link>
          </div>

          {/* Fun message */}
          <p className="text-sm text-gray-500 mt-6 flex items-center justify-center gap-2">
            <span className="text-lg">🎓</span>
            학습을 시작할 준비가 됐어요!
            <span className="text-lg">✨</span>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
