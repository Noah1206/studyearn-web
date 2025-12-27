'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Clock,
  Settings,
  LogOut,
  Coffee,
  Target,
  Moon,
  Sparkles,
  Loader2,
  Play,
  Pause,
  SkipForward,
  Timer,
  Check,
  Share2,
  Copy,
  BookOpen,
  Video,
  VideoOff,
  Mic,
  MicOff,
  RefreshCw,
  X,
  Lightbulb,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Avatar } from '@/components/ui';
import { cn } from '@/lib/utils';
import { agoraService, RemoteUser } from '@/lib/agora/agoraService';
import type { ICameraVideoTrack, IRemoteVideoTrack } from 'agora-rtc-sdk-ng';

// 타입 정의
interface Participant {
  id: string;
  user_id: string;
  nickname: string;
  avatar_url?: string;
  is_host: boolean;
  seat_number: number;
  status: 'studying' | 'break' | 'away' | 'offline';
  current_session_minutes: number;
  is_camera_on?: boolean;
  is_mic_on?: boolean;
}

// 로컬 카메라 프리뷰 컴포넌트 (Agora 트랙 또는 네이티브 스트림 사용)
function LocalCameraPreview({
  videoTrack,
  nativeStream,
  isMirrored = true,
  className,
}: {
  videoTrack: ICameraVideoTrack | null;
  nativeStream?: MediaStream | null;
  isMirrored?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nativeVideoRef = useRef<HTMLVideoElement>(null);

  // Agora 트랙 재생
  useEffect(() => {
    if (containerRef.current && videoTrack) {
      videoTrack.play(containerRef.current);
    }
    return () => {
      videoTrack?.stop();
    };
  }, [videoTrack]);

  // 네이티브 스트림 재생 (Agora 트랙이 없을 때)
  useEffect(() => {
    if (!videoTrack && nativeVideoRef.current && nativeStream) {
      nativeVideoRef.current.srcObject = nativeStream;
      nativeVideoRef.current.play().catch(console.error);
    }
  }, [videoTrack, nativeStream]);

  // Agora 트랙이 있으면 Agora 프리뷰 사용
  if (videoTrack) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "w-full h-full",
          isMirrored && "scale-x-[-1]",
          className
        )}
      />
    );
  }

  // 네이티브 스트림이 있으면 네이티브 비디오 사용
  if (nativeStream) {
    return (
      <video
        ref={nativeVideoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          "w-full h-full object-cover",
          isMirrored && "scale-x-[-1]",
          className
        )}
      />
    );
  }

  // 둘 다 없으면 카메라 OFF 아이콘 표시
  return (
    <div className={cn("bg-gray-900 flex items-center justify-center", className)}>
      <VideoOff className="w-12 h-12 text-gray-600" />
    </div>
  );
}

// 원격 비디오 프리뷰 컴포넌트
function RemoteVideoPreview({
  videoTrack,
  className,
}: {
  videoTrack: IRemoteVideoTrack | null | undefined;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && videoTrack) {
      videoTrack.play(containerRef.current);
    }
    return () => {
      videoTrack?.stop();
    };
  }, [videoTrack]);

  if (!videoTrack) {
    return (
      <div className={cn("bg-gray-900 flex items-center justify-center", className)}>
        <VideoOff className="w-12 h-12 text-gray-600" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("w-full h-full", className)}
    />
  );
}

// 비디오 뷰어 모달 (다른 참여자 화면 보기)
function VideoViewer({
  visible,
  participant,
  isCameraOn,
  remoteUser,
  onClose,
}: {
  visible: boolean;
  participant: Participant | null;
  isCameraOn: boolean;
  remoteUser?: RemoteUser;
  onClose: () => void;
}) {
  if (!visible || !participant) return null;

  const studyMinutes = participant.current_session_minutes || 0;
  const formatStudyTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* 비디오 배경 */}
      <div className="flex-1 flex items-center justify-center">
        {isCameraOn && remoteUser?.videoTrack ? (
          <RemoteVideoPreview
            videoTrack={remoteUser.videoTrack}
            className="w-full h-full"
          />
        ) : isCameraOn ? (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <p className="text-white/50 text-sm">비디오 연결 중...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Avatar
              src={participant.avatar_url}
              alt={participant.nickname}
              size="xl"
              className="w-32 h-32"
            />
          </div>
        )}
      </div>

      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        className="absolute top-6 left-6 w-11 h-11 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70"
      >
        <X className="w-6 h-6" />
      </button>

      {/* LIVE 배지 */}
      {isCameraOn && (
        <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-red-500 px-2.5 py-1 rounded">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-xs font-bold text-white">LIVE</span>
        </div>
      )}

      {/* 하단 오버레이 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pb-12">
        <h2 className="text-2xl font-bold text-white mb-2">{participant.nickname}</h2>
        <div className="flex items-center gap-2 text-white/80">
          <Clock className="w-5 h-5" />
          <span className="text-xl">{formatStudyTime(studyMinutes)}</span>
        </div>
      </div>
    </div>
  );
}

interface StudyRoom {
  id: string;
  name: string;
  goal?: string;
  is_public: boolean;
  invite_code?: string;
  max_participants: number;
  current_participants: number;
  theme: string;
  session_status: string;
  creator: {
    id: string;
    nickname: string;
    avatar_url?: string;
  };
}

// 테마 스타일 (앱과 동일)
const THEME_STYLES: Record<string, { bg: string; accent: string; icon: React.ElementType }> = {
  default: { bg: 'bg-gray-50', accent: 'text-gray-600', icon: BookOpen },
  cozy: { bg: 'bg-amber-50', accent: 'text-amber-600', icon: Coffee },
  focus: { bg: 'bg-blue-50', accent: 'text-blue-600', icon: Target },
  minimal: { bg: 'bg-slate-50', accent: 'text-slate-600', icon: Sparkles },
  nature: { bg: 'bg-green-50', accent: 'text-green-600', icon: BookOpen },
  night: { bg: 'bg-indigo-50', accent: 'text-indigo-600', icon: Moon },
};

// 시간 선택 모달
function TimeSelectModal({
  roomName,
  seatNumber,
  onConfirm,
  onSkip,
}: {
  roomName?: string;
  seatNumber?: number;
  onConfirm: (workMinutes: number, breakMinutes: number) => void;
  onSkip: () => void;
}) {
  const [workMinutes, setWorkMinutes] = useState(50);
  const [breakMinutes, setBreakMinutes] = useState(10);

  const workOptions = [25, 30, 45, 50, 60, 90];
  const breakOptions = [5, 10, 15, 20];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Timer className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">공부 시간 설정</h2>
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            {roomName && <span>{roomName}</span>}
            {roomName && seatNumber && <span>·</span>}
            {seatNumber && (
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {seatNumber}번 좌석
              </span>
            )}
          </div>
        </div>

        {/* 공부 시간 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            공부 시간
          </label>
          <div className="flex flex-wrap gap-2">
            {workOptions.map((minutes) => (
              <button
                key={minutes}
                onClick={() => setWorkMinutes(minutes)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  workMinutes === minutes
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {minutes}분
              </button>
            ))}
          </div>
        </div>

        {/* 휴식 시간 선택 */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            휴식 시간
          </label>
          <div className="flex flex-wrap gap-2">
            {breakOptions.map((minutes) => (
              <button
                key={minutes}
                onClick={() => setBreakMinutes(minutes)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  breakMinutes === minutes
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {minutes}분
              </button>
            ))}
          </div>
        </div>

        {/* 요약 */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{workMinutes}분</div>
              <div className="text-gray-500">공부</div>
            </div>
            <div className="text-gray-300">+</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{breakMinutes}분</div>
              <div className="text-gray-500">휴식</div>
            </div>
            <div className="text-gray-300">=</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{workMinutes + breakMinutes}분</div>
              <div className="text-gray-500">1사이클</div>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="space-y-3">
          <Button
            onClick={() => onConfirm(workMinutes, breakMinutes)}
            className="w-full bg-green-500 hover:bg-green-600 h-12 gap-2"
          >
            <Play className="w-4 h-4" />
            시작하기
          </Button>
          <button
            onClick={onSkip}
            className="w-full py-3 text-gray-500 hover:text-gray-700 text-sm"
          >
            설정 안하고 시작하기 (스톱워치 모드)
          </button>
        </div>
      </div>
    </div>
  );
}

// 좌석 컴포넌트
function Seat({
  seatNumber,
  participant,
  isMyself,
  isSelected,
  isCameraOn,
  onSelect,
  onViewProfile,
}: {
  seatNumber: number;
  participant?: Participant;
  isMyself?: boolean;
  isSelected?: boolean;
  isCameraOn?: boolean;
  onSelect?: () => void;
  onViewProfile?: () => void;
}) {
  const isEmpty = !participant;
  const statusColors = {
    studying: 'bg-green-500',
    break: 'bg-amber-500',
    away: 'bg-gray-400',
    offline: 'bg-gray-300',
  };

  return (
    <button
      onClick={isEmpty ? onSelect : onViewProfile}
      className={cn(
        "relative aspect-square rounded-2xl p-3 transition-all",
        isEmpty
          ? "bg-gray-100 hover:bg-green-50 hover:border-green-300 border-2 border-dashed border-gray-300"
          : "bg-white border-2 border-gray-200",
        isMyself && "ring-2 ring-green-500 ring-offset-2",
        isSelected && "ring-2 ring-blue-500 ring-offset-2"
      )}
    >
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mb-2">
            <span className="text-gray-400 text-lg">+</span>
          </div>
          <span className="text-xs text-gray-500">빈 좌석</span>
          <span className="text-xs font-medium text-gray-600">#{seatNumber}</span>
        </div>
      ) : (
        <>
          <div className="relative w-full h-full flex items-center justify-center">
            <Avatar
              src={participant.avatar_url}
              alt={participant.nickname}
              size="lg"
              className="w-16 h-16"
            />
          </div>

          {/* 상태 표시 */}
          <div className={cn(
            "absolute top-2 right-2 w-3 h-3 rounded-full ring-2 ring-white",
            statusColors[participant.status]
          )} />

          {/* 호스트 배지 또는 LIVE 배지 */}
          {isCameraOn ? (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              LIVE
            </div>
          ) : participant.is_host ? (
            <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
              호스트
            </div>
          ) : isMyself ? (
            <div className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
              나
            </div>
          ) : null}

          {/* 이름 & 시간 */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/60 to-transparent p-2 rounded-b-xl">
            <p className="text-white text-xs font-medium truncate text-center">
              {participant.nickname}
            </p>
            <p className="text-white/70 text-[10px] text-center">
              {participant.current_session_minutes}분
            </p>
          </div>

          {/* 좌석 번호 */}
          <div className="absolute bottom-2 right-2 bg-black/40 px-1.5 py-0.5 rounded text-[10px] text-white">
            #{seatNumber}
          </div>
        </>
      )}
    </button>
  );
}

// 좌석 선택 뷰
function SeatSelectionView({
  room,
  participants,
  currentUserId,
  cameraStates,
  isAlreadyJoined,
  mySeatNumber,
  onSelectSeat,
  onMyProfilePress,
  onViewParticipant,
  onLeave,
}: {
  room: StudyRoom;
  participants: Participant[];
  currentUserId?: string;
  cameraStates: Record<string, boolean>;
  isAlreadyJoined?: boolean;
  mySeatNumber?: number | null;
  onSelectSeat: (seatNumber: number) => void;
  onMyProfilePress?: () => void;
  onViewParticipant?: (participant: Participant) => void;
  onLeave: () => void;
}) {
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const totalSeats = room.max_participants || 20;
  const theme = THEME_STYLES[room.theme] || THEME_STYLES.focus;

  // 좌석 맵 생성
  const seatMap = new Map(participants.map(p => [p.seat_number, p]));
  const myParticipation = participants.find(p => p.user_id === currentUserId);

  const handleConfirm = () => {
    if (selectedSeat) {
      onSelectSeat(selectedSeat);
    }
  };

  return (
    <div className={cn("min-h-screen", theme.bg)}>
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="h-14 flex items-center justify-between">
            <button
              onClick={onLeave}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h1 className="font-bold text-gray-900">{room.name}</h1>
              <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span>{participants.length}명 참여중</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!room.is_public && room.invite_code && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(room.invite_code!);
                    alert('초대 코드가 복사되었습니다');
                  }}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 상태 범례 */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm text-gray-600">공부중</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full" />
            <span className="text-sm text-gray-600">휴식중</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full" />
            <span className="text-sm text-gray-600">자리비움</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 text-red-500">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <span className="text-xs font-bold">LIVE</span>
            </div>
            <span className="text-sm text-gray-600">카메라 ON</span>
          </div>
        </div>

        {/* 좌석 그리드 */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 mb-20">
          {Array.from({ length: totalSeats }, (_, i) => i + 1).map((seatNumber) => {
            const participant = seatMap.get(seatNumber);
            const isMyself = participant?.user_id === currentUserId;
            const isCameraOn = participant ? cameraStates[participant.user_id] : false;

            return (
              <Seat
                key={seatNumber}
                seatNumber={seatNumber}
                participant={participant}
                isMyself={isMyself}
                isSelected={selectedSeat === seatNumber}
                isCameraOn={isCameraOn}
                onSelect={() => !participant && setSelectedSeat(seatNumber)}
                onViewProfile={
                  isMyself
                    ? onMyProfilePress
                    : participant
                    ? () => onViewParticipant?.(participant)
                    : undefined
                }
              />
            );
          })}
        </div>
      </main>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white to-transparent">
        <div className="max-w-md mx-auto space-y-2">
          {isAlreadyJoined && mySeatNumber ? (
            // 기존 참여자
            <>
              {selectedSeat && selectedSeat !== mySeatNumber ? (
                // 새 좌석을 선택한 경우
                <Button
                  onClick={handleConfirm}
                  className="w-full h-14 text-base bg-blue-500 hover:bg-blue-600"
                >
                  <Check className="w-5 h-5 mr-2" />
                  {selectedSeat}번 좌석으로 변경하기
                </Button>
              ) : (
                // 기존 좌석 유지
                <Button
                  onClick={onMyProfilePress}
                  className="w-full h-14 text-base bg-green-500 hover:bg-green-600"
                >
                  <Check className="w-5 h-5 mr-2" />
                  {mySeatNumber}번 좌석에서 공부 시작하기
                </Button>
              )}
              <p className="text-center text-sm text-gray-500">
                다른 빈 좌석을 클릭하면 좌석을 변경할 수 있어요
              </p>
            </>
          ) : (
            // 신규 참여자: 좌석 선택 버튼
            <Button
              onClick={handleConfirm}
              disabled={!selectedSeat}
              className={cn(
                "w-full h-14 text-base",
                selectedSeat
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gray-300 cursor-not-allowed"
              )}
            >
              {selectedSeat ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  {selectedSeat}번 좌석 선택
                </>
              ) : (
                '좌석을 선택해주세요'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// 내 공부 화면
function MyStudyScreen({
  room,
  seatNumber,
  timerConfig,
  isStopwatchMode,
  isCameraOn,
  isMicOn,
  audioLevel,
  localVideoTrack,
  nativeStream,
  onToggleCamera,
  onToggleMic,
  onBack,
  onLeave,
}: {
  room: StudyRoom;
  seatNumber: number;
  timerConfig?: { workMinutes: number; breakMinutes: number };
  isStopwatchMode: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  audioLevel: number;
  localVideoTrack: ICameraVideoTrack | null;
  nativeStream: MediaStream | null;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onBack: () => void;
  onLeave: () => void;
}) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPhaseTime, setCurrentPhaseTime] = useState(
    timerConfig ? timerConfig.workMinutes * 60 : 0
  );
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [showTimer, setShowTimer] = useState(true);

  const theme = THEME_STYLES[room.theme] || THEME_STYLES.focus;
  const ThemeIcon = theme.icon;

  // 타이머 로직
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (!isOnBreak) {
        setElapsedTime(prev => prev + 1);
      }

      if (timerConfig && !isStopwatchMode) {
        setCurrentPhaseTime(prev => {
          if (prev <= 1) {
            if (isOnBreak) {
              setIsOnBreak(false);
              setPomodoroCount(c => c + 1);
              return timerConfig.workMinutes * 60;
            } else {
              setIsOnBreak(true);
              return timerConfig.breakMinutes * 60;
            }
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOnBreak, isPaused, timerConfig, isStopwatchMode]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatPhaseTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSkipBreak = () => {
    if (timerConfig) {
      setIsOnBreak(false);
      setCurrentPhaseTime(timerConfig.workMinutes * 60);
    }
  };

  return (
    <div className={cn("min-h-screen flex flex-col", theme.bg)}>
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-xl mx-auto px-4">
          <div className="h-14 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-1 p-2 -ml-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">좌석으로</span>
            </button>

            <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-600">
              좌석 {seatNumber}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
          {/* 타이머 섹션 */}
          <div>
            <button
              onClick={() => setShowTimer(!showTimer)}
              className="w-full flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-2 text-gray-600">
                <Timer className="w-5 h-5" />
                <span className="font-bold text-gray-900">내 공부 타이머</span>
              </div>
              <ArrowLeft className={cn(
                "w-5 h-5 text-gray-400 transition-transform",
                showTimer ? "rotate-90" : "-rotate-90"
              )} />
            </button>

            {showTimer && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                {/* 상태 표시 */}
                <div className="flex justify-center mb-6">
                  <div className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                    isOnBreak ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                  )}>
                    {isOnBreak ? (
                      <>
                        <Coffee className="w-4 h-4" />
                        <span className="font-medium">휴식 중</span>
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4" />
                        <span className="font-medium">공부 중</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 타이머 */}
                {timerConfig && !isStopwatchMode ? (
                  <div className="text-center mb-6">
                    <div className={cn(
                      "text-5xl font-mono font-bold mb-2",
                      isOnBreak ? "text-amber-600" : "text-green-600"
                    )}>
                      {formatPhaseTime(currentPhaseTime)}
                    </div>
                    <p className="text-gray-500 text-sm">
                      {isOnBreak ? '휴식' : '공부'} {isOnBreak ? timerConfig.breakMinutes : timerConfig.workMinutes}분
                    </p>
                  </div>
                ) : (
                  <div className="text-center mb-6">
                    <div className="text-5xl font-mono font-bold text-gray-900 mb-2">
                      {formatTime(elapsedTime)}
                    </div>
                    <p className="text-gray-500 text-sm">스톱워치 모드</p>
                  </div>
                )}

                {/* 총 공부 시간 */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                      <div className="text-xl font-bold text-gray-900">{formatTime(elapsedTime)}</div>
                      <div className="text-xs text-gray-500">총 공부 시간</div>
                    </div>
                    {pomodoroCount > 0 && (
                      <>
                        <div className="w-px h-10 bg-gray-200" />
                        <div className="text-center">
                          <Target className="w-5 h-5 text-green-500 mx-auto mb-1" />
                          <div className="text-xl font-bold text-gray-900">{pomodoroCount}</div>
                          <div className="text-xs text-gray-500">사이클 완료</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 컨트롤 버튼 */}
                <div className="flex items-center justify-center gap-4">
                  {timerConfig && !isStopwatchMode && (
                    <>
                      <button
                        onClick={() => setIsPaused(!isPaused)}
                        className={cn(
                          "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
                          isPaused
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        )}
                      >
                        {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                      </button>

                      {isOnBreak && (
                        <button
                          onClick={handleSkipBreak}
                          className="w-14 h-14 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300 transition-colors"
                        >
                          <SkipForward className="w-5 h-5" />
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => setIsOnBreak(!isOnBreak)}
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
                      isOnBreak
                        ? "bg-amber-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    )}
                  >
                    <Coffee className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 화면 설정 섹션 */}
          <div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Video className="w-5 h-5" />
                <span className="font-bold text-gray-900">화면 설정</span>
              </div>
              {isCameraOn && (
                <div className="flex items-center gap-1 bg-red-500 px-2 py-0.5 rounded text-white text-xs font-bold">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-4">
              {/* 카메라 프리뷰 */}
              {isCameraOn && (
                <div className="rounded-xl overflow-hidden bg-gray-900 aspect-[4/3]">
                  <LocalCameraPreview
                    videoTrack={localVideoTrack}
                    nativeStream={nativeStream}
                    className="w-full h-full"
                  />
                </div>
              )}

              {/* 카메라 설정 */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center",
                    isCameraOn ? "bg-green-100" : "bg-gray-100"
                  )}>
                    {isCameraOn ? (
                      <Video className="w-5 h-5 text-green-600" />
                    ) : (
                      <VideoOff className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">카메라</p>
                    <p className="text-xs text-gray-500">
                      {isCameraOn ? '다른 참여자에게 화면이 보여요' : '카메라가 꺼져있어요'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onToggleCamera}
                  className={cn(
                    "w-12 h-7 rounded-full transition-colors relative",
                    isCameraOn ? "bg-green-500" : "bg-gray-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform",
                    isCameraOn ? "right-1" : "left-1"
                  )} />
                </button>
              </div>

              <div className="h-px bg-gray-100" />

              {/* 마이크 설정 */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center relative",
                    isMicOn ? "bg-green-100" : "bg-gray-100"
                  )}>
                    {isMicOn ? (
                      <Mic className="w-5 h-5 text-green-600" />
                    ) : (
                      <MicOff className="w-5 h-5 text-gray-400" />
                    )}
                    {/* 오디오 레벨 링 표시 */}
                    {isMicOn && audioLevel > 5 && (
                      <div
                        className="absolute inset-0 rounded-xl border-2 border-green-500 animate-ping"
                        style={{ opacity: Math.min(0.6, audioLevel / 100) }}
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">마이크</p>
                    <p className="text-xs text-gray-500">
                      {isMicOn ? '소리가 전달되고 있어요' : '마이크가 꺼져있어요'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onToggleMic}
                  className={cn(
                    "w-12 h-7 rounded-full transition-colors relative",
                    isMicOn ? "bg-green-500" : "bg-gray-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform",
                    isMicOn ? "right-1" : "left-1"
                  )} />
                </button>
              </div>

              {/* 오디오 레벨 바 (마이크 켜져있을 때만 표시) */}
              {isMicOn && (
                <div className="flex items-center gap-2 py-2">
                  <span className="text-xs text-gray-500 w-12">레벨</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-100",
                        audioLevel > 70 ? "bg-red-500" :
                        audioLevel > 40 ? "bg-yellow-500" : "bg-green-500"
                      )}
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{audioLevel}%</span>
                </div>
              )}

              {/* 안내 */}
              <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
                <Lightbulb className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-500">
                  카메라를 켜면 좌석 페이지에서 내 화면이 다른 참여자에게 보여요
                </p>
              </div>
            </div>
          </div>

          {/* 팁 카드 */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
            <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-sm text-gray-600">
              집중이 힘들 때는 5분만 쉬었다가 다시 시작해보세요!
            </p>
          </div>

          {/* 나가기 버튼 */}
          <button
            onClick={onLeave}
            className="w-full py-3 text-red-500 hover:text-red-600 text-sm font-medium"
          >
            공부 종료하고 나가기
          </button>
        </div>
      </main>
    </div>
  );
}

// 메인 페이지
export default function StudyRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  // Phase 관리
  const [phase, setPhase] = useState<'loading' | 'time-select' | 'seat-select' | 'studying'>('loading');
  const [timerConfig, setTimerConfig] = useState<{ workMinutes: number; breakMinutes: number } | null>(null);
  const [isStopwatchMode, setIsStopwatchMode] = useState(false);
  const [mySeatNumber, setMySeatNumber] = useState<number | null>(null);
  const [isAlreadyJoined, setIsAlreadyJoined] = useState(false);

  // 데이터
  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 카메라/마이크 상태
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [cameraStates, setCameraStates] = useState<Record<string, boolean>>({});
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [isAgoraJoined, setIsAgoraJoined] = useState(false);
  const [nativeCameraStream, setNativeCameraStream] = useState<MediaStream | null>(null);
  const [nativeMicStream, setNativeMicStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const thumbnailIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const nativeVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 비디오 뷰어 상태
  const [videoViewerState, setVideoViewerState] = useState<{
    visible: boolean;
    participant: Participant | null;
  }>({ visible: false, participant: null });

  // 데이터 로드
  useEffect(() => {
    loadRoom();
  }, [roomId]);

  const loadRoom = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setCurrentUserId(user.id);

      // 방 정보 조회
      const { data: roomData, error: roomError } = await supabase
        .from('study_with_me_rooms')
        .select(`
          *,
          profiles:creator_id (
            id,
            nickname,
            avatar_url
          )
        `)
        .eq('id', roomId)
        .single();

      if (roomError || !roomData) {
        setError('방을 찾을 수 없습니다');
        setIsLoading(false);
        return;
      }

      setRoom({
        id: roomData.id,
        name: roomData.name,
        goal: roomData.goal,
        is_public: roomData.is_public,
        invite_code: roomData.invite_code,
        max_participants: roomData.max_participants,
        current_participants: roomData.current_participants,
        theme: roomData.theme || 'focus',
        session_status: roomData.session_status,
        creator: {
          id: (roomData.profiles as any)?.id || roomData.creator_id,
          nickname: (roomData.profiles as any)?.nickname || '알 수 없음',
          avatar_url: (roomData.profiles as any)?.avatar_url,
        },
      });

      // 참여자 조회
      const { data: participantsData } = await supabase
        .from('study_with_me_participants')
        .select(`
          *,
          profiles:user_id (
            id,
            nickname,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .is('left_at', null);

      if (participantsData) {
        setParticipants(participantsData.map((p: any) => ({
          id: p.id,
          user_id: p.user_id,
          nickname: (p.profiles as any)?.nickname || '익명',
          avatar_url: (p.profiles as any)?.avatar_url,
          is_host: p.user_id === roomData.creator_id,
          seat_number: p.seat_number || 1,
          status: p.status || 'studying',
          current_session_minutes: p.current_session_minutes || 0,
        })));

        // 이미 참여 중인지 확인
        const myParticipation = participantsData.find((p: any) => p.user_id === user.id);
        if (myParticipation) {
          // 기존 참여자: 좌석 번호 설정하고 좌석 화면부터 시작 (이미 참여 중 표시)
          setMySeatNumber(myParticipation.seat_number);
          setIsAlreadyJoined(true);
        }
      }

      // 항상 좌석 선택부터 시작
      setPhase('seat-select');

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load room:', err);
      setError('방을 불러오는데 실패했습니다');
      setIsLoading(false);
    }
  };

  // 좌석 선택 (먼저 좌석 선택 후 시간 설정으로)
  const handleSeatSelect = async (seatNumber: number) => {
    // 기존 참여자가 새 좌석을 선택한 경우
    if (isAlreadyJoined) {
      try {
        const supabase = createClient();
        // 좌석 번호 업데이트
        await supabase
          .from('study_with_me_participants')
          .update({ seat_number: seatNumber })
          .eq('room_id', roomId)
          .eq('user_id', currentUserId);

        setMySeatNumber(seatNumber);
        setIsStopwatchMode(true);
        setPhase('studying');
      } catch (err) {
        console.error('Failed to update seat:', err);
        alert('좌석 변경에 실패했습니다.');
      }
    } else {
      // 신규 참여자
      setMySeatNumber(seatNumber);
      setPhase('time-select');
    }
  };

  // 기존 참여자가 내 좌석 클릭 시 바로 공부 화면으로
  const handleMySeatClick = () => {
    if (isAlreadyJoined && mySeatNumber) {
      setIsStopwatchMode(true); // 기존 참여자는 스톱워치 모드로
      setPhase('studying');
    }
  };

  // 시간 설정 확인 후 참여 등록
  const handleTimeConfirm = async (workMinutes: number, breakMinutes: number) => {
    setTimerConfig({ workMinutes, breakMinutes });
    setIsStopwatchMode(false);
    await joinRoomWithSeat();
  };

  // 스톱워치 모드로 참여 등록
  const handleTimeSkip = async () => {
    setIsStopwatchMode(true);
    await joinRoomWithSeat();
  };

  // 실제 방 참여 처리 (DB 등록)
  const joinRoomWithSeat = async () => {
    if (!mySeatNumber) return;

    try {
      const supabase = createClient();

      // 참여자로 등록
      await supabase
        .from('study_with_me_participants')
        .insert({
          room_id: roomId,
          user_id: currentUserId,
          seat_number: mySeatNumber,
          status: 'studying',
        });

      // 현재 참여자 수 증가
      await supabase
        .from('study_with_me_rooms')
        .update({
          current_participants: (room?.current_participants || 0) + 1,
        })
        .eq('id', roomId);

      setPhase('studying');
    } catch (err) {
      console.error('Failed to join room:', err);
      alert('방 참여에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 방 나가기
  const handleLeave = async () => {
    if (!confirm('정말 나가시겠어요?')) return;

    try {
      const supabase = createClient();

      // 참여자 기록 업데이트
      await supabase
        .from('study_with_me_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', currentUserId);

      // 현재 참여자 수 감소
      await supabase
        .from('study_with_me_rooms')
        .update({
          current_participants: Math.max(0, (room?.current_participants || 1) - 1),
        })
        .eq('id', roomId);

      router.push('/study-with-me');
    } catch (err) {
      console.error('Failed to leave room:', err);
      router.push('/study-with-me');
    }
  };

  // 좌석 선택으로 돌아가기
  const handleBackToSeats = () => {
    setPhase('seat-select');
  };

  // Agora 채널 입장
  const joinAgoraChannel = useCallback(async () => {
    if (isAgoraJoined || !roomId || !currentUserId) return;

    try {
      await agoraService.initialize();

      // 콜백 설정
      agoraService.setCallbacks({
        onUserJoined: (uid) => {
          console.log('Remote user joined:', uid);
        },
        onUserLeft: (uid) => {
          console.log('Remote user left:', uid);
          setCameraStates(prev => {
            const newStates = { ...prev };
            delete newStates[String(uid)];
            return newStates;
          });
        },
        onUserVideoStateChanged: (uid, hasVideo) => {
          console.log('Remote user video state changed:', uid, hasVideo);
          setCameraStates(prev => ({ ...prev, [String(uid)]: hasVideo }));
        },
        onRemoteUserUpdated: (users) => {
          setRemoteUsers(users);
        },
        onError: (error) => {
          console.error('Agora error:', error);
        },
      });

      // 채널 입장 (UID를 user_id의 해시값으로 생성)
      const uid = Math.abs(currentUserId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0)) % 1000000;

      await agoraService.joinChannelAsBroadcaster({
        channelName: `study-room-${roomId}`,
        uid,
      });

      setIsAgoraJoined(true);
      console.log('Agora channel joined');
    } catch (err) {
      console.error('Failed to join Agora channel:', err);
    }
  }, [roomId, currentUserId, isAgoraJoined]);

  // 좌석 선택 후 Agora 채널 입장
  useEffect(() => {
    if (phase === 'studying' && mySeatNumber && !isAgoraJoined) {
      joinAgoraChannel();
    }
  }, [phase, mySeatNumber, isAgoraJoined, joinAgoraChannel]);

  // 세션 상태 업데이트 함수
  const updateSessionStatus = useCallback(async (status: 'waiting' | 'live' | 'ended') => {
    if (!roomId) return;
    try {
      const supabase = createClient();
      await supabase
        .from('study_with_me_rooms')
        .update({ session_status: status })
        .eq('id', roomId);
      console.log('[StudyRoom] session_status updated to:', status);
    } catch (err) {
      console.error('[StudyRoom] Failed to update session status:', err);
    }
  }, [roomId]);

  // 네이티브 카메라 시작 (Agora와 별개로 썸네일용 + 프리뷰용)
  const startNativeCamera = useCallback(async (): Promise<MediaStream | null> => {
    console.log('[StudyRoom] Starting native camera for thumbnails...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      setNativeCameraStream(stream);
      console.log('[StudyRoom] Native camera started successfully');

      // 숨겨진 video 요소 생성 (썸네일 캡처용)
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.style.position = 'absolute';
      video.style.left = '-9999px';
      video.style.top = '-9999px';
      document.body.appendChild(video);
      nativeVideoRef.current = video;

      await video.play();
      console.log('[StudyRoom] Native video element playing');
      return stream;
    } catch (err) {
      console.error('[StudyRoom] Failed to start native camera:', err);
      return null;
    }
  }, []);

  // 네이티브 카메라 중지
  const stopNativeCamera = useCallback(() => {
    console.log('[StudyRoom] Stopping native camera...');
    if (nativeCameraStream) {
      nativeCameraStream.getTracks().forEach(track => track.stop());
      setNativeCameraStream(null);
    }
    if (nativeVideoRef.current) {
      nativeVideoRef.current.remove();
      nativeVideoRef.current = null;
    }
  }, [nativeCameraStream]);

  // 네이티브 마이크 시작 (Agora와 별개로)
  const startNativeMic = useCallback(async (): Promise<MediaStream | null> => {
    console.log('[StudyRoom] Starting native microphone...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      setNativeMicStream(stream);
      console.log('[StudyRoom] Native microphone started successfully');

      // AudioContext로 오디오 레벨 분석
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // 오디오 레벨 모니터링 시작
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      audioLevelIntervalRef.current = setInterval(() => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          // 평균 볼륨 계산 (0-100 범위)
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const normalizedLevel = Math.min(100, Math.round((average / 128) * 100));
          setAudioLevel(normalizedLevel);
        }
      }, 100);

      console.log('[StudyRoom] Audio level monitoring started');
      return stream;
    } catch (err) {
      console.error('[StudyRoom] Failed to start native microphone:', err);
      return null;
    }
  }, []);

  // 네이티브 마이크 중지
  const stopNativeMic = useCallback(() => {
    console.log('[StudyRoom] Stopping native microphone...');

    // 오디오 레벨 모니터링 중지
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }

    // AudioContext 정리
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    // 스트림 정리
    if (nativeMicStream) {
      nativeMicStream.getTracks().forEach(track => track.stop());
      setNativeMicStream(null);
    }

    setAudioLevel(0);
  }, [nativeMicStream]);

  // 네이티브 비디오에서 썸네일 캡처
  const captureNativeThumbnail = useCallback(async () => {
    if (!roomId) {
      console.log('[StudyRoom] Cannot capture: no roomId');
      return;
    }

    const video = nativeVideoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('[StudyRoom] Native video not ready:', {
        hasVideo: !!video,
        videoWidth: video?.videoWidth,
        videoHeight: video?.videoHeight,
      });
      return;
    }

    console.log('[StudyRoom] Capturing from native video:', video.videoWidth, 'x', video.videoHeight);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.log('[StudyRoom] Cannot get canvas context');
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      console.log('[StudyRoom] Canvas drawn from native video');
      await uploadCanvasAsThumbnail(canvas);
    } catch (err) {
      console.error('[StudyRoom] Failed to capture native thumbnail:', err);
    }
  }, [roomId]);

  // 비디오 트랙에서 썸네일 캡처 (Agora용 - 폴백)
  const captureAndUploadThumbnail = useCallback(async (videoTrack: ICameraVideoTrack | null) => {
    // 먼저 네이티브 비디오로 시도
    if (nativeVideoRef.current && nativeVideoRef.current.videoWidth > 0) {
      console.log('[StudyRoom] Using native camera for thumbnail capture');
      await captureNativeThumbnail();
      return;
    }

    // Agora 비디오 트랙이 없으면 리턴
    if (!roomId || !videoTrack) {
      console.log('[StudyRoom] Cannot capture: no roomId or videoTrack, and no native camera');
      return;
    }

    console.log('[StudyRoom] Trying Agora video track for thumbnail...');

    try {
      // 방법 1: Agora가 생성한 video 요소 찾기 (모든 video 요소 검사)
      const videoElements = document.querySelectorAll('video');
      let videoElement: HTMLVideoElement | null = null;

      console.log('[StudyRoom] Found', videoElements.length, 'video elements');

      // 유효한 video 요소 찾기 (dimensions이 있고 재생 중인 것)
      for (const vid of Array.from(videoElements)) {
        console.log('[StudyRoom] Video element:', {
          videoWidth: vid.videoWidth,
          videoHeight: vid.videoHeight,
          readyState: vid.readyState,
          paused: vid.paused,
          hasSrcObject: !!vid.srcObject,
        });

        // videoWidth와 videoHeight가 0보다 크면 유효
        if (vid.videoWidth > 0 && vid.videoHeight > 0 && vid.readyState >= 2) {
          videoElement = vid;
          console.log('[StudyRoom] Found valid video element:', vid.videoWidth, 'x', vid.videoHeight);
          break;
        }
      }

      // 방법 2: MediaStreamTrack에서 직접 캡처 (ImageCapture API)
      if (!videoElement) {
        console.log('[StudyRoom] No valid video element, trying ImageCapture API...');

        const mediaStreamTrack = videoTrack.getMediaStreamTrack();
        if (!mediaStreamTrack) {
          console.log('[StudyRoom] No MediaStreamTrack available');
          return;
        }

        console.log('[StudyRoom] MediaStreamTrack:', {
          kind: mediaStreamTrack.kind,
          enabled: mediaStreamTrack.enabled,
          readyState: mediaStreamTrack.readyState,
        });

        if ('ImageCapture' in window) {
          try {
            const imageCapture = new (window as any).ImageCapture(mediaStreamTrack);
            const bitmap = await imageCapture.grabFrame();
            console.log('[StudyRoom] ImageCapture successful:', bitmap.width, 'x', bitmap.height);

            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(bitmap, 0, 0);

            await uploadCanvasAsThumbnail(canvas);
            return;
          } catch (imgErr) {
            console.error('[StudyRoom] ImageCapture failed:', imgErr);
          }
        } else {
          console.log('[StudyRoom] ImageCapture API not supported');
        }
        return;
      }

      // Canvas에 비디오 프레임 그리기
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.log('[StudyRoom] Cannot get canvas context');
        return;
      }

      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      console.log('[StudyRoom] Canvas drawn from video element');
      await uploadCanvasAsThumbnail(canvas);
    } catch (err) {
      console.error('[StudyRoom] Failed to capture thumbnail:', err);
    }
  }, [roomId, captureNativeThumbnail]);

  // 캔버스를 썸네일로 업로드
  const uploadCanvasAsThumbnail = useCallback(async (canvas: HTMLCanvasElement) => {
    if (!roomId) return;

    try {
      // Blob으로 변환
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.7);
      });

      if (!blob) {
        console.log('[StudyRoom] Failed to create blob from canvas');
        return;
      }

      console.log('[StudyRoom] Uploading thumbnail blob, size:', blob.size, 'bytes');

      // Supabase Storage에 업로드
      const supabase = createClient();

      // 고유한 파일명 생성 (roomId + timestamp)
      const fileName = `thumbnails/${roomId}/thumbnail_${Date.now()}.jpg`;
      console.log('[StudyRoom] Uploading to:', fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('study-rooms')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('[StudyRoom] Thumbnail upload failed:', uploadError.message);

        // 버킷이 없거나 권한 문제일 수 있음
        if (uploadError.message.includes('Bucket not found') ||
            uploadError.message.includes('bucket') ||
            uploadError.message.includes('not found')) {
          console.error('[StudyRoom] Storage bucket "study-rooms" does not exist!');
          console.error('[StudyRoom] Please create it in Supabase Dashboard:');
          console.error('[StudyRoom] 1. Go to Supabase Dashboard > Storage');
          console.error('[StudyRoom] 2. Click "New bucket"');
          console.error('[StudyRoom] 3. Name it "study-rooms"');
          console.error('[StudyRoom] 4. Enable "Public bucket"');
        }
        return;
      }

      console.log('[StudyRoom] Upload successful:', uploadData);

      // Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('study-rooms')
        .getPublicUrl(fileName);

      console.log('[StudyRoom] Public URL:', publicUrl);

      // 방 정보 업데이트
      const { error: updateError } = await supabase
        .from('study_with_me_rooms')
        .update({ thumbnail_url: publicUrl })
        .eq('id', roomId);

      if (updateError) {
        console.error('[StudyRoom] Failed to update thumbnail_url:', updateError);
        return;
      }

      console.log('[StudyRoom] Thumbnail updated successfully!');
    } catch (err) {
      console.error('[StudyRoom] Upload error:', err);
    }
  }, [roomId]);

  // 썸네일 캡처 시작 (네이티브 카메라 우선 사용)
  const startThumbnailCapture = useCallback(async (videoTrack: ICameraVideoTrack | null) => {
    // 기존 인터벌 정리
    if (thumbnailIntervalRef.current) {
      clearInterval(thumbnailIntervalRef.current);
    }

    console.log('[StudyRoom] Starting thumbnail capture...');

    // 네이티브 카메라 시작 (Agora와 별개로)
    await startNativeCamera();

    // 3초 후에 첫 캡처 (비디오가 렌더링될 시간 확보)
    setTimeout(() => {
      console.log('[StudyRoom] First thumbnail capture after delay');
      captureAndUploadThumbnail(videoTrack);
    }, 3000);

    // 30초마다 캡처
    thumbnailIntervalRef.current = setInterval(() => {
      captureAndUploadThumbnail(videoTrack);
    }, 30000);
  }, [captureAndUploadThumbnail, startNativeCamera]);

  // 썸네일 캡처 중지
  const stopThumbnailCapture = useCallback(() => {
    console.log('[StudyRoom] Stopping thumbnail capture...');
    if (thumbnailIntervalRef.current) {
      clearInterval(thumbnailIntervalRef.current);
      thumbnailIntervalRef.current = null;
    }
    // 네이티브 카메라도 중지
    stopNativeCamera();
  }, [stopNativeCamera]);

  // 카메라 토글
  const handleToggleCamera = async () => {
    try {
      if (isCameraOn) {
        // 카메라 끄기
        await agoraService.setCameraEnabled(false);
        setLocalVideoTrack(null);
        setIsCameraOn(false);
        stopThumbnailCapture();

        // 내 카메라 상태 업데이트
        if (currentUserId) {
          setCameraStates(prev => ({ ...prev, [currentUserId]: false }));
        }

        // 다른 사람도 카메라가 꺼져있으면 session_status를 waiting으로
        const anyOtherCameraOn = remoteUsers.some(u => u.hasVideo);
        if (!anyOtherCameraOn) {
          await updateSessionStatus('waiting');
          // 썸네일도 초기화
          const supabase = createClient();
          await supabase
            .from('study_with_me_rooms')
            .update({ thumbnail_url: null })
            .eq('id', roomId);
        }
      } else {
        // 카메라 켜기
        await agoraService.setCameraEnabled(true);
        const videoTrack = agoraService.getLocalVideoTrack();
        setLocalVideoTrack(videoTrack);
        setIsCameraOn(true);

        // 내 카메라 상태 업데이트
        if (currentUserId) {
          setCameraStates(prev => ({ ...prev, [currentUserId]: true }));
        }

        // session_status를 live로 업데이트
        await updateSessionStatus('live');

        // 썸네일 캡처 시작 (네이티브 카메라 사용, Agora 없어도 작동)
        console.log('[StudyRoom] Starting thumbnail capture, videoTrack:', videoTrack ? 'available' : 'null (Mock mode)');
        startThumbnailCapture(videoTrack);
      }
    } catch (err) {
      console.error('Failed to toggle camera:', err);
      alert('카메라 접근에 실패했습니다. 브라우저 권한을 확인해주세요.');
    }
  };

  // 마이크 토글 (네이티브 마이크 우선 사용)
  const handleToggleMic = async () => {
    try {
      if (isMicOn) {
        // 마이크 끄기
        await agoraService.setMicrophoneEnabled(false);
        stopNativeMic();
        setIsMicOn(false);
        console.log('[StudyRoom] Microphone turned off');
      } else {
        // 마이크 켜기 (Agora + 네이티브)
        await agoraService.setMicrophoneEnabled(true);
        await startNativeMic();
        setIsMicOn(true);
        console.log('[StudyRoom] Microphone turned on');
      }
    } catch (err) {
      console.error('Failed to toggle mic:', err);
      alert('마이크 접근에 실패했습니다. 브라우저 권한을 확인해주세요.');
    }
  };

  // 참여자 비디오 보기
  const handleViewParticipant = (participant: Participant) => {
    setVideoViewerState({ visible: true, participant });
  };

  // 비디오 뷰어 닫기
  const handleCloseVideoViewer = () => {
    setVideoViewerState({ visible: false, participant: null });
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopThumbnailCapture();
      agoraService.destroy();
    };
  }, [stopThumbnailCapture]);

  // user_id로부터 Agora UID 생성 (동일한 해시 함수)
  const getUserAgoraUid = (userId: string): number => {
    return Math.abs(userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0)) % 1000000;
  };

  // 참여자의 remoteUser 찾기
  const findRemoteUser = (participant: Participant | null): RemoteUser | undefined => {
    if (!participant) return undefined;
    const uid = getUserAgoraUid(participant.user_id);
    return remoteUsers.find(u => u.uid === uid);
  };

  // 로딩
  if (isLoading || phase === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-500">스터디룸에 입장하는 중...</p>
        </div>
      </div>
    );
  }

  // 에러
  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-900 font-medium mb-2">{error || '방을 찾을 수 없습니다'}</p>
          <Link href="/study-with-me">
            <Button className="bg-green-500 hover:bg-green-600">
              돌아가기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 시간 선택
  if (phase === 'time-select') {
    return (
      <div className="min-h-screen bg-gray-50">
        <TimeSelectModal
          roomName={room.name}
          seatNumber={mySeatNumber || undefined}
          onConfirm={handleTimeConfirm}
          onSkip={handleTimeSkip}
        />
      </div>
    );
  }

  // 좌석 선택
  if (phase === 'seat-select') {
    return (
      <>
        <SeatSelectionView
          room={room}
          participants={participants}
          currentUserId={currentUserId || undefined}
          cameraStates={cameraStates}
          isAlreadyJoined={isAlreadyJoined}
          mySeatNumber={mySeatNumber}
          onSelectSeat={handleSeatSelect}
          onMyProfilePress={handleMySeatClick}
          onViewParticipant={handleViewParticipant}
          onLeave={handleLeave}
        />
        <VideoViewer
          visible={videoViewerState.visible}
          participant={videoViewerState.participant}
          isCameraOn={videoViewerState.participant ? cameraStates[videoViewerState.participant.user_id] || false : false}
          remoteUser={findRemoteUser(videoViewerState.participant)}
          onClose={handleCloseVideoViewer}
        />
      </>
    );
  }

  // 공부 화면
  return (
    <MyStudyScreen
      room={room}
      seatNumber={mySeatNumber || 1}
      timerConfig={timerConfig || undefined}
      isStopwatchMode={isStopwatchMode}
      isCameraOn={isCameraOn}
      isMicOn={isMicOn}
      audioLevel={audioLevel}
      localVideoTrack={localVideoTrack}
      nativeStream={nativeCameraStream}
      onToggleCamera={handleToggleCamera}
      onToggleMic={handleToggleMic}
      onBack={handleBackToSeats}
      onLeave={handleLeave}
    />
  );
}
