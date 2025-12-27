'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MessageCircle,
  Users,
  Heart,
  Reply,
  MoreVertical,
  Flag,
  Trash2,
  Pin,
  Search,
  Filter,
  ChevronDown,
  Send,
  Image as ImageIcon,
  Smile,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  ThumbsUp,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatRelativeTime, cn } from '@/lib/utils';
import { Button, Card, CardContent, Badge, Input } from '@/components/ui';

// Filter Options
const FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'comments', label: '댓글' },
  { value: 'questions', label: '질문' },
  { value: 'reported', label: '신고됨' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
  { value: 'popular', label: '인기순' },
];

// Mock Data for comments/questions
interface CommunityItem {
  id: string;
  type: 'comment' | 'question';
  user: {
    id: string;
    name: string;
    avatar_url?: string;
    is_subscriber: boolean;
    tier_name?: string;
  };
  content: string;
  content_id?: string;
  content_title?: string;
  likes: number;
  replies: number;
  is_pinned: boolean;
  is_reported: boolean;
  is_replied: boolean;
  created_at: string;
}

const mockCommunityData: CommunityItem[] = [
  {
    id: '1',
    type: 'comment',
    user: {
      id: 'u1',
      name: '열정팬',
      is_subscriber: true,
      tier_name: '프리미엄',
    },
    content: '이 영상 정말 도움이 많이 됐어요! 다음 영상도 기대됩니다 :)',
    content_id: 'c1',
    content_title: '효과적인 학습 방법 10가지',
    likes: 15,
    replies: 2,
    is_pinned: false,
    is_reported: false,
    is_replied: true,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '2',
    type: 'question',
    user: {
      id: 'u2',
      name: '학습자123',
      is_subscriber: true,
      tier_name: '베이직',
    },
    content: '혹시 다음 라이브 일정이 어떻게 되나요? 꼭 참석하고 싶어요!',
    likes: 8,
    replies: 0,
    is_pinned: false,
    is_reported: false,
    is_replied: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '3',
    type: 'comment',
    user: {
      id: 'u3',
      name: '신규유저',
      is_subscriber: false,
    },
    content: '처음 왔는데 콘텐츠 퀄리티가 대박이네요. 구독할게요!',
    content_id: 'c2',
    content_title: '입문자를 위한 가이드',
    likes: 5,
    replies: 1,
    is_pinned: false,
    is_reported: false,
    is_replied: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: '4',
    type: 'comment',
    user: {
      id: 'u4',
      name: '악성유저',
      is_subscriber: false,
    },
    content: '부적절한 댓글 예시입니다.',
    content_id: 'c1',
    content_title: '효과적인 학습 방법 10가지',
    likes: 0,
    replies: 0,
    is_pinned: false,
    is_reported: true,
    is_replied: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

export default function CommunityPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<CommunityItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<CommunityItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [stats, setStats] = useState({
    totalComments: 0,
    pendingReplies: 0,
    reportedItems: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAndSort();
  }, [items, searchQuery, filter, sortBy]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // In production, fetch from Supabase
      await new Promise((resolve) => setTimeout(resolve, 500));
      setItems(mockCommunityData);

      setStats({
        totalComments: mockCommunityData.length,
        pendingReplies: mockCommunityData.filter((i) => !i.is_replied && i.type === 'question').length,
        reportedItems: mockCommunityData.filter((i) => i.is_reported).length,
      });
    } catch (error) {
      console.error('Failed to load community data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSort = () => {
    let filtered = [...items];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.content.toLowerCase().includes(query) ||
          i.user.name.toLowerCase().includes(query)
      );
    }

    // Filter
    if (filter === 'comments') {
      filtered = filtered.filter((i) => i.type === 'comment');
    } else if (filter === 'questions') {
      filtered = filtered.filter((i) => i.type === 'question');
    } else if (filter === 'reported') {
      filtered = filtered.filter((i) => i.is_reported);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'popular':
          return b.likes - a.likes;
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredItems(filtered);
  };

  const handleReply = async (itemId: string) => {
    if (!replyText.trim()) return;

    // In production, save reply to database
    console.log('Replying to:', itemId, 'with:', replyText);

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, is_replied: true, replies: item.replies + 1 } : item
      )
    );
    setReplyingTo(null);
    setReplyText('');
  };

  const handlePin = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, is_pinned: !item.is_pinned } : item
      )
    );
  };

  const handleDelete = (itemId: string) => {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  const handleDismissReport = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, is_reported: false } : item
      )
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">커뮤니티</h1>
                <p className="text-gray-500 text-sm mt-1">댓글과 질문을 관리하세요</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <MessageCircle className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalComments}</p>
              <p className="text-sm text-gray-500">전체 댓글</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.pendingReplies}</p>
              <p className="text-sm text-gray-500">답변 대기</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Flag className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.reportedItems}</p>
              <p className="text-sm text-gray-500">신고됨</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="댓글 검색..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {FILTER_OPTIONS.find((f) => f.value === filter)?.label}
                  <ChevronDown className="w-4 h-4" />
                </Button>
                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10">
                    {FILTER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilter(option.value);
                          setShowFilterDropdown(false);
                        }}
                        className={cn(
                          'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                          filter === option.value ? 'text-gray-900 font-medium' : 'text-gray-700'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Community Items */}
        {filteredItems.length > 0 ? (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className={cn(
                  'border-0 shadow-sm',
                  item.is_reported && 'border-2 border-red-200 bg-red-50',
                  item.is_pinned && 'border-2 border-orange-200'
                )}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {item.user.avatar_url ? (
                          <img
                            src={item.user.avatar_url}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{item.user.name}</span>
                          {item.user.is_subscriber && (
                            <Badge variant="secondary" size="sm" className="bg-gray-100 text-gray-700">
                              {item.user.tier_name || '구독자'}
                            </Badge>
                          )}
                          {item.is_pinned && (
                            <Badge variant="secondary" size="sm" className="bg-yellow-100 text-yellow-700">
                              <Pin className="w-3 h-3 mr-1" />
                              고정됨
                            </Badge>
                          )}
                          {item.is_reported && (
                            <Badge variant="secondary" size="sm" className="bg-red-100 text-red-700">
                              <Flag className="w-3 h-3 mr-1" />
                              신고됨
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(item.created_at)}
                          {item.content_title && (
                            <>
                              <span className="mx-1">·</span>
                              <Link
                                href={`/content/${item.content_id}`}
                                className="text-gray-900 hover:underline"
                              >
                                {item.content_title}
                              </Link>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2"
                        onClick={() => handlePin(item.id)}
                      >
                        <Pin className={cn('w-4 h-4', item.is_pinned ? 'text-yellow-500' : 'text-gray-400')} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-gray-700 mb-3">{item.content}</p>

                  {/* Reported Warning */}
                  {item.is_reported && (
                    <div className="mb-3 p-3 bg-red-100 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-red-700">
                        <AlertCircle className="w-4 h-4" />
                        이 댓글이 신고되었습니다
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300"
                        onClick={() => handleDismissReport(item.id)}
                      >
                        무시하기
                      </Button>
                    </div>
                  )}

                  {/* Stats & Reply */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {item.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Reply className="w-4 h-4" />
                        {item.replies}
                      </span>
                      {item.is_replied && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          답변 완료
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(replyingTo === item.id ? null : item.id)}
                    >
                      <Reply className="w-4 h-4 mr-1" />
                      답변하기
                    </Button>
                  </div>

                  {/* Reply Input */}
                  {replyingTo === item.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="답변을 입력하세요..."
                          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleReply(item.id);
                            }
                          }}
                        />
                        <Button onClick={() => handleReply(item.id)} disabled={!replyText.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                {searchQuery || filter !== 'all' ? '검색 결과가 없습니다' : '아직 댓글이 없습니다'}
              </h3>
              <p className="text-gray-500">
                {searchQuery || filter !== 'all'
                  ? '다른 검색어나 필터를 시도해보세요'
                  : '팬들의 댓글이 여기에 표시됩니다'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
