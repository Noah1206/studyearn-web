'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import { ArrowLeft, Lock, Shield, Sparkles, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { requestCardPayment, requestEasyPayPayment, requestTransferPayment, requestVirtualAccountPayment } from '@/lib/toss/client';
import { formatCurrency } from '@/lib/utils';
import { Button, Card, CardContent, Badge, Spinner } from '@/components/ui';
import { FallingCoins } from '@/components/animations';
import type { User } from '@supabase/supabase-js';

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  thumbnail_url: string | null;
}

interface PurchasePageProps {
  params: Promise<{ contentId: string }>;
}

export default function PurchasePage({ params }: PurchasePageProps) {
  // Note: contentId is actually productId in MVP
  const { contentId: productId } = use(params);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'kakaopay' | 'naverpay' | 'tosspay' | 'transfer' | 'virtual_account'>('tosspay');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        router.push(`/login?redirectTo=/purchase/${productId}`);
        return;
      }

      // Fetch product info from API
      try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
          router.push(`/content/${productId}`);
          return;
        }

        const data = await response.json();

        if (!data.product) {
          router.push('/content');
          return;
        }

        setProduct(data.product);

        // Check if already purchased
        if (data.isPurchased) {
          setAlreadyPurchased(true);
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
        router.push('/content');
        return;
      }

      setIsLoading(false);
    };

    fetchData();
  }, [productId, router, supabase]);

  const handlePayment = async () => {
    if (!product || !user) return;

    setIsProcessing(true);
    setError('');

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      // Create pending purchase via API
      const response = await fetch('/api/payment/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          amount: product.price,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '결제 정보 생성에 실패했습니다.');
      }

      const { orderId, orderName, amount } = await response.json();

      const paymentParams = {
        orderId,
        orderName,
        amount,
        customerEmail: user.email || undefined,
        customerName: user.user_metadata?.full_name || undefined,
        successUrl: `${appUrl}/payment/success?type=product&productId=${productId}`,
        failUrl: `${appUrl}/purchase/${productId}?error=payment_failed`,
      };

      if (paymentMethod === 'card') {
        await requestCardPayment(paymentParams);
      } else if (paymentMethod === 'transfer') {
        await requestTransferPayment(paymentParams);
      } else if (paymentMethod === 'virtual_account') {
        await requestVirtualAccountPayment(paymentParams);
      } else {
        const providerMap = {
          kakaopay: 'KAKAOPAY',
          naverpay: 'NAVERPAY',
          tosspay: 'TOSSPAY',
        } as const;
        await requestEasyPayPayment({ ...paymentParams, provider: providerMap[paymentMethod] });
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center"
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-orange-200">
            <span className="text-3xl">💰</span>
          </div>
          <p className="text-gray-600 font-medium">결제 정보를 불러오는 중...</p>
        </div>
      </motion.div>
    );
  }

  if (!product) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center"
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">😢</span>
          </div>
          <p className="text-gray-600 mb-4">상품을 찾을 수 없습니다.</p>
          <Link href="/content">
            <Button variant="outline">상품 목록으로</Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  if (alreadyPurchased) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center relative overflow-hidden"
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
      >
        {/* Success sparkles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
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

        <Card variant="elevated" className="max-w-md mx-4 text-center py-8 relative z-10 border-2 border-green-100">
          <CardContent>
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200 animate-bounce">
              <span className="text-4xl">🎉</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">이미 구매한 상품이에요!</h2>
            <p className="text-gray-600 mb-6">지금 바로 콘텐츠를 확인하세요</p>
            <div className="flex flex-col gap-3">
              <Link href={`/content/${productId}`}>
                <Button fullWidth className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                  📚 콘텐츠 보기
                </Button>
              </Link>
              <Link href="/my/purchases">
                <Button variant="outline" fullWidth>
                  구매 내역 보기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const paymentMethods = [
    {
      id: 'tosspay' as const,
      name: '토스페이',
      icon: 'T',
      iconBg: 'bg-blue-500',
      iconColor: 'text-white',
      recommended: true,
    },
    {
      id: 'kakaopay' as const,
      name: '카카오페이',
      icon: 'K',
      iconBg: 'bg-yellow-400',
      iconColor: 'text-yellow-900',
    },
    {
      id: 'naverpay' as const,
      name: '네이버페이',
      icon: 'N',
      iconBg: 'bg-green-500',
      iconColor: 'text-white',
    },
    {
      id: 'card' as const,
      name: '카드 결제',
      icon: '💳',
      iconBg: 'bg-gray-600',
      iconColor: 'text-white',
      isEmoji: true,
    },
    {
      id: 'transfer' as const,
      name: '계좌이체',
      icon: '🏦',
      iconBg: 'bg-gray-400',
      iconColor: 'text-white',
      isEmoji: true,
      subText: '실시간 계좌이체',
    },
    {
      id: 'virtual_account' as const,
      name: '가상계좌',
      icon: '📋',
      iconBg: 'bg-indigo-400',
      iconColor: 'text-white',
      isEmoji: true,
      subText: '계좌번호 발급 후 입금 (7일 유효)',
    },
  ];

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-orange-100 via-amber-50 to-yellow-100 relative overflow-hidden"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* Animated background */}
      <FallingCoins />

      {/* Decorative circles */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-orange-200/40 rounded-full blur-2xl" />
      <div className="absolute top-40 right-20 w-40 h-40 bg-yellow-200/40 rounded-full blur-2xl" />
      <div className="absolute bottom-20 left-1/4 w-48 h-48 bg-amber-200/30 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 py-8 px-4">
        {/* Header */}
        <div className="max-w-lg mx-auto mb-6">
          <Link
            href={`/content/${productId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full transition-all hover:bg-white/80"
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </Link>
        </div>

        {/* Main Card */}
        <div className="max-w-lg mx-auto">
          <Card variant="elevated" className="border-2 border-orange-100 shadow-xl shadow-orange-100/50 overflow-hidden">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-400 p-6 text-white relative overflow-hidden">
              {/* Floating coins in hero */}
              <div className="absolute top-4 right-4 animate-bounce" style={{ animationDelay: '0s' }}>
                <span className="text-3xl">🪙</span>
              </div>
              <div className="absolute top-12 right-16 animate-bounce" style={{ animationDelay: '0.5s' }}>
                <span className="text-2xl">💰</span>
              </div>
              <div className="absolute bottom-4 right-8 animate-bounce" style={{ animationDelay: '1s' }}>
                <span className="text-xl">✨</span>
              </div>

              <div className="relative z-10">
                <Badge className="bg-white/20 text-white border-white/30 mb-3">
                  학습 상품
                </Badge>
                <h1 className="text-xl font-bold mb-2 line-clamp-2">{product.title}</h1>
              </div>
            </div>

            <CardContent className="p-6">
              {/* Price Display */}
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-1">결제 금액</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  {formatCurrency(product.price)}
                </p>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  어떻게 결제할까요? 💳
                </label>
                <div className="space-y-2">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`
                        flex items-center gap-3 p-4 border-2 rounded-2xl cursor-pointer transition-all
                        ${paymentMethod === method.id
                          ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50 shadow-md shadow-orange-100'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="sr-only"
                      />

                      {/* Radio indicator */}
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${paymentMethod === method.id
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-gray-300'
                        }
                      `}>
                        {paymentMethod === method.id && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>

                      {/* Icon */}
                      <div className={`
                        w-8 h-8 ${method.iconBg} rounded-lg flex items-center justify-center
                        shadow-sm ${method.isEmoji ? '' : method.iconColor}
                      `}>
                        {method.isEmoji ? (
                          <span className="text-base">{method.icon}</span>
                        ) : (
                          <span className="text-sm font-bold">{method.icon}</span>
                        )}
                      </div>

                      {/* Label */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{method.name}</span>
                          {method.recommended && (
                            <span className="text-xs bg-gradient-to-r from-orange-400 to-amber-400 text-white px-2 py-0.5 rounded-full font-medium">
                              추천
                            </span>
                          )}
                        </div>
                        {method.subText && (
                          <span className="text-xs text-gray-500">{method.subText}</span>
                        )}
                      </div>

                      {/* Check mark */}
                      {paymentMethod === method.id && (
                        <div className="text-orange-500">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Trust Signals */}
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl mb-4 border border-green-100">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">안전한 결제</p>
                  <p className="text-xs text-green-600">7일 이내 100% 환불 보장</p>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4 flex items-center gap-2">
                  <span>⚠️</span>
                  {error}
                </div>
              )}

              {/* Pay Button */}
              <Button
                fullWidth
                size="lg"
                onClick={handlePayment}
                isLoading={isProcessing}
                className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-orange-200 transition-all hover:shadow-xl hover:shadow-orange-300 hover:scale-[1.02]"
              >
                {isProcessing ? (
                  '결제 진행 중...'
                ) : (
                  <>
                    <span className="mr-2">💳</span>
                    {formatCurrency(product.price)} 결제하기
                  </>
                )}
              </Button>

              {/* Footer note */}
              <p className="text-xs text-gray-500 text-center mt-4 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                구매 후 바로 콘텐츠를 이용할 수 있어요
              </p>
            </CardContent>
          </Card>

          {/* Bottom decoration */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <span className="text-lg">🎓</span>
              학습은 최고의 투자예요!
              <span className="text-lg">📚</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
