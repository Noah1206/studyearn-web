'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import { Clock, CheckCircle, ArrowRight, Home, ShoppingBag } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, CardContent, Spinner } from '@/components/ui';
import type { User } from '@supabase/supabase-js';

interface PendingPageProps {
  params: { contentId: string };
}

export default function PurchasePendingPage({ params }: PendingPageProps) {
  const contentId = params.contentId;
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<string | null>(null);
  const [contentTitle, setContentTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        router.push(`/login?redirectTo=/purchase/${contentId}/pending`);
        return;
      }

      // Get purchase status
      const { data: purchase } = await supabase
        .from('content_purchases')
        .select(`
          status,
          contents:content_id (title)
        `)
        .eq('content_id', contentId)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (purchase) {
        setPurchaseStatus(purchase.status);
        // @ts-ignore - nested select type issue
        setContentTitle(purchase.contents?.title || '');

        // If already completed, redirect to content page
        if (purchase.status === 'completed') {
          router.push(`/content/${contentId}`);
          return;
        }
      } else {
        // No purchase found, redirect to purchase page
        router.push(`/purchase/${contentId}`);
        return;
      }

      setIsLoading(false);
    };

    fetchData();

    // Set up realtime subscription for purchase status changes
    const channel = supabase
      .channel(`purchase-${contentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'content_purchases',
          filter: `content_id=eq.${contentId}`,
        },
        (payload: { new: { status: string } }) => {
          const newStatus = payload.new.status;
          setPurchaseStatus(newStatus);

          if (newStatus === 'completed') {
            // Redirect to content page after a short delay
            setTimeout(() => {
              router.push(`/content/${contentId}`);
            }, 2000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contentId, router, supabase]);

  if (isLoading) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-b from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center"
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
      >
        <div className="text-center">
          <Spinner className="w-10 h-10 mx-auto mb-4 text-amber-500" />
          <p className="text-gray-600 font-medium">정보를 불러오는 중...</p>
        </div>
      </motion.div>
    );
  }

  // Show completed state
  if (purchaseStatus === 'completed') {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center relative overflow-hidden"
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
      >
        {/* Success particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                left: `${Math.random() * 100}%`,
                top: '100%',
                opacity: 1,
              }}
              animate={{
                top: '-10%',
                opacity: 0,
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              <span className="text-2xl">🎉</span>
            </motion.div>
          ))}
        </div>

        <Card variant="elevated" className="max-w-md mx-4 text-center py-8 relative z-10 border-2 border-green-100">
          <CardContent>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200"
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">결제가 승인되었어요!</h2>
            <p className="text-gray-600 mb-6">
              {contentTitle && <span className="font-medium">&quot;{contentTitle}&quot;</span>}
              <br />콘텐츠를 지금 바로 확인하세요
            </p>
            <Link href={`/content/${contentId}`}>
              <Button fullWidth className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                콘텐츠 보기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Show rejected state
  if (purchaseStatus === 'rejected') {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-b from-red-50 via-rose-50 to-pink-50 flex items-center justify-center"
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
      >
        <Card variant="elevated" className="max-w-md mx-4 text-center py-8 border-2 border-red-100">
          <CardContent>
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-red-200">
              <span className="text-4xl">😢</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">결제가 거절되었어요</h2>
            <p className="text-gray-600 mb-6">
              크리에이터가 입금을 확인하지 못했어요.<br />
              다시 시도해주세요.
            </p>
            <div className="flex flex-col gap-3">
              <Link href={`/purchase/${contentId}`}>
                <Button fullWidth className="bg-gradient-to-r from-orange-500 to-amber-500">
                  다시 구매하기
                </Button>
              </Link>
              <Link href={`/content/${contentId}`}>
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

  // Show pending state (default)
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center relative overflow-hidden"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-amber-200/40 rounded-full blur-2xl" />
      <div className="absolute top-40 right-20 w-40 h-40 bg-yellow-200/40 rounded-full blur-2xl" />
      <div className="absolute bottom-20 left-1/4 w-48 h-48 bg-orange-200/30 rounded-full blur-3xl" />

      <Card variant="elevated" className="max-w-md mx-4 text-center py-8 relative z-10 border-2 border-amber-100">
        <CardContent>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-200"
          >
            <Clock className="w-12 h-12 text-white" />
          </motion.div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">결제 확인 대기 중</h2>
          <p className="text-gray-600 mb-2">
            {contentTitle && <span className="font-medium">&quot;{contentTitle}&quot;</span>}
          </p>
          <p className="text-gray-500 text-sm mb-6">
            크리에이터가 입금을 확인하면<br />
            콘텐츠를 열람할 수 있어요
          </p>

          {/* Status indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex gap-1">
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                className="w-2 h-2 bg-amber-500 rounded-full"
              />
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                className="w-2 h-2 bg-amber-500 rounded-full"
              />
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                className="w-2 h-2 bg-amber-500 rounded-full"
              />
            </div>
            <span className="text-sm text-amber-600 font-medium">확인 중</span>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/my/purchases">
              <Button fullWidth variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                <ShoppingBag className="w-4 h-4 mr-2" />
                구매 내역 보기
              </Button>
            </Link>
            <Link href="/">
              <Button fullWidth variant="ghost" className="text-gray-500">
                <Home className="w-4 h-4 mr-2" />
                홈으로 돌아가기
              </Button>
            </Link>
          </div>

          <p className="text-xs text-gray-400 mt-6">
            확인이 완료되면 알림으로 안내해드릴게요
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
