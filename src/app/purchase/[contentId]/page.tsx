'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, AlertCircle, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useSession } from '@/components/providers/SessionProvider';
import { generateTossDeeplink } from '@/lib/deeplink';
import { LoadingPage } from '@/components/ui/Spinner';
import type { BankCode } from '@/lib/deeplink';
import { requestCardPayment, requestKakaoPayPayment } from '@/lib/portone/client';

type PaymentMethod = 'card' | 'kakaopay' | 'transfer';

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
  const [showPaymentMethodSheet, setShowPaymentMethodSheet] = useState(false);
  const [showKakaoPayModal, setShowKakaoPayModal] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToRefund, setAgreedToRefund] = useState(false);

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
      const initResponse = await fetch('/api/purchase/portone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: product.id }),
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(errorData.message || '결제 초기화에 실패했습니다.');
      }

      const { paymentId, orderName, amount } = await initResponse.json();

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

      if (paymentResult.code) {
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

  const handleKakaoPayPayment = async () => {
    if (!product || !user) return;
    setShowKakaoPayModal(true);
  };

  const handleKakaoPayConfirm = async () => {
    if (!product || !user) return;

    setIsProcessing(true);
    setShowKakaoPayModal(false);
    setError('');

    try {
      const initResponse = await fetch('/api/purchase/portone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: product.id }),
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(errorData.message || '결제 초기화에 실패했습니다.');
      }

      const { paymentId, orderName, amount } = await initResponse.json();

      const paymentResult = await requestKakaoPayPayment(
        paymentId,
        orderName,
        amount,
        {
          fullName: user.user_metadata?.name || user.email?.split('@')[0] || '구매자',
          phoneNumber: user.user_metadata?.phone || '01000000000',
          email: user.email,
        }
      );

      if (paymentResult.code) {
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
      console.error('KakaoPay payment error:', err);
      setError(err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  const getPaymentMethodLabel = () => {
    switch (paymentMethod) {
      case 'card': return '신용/체크카드';
      case 'kakaopay': return '카카오페이';
      case 'transfer': return '계좌이체';
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'card') {
      handleCardPayment();
    } else if (paymentMethod === 'kakaopay') {
      handleKakaoPayPayment();
    } else if (paymentMethod === 'transfer') {
      handlePaymentComplete();
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

  // 전체 동의 여부
  const allAgreed = agreedToPrivacy && agreedToRefund;

  // 메인 결제 화면
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <Link href={`/content/${productId}`}>
            <button className="p-2 -ml-2">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
          </Link>
          <h1 className="flex-1 text-center font-bold text-lg text-gray-900">주문 / 결제</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-52 space-y-3">
        {/* 상품 정보 카드 */}
        <section className="bg-white rounded-2xl p-4">
          <p className="text-sm font-bold text-gray-900 mb-3">주문 상품</p>
          <div className="flex gap-3">
            {/* 썸네일 */}
            <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
              {product.thumbnail_url ? (
                <Image
                  src={product.thumbnail_url}
                  alt={product.title}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-gray-50 to-gray-100">
                  📄
                </div>
              )}
            </div>
            {/* 상품 정보 */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                {product.title}
              </p>
              <p className="text-xs text-gray-500 mt-1.5">
                {product.creator.name} · 디지털 콘텐츠
              </p>
            </div>
          </div>
        </section>

        {/* 결제수단 선택 카드 */}
        <section className="bg-white rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowPaymentMethodSheet(true)}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="text-sm font-bold text-gray-900">결제수단</p>
              <p className="text-sm text-gray-500 mt-0.5">{getPaymentMethodLabel()}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </section>

        {/* 계좌이체 추가 입력 */}
        {paymentMethod === 'transfer' && (
          <section className="bg-white rounded-2xl p-4">
            <p className="text-sm font-bold text-gray-900 mb-3">입금자명</p>
            <input
              type="text"
              value={buyerNote}
              onChange={(e) => setBuyerNote(e.target.value)}
              placeholder="송금 시 입력한 이름"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={handleOpenToss}
              className="w-full mt-3 py-3 rounded-xl font-medium text-white bg-[#0064FF] hover:bg-[#0050CC] transition-colors"
            >
              토스로 송금하기
            </button>
          </section>
        )}

        {/* 최종 결제 금액 카드 */}
        <section className="bg-white rounded-2xl p-4">
          <p className="text-base font-bold text-gray-900 mb-4">최종 결제 금액</p>

          {/* 금액 상세 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">총 상품 가격</span>
              <span className="text-sm text-gray-700">{formatCurrency(product.price)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">할인</span>
              <span className="text-sm text-gray-700">0원</span>
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t border-dashed border-gray-200 my-4" />

          {/* 총 결제 금액 */}
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-gray-900">총 결제 금액</span>
            <span className="text-2xl font-bold text-orange-500">{formatCurrency(product.price)}</span>
          </div>
        </section>

        {/* 동의 항목 */}
        <section className="bg-white rounded-2xl p-4">
          <p className="text-sm font-bold text-gray-900 mb-3">약관 동의</p>

          {/* 개인정보 동의 */}
          <label className="flex items-center justify-between py-3 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                agreedToPrivacy
                  ? 'bg-orange-500 border-orange-500'
                  : 'border-gray-300'
              }`}>
                {agreedToPrivacy && (
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                )}
              </div>
              <span className="text-sm text-gray-700">개인정보 제3자 제공 동의</span>
            </div>
            <Link href="/privacy" className="text-sm text-gray-400 hover:text-gray-600" onClick={(e) => e.stopPropagation()}>보기</Link>
            <input
              type="checkbox"
              checked={agreedToPrivacy}
              onChange={(e) => setAgreedToPrivacy(e.target.checked)}
              className="sr-only"
            />
          </label>

          {/* 환불 정책 동의 */}
          <label className="flex items-center justify-between py-3 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                agreedToRefund
                  ? 'bg-orange-500 border-orange-500'
                  : 'border-gray-300'
              }`}>
                {agreedToRefund && (
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                )}
              </div>
              <span className="text-sm text-gray-700">환불 정책 동의</span>
            </div>
            <Link href="/refund" className="text-sm text-gray-400 hover:text-gray-600" onClick={(e) => e.stopPropagation()}>보기</Link>
            <input
              type="checkbox"
              checked={agreedToRefund}
              onChange={(e) => setAgreedToRefund(e.target.checked)}
              className="sr-only"
            />
          </label>

          {/* 안내 문구 */}
          <p className="text-xs text-gray-400 mt-3 leading-relaxed">
            디지털 콘텐츠 특성상 다운로드/열람 후에는 청약철회가 제한됩니다.
          </p>
        </section>

        {/* 에러 메시지 */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="mx-4 mt-4 bg-red-50 rounded-lg p-4 flex items-start gap-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 하단 고정 결제 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-bottom">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <p className="text-xs text-gray-500">총 결제 금액</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(product.price)}</p>
            </div>
            <button
              onClick={handlePayment}
              disabled={!allAgreed || isProcessing || (paymentMethod === 'transfer' && !buyerNote.trim())}
              className={`flex-1 py-4 rounded-xl font-bold text-base transition-all ${
                allAgreed && !isProcessing && (paymentMethod !== 'transfer' || buyerNote.trim())
                  ? 'bg-gray-900 text-white active:bg-gray-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isProcessing ? '처리 중...' : !allAgreed ? '약관에 동의해주세요' : '결제하기'}
            </button>
          </div>
        </div>
      </div>

      {/* 결제수단 선택 바텀시트 */}
      <AnimatePresence>
        {showPaymentMethodSheet && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 배경 */}
            <motion.div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowPaymentMethodSheet(false)}
            />

            {/* 시트 */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl safe-area-bottom"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="max-w-lg mx-auto">
                {/* 핸들 */}
                <div className="flex justify-center py-3">
                  <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                {/* 타이틀 */}
                <div className="px-4 pb-2">
                  <h3 className="text-lg font-bold text-gray-900">결제수단 선택</h3>
                </div>

                {/* 옵션들 */}
                <div className="px-4 pb-6">
                  <button
                    onClick={() => {
                      setPaymentMethod('card');
                      setShowPaymentMethodSheet(false);
                    }}
                    className={`w-full py-4 px-4 rounded-xl mb-2 flex items-center justify-between transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-orange-50 border-2 border-orange-500'
                        : 'bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <span className={`font-medium ${paymentMethod === 'card' ? 'text-orange-600' : 'text-gray-700'}`}>
                      신용/체크카드
                    </span>
                    {paymentMethod === 'card' && (
                      <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setPaymentMethod('kakaopay');
                      setShowPaymentMethodSheet(false);
                      setShowKakaoPayModal(true);
                    }}
                    className={`w-full py-4 px-4 rounded-xl mb-2 flex items-center justify-between transition-all ${
                      paymentMethod === 'kakaopay'
                        ? 'bg-[#FEE500]/20 border-2 border-[#FEE500]'
                        : 'bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#FEE500] rounded flex items-center justify-center">
                        <span className="text-[#191919] font-bold text-[10px]">pay</span>
                      </div>
                      <span className={`font-medium ${paymentMethod === 'kakaopay' ? 'text-[#191919]' : 'text-gray-700'}`}>
                        카카오페이
                      </span>
                    </div>
                    {paymentMethod === 'kakaopay' && (
                      <div className="w-5 h-5 bg-[#FEE500] rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-[#191919]" strokeWidth={3} />
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setPaymentMethod('transfer');
                      setShowPaymentMethodSheet(false);
                    }}
                    className={`w-full py-4 px-4 rounded-xl flex items-center justify-between transition-all ${
                      paymentMethod === 'transfer'
                        ? 'bg-orange-50 border-2 border-orange-500'
                        : 'bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <span className={`font-medium ${paymentMethod === 'transfer' ? 'text-orange-600' : 'text-gray-700'}`}>
                      계좌이체 (토스)
                    </span>
                    {paymentMethod === 'transfer' && (
                      <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 카카오페이 결제 모달 */}
      <AnimatePresence>
        {showKakaoPayModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 배경 */}
            <motion.div
              className="absolute inset-0 bg-black/30"
              onClick={() => setShowKakaoPayModal(false)}
            />

            {/* 모달 */}
            <motion.div
              className="relative bg-white rounded-[28px] w-full max-w-[360px] p-10 shadow-lg"
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
            >
              {/* 카카오페이 로고 */}
              <div className="flex items-center gap-2 mb-10">
                <svg width="28" height="26" viewBox="0 0 28 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M14 0C6.268 0 0 4.97 0 11.1c0 3.96 2.576 7.43 6.454 9.398l-1.31 4.864c-.115.427.37.77.736.52l5.81-3.856c.753.082 1.522.124 2.31.124 7.732 0 14-4.97 14-11.1S21.732 0 14 0Z" fill="#FFEB00"/>
                </svg>
                <span className="text-[#191919] font-bold text-[22px] tracking-tight">pay</span>
              </div>

              {/* 결제 타이틀 */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-[#191F28] leading-snug tracking-tight">
                  {product.title}
                  <br />
                  <span className="text-[#4E5968]">{formatCurrency(product.price)}을 결제할까요?</span>
                </h2>
              </div>

              {/* 결제 정보 */}
              <div className="mb-14 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#8B95A1] text-[15px]">상품 금액</span>
                  <span className="text-[#191F28] text-[17px] font-bold">{formatCurrency(product.price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8B95A1] text-[15px]">결제 수단</span>
                  <span className="text-[#3182F6] text-[15px] font-semibold">카카오페이 머니</span>
                </div>
              </div>

              {/* 결제 버튼 */}
              <button
                onClick={handleKakaoPayConfirm}
                className="w-full h-16 bg-[#FFEB00] text-[#1A1A1A] rounded-[18px] font-bold text-lg active:scale-[0.97] active:bg-[#F7E100] transition-transform"
              >
                결제하기
              </button>

              {/* 취소 버튼 */}
              <button
                onClick={() => setShowKakaoPayModal(false)}
                className="w-full mt-4 text-[#B0B8C1] font-semibold text-base"
              >
                취소
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
