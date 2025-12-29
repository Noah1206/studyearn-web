'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Check,
  CheckCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar, Badge, Spinner, LoadingInline } from '@/components/ui';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

interface Participant {
  id: string;
  display_name: string;
  profile_image_url?: string;
  is_online?: boolean;
}

// Animation variants
const messageVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

function MessageBubble({
  message,
  isOwn,
  showAvatar,
  participant,
}: {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  participant?: Participant;
}) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar (only for received messages) */}
      {!isOwn && (
        <div className="w-8 flex-shrink-0">
          {showAvatar && (
            <Avatar
              src={participant?.profile_image_url}
              alt={participant?.display_name || ''}
              size="sm"
            />
          )}
        </div>
      )}

      {/* Message bubble */}
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isOwn
              ? 'bg-orange-500 text-white rounded-br-md'
              : 'bg-white text-gray-900 rounded-bl-md border border-gray-100'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-400">{formatTime(message.created_at)}</span>
          {isOwn && (
            message.is_read ? (
              <CheckCheck className="w-3.5 h-3.5 text-orange-500" />
            ) : (
              <Check className="w-3.5 h-3.5 text-gray-400" />
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!currentUserId || !conversationId) return;

    const supabase = createClient();

    // Subscribe to new messages in this conversation
    const channel = supabase
      .channel(`dm_messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dm_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;

          // Only add if it's from the other user (our own messages are added optimistically)
          if (newMessage.sender_id !== currentUserId) {
            setMessages(prev => {
              // Check if message already exists
              if (prev.some(m => m.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });

            // Mark as read immediately since we're viewing this conversation
            supabase
              .from('dm_messages')
              .update({ is_read: true })
              .eq('id', newMessage.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dm_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages(prev =>
            prev.map(m => m.id === updatedMessage.id ? updatedMessage : m)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUserId(user.id);

      // Load conversation details
      const { data: convData, error: convError } = await supabase
        .from('dm_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) {
        // Mock data for demo
        setParticipant({
          id: 'user1',
          display_name: '수학왕 김철수',
          is_online: true,
        });
        setMessages([
          {
            id: '1',
            content: '안녕하세요! 혹시 수학 질문 있으시면 물어봐 주세요~',
            sender_id: 'user1',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            is_read: true,
          },
          {
            id: '2',
            content: '네! 미적분 부분에서 궁금한 게 있어요',
            sender_id: user.id,
            created_at: new Date(Date.now() - 3500000).toISOString(),
            is_read: true,
          },
          {
            id: '3',
            content: '어떤 부분이 헷갈리시나요?',
            sender_id: 'user1',
            created_at: new Date(Date.now() - 3400000).toISOString(),
            is_read: true,
          },
          {
            id: '4',
            content: '치환적분이랑 부분적분 언제 쓰는지 구분이 안 돼요 ㅠㅠ',
            sender_id: user.id,
            created_at: new Date(Date.now() - 3300000).toISOString(),
            is_read: true,
          },
          {
            id: '5',
            content: '아 그 부분 많이 헷갈려하시더라구요! 간단하게 설명드릴게요.\n\n치환적분은 합성함수 형태일 때 사용하고, 부분적분은 두 함수의 곱 형태일 때 사용해요.',
            sender_id: 'user1',
            created_at: new Date(Date.now() - 60000).toISOString(),
            is_read: true,
          },
        ]);
        setIsLoading(false);
        return;
      }

      // Get participant info
      const participantId = convData.participant1_id === user.id
        ? convData.participant2_id
        : convData.participant1_id;

      const { data: participantData } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .eq('id', participantId)
        .single();

      setParticipant({
        id: participantId,
        display_name: participantData?.nickname || 'Unknown',
        profile_image_url: participantData?.avatar_url,
        is_online: false,
      });

      // Load messages
      const { data: messagesData } = await supabase
        .from('dm_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      setMessages(messagesData || []);

      // Mark messages as read
      await supabase
        .from('dm_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);

    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const supabase = createClient();

      // Optimistic update
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        content: messageContent,
        sender_id: currentUserId,
        created_at: new Date().toISOString(),
        is_read: false,
      };
      setMessages(prev => [...prev, tempMessage]);

      // Send to database
      const { data, error } = await supabase
        .from('dm_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: messageContent,
        })
        .select()
        .single();

      if (error) throw error;

      // Update with real message
      setMessages(prev =>
        prev.map(m => m.id === tempMessage.id ? data : m)
      );

      // Update conversation last_message_at
      await supabase
        .from('dm_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

    } catch (error) {
      console.error('Failed to send message:', error);
      // Revert optimistic update on error
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: Record<string, Message[]>, message) => {
    const date = new Date(message.created_at).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50 flex flex-col"
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
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/messages" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar
                    src={participant?.profile_image_url}
                    alt={participant?.display_name || ''}
                    size="md"
                  />
                  {participant?.is_online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900">{participant?.display_name}</h1>
                  <p className="text-xs text-gray-500">
                    {participant?.is_online ? '온라인' : '오프라인'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <Phone className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <Video className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
                  {date}
                </span>
              </div>

              {/* Messages for this date */}
              <div className="space-y-3">
                {dateMessages.map((message, index) => {
                  const isOwn = message.sender_id === currentUserId;
                  const showAvatar =
                    !isOwn &&
                    (index === 0 || dateMessages[index - 1].sender_id !== message.sender_id);

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      participant={participant || undefined}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-t border-gray-100 sticky bottom-0"
      >
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ImageIcon className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <Smile className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="메시지를 입력하세요..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-2.5 bg-gray-100 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:bg-white transition-all"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending}
              className={`p-3 rounded-full transition-colors ${
                newMessage.trim()
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {isSending ? (
                <LoadingInline />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.footer>
    </motion.div>
  );
}
