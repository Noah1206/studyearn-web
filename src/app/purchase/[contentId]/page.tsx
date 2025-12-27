'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Lock, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { requestCardPayment, requestEasyPayPayment } from '@/lib/toss/client';
import { formatCurrency, generateMerchantUid } from '@/lib/utils';
import { Button, Card, CardContent, CardHeader, CardTitle, Avatar, Badge, Spinner } from '@/components/ui';
import type { Content, CreatorSettings } from '@/types/database';
import type { User } from '@supabase/supabase-js';

interface PurchasePageProps {
  params: Promise<{ contentId: string }>;
}

export default function PurchasePage({ params }: PurchasePageProps) {
  const { contentId } = use(params);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [content, setContent] = useState<Content | null>(null);
  const [creator, setCreator] = useState<CreatorSettings | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'kakaopay' | 'naverpay'>('card');
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
        router.push(`/login?redirectTo=/purchase/${contentId}`);
        return;
      }

      // Get content
      const { data: contentData } = await supabase
        .from('contents')
        .select('*')
        .eq('id', contentId)
        .eq('is_published', true)
        .single();

      if (!contentData || contentData.access_level !== 'paid' || !contentData.price) {
        router.push(`/content/${contentId}`);
        return;
      }
      setContent(contentData);

      // Get creator
      const { data: creatorData } = await supabase
        .from('creator_settings')
        .select('*')
        .eq('user_id', contentData.creator_id)
        .single();

      setCreator(creatorData);

      // Check if already purchased
      const { data: purchase } = await supabase
        .from('content_purchases')
        .select('id')
        .eq('content_id', contentId)
        .eq('buyer_id', user.id)
        .eq('status', 'completed')
        .single();

      if (purchase) {
        setAlreadyPurchased(true);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [contentId, router, supabase]);

  const handlePayment = async () => {
    if (!content || !user || !content.price) return;

    setIsProcessing(true);
    setError('');

    try {
      const merchantUid = generateMerchantUid('content');
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

      // Create pending payment record
      const { error: insertError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          merchant_uid: merchantUid,
          amount: content.price,
          payment_type: 'one_time',
          content_id: content.id,
          creator_id: creator?.id,
          buyer_email: user.email,
          buyer_name: user.user_metadata?.full_name,
        });

      if (insertError) {
        throw new Error('결제 정보 생성에 실패했습니다.');
      }

      const paymentParams = {
        orderId: merchantUid,
        orderName: content.title,
        amount: content.price,
        customerEmail: user.email || undefined,
        customerName: user.user_metadata?.full_name || undefined,
        successUrl: `${appUrl}/payment/success?type=content&contentId=${contentId}`,
        failUrl: `${appUrl}/purchase/${contentId}?error=payment_failed`,
      };

      if (paymentMethod === 'card') {
        await requestCardPayment(paymentParams);
      } else {
        const provider = paymentMethod === 'kakaopay' ? 'KAKAOPAY' : 'NAVERPAY';
        await requestEasyPayPayment({ ...paymentParams, provider });
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!content || !content.price) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">콘텐츠를 찾을 수 없습니다.</p>
          <Link href="/">
            <Button variant="outline">홈으로</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (alreadyPurchased) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4">
          <Card variant="elevated" className="text-center py-8">
            <CardContent>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-gray-900" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">이미 구매한 콘텐츠입니다</h2>
              <p className="text-gray-600 mb-6">앱에서 콘텐츠를 확인할 수 있습니다.</p>
              <div className="flex flex-col gap-3">
                <a
                  href={process.env.NEXT_PUBLIC_APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button fullWidth>앱에서 보기</Button>
                </a>
                <Link href={`/content/${contentId}`}>
                  <Button variant="outline" fullWidth>
                    콘텐츠 페이지로
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const contentTypeLabels = {
    post: '포스트',
    video: '영상',
    audio: '오디오',
    document: '문서',
    image: '이미지',
    live: '라이브',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link
          href={`/content/${contentId}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          콘텐츠로 돌아가기
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Content Info */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">콘텐츠 구매</h1>

            <Card variant="outlined">
              {content.thumbnail_url && (
                <div className="relative aspect-video">
                  <Image
                    src={content.thumbnail_url}
                    alt={content.title}
                    fill
                    className="object-cover rounded-t-xl"
                  />
                </div>
              )}
              <CardContent className="p-6">
                <Badge variant="outline" className="mb-3">
                  {contentTypeLabels[content.content_type]}
                </Badge>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{content.title}</h2>
                {content.description && (
                  <p className="text-gray-600 line-clamp-3">{content.description}</p>
                )}

                {creator && (
                  <Link
                    href={`/creator/${creator.user_id}`}
                    className="flex items-center gap-3 mt-4 pt-4 border-t"
                  >
                    <Avatar
                      src={creator.profile_image_url}
                      alt={creator.display_name || '크리에이터'}
                      size="sm"
                    />
                    <span className="text-gray-700 hover:text-gray-900">
                      {creator.display_name || '크리에이터'}
                    </span>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Section */}
          <div>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>결제 정보</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Order Summary */}
                <div className="p-4 bg-gray-50 rounded-lg mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">콘텐츠</span>
                    <span className="font-medium truncate max-w-[200px]">{content.title}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">결제 금액</span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(content.price)}
                    </span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    결제 수단
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="text-gray-900"
                      />
                      <span>신용/체크카드</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="kakaopay"
                        checked={paymentMethod === 'kakaopay'}
                        onChange={() => setPaymentMethod('kakaopay')}
                        className="text-gray-900"
                      />
                      <span>카카오페이</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="naverpay"
                        checked={paymentMethod === 'naverpay'}
                        onChange={() => setPaymentMethod('naverpay')}
                        className="text-gray-900"
                      />
                      <span>네이버페이</span>
                    </label>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-4">
                    {error}
                  </div>
                )}

                <Button
                  fullWidth
                  size="lg"
                  onClick={handlePayment}
                  isLoading={isProcessing}
                >
                  {formatCurrency(content.price)} 결제하기
                </Button>

                <div className="flex items-center gap-2 justify-center mt-4 text-sm text-gray-500">
                  <Lock className="w-4 h-4" />
                  <span>안전한 결제가 보장됩니다</span>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  구매 후에는 앱에서 콘텐츠를 확인할 수 있습니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
