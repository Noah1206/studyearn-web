'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MessageSquare,
  Search,
  Plus,
  Users,
  Clock,
  CheckCircle2,
  Filter,
  Loader2,
  ChevronRight,
  Tag,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatNumber } from '@/lib/utils';
import { Button, Badge, Avatar, Card, CardContent, Tabs, TabsList, TabsTrigger } from '@/components/ui';

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
  question_count: number;
  answered_count: number;
  is_active: boolean;
  created_at: string;
  tags?: string[];
}

const SUBJECTS = [
  { id: 'all', label: '전체', emoji: '📚' },
  { id: 'korean', label: '국어', emoji: '📖' },
  { id: 'english', label: '영어', emoji: '🌍' },
  { id: 'math', label: '수학', emoji: '🔢' },
  { id: 'science', label: '과학', emoji: '🔬' },
  { id: 'social', label: '사회', emoji: '🗺️' },
  { id: 'coding', label: '코딩', emoji: '💻' },
];

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

function QnARoomCard({ room }: { room: QnARoom }) {
  const answerRate = room.question_count > 0
    ? Math.round((room.answered_count / room.question_count) * 100)
    : 0;

  return (
    <motion.div variants={itemVariants}>
      <Link href={`/qna/${room.id}`}>
        <Card className="hover:shadow-md transition-all duration-300 border-gray-100 hover:border-orange-200">
          <CardContent className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
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
                <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-orange-500 transition-colors">
                  {room.title}
                </h3>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
            </div>

            {/* Description */}
            {room.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {room.description}
              </p>
            )}

            {/* Tags */}
            {room.tags && room.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {room.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md text-xs text-gray-600"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
                {room.tags.length > 3 && (
                  <span className="text-xs text-gray-400">+{room.tags.length - 3}</span>
                )}
              </div>
            )}

            {/* Creator */}
            <div className="flex items-center gap-2 mb-4">
              <Avatar
                src={room.creator.profile_image_url}
                alt={room.creator.display_name}
                size="xs"
              />
              <span className="text-sm text-gray-600">{room.creator.display_name}</span>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {formatNumber(room.participant_count)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {formatNumber(room.question_count)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">
                  답변률 {answerRate}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
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
        <MessageSquare className="w-10 h-10 text-orange-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Q&A 방이 없습니다
      </h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        새로운 Q&A 방을 만들어 질문을 시작해보세요
      </p>
      <Button className="gap-2">
        <Plus className="w-4 h-4" />
        Q&A 방 만들기
      </Button>
    </motion.div>
  );
}

export default function QnAPage() {
  const [rooms, setRooms] = useState<QnARoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active');

  useEffect(() => {
    loadRooms();
  }, [selectedSubject]);

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      // Try to load from qna_rooms table
      const { data, error } = await supabase
        .from('qna_rooms')
        .select(`
          *,
          creator:profiles(id, nickname, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load Q&A rooms:', error);
        // Mock data for demo
        setRooms([
          {
            id: '1',
            title: '수능 수학 킬러문항 Q&A',
            description: '어려운 수학 문제 함께 풀어봐요! 기출문제 중심으로 진행합니다.',
            subject: '수학',
            creator: {
              id: 'c1',
              display_name: '수학왕',
            },
            participant_count: 156,
            question_count: 89,
            answered_count: 82,
            is_active: true,
            created_at: new Date().toISOString(),
            tags: ['수능', '킬러문항', '미적분'],
          },
          {
            id: '2',
            title: '영어 문법 질문방',
            description: '헷갈리는 영어 문법 질문하세요!',
            subject: '영어',
            creator: {
              id: 'c2',
              display_name: '영어마스터',
            },
            participant_count: 234,
            question_count: 145,
            answered_count: 140,
            is_active: true,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            tags: ['문법', '수능영어', '토익'],
          },
          {
            id: '3',
            title: '파이썬 코딩 Q&A',
            description: '파이썬 초보부터 고급까지 모든 질문 환영!',
            subject: '코딩',
            creator: {
              id: 'c3',
              display_name: '코딩천재',
            },
            participant_count: 312,
            question_count: 201,
            answered_count: 195,
            is_active: true,
            created_at: new Date(Date.now() - 172800000).toISOString(),
            tags: ['파이썬', '알고리즘', '자료구조'],
          },
          {
            id: '4',
            title: '한국사 암기법 공유',
            description: '한국사 연대표, 사건 암기 팁 공유합니다',
            subject: '사회',
            creator: {
              id: 'c4',
              display_name: '역사탐험가',
            },
            participant_count: 89,
            question_count: 45,
            answered_count: 38,
            is_active: false,
            created_at: new Date(Date.now() - 604800000).toISOString(),
            tags: ['한국사', '암기법', '수능'],
          },
        ]);
        setIsLoading(false);
        return;
      }

      // Transform data
      const transformedRooms = (data || []).map((room: any) => ({
        ...room,
        creator: {
          id: room.creator?.id,
          display_name: room.creator?.nickname || 'Unknown',
          profile_image_url: room.creator?.avatar_url,
        },
      }));

      setRooms(transformedRooms);
    } catch (error) {
      console.error('Failed to load Q&A rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || room.subject === selectedSubject;
    const matchesTab = activeTab === 'all' || room.is_active;

    return matchesSearch && matchesSubject && matchesTab;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-100 sticky top-0 z-20"
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Q&A</h1>
                  <p className="text-sm text-gray-500">{rooms.length}개의 방</p>
                </div>
              </div>
            </div>

            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              방 만들기
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Q&A 방 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:bg-white transition-all"
            />
          </div>

          {/* Subject Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {SUBJECTS.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
                  selectedSubject === subject.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{subject.emoji}</span>
                <span className="text-sm font-medium">{subject.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'all')} className="mb-6">
          <TabsList className="w-full bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="active" className="flex-1 rounded-lg">
              진행중
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1 rounded-lg">
              전체
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Room List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4 md:grid-cols-2"
          >
            {filteredRooms.map((room) => (
              <QnARoomCard key={room.id} room={room} />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
