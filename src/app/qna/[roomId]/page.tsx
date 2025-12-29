'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowLeft,
  MessageSquare,
  Send,
  ThumbsUp,
  CheckCircle2,
  MoreVertical,
  Users,
  Clock,
  Tag,
  Plus,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatNumber } from '@/lib/utils';
import { Button, Badge, Avatar, Card, CardContent, Spinner, LoadingInline } from '@/components/ui';

interface Question {
  id: string;
  content: string;
  author: {
    id: string;
    display_name: string;
    profile_image_url?: string;
  };
  created_at: string;
  is_answered: boolean;
  upvotes: number;
  answers: Answer[];
}

interface Answer {
  id: string;
  content: string;
  author: {
    id: string;
    display_name: string;
    profile_image_url?: string;
    is_creator?: boolean;
  };
  created_at: string;
  is_accepted: boolean;
  upvotes: number;
}

interface QnARoom {
  id: string;
  title: string;
  description?: string;
  subject: string;
  creator: {
    id: string;
    display_name: string;
    profile_image_url?: string;
  };
  participant_count: number;
  is_active: boolean;
  tags?: string[];
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

function QuestionCard({
  question,
  onAnswer,
}: {
  question: Question;
  onAnswer: (questionId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div variants={itemVariants}>
      <Card className="border-gray-100 hover:border-gray-200 transition-colors">
        <CardContent className="p-4">
          {/* Question */}
          <div className="flex gap-3">
            <Avatar
              src={question.author.profile_image_url}
              alt={question.author.display_name}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900 text-sm">
                  {question.author.display_name}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(question.created_at)}
                </span>
                {question.is_answered && (
                  <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                    답변완료
                  </Badge>
                )}
              </div>
              <p className="text-gray-900 whitespace-pre-wrap">{question.content}</p>

              {/* Question Actions */}
              <div className="flex items-center gap-4 mt-3">
                <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{question.upvotes}</span>
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>답변 {question.answers.length}개</span>
                </button>
                <button
                  onClick={() => onAnswer(question.id)}
                  className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  답변하기
                </button>
              </div>
            </div>
          </div>

          {/* Answers */}
          <AnimatePresence>
            {isExpanded && question.answers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 ml-10 space-y-3 border-l-2 border-gray-100 pl-4"
              >
                {question.answers.map((answer) => (
                  <div key={answer.id} className="flex gap-3">
                    <Avatar
                      src={answer.author.profile_image_url}
                      alt={answer.author.display_name}
                      size="xs"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">
                          {answer.author.display_name}
                        </span>
                        {answer.author.is_creator && (
                          <Badge className="bg-orange-100 text-orange-600 border-0 text-xs">
                            크리에이터
                          </Badge>
                        )}
                        {answer.is_accepted && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                        <span className="text-xs text-gray-400">
                          {formatDate(answer.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">
                        {answer.content}
                      </p>
                      <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 transition-colors mt-2">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{answer.upvotes}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function QnARoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<QnARoom | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRoom();
  }, [roomId]);

  const loadRoom = async () => {
    try {
      const supabase = createClient();

      // Try to load room
      const { data: roomData, error: roomError } = await supabase
        .from('qna_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) {
        // Mock data
        setRoom({
          id: roomId,
          title: '수능 수학 킬러문항 Q&A',
          description: '어려운 수학 문제 함께 풀어봐요! 기출문제 중심으로 진행합니다.',
          subject: '수학',
          creator: {
            id: 'c1',
            display_name: '수학왕',
          },
          participant_count: 156,
          is_active: true,
          tags: ['수능', '킬러문항', '미적분'],
        });

        setQuestions([
          {
            id: 'q1',
            content: '치환적분에서 범위를 바꿀 때 항상 헷갈리는데 어떻게 하면 되나요?',
            author: {
              id: 'u1',
              display_name: '고3수험생',
            },
            created_at: new Date(Date.now() - 3600000).toISOString(),
            is_answered: true,
            upvotes: 12,
            answers: [
              {
                id: 'a1',
                content: '치환한 변수로 범위를 바꿔주시면 돼요! 예를 들어 x=2일 때 t=f(2)가 되니까 t의 범위로 바꿔주세요.',
                author: {
                  id: 'c1',
                  display_name: '수학왕',
                  is_creator: true,
                },
                created_at: new Date(Date.now() - 3000000).toISOString(),
                is_accepted: true,
                upvotes: 8,
              },
            ],
          },
          {
            id: 'q2',
            content: '로피탈 정리 언제 쓰면 되나요? 0/0 형태만 되나요?',
            author: {
              id: 'u2',
              display_name: '수학초보',
            },
            created_at: new Date(Date.now() - 7200000).toISOString(),
            is_answered: true,
            upvotes: 8,
            answers: [
              {
                id: 'a2',
                content: '0/0 또는 ∞/∞ 형태일 때 사용 가능해요! 다른 부정형은 0/0 또는 ∞/∞ 형태로 변환해서 사용하면 됩니다.',
                author: {
                  id: 'c1',
                  display_name: '수학왕',
                  is_creator: true,
                },
                created_at: new Date(Date.now() - 6000000).toISOString(),
                is_accepted: true,
                upvotes: 5,
              },
              {
                id: 'a3',
                content: '저도 궁금했는데 설명 감사해요!',
                author: {
                  id: 'u3',
                  display_name: '익명학생',
                },
                created_at: new Date(Date.now() - 5500000).toISOString(),
                is_accepted: false,
                upvotes: 1,
              },
            ],
          },
          {
            id: 'q3',
            content: '급수의 수렴 판정법 중에 가장 자주 쓰이는 게 뭔가요?',
            author: {
              id: 'u4',
              display_name: '재수생',
            },
            created_at: new Date(Date.now() - 86400000).toISOString(),
            is_answered: false,
            upvotes: 5,
            answers: [],
          },
        ]);

        setIsLoading(false);
        return;
      }

      setRoom(roomData);

      // Load questions
      const { data: questionsData } = await supabase
        .from('qna_questions')
        .select(`
          *,
          author:profiles(id, nickname, avatar_url),
          qna_answers(
            *,
            author:profiles(id, nickname, avatar_url)
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });

      setQuestions(questionsData || []);
    } catch (error) {
      console.error('Failed to load room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Add question (mock for now)
      const newQ: Question = {
        id: `temp-${Date.now()}`,
        content: newQuestion.trim(),
        author: {
          id: user.id,
          display_name: '나',
        },
        created_at: new Date().toISOString(),
        is_answered: false,
        upvotes: 0,
        answers: [],
      };

      setQuestions(prev => [newQ, ...prev]);
      setNewQuestion('');
    } catch (error) {
      console.error('Failed to submit question:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswer = (questionId: string) => {
    // Open answer modal or inline answer input
    console.log('Answer to:', questionId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Q&A 방을 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50"
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
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/qna" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="outline"
                  className={`text-xs ${room.is_active ? 'border-green-500 text-green-600' : 'border-gray-300 text-gray-500'}`}
                >
                  {room.is_active ? '진행중' : '종료'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {room.subject}
                </Badge>
              </div>
              <h1 className="text-lg font-bold text-gray-900 truncate">{room.title}</h1>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Room Info */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Avatar
                src={room.creator.profile_image_url}
                alt={room.creator.display_name}
                size="xs"
              />
              <span>{room.creator.display_name}</span>
            </div>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {formatNumber(room.participant_count)}
            </span>
          </div>

          {/* Tags */}
          {room.tags && room.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {room.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md text-xs text-gray-600"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Question Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border-gray-100">
            <CardContent className="p-4">
              <textarea
                placeholder="질문을 입력하세요..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                rows={3}
                className="w-full px-0 py-0 text-gray-900 placeholder-gray-500 focus:outline-none resize-none"
              />
              <div className="flex justify-end mt-3">
                <Button
                  onClick={handleSubmitQuestion}
                  disabled={!newQuestion.trim() || isSubmitting}
                  size="sm"
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <LoadingInline />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  질문하기
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Questions List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onAnswer={handleAnswer}
            />
          ))}
        </motion.div>

        {questions.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">아직 질문이 없습니다</p>
            <p className="text-sm text-gray-400">첫 번째 질문을 해보세요!</p>
          </div>
        )}
      </main>
    </motion.div>
  );
}
