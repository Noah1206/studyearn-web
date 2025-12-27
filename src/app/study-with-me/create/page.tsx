'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Rocket,
  Settings,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Check,
  Target,
  Coffee,
  Moon,
  Sparkles,
  Music,
  Leaf,
  CloudRain,
  VolumeX,
} from 'lucide-react';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

// 테마 옵션 (앱과 동일)
const THEME_OPTIONS = [
  { id: 'focus', name: '집중', emoji: '🎯', icon: Target },
  { id: 'cozy', name: '아늑', emoji: '☕', icon: Coffee },
  { id: 'night', name: '심야', emoji: '🌙', icon: Moon },
  { id: 'minimal', name: '미니멀', emoji: '✨', icon: Sparkles },
];

// 배경음악 옵션 (앱과 동일)
const MUSIC_OPTIONS = [
  { id: 'none', name: '없음', emoji: '🔇', icon: VolumeX },
  { id: 'lofi', name: 'Lo-Fi', emoji: '🎵', icon: Music },
  { id: 'nature', name: '자연', emoji: '🌿', icon: Leaf },
  { id: 'cafe', name: '카페', emoji: '☕', icon: Coffee },
  { id: 'rain', name: '빗소리', emoji: '🌧️', icon: CloudRain },
];

// 좌석 수 옵션 (앱과 동일)
const CAPACITY_OPTIONS = [
  { value: 10, label: '10명' },
  { value: 20, label: '20명' },
  { value: 30, label: '30명' },
  { value: 50, label: '50명' },
  { value: null, label: '무제한' },
];

export default function CreateStudyRoomPage() {
  const router = useRouter();

  // 폼 상태
  const [roomName, setRoomName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 고급 설정
  const [isPublic, setIsPublic] = useState(true);
  const [capacity, setCapacity] = useState<number | null>(20);
  const [showCapacityDropdown, setShowCapacityDropdown] = useState(false);
  const [customCapacity, setCustomCapacity] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('focus');
  const [selectedMusic, setSelectedMusic] = useState('none');

  // 로딩 상태
  const [isCreating, setIsCreating] = useState(false);

  // 유효성 검사
  const isValid = roomName.length >= 2 && roomName.length <= 30;

  // 빠른 시작 (기본값으로 생성)
  const handleQuickStart = async () => {
    if (!isValid) return;
    await createRoom({
      name: roomName.trim(),
      is_public: true,
      max_participants: 20,
      theme: 'focus',
      layout: 'grid',
    });
  };

  // 설정대로 생성
  const handleCreate = async () => {
    if (!isValid) return;
    await createRoom({
      name: roomName.trim(),
      description: description.trim() || undefined,
      is_public: isPublic,
      max_participants: capacity ?? undefined,
      theme: selectedTheme,
      background_music: selectedMusic === 'none' ? undefined : selectedMusic,
      layout: 'grid',
    });
  };

  // 방 생성 API 호출
  const createRoom = async (roomData: {
    name: string;
    description?: string;
    is_public: boolean;
    max_participants?: number;
    theme: string;
    background_music?: string;
    layout: string;
  }) => {
    setIsCreating(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: room, error } = await supabase
        .from('study_with_me_rooms')
        .insert({
          creator_id: user.id,
          name: roomData.name,
          goal: roomData.description,
          is_public: roomData.is_public,
          max_participants: roomData.max_participants || 100,
          current_participants: 1,
          theme: roomData.theme,
          background_music: roomData.background_music,
          layout: roomData.layout,
          session_status: 'waiting',
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create room:', error);
        alert('방 생성에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      // 방 생성자를 참여자로 추가
      await supabase
        .from('study_with_me_participants')
        .insert({
          room_id: room.id,
          user_id: user.id,
          seat_number: 1,
          status: 'studying',
        });

      router.push(`/study-room/${room.id}`);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('방 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsCreating(false);
    }
  };

  // 커스텀 좌석 수 확인
  const handleCustomCapacitySubmit = () => {
    const num = parseInt(customCapacity, 10);
    if (num && num >= 2 && num <= 100) {
      setCapacity(num);
      setShowCustomInput(false);
      setShowCapacityDropdown(false);
      setCustomCapacity('');
    } else {
      alert('2~100 사이의 숫자를 입력해주세요.');
    }
  };

  // 현재 선택값이 프리셋에 없으면 커스텀 값
  const isCustomSelected = capacity !== null && !CAPACITY_OPTIONS.some(o => o.value === capacity);
  const selectedCapacityOption = CAPACITY_OPTIONS.find(o => o.value === capacity);
  const capacityDisplayText = isCustomSelected
    ? `${capacity}명`
    : (selectedCapacityOption?.label || '선택');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-xl mx-auto px-4">
          <div className="h-14 flex items-center gap-4">
            <Link
              href="/study-with-me"
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-gray-900">스터디 만들기</h1>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* 메인 입력: 방 이름 */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-900">
              방 이름
            </label>
            <div className="relative">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="예: 같이 공부해요!"
                maxLength={30}
                autoFocus
                className={cn(
                  "w-full px-4 py-4 bg-gray-100 border rounded-xl text-gray-900 placeholder-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white",
                  "transition-all"
                )}
              />
              <span className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 text-sm",
                roomName.length >= 30 ? "text-amber-500" : "text-gray-400"
              )}>
                {roomName.length}/30
              </span>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              2자 이상 입력해주세요
            </p>
          </div>

          {/* 빠른 시작 버튼 */}
          <div className="space-y-3">
            <Button
              onClick={handleQuickStart}
              disabled={!isValid || isCreating}
              className="w-full h-14 text-base font-bold bg-green-500 hover:bg-green-600 gap-2"
            >
              {isCreating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Rocket className="w-5 h-5" />
              )}
              빠른 시작
            </Button>
            <p className="text-center text-sm text-gray-500">
              공개 방 · 20명 · 집중 모드로 바로 시작
            </p>
          </div>

          {/* 구분선 */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">또는</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* 고급 설정 토글 */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-4 py-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-700">고급 설정</span>
            </div>
            {showAdvanced ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {/* 고급 설정 내용 */}
          {showAdvanced && (
            <div className="space-y-5 animate-in slide-in-from-top-2 duration-200">
              {/* 공개 설정 */}
              <Card className="border-gray-200">
                <CardContent className="p-4">
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className="w-full flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">공개 방</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {isPublic ? '누구나 참여 가능' : '초대 코드로만 입장'}
                      </p>
                    </div>
                    <div className={cn(
                      "w-12 h-7 rounded-full p-0.5 transition-colors",
                      isPublic ? "bg-green-500" : "bg-gray-300"
                    )}>
                      <div className={cn(
                        "w-6 h-6 rounded-full bg-white shadow transition-transform",
                        isPublic && "translate-x-5"
                      )} />
                    </div>
                  </button>
                </CardContent>
              </Card>

              {/* 좌석 수 */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">좌석 수</span>
                <div className="relative">
                  <button
                    onClick={() => setShowCapacityDropdown(!showCapacityDropdown)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 bg-white border rounded-xl",
                      "hover:bg-gray-50 transition-colors",
                      showCapacityDropdown ? "border-gray-400" : "border-gray-200"
                    )}
                  >
                    <span className="font-medium text-gray-900">{capacityDisplayText}</span>
                    {showCapacityDropdown ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {showCapacityDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                      {CAPACITY_OPTIONS.map((option) => (
                        <button
                          key={option.label}
                          onClick={() => {
                            setCapacity(option.value);
                            setShowCapacityDropdown(false);
                            setShowCustomInput(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                            capacity === option.value && "bg-green-50"
                          )}
                        >
                          <span className={cn(
                            "text-sm",
                            capacity === option.value ? "font-bold text-green-700" : "text-gray-700"
                          )}>
                            {option.label}
                          </span>
                          {capacity === option.value && (
                            <Check className="w-4 h-4 text-green-600" />
                          )}
                        </button>
                      ))}
                      <div className="border-t border-gray-100">
                        {showCustomInput ? (
                          <div className="flex items-center gap-2 p-3">
                            <input
                              type="number"
                              value={customCapacity}
                              onChange={(e) => setCustomCapacity(e.target.value)}
                              placeholder="2~100"
                              min={2}
                              max={100}
                              className="flex-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              autoFocus
                            />
                            <span className="text-sm text-gray-500">명</span>
                            <button
                              onClick={handleCustomCapacitySubmit}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowCustomInput(true)}
                            className={cn(
                              "w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                              isCustomSelected && "bg-green-50"
                            )}
                          >
                            <span className="text-sm text-gray-700">직접 입력</span>
                            {isCustomSelected && (
                              <Check className="w-4 h-4 text-green-600" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 테마 */}
              <div className="space-y-3">
                <span className="text-sm font-semibold text-gray-700">테마</span>
                <div className="flex flex-wrap gap-2">
                  {THEME_OPTIONS.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all",
                        selectedTheme === theme.id
                          ? "bg-green-50 border-green-500 text-green-700"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      <span>{theme.emoji}</span>
                      <span className={cn(
                        "text-sm",
                        selectedTheme === theme.id ? "font-semibold" : "font-medium"
                      )}>
                        {theme.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 배경음악 */}
              <div className="space-y-3">
                <span className="text-sm font-semibold text-gray-700">배경음악</span>
                <div className="flex flex-wrap gap-2">
                  {MUSIC_OPTIONS.map((music) => (
                    <button
                      key={music.id}
                      onClick={() => setSelectedMusic(music.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all",
                        selectedMusic === music.id
                          ? "bg-green-50 border-green-500 text-green-700"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      <span>{music.emoji}</span>
                      <span className={cn(
                        "text-sm",
                        selectedMusic === music.id ? "font-semibold" : "font-medium"
                      )}>
                        {music.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 설명 추가 */}
              {!showDescription ? (
                <button
                  onClick={() => setShowDescription(true)}
                  className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">설명 추가하기</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <span className="text-sm font-semibold text-gray-700">설명</span>
                  <div className="relative">
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="어떤 스터디인지 소개해주세요"
                      maxLength={100}
                      className="w-full px-4 py-4 bg-gray-100 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      {description.length}/100
                    </span>
                  </div>
                </div>
              )}

              {/* 설정대로 생성 버튼 */}
              <Button
                onClick={handleCreate}
                disabled={!isValid || isCreating}
                className="w-full h-14 text-base font-bold bg-green-500 hover:bg-green-600 gap-2 mt-4"
              >
                {isCreating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                방 만들기
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
