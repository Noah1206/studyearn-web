'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowLeft,
  MessageCircle,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
  User,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Button, Card, CardContent, Badge, Tabs, TabsList, TabsTrigger, Spinner } from '@/components/ui';

interface Question {
  id: string;
  content: string;
  is_anonymous: boolean;
  is_public: boolean;
  status: 'pending' | 'answered' | 'rejected' | 'expired';
  created_at: string;
  answered_at: string | null;
  creator: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  answers: {
    id: string;
    content: string;
    created_at: string;
  }[];
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

function getStatusBadge(status: Question['status']) {
  switch (status) {
    case 'answered':
      return <Badge className="flex-shrink-0 bg-green-100 text-green-700 border-0">답변완료</Badge>;
    case 'pending':
      return <Badge className="flex-shrink-0 bg-amber-100 text-amber-700 border-0">대기중</Badge>;
    case 'rejected':
      return <Badge className="flex-shrink-0 bg-red-100 text-red-700 border-0">삭제됨</Badge>;
    case 'expired':
      return <Badge className="flex-shrink-0 bg-gray-100 text-gray-700 border-0">만료됨</Badge>;
    default:
      return <Badge className="flex-shrink-0 bg-gray-100 text-gray-700 border-0">{status}</Badge>;
  }
}

function QuestionCard({ question }: { question: Question }) {
  const isAnswered = question.status === 'answered';
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <motion.div variants={itemVariants}>
      <Card className="overflow-hidden hover:shadow-md transition-all duration-300 border-gray-100">
        <CardContent className="p-0">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                {/* Creator Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {question.creator?.avatar_url ? (
                    <img
                      src={question.creator.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {question.creator?.display_name || '크리에이터'}
                  </p>
                  <p className="text-xs text-gray-500">에게 질문</p>
                </div>
              </div>
              {getStatusBadge(question.status)}
            </div>

            {/* Question Content */}
            <div className="bg-gray-50 rounded-xl p-3 mb-3">
              <p className="text-sm text-gray-500 mb-1">내 질문</p>
              <p className="text-gray-700 whitespace-pre-wrap line-clamp-3">
                {question.content}
              </p>
            </div>

            {/* Answer Preview */}
            {isAnswered && question.answers?.[0] && (
              <div className="bg-green-50 rounded-xl p-3 mb-3">
                <p className="text-sm text-green-600 mb-1 font-medium">답변</p>
                <p className={`text-gray-700 ${!showAnswer ? 'line-clamp-2' : ''}`}>
                  {question.answers[0].content}
                </p>
                {question.answers[0].content.length > 100 && (
                  <button
                    onClick={() => setShowAnswer(!showAnswer)}
                    className="text-green-600 text-sm mt-1 hover:underline"
                  >
                    {showAnswer ? '접기' : '더보기'}
                  </button>
                )}
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(question.created_at)}
              </span>
              {question.is_anonymous && (
                <Badge variant="outline" className="text-xs">익명 질문</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <MessageCircle className="w-10 h-10 text-orange-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        질문 내역이 없습니다
      </h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        좋아하는 크리에이터에게 질문을 보내보세요
      </p>
      <Link href="/content">
        <Button className="gap-2">
          크리에이터 둘러보기
          <ChevronRight className="w-4 h-4" />
        </Button>
      </Link>
    </motion.div>
  );
}

export default function MyQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState({ total: 0, answered: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const response = await fetch('/api/me/questions');
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      const data = await response.json();
      setQuestions(data.questions || []);
      setStats(data.stats || { total: 0, answered: 0, pending: 0 });
    } catch (error) {
      console.error('Failed to load questions:', error);
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredQuestions = questions.filter((question) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'answered') return question.status === 'answered';
    if (activeTab === 'pending') return question.status === 'pending';
    return true;
  });

  return (
    <motion.div
      className="min-h-screen bg-white"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-100 sticky top-0 z-20"
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">내 질문</h1>
                <p className="text-sm text-gray-500">{stats.total}개의 질문</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <Card className="border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">답변 받음</p>
                  <p className="text-xl font-bold text-gray-900">{stats.answered}개</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">대기 중</p>
                  <p className="text-xl font-bold text-gray-900">{stats.pending}개</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="w-full bg-gray-100 p-1 rounded-xl">
              <TabsTrigger value="all" className="flex-1 rounded-lg">
                전체 ({questions.length})
              </TabsTrigger>
              <TabsTrigger value="answered" className="flex-1 rounded-lg">
                답변완료 ({stats.answered})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex-1 rounded-lg">
                대기중 ({stats.pending})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Questions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <Spinner size="lg" />
              <span className="text-sm text-gray-500">질문 내역을 불러오는 중...</span>
            </motion.div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {filteredQuestions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
          </motion.div>
        )}
      </main>
    </motion.div>
  );
}
