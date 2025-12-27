'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Users,
  Plus,
  ChevronRight,
  BookOpen,
  Coffee,
  Moon,
  Sparkles,
  Target,
  Flame,
  Clock,
  X,
} from 'lucide-react';
import { Button, Avatar } from '@/components/ui';
import { cn } from '@/lib/utils';

// 세션 상태 정의 (앱과 동일)
type SessionStatus = 'waiting' | 'studying' | 'break' | 'paused' | 'ended';
type RoomTheme = 'default' | 'cozy' | 'focus' | 'minimal' | 'nature' | 'night';

interface RoomListItem {
  id: string;
  name: string;
  goal: string | null;
  is_public: boolean;
  current_participants: number;
  max_participants: number;
  session_status: SessionStatus;
  theme: RoomTheme;
  created_at: string;
  creator: {
    id: string;
    nickname: string;
    avatar_url?: string;
  };
}

// 테마별 스타일 (앱과 동일)
const THEME_STYLES: Record<RoomTheme, { bg: string; accent: string; icon: React.ElementType; label: string }> = {
  default: { bg: 'bg-gray-50', accent: 'text-gray-600', icon: BookOpen, label: '기본' },
  cozy: { bg: 'bg-amber-50', accent: 'text-amber-600', icon: Coffee, label: '아늑' },
  focus: { bg: 'bg-blue-50', accent: 'text-blue-600', icon: Target, label: '집중' },
  minimal: { bg: 'bg-slate-50', accent: 'text-slate-600', icon: Sparkles, label: '미니멀' },
  nature: { bg: 'bg-green-50', accent: 'text-green-600', icon: BookOpen, label: '자연' },
  night: { bg: 'bg-indigo-50', accent: 'text-indigo-600', icon: Moon, label: '심야' },
};

// 세션 상태별 스타일
const SESSION_STATUS_STYLES: Record<SessionStatus, { label: string; color: string; dotColor: string }> = {
  waiting: { label: '대기 중', color: 'text-gray-500', dotColor: 'bg-gray-400' },
  studying: { label: '공부 중', color: 'text-green-600', dotColor: 'bg-green-500' },
  break: { label: '휴식 중', color: 'text-amber-600', dotColor: 'bg-amber-500' },
  paused: { label: '일시정지', color: 'text-gray-500', dotColor: 'bg-gray-400' },
  ended: { label: '종료됨', color: 'text-gray-400', dotColor: 'bg-gray-300' },
};

// 스터디룸 카드 컴포넌트 (앱과 동일한 디자인)
function RoomCard({ room }: { room: RoomListItem }) {
  const theme = THEME_STYLES[room.theme] || THEME_STYLES.default;
  const status = SESSION_STATUS_STYLES[room.session_status] || SESSION_STATUS_STYLES.waiting;
  const ThemeIcon = theme.icon;
  const isFull = room.current_participants >= room.max_participants;

  return (
    <Link href={`/study-room/${room.id}`} className="block group">
      <div className={cn(
        'rounded-2xl border border-gray-200 overflow-hidden transition-all',
        'hover:border-gray-300 hover:shadow-lg',
        isFull && 'opacity-60'
      )}>
        {/* 상단 테마 영역 */}
        <div className={cn('p-4 pb-3', theme.bg)}>
          <div className="flex items-center justify-between mb-2">
            <div className={cn('flex items-center gap-1.5 text-xs font-medium', theme.accent)}>
              <ThemeIcon className="w-3.5 h-3.5" />
              {theme.label}
            </div>
            <div className="flex items-center gap-1.5">
              <div className={cn('w-2 h-2 rounded-full', status.dotColor)} />
              <span className={cn('text-xs font-medium', status.color)}>
                {status.label}
              </span>
            </div>
          </div>
          <h3 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-blue-600 transition-colors">
            {room.name}
          </h3>
          {room.goal && (
            <p className="text-gray-500 text-sm mt-1 line-clamp-1">
              {room.goal}
            </p>
          )}
        </div>

        {/* 하단 정보 영역 */}
        <div className="bg-white p-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar
                src={room.creator.avatar_url}
                alt={room.creator.nickname}
                size="xs"
                className="w-6 h-6"
              />
              <span className="text-gray-600 text-sm truncate max-w-[100px]">
                {room.creator.nickname}
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">
                {room.current_participants}/{room.max_participants}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// 섹션 헤더 컴포넌트
function SectionHeader({
  icon,
  title,
  count,
  showMore,
  onShowMore
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  showMore?: boolean;
  onShowMore?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        {icon}
        {title}
        {count !== undefined && count > 0 && (
          <span className="text-sm font-normal text-gray-400">({count})</span>
        )}
      </h2>
      {showMore && onShowMore && (
        <button
          onClick={onShowMore}
          className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-0.5"
        >
          더보기 <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// 빈 상태 컴포넌트
function EmptyState({
  title,
  description,
  action,
  actionHref
}: {
  title: string;
  description: string;
  action?: string;
  actionHref?: string;
}) {
  return (
    <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <BookOpen className="w-8 h-8 text-gray-300" />
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      {action && actionHref && (
        <Link href={actionHref}>
          <Button size="sm" className="gap-1">
            <Plus className="w-4 h-4" />
            {action}
          </Button>
        </Link>
      )}
    </div>
  );
}

interface StudyWithMeClientProps {
  publicRooms: RoomListItem[];
  popularRooms: RoomListItem[];
  myRooms: RoomListItem[];
  isLoggedIn: boolean;
}

export default function StudyWithMeClient({
  publicRooms,
  popularRooms,
  myRooms,
  isLoggedIn,
}: StudyWithMeClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // 검색 필터링
  const filteredPublicRooms = useMemo(() => {
    if (!searchQuery.trim()) return publicRooms;
    const query = searchQuery.toLowerCase();
    return publicRooms.filter(room =>
      room.name.toLowerCase().includes(query) ||
      room.goal?.toLowerCase().includes(query) ||
      room.creator.nickname.toLowerCase().includes(query)
    );
  }, [publicRooms, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="space-y-8">
      {/* 헤더: 검색 + 방 만들기 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* 검색 */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="스터디룸 검색..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-10 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 방 만들기 버튼 */}
        <Link href="/study-with-me/create">
          <Button className="gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" />
            스터디룸 만들기
          </Button>
        </Link>
      </div>

      {/* 검색 결과 */}
      {isSearching ? (
        <section>
          <SectionHeader
            icon={<Search className="w-5 h-5 text-blue-500" />}
            title="검색 결과"
            count={filteredPublicRooms.length}
          />
          {filteredPublicRooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPublicRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="검색 결과가 없습니다"
              description="다른 검색어로 시도해보세요"
            />
          )}
        </section>
      ) : (
        <>
          {/* 내가 참여 중인 방 (로그인한 경우만) */}
          {isLoggedIn && (
            <section>
              <SectionHeader
                icon={<BookOpen className="w-5 h-5 text-green-500" />}
                title="내가 참여 중인 방"
                count={myRooms.length}
              />
              {myRooms.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myRooms.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="참여 중인 방이 없습니다"
                  description="스터디룸에 참여해보세요"
                  action="스터디룸 찾아보기"
                  actionHref="#public-rooms"
                />
              )}
            </section>
          )}

          {/* 지금 인기 있는 방 */}
          {popularRooms.length > 0 && (
            <section>
              <SectionHeader
                icon={<Flame className="w-5 h-5 text-red-500" />}
                title="지금 인기 있는 방"
                count={popularRooms.length}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularRooms.slice(0, 6).map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            </section>
          )}

          {/* 공개 방 */}
          <section id="public-rooms">
            <SectionHeader
              icon={<Clock className="w-5 h-5 text-blue-500" />}
              title="공개 방"
              count={publicRooms.length}
            />
            {publicRooms.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicRooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="아직 스터디룸이 없습니다"
                description="첫 번째 스터디룸을 만들어보세요!"
                action="스터디룸 만들기"
                actionHref="/study-with-me/create"
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}
