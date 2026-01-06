'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowLeft,
  Shield,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Banknote,
  Building2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Button, Card, CardContent, Badge, Spinner } from '@/components/ui';
import type { User } from '@supabase/supabase-js';

interface PlatformPaymentAccount {
  bank_name: string;
  account_number: string;
  account_holder: string;
}

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

  const [user, setUser] = useState<User | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [platformAccount, setPlatformAccount] = useState<PlatformPaymentAccount | null>(null);
  const [buyerNote, setBuyerNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        router.push(`/login?redirectTo=/purchase/${productId}`);
        return;
      }

      try {
        // Fetch product and platform account in parallel
        const [productResponse, platformResponse] = await Promise.all([
          fetch(`/api/products/${productId}`),
          fetch('/api/platform/settings?key=payment_account'),
        ]);

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

        // Set platform payment account
        if (platformResponse.ok) {
          const platformData = await platformResponse.json();
          if (platformData.value) {
            setPlatformAccount(platformData.value);
          }
        }

        // Check if there's a pending purchase
        const { data: pendingPurchase } = await supabase
          .from('content_purchases')
          .select('id, status')
          .eq('content_id', productId)
          .eq('buyer_id', user.id)
          .in('status', ['pending_payment', 'pending_confirm'])
          .single();

        if (pendingPurchase) {
          setPendingPurchase(true);
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

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
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
          <Spinner className="w-10 h-10 mx-auto mb-4 text-orange-500" />
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

  if (pendingPurchase) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-b from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center relative overflow-hidden"
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
      >
        <Card variant="elevated" className="max-w-md mx-4 text-center py-8 relative z-10 border-2 border-amber-100">
          <CardContent>
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-200">
              <Clock className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">입금 확인 대기 중</h2>
            <p className="text-gray-600 mb-6">
              결제완료 요청을 보내셨어요.<br />
              입금 확인 후 콘텐츠를 열람할 수 있습니다.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/my/purchases">
                <Button fullWidth className="bg-gradient-to-r from-amber-500 to-yellow-500">
                  구매 내역 확인
                </Button>
              </Link>
              <Link href={`/content/${productId}`}>
                <Button variant="outline" fullWidth>
                  상품 페이지로
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Check if platform payment account is set up
  if (!platformAccount) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-b from-gray-50 via-slate-50 to-gray-100 flex items-center justify-center"
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
      >
        <Card variant="elevated" className="max-w-md mx-4 text-center py-8 border-2 border-gray-200">
          <CardContent>
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">결제 시스템 준비 중</h2>
            <p className="text-gray-600 mb-6">
              결제 시스템을 준비 중입니다.<br />
              잠시 후 다시 시도해주세요.
            </p>
            <Link href={`/content/${productId}`}>
              <Button variant="outline" fullWidth>
                상품 페이지로 돌아가기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-yellow-50 relative overflow-hidden"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
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
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 opacity-20">
                <div className="w-20 h-20">
                  <Building2 className="w-full h-full" />
                </div>
              </div>

              <div className="relative z-10">
                <Badge className="bg-white/20 text-white border-white/30 mb-3">
                  계좌이체 결제
                </Badge>
                <h1 className="text-xl font-bold mb-2 line-clamp-2">{product.title}</h1>
                <p className="text-white/80 text-sm">
                  판매자: {product.creator.name}
                </p>
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

              {/* Payment Instructions - Platform Account */}
              <div className="rounded-2xl border-2 p-5 mb-6 bg-green-50 border-green-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-6 h-6" />
                  계좌로 송금하기
                </h3>

                <div className="space-y-3">
                  <div className="bg-white rounded-xl p-4 border border-green-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">은행</p>
                        <p className="font-bold text-gray-900">{platformAccount.bank_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">계좌번호</p>
                        <p className="font-bold text-gray-900">{platformAccount.account_number}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(platformAccount.account_number, 'account')}
                        className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        {copiedField === 'account' ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <Copy className="w-5 h-5 text-green-600" />
                        )}
                      </button>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">예금주</p>
                      <p className="font-bold text-gray-900">{platformAccount.account_holder}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>1. 위 계좌로 <strong className="text-orange-600">{formatCurrency(product.price)}</strong>을 송금하세요</p>
                    <p>2. 송금 완료 후 아래 &apos;결제완료&apos; 버튼을 눌러주세요</p>
                  </div>
                </div>
              </div>

              {/* Buyer Note (입금자명) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  입금자명 (필수)
                </label>
                <input
                  type="text"
                  value={buyerNote}
                  onChange={(e) => setBuyerNote(e.target.value)}
                  placeholder="송금 시 입력한 이름을 적어주세요"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  입금 확인에 사용됩니다. 정확히 입력해주세요.
                </p>
              </div>

              {/* Trust Signals */}
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl mb-4 border border-amber-100">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800">안내</p>
                  <p className="text-xs text-amber-600">
                    입금 확인 후 콘텐츠를 열람할 수 있어요
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Payment Complete Button */}
              <Button
                fullWidth
                size="lg"
                onClick={handlePaymentComplete}
                isLoading={isProcessing}
                disabled={!buyerNote.trim()}
                className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-orange-200 transition-all hover:shadow-xl hover:shadow-orange-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  '처리 중...'
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    송금 완료했어요!
                  </>
                )}
              </Button>

              {/* Footer note */}
              <p className="text-xs text-gray-500 text-center mt-4">
                입금 확인 후 알림을 보내드려요
              </p>
            </CardContent>
          </Card>

          {/* Bottom decoration */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <span className="text-lg">💸</span>
              안전하게 거래하세요
              <span className="text-lg">✨</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
