'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import { Clock, CheckCircle, ArrowRight, Home, MessageCircle, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, CardContent, Spinner } from '@/components/ui';
import type { User } from '@supabase/supabase-js';

interface PendingPageProps {
  params: { id: string };
}

export default function QAPendingPage({ params }: PendingPageProps) {
  const questionId = params.id;
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [questionStatus, setQuestionStatus] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        router.push(`/login?redirectTo=/qa/${questionId}/pending`);
        return;
      }

      // Get question and payment status
      const { data: question } = await supabase
        .from('questions')
        .select(`
          id,
          status,
          payment_status,
          is_paid,
          creator:creator_id (display_name)
        `)
        .eq('id', questionId)
        .eq('asker_id', user.id)
        .single();

      if (!question) {
        // No question found, redirect to my questions
        router.push('/my/questions');
        return;
      }

      if (!question.is_paid) {
        // Not a paid question, redirect
        router.push('/my/questions');
        return;
      }

      setPaymentStatus(question.payment_status);
      setQuestionStatus(question.status);
      // @ts-ignore - nested select type issue
      setCreatorName(question.creator?.display_name || '크리에이터');

      // If already answered, redirect to my questions
      if (question.status === 'answered') {
        router.push('/my/questions');
        return;
      }

      setIsLoading(false);
    };

    fetchData();

    // Set up realtime subscription for question status changes
    const channel = supabase
      .channel(`question-${questionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'questions',
          filter: `id=eq.${questionId}`,
        },
        (payload: { new: { status: string; payment_status: string } }) => {
          const newPaymentStatus = payload.new.payment_status;
          const newStatus = payload.new.status;
          setPaymentStatus(newPaymentStatus);
          setQuestionStatus(newStatus);

          // If answered, redirect after a short delay
          if (newStatus === 'answered') {
            setTimeout(() => {
              router.push('/my/questions');
            }, 2000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [questionId, router, supabase]);

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

  // Show answered state
  if (questionStatus === 'answered') {
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">답변이 도착했어요!</h2>
            <p className="text-gray-600 mb-6">
              <span className="font-medium">{creatorName}</span>님이 답변을 보냈어요
            </p>
            <Link href="/my/questions">
              <Button fullWidth className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                답변 확인하기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Show payment rejected state
  if (paymentStatus === 'rejected') {
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
              <XCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">결제가 확인되지 않았어요</h2>
            <p className="text-gray-600 mb-6">
              크리에이터가 입금을 확인하지 못했어요.<br />
              입금 후 다시 시도해주세요.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/my/questions">
                <Button fullWidth className="bg-gradient-to-r from-orange-500 to-amber-500">
                  내 질문 확인하기
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" fullWidth>
                  홈으로 돌아가기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Show payment confirmed, waiting for answer
  if (paymentStatus === 'confirmed') {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center relative overflow-hidden"
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
      >
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-200/40 rounded-full blur-2xl" />
        <div className="absolute top-40 right-20 w-40 h-40 bg-emerald-200/40 rounded-full blur-2xl" />

        <Card variant="elevated" className="max-w-md mx-4 text-center py-8 relative z-10 border-2 border-green-100">
          <CardContent>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200"
            >
              <MessageCircle className="w-12 h-12 text-white" />
            </motion.div>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full text-green-700 text-sm font-medium mb-4">
              <CheckCircle className="w-4 h-4" />
              결제 확인 완료
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">답변을 기다리는 중</h2>
            <p className="text-gray-600 mb-2">
              <span className="font-medium">{creatorName}</span>님에게 질문이 전달되었어요
            </p>
            <p className="text-gray-500 text-sm mb-6">
              크리에이터가 답변하면 알려드릴게요
            </p>

            {/* Status indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex gap-1">
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 bg-green-500 rounded-full"
                />
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                  className="w-2 h-2 bg-green-500 rounded-full"
                />
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                  className="w-2 h-2 bg-green-500 rounded-full"
                />
              </div>
              <span className="text-sm text-green-600 font-medium">답변 대기 중</span>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/my/questions">
                <Button fullWidth variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  내 질문 보기
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
              답변이 등록되면 알림으로 안내해드릴게요
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Show pending payment state (default)
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
            <span className="font-medium">{creatorName}</span>님에게 보낸 질문
          </p>
          <p className="text-gray-500 text-sm mb-6">
            크리에이터가 입금을 확인하면<br />
            질문이 전달됩니다
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
            <span className="text-sm text-amber-600 font-medium">입금 확인 중</span>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/my/questions">
              <Button fullWidth variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                <MessageCircle className="w-4 h-4 mr-2" />
                내 질문 보기
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
