'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Users,
  Play,
  Clock,
  Flame,
  ChevronRight,
  BookOpen,
  X,
  LayoutGrid,
  BookText,
  Calculator,
  Languages,
  FlaskConical,
  Code2,
  Lightbulb,
} from 'lucide-react';
import { Button, Avatar } from '@/components/ui';

// 스터디룸 타입 정의
interface StudyRoom {
  id: string;
  name: string;
  goal: string | null;
  is_public: boolean;
  current_participants: number;
  max_participants: number;
  session_status: string;
  theme: string | null;
  created_at: string;
  creator: {
    id: string;
    nickname: string;
    avatar_url: string | null;
  };
}

// 카테고리 옵션
const CATEGORIES = [
  { id: 'all', label: '전체', icon: LayoutGrid },
  { id: 'korean', label: '국어', icon: BookText },
  { id: 'math', label: '수학', icon: Calculator },
  { id: 'english', label: '영어', icon: Languages },
  { id: 'science', label: '과학', icon: FlaskConical },
  { id: 'coding', label: '코딩', icon: Code2 },
  { id: 'study-tips', label: '공부법', icon: Lightbulb },
];

// 섹션 헤더 컴포넌트
function SectionHeader({ icon, title, href, linkText = '전체보기' }: { icon: React.ReactNode; title: string; href?: string; linkText?: string }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {href && (
        <Link href={href}>
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
            {linkText} <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      )}
    </div>
  );
}

// 스터디룸 카드
function RoomCard({ room }: { room: StudyRoom }) {
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}개월 전`;
    return `${Math.floor(diffInSeconds / 31536000)}년 전`;
  };

  const isLive = room.session_status === 'active' || room.session_status === 'streaming';

  // 테마별 그라데이션 색상
  const getThemeGradient = (theme: string | null) => {
    switch (theme) {
      case 'korean': return 'from-rose-100 via-pink-50 to-rose-50';
      case 'math': return 'from-blue-100 via-indigo-50 to-blue-50';
      case 'english': return 'from-emerald-100 via-green-50 to-emerald-50';
      case 'science': return 'from-purple-100 via-violet-50 to-purple-50';
      case 'coding': return 'from-cyan-100 via-sky-50 to-cyan-50';
      case 'study-tips': return 'from-amber-100 via-yellow-50 to-amber-50';
      default: return 'from-orange-100 via-amber-50 to-yellow-100';
    }
  };

  return (
    <Link href={`/study-room/${room.id}`} className="group block">
      <div className="relative aspect-video bg-gray-900 rounded-3xl overflow-hidden mb-4 shadow-md group-hover:shadow-xl transition-shadow">
        {/* 썸네일 대신 테마 기반 그라데이션 배경 */}
        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getThemeGradient(room.theme)}`}>
          <div className="text-center">
            <BookOpen className="w-14 h-14 text-orange-300 mx-auto mb-3" />
            <span className="text-orange-400 text-base font-medium">Study With Me</span>
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl">
            <Play className="w-9 h-9 text-gray-900 ml-1" fill="currentColor" />
          </div>
        </div>

        {/* 라이브 여부 및 참여자 수 */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {isLive ? (
            <>
              <div className="bg-red-500 px-3 py-1.5 rounded-full text-sm font-bold text-white flex items-center gap-2 shadow-lg">
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
              <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm text-white flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {room.current_participants}
              </div>
            </>
          ) : (
            <div className="bg-gray-500 px-3 py-1.5 rounded-full text-sm font-medium text-white shadow-lg">
              대기중
            </div>
          )}
        </div>

        {/* 참여자 현황 */}
        <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-xl text-base text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-orange-400" />
          {room.current_participants}/{room.max_participants}
        </div>

        {/* 카테고리 */}
        <div className="absolute bottom-4 left-4">
          <span className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm font-medium text-gray-700">
            {CATEGORIES.find(c => c.id === room.theme)?.label || '공부'}
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <Avatar
            src={room.creator?.avatar_url}
            alt={room.creator?.nickname}
            size="md"
            className="w-12 h-12 ring-2 ring-orange-100"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-lg leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
            {room.name}
          </h3>
          <p className="text-gray-500 text-base mt-1 truncate">
            {room.creator?.nickname}
          </p>
          <p className="text-gray-400 text-sm flex items-center gap-1.5 mt-1">
            <Users className="w-4 h-4" />
            <span>{room.current_participants}명 참여중</span>
            <span>•</span>
            <span>{getRelativeTime(room.created_at)}</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

interface StudyWithMeClientProps {
  popularRooms: StudyRoom[];
  latestRooms: StudyRoom[];
}

export default function StudyWithMeClient({
  popularRooms,
  latestRooms,
}: StudyWithMeClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 모든 스터디룸 합치기 (중복 제거)
  const allRooms = useMemo(() => {
    const combined = [...popularRooms, ...latestRooms];
    const uniqueMap = new Map(combined.map(r => [r.id, r]));
    return Array.from(uniqueMap.values());
  }, [popularRooms, latestRooms]);

  // 필터링된 스터디룸
  const filteredRooms = useMemo(() => {
    let result = allRooms;

    // 카테고리 필터 (theme 기반)
    if (selectedCategory !== 'all') {
      result = result.filter(r => r.theme === selectedCategory);
    }

    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.name?.toLowerCase().includes(query) ||
        r.goal?.toLowerCase().includes(query) ||
        r.creator?.nickname?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [allRooms, selectedCategory, searchQuery]);

  // 검색/필터가 활성화되었는지
  const isFiltering = searchQuery.trim() || selectedCategory !== 'all';

  return (
    <div className="flex gap-6 w-full">
      {/* 왼쪽 사이드바 - 검색 + 카테고리 필터 (세로 직사각형) */}
      <aside className="hidden lg:block w-52 flex-shrink-0">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm sticky top-6">
          {/* 검색 바 */}
          <div className="relative mb-5">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="스터디 검색..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-9 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-2.5 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 구분선 */}
          <div className="h-px bg-gray-100 mb-4" />

          {/* 카테고리 목록 (세로) */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">카테고리</p>
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* 오른쪽 메인 콘텐츠 영역 - 사이드바 제외 전체 너비 */}
      <div className="flex-1 min-w-0 space-y-8 w-full">
        {/* 히어로 섹션 */}
        <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-gray-900 rounded-3xl">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-black/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-400/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 px-10 py-8 md:px-14 md:py-10">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="inline-flex items-center gap-2 bg-red-500 text-white text-sm font-bold px-4 py-1.5 rounded-lg shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
              함께 공부해요
            </h1>

            <p className="text-white/80 text-base md:text-lg mb-6 max-w-xl">
              다양한 크리에이터와 함께 공부하고, 성장하세요.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/study-with-me/create">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 shadow-xl gap-2 px-6">
                  <Users className="w-5 h-5" />
                  스터디룸 만들기
                </Button>
              </Link>
              <Link href="/explore">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2 px-6">
                  <Play className="w-5 h-5" />
                  둘러보기
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 모바일용 필터 (가로 스크롤) */}
        <div className="md:hidden bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 스터디룸 영역 */}
        <div>
        {/* 필터링 중일 때 */}
      {isFiltering ? (
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-orange-500" />
              검색 결과
              <span className="text-orange-500 text-base font-normal ml-1">
                {filteredRooms.length}개
              </span>
            </h2>
            {isFiltering && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-gray-500 hover:text-gray-900"
              >
                필터 초기화
              </Button>
            )}
          </div>

          {filteredRooms.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {filteredRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                검색 결과가 없어요
              </h3>
              <p className="text-gray-500 text-sm">
                다른 검색어나 카테고리를 선택해보세요
              </p>
            </div>
          )}
        </section>
      ) : (
        <>
          {/* 인기 스터디룸 */}
          {popularRooms.length > 0 && (
            <section className="mt-4">
              <SectionHeader
                icon={<Flame className="w-5 h-5 text-red-500" />}
                title="지금 인기있는 스터디룸"
                href="/ranking"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {popularRooms.slice(0, 10).map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            </section>
          )}

          {/* 최신 스터디룸 */}
          {latestRooms.length > 0 && (
            <section className="mt-10">
              <SectionHeader
                icon={<Clock className="w-5 h-5 text-orange-500" />}
                title="새로 만들어진 스터디룸"
                href="/explore"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {latestRooms.slice(0, 10).map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
        </div>
      </div>
    </div>
  );
}
