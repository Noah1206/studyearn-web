'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Clock,
  ChevronRight,
  Sparkles,
  Shield,
  User,
  FileText,
  CreditCard,
  Building2,
  Wallet,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useSession } from '@/components/providers/SessionProvider';
import { generateTossDeeplink } from '@/lib/deeplink';
import { LoadingPage } from '@/components/ui/Spinner';
import type { BankCode } from '@/lib/deeplink';
import { requestCardPayment } from '@/lib/portone/client';

type PaymentMethod = 'card' | 'transfer';

// 플랫폼 계좌 정보 (환경 변수에서 로드)
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

// 토스 스타일 애니메이션 variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

const scaleVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

const pulseVariants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut' as const,
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

    // 토스 QR 형식 딥링크 생성 (bank=은행명, origin=qr)
    const url = generateTossDeeplink(
      PLATFORM_BANK_CODE,
      PLATFORM_ACCOUNT_NUMBER,
      product.price
    );

    // 디버깅용
    console.log('[TossDeeplink]', { url, bank: PLATFORM_BANK_CODE, account: PLATFORM_ACCOUNT_NUMBER });
    alert(`URL: ${url}`);

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

  // 카드 결제 처리 (PortOne)
  const handleCardPayment = async () => {
    if (!product || !user) return;

    setIsProcessing(true);
    setError('');

    try {
      console.log('[Payment] 1. 결제 초기화 시작...');

      // 1. 서버에서 결제 정보 생성
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

      // 2. PortOne 결제창 호출
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
        // 결제 실패 또는 취소
        console.error('[PortOne Error]', paymentResult.code, paymentResult.message);

        if (paymentResult.code === 'USER_CANCEL') {
          // 사용자가 직접 취소한 경우 - 에러 메시지 없이 종료
          setIsProcessing(false);
          return;
        }

        // 그 외 모든 에러는 사용자에게 표시
        throw new Error(paymentResult.message || `결제 오류: ${paymentResult.code}`);
      }

      // 3. 결제 검증
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
        // 결제 완료 - 콘텐츠 페이지로 이동
        router.push(`/content/${productId}?purchased=true`);
      } else if (verifyResult.status === 'awaiting_deposit') {
        // 가상계좌 입금 대기 (이 경우는 카드결제에서는 발생하지 않음)
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
          className="text-center bg-white rounded-3xl p-8 shadow-sm max-w-sm w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">상품을 찾을 수 없어요</h2>
          <p className="text-gray-500 mb-6">삭제되었거나 존재하지 않는 상품이에요</p>
          <Link href="/content">
            <motion.button
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-semibold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              상품 둘러보기
            </motion.button>
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
          className="text-center bg-white rounded-3xl p-8 shadow-sm max-w-sm w-full overflow-hidden relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* 축하 파티클 */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ opacity: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  y: [-20, -60],
                  x: [0, (i % 2 === 0 ? 1 : -1) * 20],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: 'easeOut',
                }}
                style={{ left: `${20 + i * 12}%`, top: '40%' }}
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </motion.div>
            ))}
          </div>

          <motion.div
            className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 500 }}
            >
              <Check className="w-12 h-12 text-white" />
            </motion.div>
          </motion.div>
          <motion.h2
            className="text-2xl font-bold text-gray-900 mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            이미 구매했어요!
          </motion.h2>
          <motion.p
            className="text-gray-500 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            지금 바로 콘텐츠를 확인해보세요
          </motion.p>
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link href={`/content/${productId}`}>
              <motion.button
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-semibold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                콘텐츠 보러가기
              </motion.button>
            </Link>
            <Link href="/my/purchases">
              <motion.button
                className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-semibold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                구매 내역 보기
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // 대기 중
  if (pendingPurchase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-5">
        <motion.div
          className="text-center bg-white rounded-3xl p-8 shadow-sm max-w-sm w-full"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <motion.div
            className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Clock className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">입금 확인 중이에요</h2>
          <p className="text-gray-500 mb-8">
            확인되면 바로 알려드릴게요!
          </p>
          <div className="space-y-3">
            <Link href="/my/purchases">
              <motion.button
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-semibold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                구매 내역 확인
              </motion.button>
            </Link>
            <Link href={`/content/${productId}`}>
              <motion.button
                className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-semibold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                상품 페이지로
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // 메인 결제 화면
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <motion.header
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center">
          <Link href={`/content/${productId}`}>
            <motion.button
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </motion.button>
          </Link>
          <h1 className="flex-1 text-center font-semibold text-gray-900">결제하기</h1>
          <div className="w-10" />
        </div>
      </motion.header>

      <motion.main
        className="max-w-lg mx-auto px-5 py-6 pb-40"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 상품 정보 카드 */}
        <motion.div
          className="bg-gray-50 rounded-3xl p-5 mb-6 flex gap-4"
          variants={itemVariants}
        >
          <div className="w-20 h-20 rounded-2xl bg-gray-200 overflow-hidden flex-shrink-0">
            {product.thumbnail_url ? (
              <Image
                src={product.thumbnail_url}
                alt={product.title}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 line-clamp-2 mb-1">{product.title}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="w-4 h-4" />
              <span>{product.creator.name}</span>
            </div>
          </div>
        </motion.div>

        {/* 결제 금액 */}
        <motion.div
          className="text-center mb-8"
          variants={scaleVariants}
        >
          <p className="text-gray-500 text-sm mb-2">결제 금액</p>
          <motion.p
            className="text-5xl font-bold text-gray-900 tracking-tight"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
          >
            {formatCurrency(product.price)}
          </motion.p>
        </motion.div>

        {/* 안전 거래 안내 배지 */}
        <motion.div
          className="bg-emerald-50 rounded-3xl p-5 mb-6"
          variants={itemVariants}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="font-semibold text-emerald-900">스터플이 안전하게 보호해요</p>
          </div>
          <div className="space-y-2 text-sm text-emerald-700">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>입금 확인 전까지 에스크로 보관</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>콘텐츠 문제시 100% 환불</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>24시간 내 입금 확인</span>
            </div>
          </div>
        </motion.div>

        {/* 결제 방법 선택 */}
        <motion.div
          className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6"
          variants={itemVariants}
        >
          <p className="font-semibold text-gray-900 mb-4">결제 방법</p>
          <div className="grid grid-cols-2 gap-3">
            {/* 카드 결제 */}
            <motion.button
              onClick={() => setPaymentMethod('card')}
              className={`relative p-4 rounded-2xl border-2 transition-all ${
                paymentMethod === 'card'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {paymentMethod === 'card' && (
                <motion.div
                  className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
              <CreditCard className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'}`} />
              <p className={`text-sm font-medium ${paymentMethod === 'card' ? 'text-blue-900' : 'text-gray-700'}`}>카드결제</p>
              <p className="text-xs text-gray-400 mt-1">즉시 이용</p>
            </motion.button>

            {/* 토스 송금 */}
            <motion.button
              onClick={() => setPaymentMethod('transfer')}
              className={`relative p-4 rounded-2xl border-2 transition-all ${
                paymentMethod === 'transfer'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {paymentMethod === 'transfer' && (
                <motion.div
                  className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
              <Wallet className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'transfer' ? 'text-blue-600' : 'text-gray-400'}`} />
              <p className={`text-sm font-medium ${paymentMethod === 'transfer' ? 'text-blue-900' : 'text-gray-700'}`}>토스 송금</p>
              <p className="text-xs text-gray-400 mt-1">입금 확인 후</p>
            </motion.button>
          </div>
        </motion.div>

        {/* 카드 결제 UI */}
        <AnimatePresence mode="wait">
          {paymentMethod === 'card' && (
            <motion.div
              key="card-payment"
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">카드로 결제하기</p>
                  <p className="text-sm text-gray-500">결제 완료 후 바로 이용할 수 있어요</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>신용카드, 체크카드 모두 가능</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>결제 즉시 콘텐츠 이용 가능</span>
                </div>
              </div>

              {/* 진행 절차 - 카드결제 */}
              <div className="flex items-center justify-center gap-2 text-center text-xs text-gray-400 mt-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full font-medium">결제</span>
                <ChevronRight className="w-3 h-3" />
                <span className="px-2 py-1 bg-gray-100 rounded-full">검증</span>
                <ChevronRight className="w-3 h-3" />
                <span className="px-2 py-1 bg-gray-100 rounded-full">완료</span>
              </div>
            </motion.div>
          )}

          {/* 토스 송금 UI */}
          {paymentMethod === 'transfer' && (
            <motion.div
              key="transfer-payment"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">토스로 송금하기</p>
                    <p className="text-sm text-gray-500">버튼을 누르면 바로 송금화면으로 이동해요</p>
                  </div>
                </div>

                <motion.button
                  onClick={handleOpenToss}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-white text-lg"
                  style={{ backgroundColor: '#0064FF' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm0-8H9V7h6v2z"/>
                  </svg>
                  토스로 송금하기
                </motion.button>
                <p className="text-xs text-gray-400 text-center mt-4">
                  &apos;스터플&apos;에게 금액이 자동 입력된 송금 화면이 열려요
                </p>
              </div>

              {/* 입금자명 입력 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                <label className="block font-semibold text-gray-900 mb-3">
                  입금자명
                </label>
                <input
                  type="text"
                  value={buyerNote}
                  onChange={(e) => setBuyerNote(e.target.value)}
                  placeholder="송금할 때 입력한 이름"
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <p className="text-xs text-gray-400 mt-2">
                  빠른 입금 확인을 위해 정확히 입력해주세요
                </p>
              </div>

              {/* 진행 절차 타임라인 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                <p className="font-semibold text-gray-900 mb-4">이렇게 진행돼요</p>
                <div className="flex items-center justify-between text-center">
                  <div className="flex-1">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center mx-auto mb-2 text-sm font-semibold">1</div>
                    <p className="text-xs text-gray-600">송금하기</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mx-auto mb-2 text-sm font-semibold">2</div>
                    <p className="text-xs text-gray-400">확인 요청</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mx-auto mb-2 text-sm font-semibold">3</div>
                    <p className="text-xs text-gray-400">입금 확인</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mx-auto mb-2 text-sm font-semibold">4</div>
                    <p className="text-xs text-gray-400">콘텐츠 이용</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center mt-4">
                  입금 확인은 보통 24시간 내에 완료돼요
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 에러 메시지 */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="bg-red-50 rounded-2xl p-4 mb-4 flex items-center gap-3"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 주의사항 */}
        <motion.div
          className="bg-gray-50 rounded-2xl p-4 mb-6"
          variants={itemVariants}
        >
          <p className="text-xs font-semibold text-gray-500 mb-2">구매 전 확인해주세요</p>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• 디지털 콘텐츠는 다운로드 후 환불이 제한될 수 있어요</li>
            <li>• 콘텐츠에 문제가 있다면 24시간 내에 신고해주세요</li>
          </ul>
        </motion.div>
      </motion.main>

      {/* 하단 고정 버튼 */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-5 pb-8"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.5 }}
      >
        <div className="max-w-lg mx-auto">
          {paymentMethod === 'card' ? (
            /* 카드 결제 버튼 */
            <motion.button
              onClick={handleCardPayment}
              disabled={isProcessing}
              className={`w-full py-5 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
                !isProcessing
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
              variants={pulseVariants}
              initial="initial"
              animate={!isProcessing ? 'pulse' : 'initial'}
              whileHover={!isProcessing ? { scale: 1.02 } : {}}
              whileTap={!isProcessing ? { scale: 0.98 } : {}}
            >
              {isProcessing ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  결제 처리 중...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  {formatCurrency(product.price)} 결제하기
                </>
              )}
            </motion.button>
          ) : (
            /* 토스 송금 확인 버튼 */
            <motion.button
              onClick={handlePaymentComplete}
              disabled={!buyerNote.trim() || isProcessing}
              className={`w-full py-5 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
                buyerNote.trim() && !isProcessing
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
              variants={pulseVariants}
              initial="initial"
              animate={buyerNote.trim() && !isProcessing ? 'pulse' : 'initial'}
              whileHover={buyerNote.trim() && !isProcessing ? { scale: 1.02 } : {}}
              whileTap={buyerNote.trim() && !isProcessing ? { scale: 0.98 } : {}}
            >
              {isProcessing ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  처리 중...
                </>
              ) : (
                <>
                  송금 완료했어요
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
