'use client';

import { useState } from 'react';
import { Target, Clock, Sparkles, Play } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface GoalSelectModalProps {
  roomName?: string;
  seatNumber?: number;
  onConfirm: (goalMinutes: number) => void;
}

export default function GoalSelectModal({
  roomName,
  seatNumber,
  onConfirm,
}: GoalSelectModalProps) {
  const [goalHours, setGoalHours] = useState(2);

  const presets = [
    { hours: 0.5, label: '30분', emoji: '⚡', description: '가볍게 시작' },
    { hours: 1, label: '1시간', emoji: '🎯', description: '집중 모드' },
    { hours: 2, label: '2시간', emoji: '🔥', description: '추천' },
    { hours: 3, label: '3시간', emoji: '💪', description: '딥워크' },
    { hours: 4, label: '4시간', emoji: '🚀', description: '마라톤' },
  ];

  const handleConfirm = () => {
    onConfirm(goalHours * 60);
  };

  // 예상 동전 수 계산 (10분당 1개)
  const estimatedCoins = Math.floor(goalHours * 6);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">오늘의 공부 목표</h2>
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

        {/* 프리셋 선택 */}
        <div className="space-y-2 mb-6">
          {presets.map((preset) => (
            <button
              key={preset.hours}
              onClick={() => setGoalHours(preset.hours)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all border-2",
                goalHours === preset.hours
                  ? "bg-green-50 border-green-500 shadow-md"
                  : "bg-gray-50 border-transparent hover:bg-gray-100"
              )}
            >
              <span className="text-2xl">{preset.emoji}</span>
              <div className="flex-1 text-left">
                <div className="font-bold text-gray-900">{preset.label}</div>
                <div className="text-sm text-gray-500">{preset.description}</div>
              </div>
              {goalHours === preset.hours && (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* 예상 결과 */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-4 mb-6 border border-amber-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐷</span>
              <span className="text-sm text-gray-600">목표 달성 시</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-2xl">🪙</span>
              <span className="font-bold text-amber-600">x{estimatedCoins}</span>
            </div>
          </div>
        </div>

        {/* 시작 버튼 */}
        <Button
          onClick={handleConfirm}
          className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg gap-2"
        >
          <Play className="w-5 h-5" />
          공부 시작하기
        </Button>

        {/* 안내 */}
        <p className="text-center text-xs text-gray-400 mt-4">
          목표는 공부 중에도 변경할 수 있어요
        </p>
      </div>
    </div>
  );
}
