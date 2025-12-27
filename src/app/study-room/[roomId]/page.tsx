'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Users,
  Clock,
  MessageSquare,
  Settings,
  LogOut,
  Volume2,
  VolumeX,
  Coffee,
  Target,
  Send,
  Loader2,
  X,
  Play,
  Pause,
  SkipForward,
  Timer,
  Armchair,
  Check,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Badge, Avatar } from '@/components/ui';

// Types
interface Participant {
  id: string;
  display_name: string;
  profile_image_url?: string;
  is_host: boolean;
  is_video_on: boolean;
  is_audio_on: boolean;
  study_time: number;
  seat_number: number;
  status: 'studying' | 'break' | 'away';
}

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

interface StudyRoom {
  id: string;
  title: string;
  description?: string;
  host: {
    id: string;
    display_name: string;
    profile_image_url?: string;
  };
  category: string;
  goal?: string;
  participant_count: number;
  max_participants: number;
  is_active: boolean;
  started_at: string;
}

interface TimerConfig {
  workMinutes: number;
  breakMinutes: number;
}

// Phase enum
type StudyPhase = 'time-select' | 'seat-select' | 'studying';

// Time Selection Modal Component
function TimeSelectModal({
  onConfirm,
  onSkip,
}: {
  onConfirm: (workMinutes: number, breakMinutes: number) => void;
  onSkip: () => void;
}) {
  const [workMinutes, setWorkMinutes] = useState(50);
  const [breakMinutes, setBreakMinutes] = useState(10);

  const workOptions = [25, 30, 45, 50, 60, 90, 120];
  const breakOptions = [5, 10, 15, 20, 30];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Timer className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">공부 시간 설정</h2>
          <p className="text-gray-500">포모도로 타이머로 집중력을 높여보세요</p>
        </div>

        {/* Work Time Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            공부 시간
          </label>
          <div className="flex flex-wrap gap-2">
            {workOptions.map((minutes) => (
              <button
                key={minutes}
                onClick={() => setWorkMinutes(minutes)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  workMinutes === minutes
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {minutes}분
              </button>
            ))}
          </div>
        </div>

        {/* Break Time Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            휴식 시간
          </label>
          <div className="flex flex-wrap gap-2">
            {breakOptions.map((minutes) => (
              <button
                key={minutes}
                onClick={() => setBreakMinutes(minutes)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  breakMinutes === minutes
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {minutes}분
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{workMinutes}분</div>
              <div className="text-gray-500">공부</div>
            </div>
            <div className="text-gray-300">+</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{breakMinutes}분</div>
              <div className="text-gray-500">휴식</div>
            </div>
            <div className="text-gray-300">=</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{workMinutes + breakMinutes}분</div>
              <div className="text-gray-500">1사이클</div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => onConfirm(workMinutes, breakMinutes)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3"
          >
            <Play className="w-4 h-4 mr-2" />
            시작하기
          </Button>
          <button
            onClick={onSkip}
            className="w-full py-3 text-gray-500 hover:text-gray-700 text-sm"
          >
            설정 안하고 시작하기 (스톱워치 모드)
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Seat Component
function Seat({
  seatNumber,
  participant,
  isSelected,
  onSelect,
}: {
  seatNumber: number;
  participant?: Participant;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isEmpty = !participant;
  const statusColors = {
    studying: 'bg-green-500',
    break: 'bg-orange-500',
    away: 'bg-gray-400',
  };

  return (
    <motion.button
      whileHover={{ scale: isEmpty ? 1.05 : 1 }}
      whileTap={{ scale: isEmpty ? 0.95 : 1 }}
      onClick={isEmpty ? onSelect : undefined}
      disabled={!isEmpty}
      className={`relative aspect-square rounded-2xl p-3 transition-all ${
        isEmpty
          ? 'bg-gray-100 hover:bg-orange-100 hover:border-orange-300 border-2 border-dashed border-gray-300 cursor-pointer'
          : 'bg-gray-800 cursor-default'
      } ${isSelected ? 'ring-4 ring-orange-500 ring-offset-2' : ''}`}
    >
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-full">
          <Armchair className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-xs text-gray-500">빈 좌석</span>
          <span className="text-xs font-medium text-gray-600">#{seatNumber}</span>
        </div>
      ) : (
        <>
          {/* Participant Video/Avatar */}
          <div className="relative w-full h-full flex items-center justify-center">
            {participant.is_video_on ? (
              <div className="w-full h-full bg-gray-700 rounded-xl" />
            ) : (
              <Avatar
                src={participant.profile_image_url}
                alt={participant.display_name}
                size="lg"
              />
            )}
          </div>

          {/* Status indicator */}
          <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${statusColors[participant.status]} ring-2 ring-white`} />

          {/* Name & Time */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 rounded-b-xl">
            <p className="text-white text-xs font-medium truncate">{participant.display_name}</p>
            <p className="text-white/60 text-[10px]">
              {Math.floor(participant.study_time / 60)}분 공부
            </p>
          </div>

          {/* Seat number */}
          <div className="absolute top-2 left-2 bg-black/50 px-1.5 py-0.5 rounded text-[10px] text-white">
            #{seatNumber}
          </div>
        </>
      )}
    </motion.button>
  );
}

// Seat Selection View Component
function SeatSelectionView({
  participants,
  onSelectSeat,
  roomTitle,
}: {
  participants: Participant[];
  onSelectSeat: (seatNumber: number) => void;
  roomTitle: string;
}) {
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const totalSeats = 12;

  const handleConfirm = () => {
    if (selectedSeat) {
      onSelectSeat(selectedSeat);
    }
  };

  // Create seat map
  const seatMap = new Map(participants.map(p => [p.seat_number, p]));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <Link
          href="/study-with-me"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>돌아가기</span>
        </Link>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">{roomTitle}</h1>
          <p className="text-gray-400">좌석을 선택해주세요</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-400">공부중</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full" />
              <span className="text-sm text-gray-400">휴식중</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full" />
              <span className="text-sm text-gray-400">자리비움</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seats Grid */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
          {Array.from({ length: totalSeats }, (_, i) => i + 1).map((seatNumber) => (
            <Seat
              key={seatNumber}
              seatNumber={seatNumber}
              participant={seatMap.get(seatNumber)}
              isSelected={selectedSeat === seatNumber}
              onSelect={() => setSelectedSeat(seatNumber)}
            />
          ))}
        </div>
      </div>

      {/* Confirm Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900 to-transparent">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleConfirm}
            disabled={!selectedSeat}
            className={`w-full py-4 text-lg ${
              selectedSeat
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
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
        </div>
      </div>
    </div>
  );
}

// Participant Card Component
function ParticipantCard({ participant }: { participant: Participant }) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
  };

  const statusLabels = {
    studying: '공부중',
    break: '휴식중',
    away: '자리비움',
  };

  const statusColors = {
    studying: 'bg-green-500',
    break: 'bg-orange-500',
    away: 'bg-gray-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video"
    >
      {/* Video placeholder */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
        {participant.is_video_on ? (
          <div className="w-full h-full bg-gray-700" />
        ) : (
          <Avatar
            src={participant.profile_image_url}
            alt={participant.display_name}
            size="xl"
          />
        )}
      </div>

      {/* Status indicators */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        {participant.is_host && (
          <Badge className="bg-orange-500 text-white border-0 text-xs">
            호스트
          </Badge>
        )}
        <Badge className={`${statusColors[participant.status]} text-white border-0 text-xs`}>
          {statusLabels[participant.status]}
        </Badge>
      </div>

      {/* Seat number */}
      <div className="absolute top-3 right-3 bg-black/50 px-2 py-1 rounded text-xs text-white">
        #{participant.seat_number}
      </div>

      {/* User info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium text-sm">
              {participant.display_name}
            </span>
            <span className="text-white/60 text-xs">
              {formatTime(participant.study_time)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {!participant.is_audio_on && (
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <MicOff className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            {!participant.is_video_on && (
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <VideoOff className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Main Study Room Page
export default function StudyRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Phase management
  const [phase, setPhase] = useState<StudyPhase>('time-select');
  const [timerConfig, setTimerConfig] = useState<TimerConfig | null>(null);
  const [isStopwatchMode, setIsStopwatchMode] = useState(false);
  const [mySeatNumber, setMySeatNumber] = useState<number | null>(null);

  // Room data
  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  // Media controls
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isSoundOn, setIsSoundOn] = useState(true);

  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [currentPhaseTime, setCurrentPhaseTime] = useState(0); // seconds remaining in current phase
  const [isPaused, setIsPaused] = useState(false);

  // Load room data
  useEffect(() => {
    loadRoom();
  }, [roomId]);

  // Timer logic
  useEffect(() => {
    if (phase !== 'studying' || isPaused) return;

    const interval = setInterval(() => {
      if (!isOnBreak) {
        setElapsedTime(prev => prev + 1);
      }

      if (timerConfig && !isStopwatchMode) {
        setCurrentPhaseTime(prev => {
          if (prev <= 1) {
            // Phase complete
            if (isOnBreak) {
              // Break finished, start new work session
              setIsOnBreak(false);
              setPomodoroCount(c => c + 1);
              return timerConfig.workMinutes * 60;
            } else {
              // Work finished, start break
              setIsOnBreak(true);
              return timerConfig.breakMinutes * 60;
            }
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, isOnBreak, isPaused, timerConfig, isStopwatchMode]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadRoom = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Try to get real room data from study_with_me_rooms
      const { data: roomData } = await supabase
        .from('study_with_me_rooms')
        .select(`
          *,
          host:creator_settings!study_with_me_rooms_host_id_fkey(
            user_id,
            display_name,
            profile_image_url
          )
        `)
        .eq('id', roomId)
        .single();

      if (roomData) {
        setRoom({
          id: roomData.id,
          title: roomData.title,
          description: roomData.description,
          host: {
            id: roomData.host?.user_id || roomData.host_id,
            display_name: roomData.host?.display_name || '호스트',
            profile_image_url: roomData.host?.profile_image_url,
          },
          category: roomData.category || '공부',
          goal: roomData.goal,
          participant_count: roomData.participant_count || 1,
          max_participants: roomData.max_participants || 12,
          is_active: roomData.is_active,
          started_at: roomData.started_at || new Date().toISOString(),
        });

        // Get participants
        const { data: participantsData } = await supabase
          .from('study_with_me_participants')
          .select(`
            *,
            user:profiles(display_name, avatar_url)
          `)
          .eq('room_id', roomId);

        if (participantsData && participantsData.length > 0) {
          setParticipants(participantsData.map((p: any, index: number) => ({
            id: p.user_id,
            display_name: p.user?.display_name || `참여자 ${index + 1}`,
            profile_image_url: p.user?.avatar_url,
            is_host: p.user_id === roomData.host_id,
            is_video_on: p.is_video_on ?? true,
            is_audio_on: p.is_audio_on ?? false,
            study_time: p.study_time || 0,
            seat_number: p.seat_number || index + 1,
            status: p.status || 'studying',
          })));
        }
      } else {
        // Fallback to content-based room (for demo/preview)
        const { data: content } = await supabase
          .from('contents')
          .select(`
            *,
            creator:creator_settings(
              user_id,
              display_name,
              profile_image_url
            )
          `)
          .eq('id', roomId)
          .single();

        if (content) {
          setRoom({
            id: content.id,
            title: content.title,
            description: content.description,
            host: {
              id: content.creator?.user_id || content.creator_id,
              display_name: content.creator?.display_name || '크리에이터',
              profile_image_url: content.creator?.profile_image_url,
            },
            category: content.category || '공부',
            goal: '함께 공부해요!',
            participant_count: 1,
            max_participants: 12,
            is_active: true,
            started_at: new Date().toISOString(),
          });
        }
      }

      // Add some demo participants if none exist
      if (participants.length === 0) {
        setParticipants([
          {
            id: 'p1',
            display_name: '열공러',
            is_host: false,
            is_video_on: true,
            is_audio_on: false,
            study_time: 2800,
            seat_number: 1,
            status: 'studying',
          },
          {
            id: 'p2',
            display_name: '수학천재',
            is_host: false,
            is_video_on: false,
            is_audio_on: false,
            study_time: 1500,
            seat_number: 3,
            status: 'break',
          },
          {
            id: 'p3',
            display_name: '공부왕',
            is_host: true,
            is_video_on: true,
            is_audio_on: true,
            study_time: 4200,
            seat_number: 5,
            status: 'studying',
          },
        ]);
      }

      setChatMessages([
        {
          id: '1',
          user_id: 'p3',
          user_name: '공부왕',
          content: '안녕하세요! 오늘도 화이팅!',
          created_at: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          id: '2',
          user_id: 'p1',
          user_name: '열공러',
          content: '화이팅입니다~',
          created_at: new Date(Date.now() - 1700000).toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Failed to load room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Time select handlers
  const handleTimeConfirm = (workMinutes: number, breakMinutes: number) => {
    setTimerConfig({ workMinutes, breakMinutes });
    setCurrentPhaseTime(workMinutes * 60);
    setPhase('seat-select');
  };

  const handleTimeSkip = () => {
    setIsStopwatchMode(true);
    setPhase('seat-select');
  };

  // Seat select handler
  const handleSeatSelect = (seatNumber: number) => {
    setMySeatNumber(seatNumber);
    setPhase('studying');
  };

  // Format time functions
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhaseTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Chat handler
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: `temp-${Date.now()}`,
      user_id: 'me',
      user_name: '나',
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  // Leave room handler
  const handleLeaveRoom = () => {
    if (confirm('정말 퇴장하시겠습니까?')) {
      router.push('/study-with-me');
    }
  };

  // Skip break handler
  const handleSkipBreak = () => {
    if (timerConfig) {
      setIsOnBreak(false);
      setCurrentPhaseTime(timerConfig.workMinutes * 60);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-400">스터디룸에 입장하는 중...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">스터디룸을 찾을 수 없습니다</p>
          <Link href="/study-with-me">
            <Button>돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Render based on phase
  if (phase === 'time-select') {
    return (
      <div className="min-h-screen bg-gray-900">
        <TimeSelectModal onConfirm={handleTimeConfirm} onSkip={handleTimeSkip} />
      </div>
    );
  }

  if (phase === 'seat-select') {
    return (
      <SeatSelectionView
        participants={participants}
        onSelectSeat={handleSeatSelect}
        roomTitle={room.title}
      />
    );
  }

  // Main study view
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 border-b border-gray-700 px-4 py-3"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLeaveRoom}
              className="p-2 hover:bg-gray-700 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-white font-semibold">{room.title}</h1>
                <Badge className="bg-green-500 text-white border-0 text-xs">LIVE</Badge>
                {mySeatNumber && (
                  <Badge className="bg-orange-500 text-white border-0 text-xs">
                    #{mySeatNumber}번 좌석
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {participants.length + 1}/{room.max_participants}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(elapsedTime)}
                </span>
                {pomodoroCount > 0 && (
                  <span className="flex items-center gap-1 text-orange-400">
                    <Target className="w-4 h-4" />
                    {pomodoroCount}회 완료
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Timer Display */}
          {timerConfig && !isStopwatchMode && (
            <div className={`hidden md:flex items-center gap-3 px-4 py-2 rounded-xl ${
              isOnBreak ? 'bg-green-500/20' : 'bg-orange-500/20'
            }`}>
              <Timer className={`w-5 h-5 ${isOnBreak ? 'text-green-400' : 'text-orange-400'}`} />
              <div>
                <div className={`text-xl font-mono font-bold ${isOnBreak ? 'text-green-400' : 'text-orange-400'}`}>
                  {formatPhaseTime(currentPhaseTime)}
                </div>
                <div className="text-xs text-gray-400">
                  {isOnBreak ? '휴식 중' : '공부 중'}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="text-white hover:bg-gray-700"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-700"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Grid */}
        <main className={`flex-1 p-4 transition-all ${isChatOpen ? 'mr-80' : ''}`}>
          <div className={`grid gap-4 h-full ${
            participants.length <= 2 ? 'grid-cols-1 md:grid-cols-2' :
            participants.length <= 4 ? 'grid-cols-2' :
            'grid-cols-2 md:grid-cols-3'
          }`}>
            {/* My Video */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video ring-2 ring-orange-500"
            >
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                {isVideoOn ? (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-500">카메라</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-white">나</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="absolute top-3 left-3">
                <Badge className="bg-orange-500 text-white border-0 text-xs">나</Badge>
              </div>
              <div className="absolute top-3 right-3 bg-black/50 px-2 py-1 rounded text-xs text-white">
                #{mySeatNumber}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium text-sm">{formatTime(elapsedTime)}</span>
                  <div className="flex items-center gap-1.5">
                    {!isAudioOn && (
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <MicOff className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    {!isVideoOn && (
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <VideoOff className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Other Participants */}
            {participants.map((participant) => (
              <ParticipantCard key={participant.id} participant={participant} />
            ))}
          </div>
        </main>

        {/* Chat Sidebar */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.aside
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-gray-800 border-l border-gray-700 flex flex-col z-30"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-white font-semibold">채팅</h2>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((message) => (
                  <div key={message.id}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-orange-400">
                        {message.user_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{message.content}</p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="메시지 입력..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-4 py-2 bg-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2 bg-orange-500 rounded-xl text-white hover:bg-orange-600 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 border-t border-gray-700 px-4 py-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          {/* Timer controls for pomodoro mode */}
          {timerConfig && !isStopwatchMode && (
            <>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsPaused(!isPaused)}
                className={`p-4 rounded-full transition-colors ${
                  isPaused ? 'bg-green-500 text-white' : 'bg-gray-700 text-white'
                }`}
              >
                {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
              </motion.button>

              {isOnBreak && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSkipBreak}
                  className="p-4 rounded-full bg-gray-700 text-white hover:bg-gray-600"
                >
                  <SkipForward className="w-6 h-6" />
                </motion.button>
              )}

              <div className="w-px h-10 bg-gray-600 mx-2" />
            </>
          )}

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAudioOn(!isAudioOn)}
            className={`p-4 rounded-full transition-colors ${
              isAudioOn ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`p-4 rounded-full transition-colors ${
              isVideoOn ? 'bg-gray-700 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSoundOn(!isSoundOn)}
            className={`p-4 rounded-full transition-colors ${
              isSoundOn ? 'bg-gray-700 text-white' : 'bg-gray-600 text-gray-400'
            }`}
          >
            {isSoundOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (!timerConfig || isStopwatchMode) {
                setIsOnBreak(!isOnBreak);
              }
            }}
            className={`p-4 rounded-full transition-colors ${
              isOnBreak ? 'bg-orange-500 text-white' : 'bg-gray-700 text-white'
            }`}
          >
            <Coffee className="w-6 h-6" />
          </motion.button>

          <div className="w-px h-10 bg-gray-600 mx-2" />

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLeaveRoom}
            className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <LogOut className="w-6 h-6" />
          </motion.button>
        </div>

        {isOnBreak && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-orange-400 text-sm mt-2"
          >
            휴식 중... 타이머가 일시정지되었습니다
          </motion.p>
        )}
      </motion.footer>
    </div>
  );
}
