'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useSession } from '@/components/providers/SessionProvider';
import { generateTossDeeplink } from '@/lib/deeplink';
import { LoadingPage } from '@/components/ui/Spinner';
import type { BankCode } from '@/lib/deeplink';
import { requestCardPayment } from '@/lib/portone/client';

type PaymentMethod = 'card' | 'transfer';

const PLATFORM_BANK_CODE = (process.env.NEXT_PUBLIC_PLATFORM_BANK_CODE || 'busan') as BankCode;
const PLATFORM_ACCOUNT_NUMBER = process.env.NEXT_PUBLIC_PLATFORM_ACCOUNT_NUMBER || '';

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  thumbnail_url: string | null;
  creator: {
    name: string;
    avatar_url?: string | null;
  };
  creator_id: string;
}

interface PurchasePageProps {
  params: { contentId: string };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 30,
    },
  },
};

export default function PurchasePage({ params }: PurchasePageProps) {
  const productId = params.contentId;
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useSession();

  const [product, setProduct] = useState<Product | null>(null);
  const [buyerNote, setBuyerNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  useEffect(() => {
    if (isSessionLoading) return;
    if (!user) {
      router.push(`/login?redirectTo=/purchase/${productId}`);
    }
  }, [isSessionLoading, user, router, productId]);

  useEffect(() => {
    if (isSessionLoading || !user) return;

    const fetchData = async () => {
      setIsLoading(true);

      try {
        const productResponse = await fetch(`/api/products/${productId}`);

        if (!productResponse.ok) {
          router.push(`/content/${productId}`);
          return;
        }

        const productData = await productResponse.json();

        if (!productData.product) {
          router.push('/content');
          return;
        }

        setProduct(productData.product);

        if (productData.isPurchased) {
          setAlreadyPurchased(true);
        }

        try {
          const pendingCheckResponse = await fetch(
            `/api/purchase/pending?contentId=${productId}`,
            { credentials: 'include' }
          );
          if (pendingCheckResponse.ok) {
            const pendingData = await pendingCheckResponse.json();
            if (pendingData.hasPending) {
              setPendingPurchase(true);
            }
          }
        } catch (pendingErr) {
          console.warn('Failed to check pending purchase:', pendingErr);
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
        router.push('/content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [productId, router, user, isSessionLoading]);

  const handleOpenToss = () => {
    if (!product || !PLATFORM_ACCOUNT_NUMBER) {
      alert('플랫폼 계좌 정보가 설정되지 않았습니다.');
      return;
    }

    const url = generateTossDeeplink(
      PLATFORM_BANK_CODE,
      PLATFORM_ACCOUNT_NUMBER,
      product.price
    );

    console.log('[TossDeeplink]', { url, bank: PLATFORM_BANK_CODE, account: PLATFORM_ACCOUNT_NUMBER });
    window.location.href = url;
  };

  const handlePaymentComplete = async () => {
    if (!product || !user) return;

    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/purchase/p2p', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: product.id,
          buyerNote: buyerNote.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '구매 요청에 실패했습니다.');
      }

      router.push(`/purchase/${productId}/pending`);
    } catch (err) {
      console.error('Purchase error:', err);
      setError(err instanceof Error ? err.message : '구매 처리 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  const handleCardPayment = async () => {
    if (!product || !user) return;

    setIsProcessing(true);
    setError('');

    try {
      console.log('[Payment] 1. 결제 초기화 시작...');

      const initResponse = await fetch('/api/purchase/portone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: product.id }),
      });

      console.log('[Payment] 1-1. API 응답 상태:', initResponse.status);

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        console.error('[Payment] 1-2. API 에러:', errorData);
        throw new Error(errorData.message || '결제 초기화에 실패했습니다.');
      }

      const { paymentId, orderName, amount } = await initResponse.json();
      console.log('[Payment] 2. 결제 정보:', { paymentId, orderName, amount });

      console.log('[Payment] 3. PortOne SDK 호출 중...');
      const paymentResult = await requestCardPayment(
        paymentId,
        orderName,
        amount,
        {
          fullName: user.user_metadata?.name || user.email?.split('@')[0] || '구매자',
          phoneNumber: user.user_metadata?.phone || '01000000000',
          email: user.email,
        }
      );
      console.log('[Payment] 4. PortOne 결과:', paymentResult);

      if (paymentResult.code) {
        console.error('[PortOne Error]', paymentResult.code, paymentResult.message);

        if (paymentResult.code === 'USER_CANCEL') {
          setIsProcessing(false);
          return;
        }

        throw new Error(paymentResult.message || `결제 오류: ${paymentResult.code}`);
      }

      const verifyResponse = await fetch('/api/payments/portone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: paymentResult.paymentId,
          amount,
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.message || '결제 검증에 실패했습니다.');
      }

      const verifyResult = await verifyResponse.json();

      if (verifyResult.status === 'completed') {
        router.push(`/content/${productId}?purchased=true`);
      } else if (verifyResult.status === 'awaiting_deposit') {
        router.push(`/purchase/${productId}/pending`);
      }
    } catch (err) {
      console.error('Card payment error:', err);
      setError(err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  // 로딩 화면
  if (isSessionLoading || isLoading) {
    return <LoadingPage message="결제 정보를 불러오고 있어요" />;
  }

  // 상품 없음
  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-5">
        <motion.div
          className="text-center max-w-sm w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-6xl mb-6">🤔</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">상품을 찾을 수 없어요</h2>
          <p className="text-gray-500 mb-8">삭제되었거나 존재하지 않는 상품이에요</p>
          <Link href="/content">
            <button className="w-full py-4 bg-gray-900 text-white rounded-xl font-semibold">
              상품 둘러보기
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // 이미 구매함
  if (alreadyPurchased) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-5">
        <motion.div
          className="text-center max-w-sm w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-6xl mb-6">✅</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">이미 구매한 콘텐츠예요</h2>
          <p className="text-gray-500 mb-8">지금 바로 확인해보세요</p>
          <div className="space-y-3">
            <Link href={`/content/${productId}`}>
              <button className="w-full py-4 bg-gray-900 text-white rounded-xl font-semibold">
                콘텐츠 보기
              </button>
            </Link>
            <Link href="/my/purchases">
              <button className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold">
                구매 내역
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // 대기 중인 구매 취소
  const handleCancelPending = async () => {
    if (!confirm('대기 중인 구매를 취소하시겠어요?')) return;

    try {
      const response = await fetch('/api/purchase/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: productId }),
      });

      if (response.ok) {
        setPendingPurchase(false);
      } else {
        const data = await response.json();
        alert(data.message || '취소에 실패했습니다.');
      }
    } catch {
      alert('취소 중 오류가 발생했습니다.');
    }
  };

  // 대기 중
  if (pendingPurchase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-5">
        <motion.div
          className="text-center max-w-sm w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.p
            className="text-6xl mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⏳
          </motion.p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">입금 확인 중</h2>
          <p className="text-gray-500 mb-8">확인되면 바로 알려드릴게요</p>
          <div className="space-y-3">
            <Link href="/my/purchases">
              <button className="w-full py-4 bg-gray-900 text-white rounded-xl font-semibold">
                구매 내역 확인
              </button>
            </Link>
            <Link href={`/content/${productId}`}>
              <button className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold">
                상품 페이지로
              </button>
            </Link>
            <button
              onClick={handleCancelPending}
              className="w-full py-3 text-gray-400 text-sm"
            >
              구매 취소
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 메인 결제 화면
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center">
          <Link href={`/content/${productId}`}>
            <button className="p-2 -ml-2">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
          </Link>
          <h1 className="flex-1 text-center font-bold text-gray-900">결제</h1>
          <div className="w-10" />
        </div>
      </header>

      <motion.main
        className="max-w-lg mx-auto px-5 py-6 pb-36"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 상품 정보 */}
        <motion.div className="mb-8" variants={itemVariants}>
          <p className="text-sm text-gray-500 mb-1">{product.creator.name}</p>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{product.title}</h2>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">{formatCurrency(product.price)}</span>
          </div>
        </motion.div>

        {/* 구분선 */}
        <motion.hr className="border-gray-100 mb-6" variants={itemVariants} />

        {/* 결제 방법 */}
        <motion.div className="mb-6" variants={itemVariants}>
          <p className="text-sm font-medium text-gray-900 mb-3">결제 방법</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                paymentMethod === 'card'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              카드결제
            </button>
            <button
              onClick={() => setPaymentMethod('transfer')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                paymentMethod === 'transfer'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              계좌이체
            </button>
          </div>
        </motion.div>

        {/* 카드 결제 */}
        <AnimatePresence mode="wait">
          {paymentMethod === 'card' && (
            <motion.div
              key="card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-6"
            >
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600">
                  결제 버튼을 누르면 카드 결제창이 열립니다.
                  <br />
                  결제 완료 후 바로 콘텐츠를 이용할 수 있어요.
                </p>
              </div>
            </motion.div>
          )}

          {/* 계좌이체 */}
          {paymentMethod === 'transfer' && (
            <motion.div
              key="transfer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 mb-6"
            >
              {/* 토스 송금 버튼 */}
              <button
                onClick={handleOpenToss}
                className="w-full py-3.5 rounded-xl font-medium text-white bg-[#0064FF]"
              >
                토스로 송금하기
              </button>

              {/* 입금자명 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  입금자명
                </label>
                <input
                  type="text"
                  value={buyerNote}
                  onChange={(e) => setBuyerNote(e.target.value)}
                  placeholder="송금 시 입력한 이름"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              {/* 안내 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600">
                  토스로 송금 후 입금자명을 입력하고 완료 버튼을 눌러주세요.
                  <br />
                  입금 확인 후 콘텐츠를 이용할 수 있어요.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 구분선 */}
        <motion.hr className="border-gray-100 mb-6" variants={itemVariants} />

        {/* 안전 거래 안내 */}
        <motion.div className="mb-6" variants={itemVariants}>
          <p className="text-sm font-medium text-gray-900 mb-3">안전 거래</p>
          <ul className="text-sm text-gray-500 space-y-1.5">
            <li>• 에스크로 방식으로 안전하게 보관돼요</li>
            <li>• 문제 발생 시 100% 환불 가능해요</li>
          </ul>
        </motion.div>

        {/* 에러 메시지 */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="bg-red-50 rounded-xl p-4 mb-4 flex items-start gap-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 주의사항 */}
        <motion.p className="text-xs text-gray-400" variants={itemVariants}>
          디지털 콘텐츠는 다운로드 후 환불이 제한될 수 있어요.
          문제가 있다면 24시간 내에 신고해주세요.
        </motion.p>
      </motion.main>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-5 pb-8">
        <div className="max-w-lg mx-auto">
          {paymentMethod === 'card' ? (
            <button
              onClick={handleCardPayment}
              disabled={isProcessing}
              className={`w-full py-4 rounded-xl font-semibold text-base ${
                !isProcessing
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {isProcessing ? '처리 중...' : `${formatCurrency(product.price)} 결제하기`}
            </button>
          ) : (
            <button
              onClick={handlePaymentComplete}
              disabled={!buyerNote.trim() || isProcessing}
              className={`w-full py-4 rounded-xl font-semibold text-base ${
                buyerNote.trim() && !isProcessing
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {isProcessing ? '처리 중...' : '송금 완료'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
