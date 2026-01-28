import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  User,
  Calendar,
  AlertCircle,
  Banknote,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatRelativeTime, formatCurrency } from '@/lib/utils';
import { LoadingSection } from '@/components/ui';
import QAActions from './QAActions';

export const dynamic = 'force-dynamic';

interface QuestionWithDetails {
  id: string;
  content: string;
  is_anonymous: boolean;
  is_public: boolean;
  status: string;
  created_at: string;
  answered_at: string | null;
  is_paid: boolean;
  price: number;
  payment_status: string;
  asker: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  answers: {
    id: string;
    content: string;
    created_at: string;
  }[];
  qa_payments: {
    buyer_note: string | null;
  }[];
}

async function getQuestions(userId: string) {
  const supabase = await createClient();

  // Get all questions received by this creator
  const { data: questions, error } = await supabase
    .from('questions')
    .select(`
      id,
      content,
      is_anonymous,
      is_public,
      status,
      created_at,
      answered_at,
      is_paid,
      price,
      payment_status,
      asker:asker_id (
        id,
        display_name,
        avatar_url
      ),
      answers (
        id,
        content,
        created_at
      ),
      qa_payments (
        buyer_note
      )
    `)
    .eq('creator_id', userId)
    .order('created_at', { ascending: false });

  if (error || !questions) {
    return { pending: [], answered: [], rejected: [] };
  }

  // Type assertion for the query result
  const typedQuestions = questions as unknown as QuestionWithDetails[];

  // Separate by status
  const pending = typedQuestions.filter(q => q.status === 'pending');
  const answered = typedQuestions.filter(q => q.status === 'answered');
  const rejected = typedQuestions.filter(q => q.status === 'rejected');

  return { pending, answered, rejected };
}

// Question Card Component
function QuestionCard({ question, showActions }: { question: QuestionWithDetails; showActions?: boolean }) {
  const isPending = question.status === 'pending';
  const isAnswered = question.status === 'answered';
  const isRejected = question.status === 'rejected';

  const getStatusBadge = () => {
    if (isPending) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <Clock className="w-3 h-3" />
          답변 대기
        </span>
      );
    }
    if (isAnswered) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" />
          답변완료
        </span>
      );
    }
    if (isRejected) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <XCircle className="w-3 h-3" />
          삭제됨
        </span>
      );
    }
    return null;
  };

  const getAskerName = () => {
    if (question.is_anonymous) {
      return '익명';
    }
    return question.asker?.display_name || '알 수 없음';
  };

  return (
    <div className={`bg-white rounded-2xl border ${isPending ? 'border-amber-200 shadow-amber-100/50' : 'border-gray-100'} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}>
      <div className="p-4">
        <div className="flex gap-4">
          {/* User Avatar */}
          <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
            {question.is_anonymous ? (
              <span className="text-xl text-gray-400">?</span>
            ) : question.asker?.avatar_url ? (
              <img
                src={question.asker.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-gray-400" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{getAskerName()}</span>
                {question.is_anonymous && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">익명</span>
                )}
              </div>
              {getStatusBadge()}
            </div>

            {/* Question Content */}
            <p className="text-gray-700 mb-3 whitespace-pre-wrap line-clamp-3">
              {question.content}
            </p>

            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatRelativeTime(question.created_at)}
              </span>
              {question.is_paid && (
                <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">
                  <Banknote className="w-3 h-3" />
                  {formatCurrency(question.price)}
                </span>
              )}
              {!question.is_public && (
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">비공개</span>
              )}
            </div>
          </div>
        </div>

        {/* Answer preview */}
        {isAnswered && question.answers?.[0] && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-sm text-gray-600 mb-1 font-medium">내 답변</p>
              <p className="text-gray-700 text-sm line-clamp-2">
                {question.answers[0].content}
              </p>
            </div>
          </div>
        )}

        {/* Actions for pending questions */}
        {showActions && isPending && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <QAActions
              questionId={question.id}
              questionContent={question.content}
              isPaid={question.is_paid}
              paymentStatus={question.payment_status}
              price={question.price}
              buyerNote={question.qa_payments?.[0]?.buyer_note || ''}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Empty State
function EmptyState({ type }: { type: 'pending' | 'answered' | 'rejected' }) {
  const messages = {
    pending: {
      icon: MessageCircle,
      title: '대기 중인 질문이 없어요',
      description: '팬들이 질문을 보내면 여기에 표시됩니다.',
    },
    answered: {
      icon: CheckCircle,
      title: '답변한 질문이 없어요',
      description: '답변한 질문 내역이 여기에 표시됩니다.',
    },
    rejected: {
      icon: XCircle,
      title: '삭제된 질문이 없어요',
      description: '삭제한 질문 내역이 여기에 표시됩니다.',
    },
  };

  const message = messages[type];
  const Icon = message.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-gray-300" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{message.title}</h3>
      <p className="text-sm text-gray-500">{message.description}</p>
    </div>
  );
}

// Filter Tab
function FilterTab({
  label,
  count,
  active,
  href,
  color,
}: {
  label: string;
  count: number;
  active?: boolean;
  href: string;
  color?: 'amber' | 'green' | 'red';
}) {
  const colorClasses = {
    amber: active ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
    green: active ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100',
    red: active ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100',
  };

  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
        color ? colorClasses[color] : (active ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200')
      }`}
    >
      {label} <span className="opacity-70">{count}</span>
    </Link>
  );
}

async function QAContent({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/dashboard/qa');
  }

  // Check if user is a creator
  const { data: creatorCheck } = await supabase
    .from('creator_settings')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!creatorCheck) {
    redirect('/dashboard');
  }

  const { pending, answered, rejected } = await getQuestions(user.id);
  const filter = (searchParams?.filter as string) || 'pending';

  const getQuestionsToShow = () => {
    switch (filter) {
      case 'answered':
        return answered;
      case 'rejected':
        return rejected;
      default:
        return pending;
    }
  };

  const questionsToShow = getQuestionsToShow();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Q&A 관리</h1>
            </div>
          </div>
          {pending.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {pending.length}건 대기 중
            </span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Info Banner */}
        {pending.length > 0 && filter === 'pending' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                {pending.length}개의 질문이 답변을 기다리고 있어요
              </p>
              <p className="text-xs text-amber-600 mt-1">
                팬들의 질문에 답변해서 소통해보세요!
              </p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          <FilterTab
            label="대기 중"
            count={pending.length}
            active={filter === 'pending'}
            href="/dashboard/qa"
            color="amber"
          />
          <FilterTab
            label="답변완료"
            count={answered.length}
            active={filter === 'answered'}
            href="/dashboard/qa?filter=answered"
            color="green"
          />
          <FilterTab
            label="삭제됨"
            count={rejected.length}
            active={filter === 'rejected'}
            href="/dashboard/qa?filter=rejected"
            color="red"
          />
        </div>

        {/* Question List */}
        {questionsToShow.length > 0 ? (
          <div className="space-y-3">
            {questionsToShow.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                showActions={filter === 'pending'}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl">
            <EmptyState type={filter as 'pending' | 'answered' | 'rejected'} />
          </div>
        )}
      </main>
    </div>
  );
}

export default function QAPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return (
    <Suspense fallback={<LoadingSection fullHeight />}>
      <QAContent searchParams={searchParams} />
    </Suspense>
  );
}

export const metadata = {
  title: 'Q&A 관리 - 스터플',
  description: '팬들의 질문에 답변하세요.',
};
