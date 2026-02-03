'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowLeft,
  Shield,
  Copy,
  Check,
  Building2,
  AlertCircle,
  MessageCircle,
  User,
  Clock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { Button, Card, CardContent, Badge, Spinner } from '@/components/ui';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface PlatformPaymentAccount {
  bank_name: string;
  account_number: string;
  account_holder: string;
}

interface Creator {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  qa_price: number;
}

interface PaidQAPageProps {
  params: { id: string };
}

export default function PaidQAPage({ params }: PaidQAPageProps) {
  const creatorId = params.id;
  const router = useRouter();

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [platformAccount, setPlatformAccount] = useState<PlatformPaymentAccount | null>(null);
  const [questionContent, setQuestionContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [buyerNote, setBuyerNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [hasPendingQuestion, setHasPendingQuestion] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        router.push(`/login?redirectTo=/qa/${creatorId}/pay`);
        return;
      }

      // Can't ask yourself
      if (user.id === creatorId) {
        router.push(`/@${creatorId}`);
        return;
      }

      try {
        // Fetch creator info, Q&A settings, and platform account in parallel
        const [creatorResponse, platformResponse] = await Promise.all([
          supabase
            .from('users')
            .select(`
              id,
              display_name,
              avatar_url
            `)
            .eq('id', creatorId)
            .single(),
          fetch('/api/platform/settings?key=payment_account'),
        ]);

        if (creatorResponse.error || !creatorResponse.data) {
          router.push('/content');
          return;
        }

        // Get Q&A settings
        const { data: qaSettings } = await supabase
          .from('creator_qa_settings')
          .select('qa_price, is_qa_enabled')
          .eq('user_id', creatorId)
          .single();

        if (!qaSettings?.is_qa_enabled || !qaSettings?.qa_price || qaSettings.qa_price <= 0) {
          // No paid Q&A available
          router.push(`/@${creatorId}`);
          return;
        }

        setCreator({
          ...creatorResponse.data,
          qa_price: qaSettings.qa_price,
        });

        // Set platform payment account
        if (platformResponse.ok) {
          const platformData = await platformResponse.json();
          if (platformData.value) {
            setPlatformAccount(platformData.value);
          }
        }

        // Check if there's a pending paid question
        const { data: pendingQuestion } = await supabase
          .from('questions')
          .select('id')
          .eq('creator_id', creatorId)
          .eq('asker_id', user.id)
          .eq('is_paid', true)
          .eq('payment_status', 'pending')
          .single();

        if (pendingQuestion) {
          setHasPendingQuestion(true);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        router.push('/content');
        return;
      }

      setIsLoading(false);
    };

    fetchData();
  }, [creatorId, router, supabase]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSubmit = async () => {
    if (!creator || !user || !questionContent.trim()) return;

    if (!buyerNote.trim()) {
      setError('입금자명을 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/qa/paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: creator.id,
          content: questionContent.trim(),
          isAnonymous,
          buyerNote: buyerNote.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '질문 등록에 실패했습니다.');
      }

      const data = await response.json();
      router.push(`/qa/${data.questionId}/pending`);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : '질문 등록 중 오류가 발생했습니다.');
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
          <p className="text-gray-600 font-medium">정보를 불러오는 중...</p>
        </div>
      </motion.div>
    );
  }

  if (!creator) {
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
          <p className="text-gray-600 mb-4">크리에이터를 찾을 수 없습니다.</p>
          <Link href="/content">
            <Button variant="outline">돌아가기</Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  if (hasPendingQuestion) {
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">대기 중인 질문이 있어요</h2>
            <p className="text-gray-600 mb-6">
              결제 확인 대기 중인 질문이 있습니다.<br />
              확인 후 새 질문을 등록해주세요.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/my/questions">
                <Button fullWidth className="bg-gradient-to-r from-amber-500 to-yellow-500">
                  내 질문 확인하기
                </Button>
              </Link>
              <Link href={`/@${creatorId}`}>
                <Button variant="outline" fullWidth>
                  프로필로 돌아가기
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
            <Link href={`/@${creatorId}`}>
              <Button variant="outline" fullWidth>
                프로필로 돌아가기
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
            href={`/@${creatorId}`}
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
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-6 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 opacity-20">
                <div className="w-20 h-20">
                  <MessageCircle className="w-full h-full" />
                </div>
              </div>

              <div className="relative z-10">
                <Badge className="bg-white/20 text-white border-white/30 mb-3">
                  유료 Q&A
                </Badge>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                    {creator.avatar_url ? (
                      <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">{creator.display_name || '크리에이터'}</h1>
                    <p className="text-white/80 text-sm">에게 질문하기</p>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              {/* Price Display */}
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-1">질문 가격</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  {formatCurrency(creator.qa_price)}
                </p>
              </div>

              {/* Question Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  질문 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={questionContent}
                  onChange={(e) => setQuestionContent(e.target.value)}
                  placeholder="크리에이터에게 궁금한 점을 물어보세요..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {questionContent.length}/1000
                </p>
              </div>

              {/* Anonymous Option */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">익명으로 질문하기</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-8">
                  체크하면 크리에이터에게 이름이 표시되지 않아요
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
                    <p>1. 위 계좌로 <strong className="text-orange-600">{formatCurrency(creator.qa_price)}</strong>을 송금하세요</p>
                    <p>2. 송금 완료 후 아래 버튼을 눌러주세요</p>
                  </div>
                </div>
              </div>

              {/* Buyer Note (입금자명) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  입금자명 <span className="text-red-500">*</span>
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
                    입금 확인 후 크리에이터에게 질문이 전달돼요
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button
                fullWidth
                size="lg"
                onClick={handleSubmit}
                isLoading={isProcessing}
                disabled={!questionContent.trim() || !buyerNote.trim()}
                className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-orange-200 transition-all hover:shadow-xl hover:shadow-orange-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  '처리 중...'
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    송금 완료 & 질문 등록
                  </>
                )}
              </Button>

              {/* Footer note */}
              <p className="text-xs text-gray-500 text-center mt-4">
                입금 확인 후 답변을 받으면 알림을 보내드려요
              </p>
            </CardContent>
          </Card>

          {/* Bottom decoration */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <span className="text-lg">💬</span>
              크리에이터와 소통해보세요
              <span className="text-lg">✨</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
