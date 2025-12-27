'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MessageCircle,
  Search,
  MoreVertical,
  Check,
  CheckCheck,
  Edit,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { Avatar, Badge, Card, CardContent } from '@/components/ui';

interface Conversation {
  id: string;
  participant: {
    id: string;
    display_name: string;
    profile_image_url?: string;
    is_online?: boolean;
  };
  last_message?: {
    content: string;
    created_at: string;
    is_read: boolean;
    sender_id: string;
  };
  unread_count: number;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

function ConversationItem({ conversation, currentUserId }: { conversation: Conversation; currentUserId: string }) {
  const isOwnMessage = conversation.last_message?.sender_id === currentUserId;

  return (
    <motion.div variants={itemVariants}>
      <Link href={`/messages/${conversation.id}`}>
        <Card className="hover:bg-gray-50 transition-colors border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Avatar with online indicator */}
              <div className="relative flex-shrink-0">
                <Avatar
                  src={conversation.participant.profile_image_url}
                  alt={conversation.participant.display_name}
                  size="lg"
                />
                {conversation.participant.is_online && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {conversation.participant.display_name}
                  </h3>
                  {conversation.last_message && (
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatDate(conversation.last_message.created_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {conversation.last_message && (
                    <>
                      {isOwnMessage && (
                        conversation.last_message.is_read ? (
                          <CheckCheck className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        ) : (
                          <Check className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )
                      )}
                      <p className={`text-sm truncate ${
                        !isOwnMessage && conversation.unread_count > 0
                          ? 'text-gray-900 font-medium'
                          : 'text-gray-500'
                      }`}>
                        {conversation.last_message.content}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Unread badge */}
              {conversation.unread_count > 0 && (
                <Badge className="bg-orange-500 text-white border-0 min-w-[22px] h-[22px] rounded-full px-1.5">
                  {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                </Badge>
              )}
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
        <MessageCircle className="w-10 h-10 text-orange-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        메시지가 없습니다
      </h3>
      <p className="text-gray-500 max-w-sm mx-auto">
        크리에이터나 다른 사용자와 대화를 시작해보세요
      </p>
    </motion.div>
  );
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;
      setCurrentUserId(user.id);

      // Load conversations from dm_conversations table
      const { data, error } = await supabase
        .from('dm_conversations')
        .select(`
          id,
          participant1_id,
          participant2_id,
          last_message_at,
          dm_messages(
            content,
            created_at,
            is_read,
            sender_id
          )
        `)
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Failed to load conversations:', error);
        // Mock data for demo
        setConversations([
          {
            id: '1',
            participant: {
              id: 'user1',
              display_name: '수학왕 김철수',
              is_online: true,
            },
            last_message: {
              content: '안녕하세요! 질문 있으시면 편하게 물어보세요~',
              created_at: new Date().toISOString(),
              is_read: true,
              sender_id: 'user1',
            },
            unread_count: 0,
          },
          {
            id: '2',
            participant: {
              id: 'user2',
              display_name: '영어천재 박영희',
              is_online: false,
            },
            last_message: {
              content: '네, 그 문법 설명 영상 올려드릴게요!',
              created_at: new Date(Date.now() - 3600000).toISOString(),
              is_read: false,
              sender_id: user.id,
            },
            unread_count: 0,
          },
          {
            id: '3',
            participant: {
              id: 'user3',
              display_name: '코딩마스터',
              is_online: true,
            },
            last_message: {
              content: '새로운 파이썬 강의 업로드했어요!',
              created_at: new Date(Date.now() - 86400000).toISOString(),
              is_read: false,
              sender_id: 'user3',
            },
            unread_count: 3,
          },
        ]);
        return;
      }

      // Transform data
      const transformedConversations = await Promise.all(
        (data || []).map(async (conv: any) => {
          const participantId = conv.participant1_id === user.id
            ? conv.participant2_id
            : conv.participant1_id;

          // Get participant info
          const { data: participantData } = await supabase
            .from('profiles')
            .select('id, nickname, avatar_url')
            .eq('id', participantId)
            .single();

          const lastMessage = conv.dm_messages?.[0];
          const unreadCount = conv.dm_messages?.filter(
            (m: any) => m.sender_id !== user.id && !m.is_read
          ).length || 0;

          return {
            id: conv.id,
            participant: {
              id: participantId,
              display_name: participantData?.nickname || 'Unknown',
              profile_image_url: participantData?.avatar_url,
              is_online: false,
            },
            last_message: lastMessage ? {
              content: lastMessage.content,
              created_at: lastMessage.created_at,
              is_read: lastMessage.is_read,
              sender_id: lastMessage.sender_id,
            } : undefined,
            unread_count: unreadCount,
          };
        })
      );

      setConversations(transformedConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.participant.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((acc, conv) => acc + conv.unread_count, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-100 sticky top-0 z-20"
      >
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">메시지</h1>
                  {totalUnread > 0 && (
                    <p className="text-sm text-orange-500">{totalUnread}개의 새 메시지</p>
                  )}
                </div>
              </div>
            </div>

            {/* New message button */}
            <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <Edit className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="대화 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:bg-white transition-all"
            />
          </div>
        </div>
      </motion.header>

      <main className="max-w-2xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="divide-y divide-gray-100"
          >
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                currentUserId={currentUserId}
              />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
