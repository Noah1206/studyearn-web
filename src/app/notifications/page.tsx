'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Coins, UserPlus, Heart, MessageCircle, Check } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: {
    content_id?: string;
    question_id?: string;
    profile_id?: string;
    [key: string]: unknown;
  };
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  purchase: <Coins className="w-5 h-5 text-yellow-500" />,
  follow: <UserPlus className="w-5 h-5 text-blue-500" />,
  like: <Heart className="w-5 h-5 text-red-500" />,
  review: <Heart className="w-5 h-5 text-pink-500" />,
  qa_answer: <MessageCircle className="w-5 h-5 text-green-500" />,
  qa_question: <MessageCircle className="w-5 h-5 text-green-500" />,
  system: <Bell className="w-5 h-5 text-gray-500" />,
};

function getIcon(type: string) {
  return TYPE_ICON[type] ?? <Bell className="w-5 h-5 text-gray-400" />;
}

function getLink(n: Notification): string | null {
  const m = n.metadata;
  switch (n.type) {
    case 'purchase':
      return '/my/purchases';
    case 'follow':
      return m?.profile_id ? `/profile/${m.profile_id}` : '/profile';
    case 'qa_answer':
    case 'qa_question':
      return m?.content_id && m?.question_id
        ? `/content/${m.content_id}?qa=${m.question_id}`
        : null;
    case 'like':
    case 'review':
      return m?.content_id ? `/content/${m.content_id}` : null;
    default:
      return null;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=50');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_ids: [id] }),
    });
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClick = async (n: Notification) => {
    if (!n.is_read) {
      markAsRead(n.id);
      setNotifications(prev =>
        prev.map(item => (item.id === n.id ? { ...item, is_read: true } : item))
      );
      setUnreadCount(c => Math.max(0, c - 1));
    }
    const link = getLink(n);
    if (link) router.push(link);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">알림</h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              모두 읽음
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 px-6">
            <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mb-5">
              <Bell className="w-9 h-9 text-orange-300" />
            </div>
            <p className="text-lg font-semibold text-gray-800 mb-1">아직 알림이 없어요</p>
            <p className="text-sm text-gray-400 text-center">새로운 소식이 생기면 여기에 표시됩니다</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map(n => (
              <li
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-gray-50 ${
                  !n.is_read ? 'bg-orange-50/60' : 'bg-white'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">{getIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {n.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-500 mt-2" />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
