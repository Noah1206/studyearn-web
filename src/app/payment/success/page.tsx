'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { Button, Card, CardContent, Spinner } from '@/components/ui';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const type = searchParams.get('type'); // 'subscription' or 'content'
  const contentId = searchParams.get('contentId');
  const creatorId = searchParams.get('creatorId');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<{
    orderName: string;
    method: string;
    approvedAt: string;
  } | null>(null);

  useEffect(() => {
    const confirmPayment = async () => {
      if (!paymentKey || !orderId || !amount) {
        setStatus('error');
        setErrorMessage('결제 정보가 올바르지 않습니다.');
        return;
      }

      try {
        const response = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
            type,
            contentId,
            creatorId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || '결제 확인에 실패했습니다.');
        }

        setPaymentDetails({
          orderName: data.orderName,
          method: data.method,
          approvedAt: data.approvedAt,
        });
        setStatus('success');
      } catch (err) {
        console.error('Payment confirmation error:', err);
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : '결제 확인 중 오류가 발생했습니다.');
      }
    };

    confirmPayment();
  }, [paymentKey, orderId, amount, type, contentId, creatorId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card variant="elevated" className="max-w-md w-full mx-4">
          <CardContent className="text-center py-12">
            <Loader2 className="w-16 h-16 text-gray-900 animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">결제 확인 중</h2>
            <p className="text-gray-600">잠시만 기다려주세요...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card variant="elevated" className="max-w-md w-full mx-4">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">결제 실패</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="flex flex-col gap-3">
              <Link href="/">
                <Button variant="outline" fullWidth>
                  홈으로 돌아가기
                </Button>
              </Link>
              {type === 'content' && contentId && (
                <Link href={`/purchase/${contentId}`}>
                  <Button fullWidth>다시 시도하기</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(value);
  };

  const methodLabels: Record<string, string> = {
    CARD: '카드',
    TRANSFER: '계좌이체',
    VIRTUAL_ACCOUNT: '가상계좌',
    MOBILE_PHONE: '휴대폰',
    CULTURE_GIFT_CERTIFICATE: '문화상품권',
    BOOK_GIFT_CERTIFICATE: '도서상품권',
    GAME_GIFT_CERTIFICATE: '게임상품권',
    EASY_PAY: '간편결제',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <Card variant="elevated" className="max-w-md w-full mx-4">
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-gray-900" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {type === 'subscription' ? '구독이 완료되었습니다!' : '결제가 완료되었습니다!'}
          </h2>
          <p className="text-gray-600 mb-8">
            {type === 'subscription'
              ? '이제 구독 전용 콘텐츠를 앱에서 이용할 수 있습니다.'
              : '이제 구매한 콘텐츠를 앱에서 이용할 수 있습니다.'}
          </p>

          {/* Payment Details */}
          {paymentDetails && (
            <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left">
              <h3 className="font-medium text-gray-900 mb-3">결제 내역</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">주문명</span>
                  <span className="text-gray-900 font-medium">{paymentDetails.orderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">결제금액</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(Number(amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">결제수단</span>
                  <span className="text-gray-900">{methodLabels[paymentDetails.method] || paymentDetails.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">결제일시</span>
                  <span className="text-gray-900">{formatDate(paymentDetails.approvedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">주문번호</span>
                  <span className="text-gray-900 font-mono text-xs">{orderId}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <a
              href={process.env.NEXT_PUBLIC_APP_STORE_URL || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button fullWidth>
                <span className="flex items-center justify-center gap-2">
                  앱에서 콘텐츠 보기
                  <ExternalLink className="w-4 h-4" />
                </span>
              </Button>
            </a>

            <Link href="/my/purchases">
              <Button variant="outline" fullWidth>
                구매 내역 보기
              </Button>
            </Link>

            <Link href="/">
              <Button variant="ghost" fullWidth>
                홈으로 돌아가기
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            문의사항이 있으시면 고객센터로 연락해주세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
