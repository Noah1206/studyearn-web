'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  RoutineItem,
  RoutineType,
  ROUTINE_COLORS,
  WEEKDAYS,
  TIME_OPTIONS,
  generateId,
} from './types';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: RoutineItem) => void;
  routineType: RoutineType;
  customDays?: number;
  editItem?: RoutineItem | null; // 수정 모드일 때
}

export function AddItemModal({
  isOpen,
  onClose,
  onAdd,
  routineType,
  customDays = 30,
  editItem,
}: AddItemModalProps) {
  const [title, setTitle] = useState('');
  const [day, setDay] = useState(0);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(10);
  const [color, setColor] = useState(ROUTINE_COLORS[0].bg);

  // 수정 모드일 때 기존 값으로 초기화
  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title);
      setDay(editItem.day);
      setStartHour(editItem.startHour ?? 9);
      setEndHour(editItem.endHour ?? 10);
      setColor(editItem.color);
    } else {
      // 새로 추가할 때 초기화
      setTitle('');
      setDay(routineType === 'day' ? 0 : 0);
      setStartHour(9);
      setEndHour(10);
      setColor(ROUTINE_COLORS[Math.floor(Math.random() * ROUTINE_COLORS.length)].bg);
    }
  }, [editItem, isOpen, routineType]);

  const handleSubmit = () => {
    if (!title.trim()) return;

    const item: RoutineItem = {
      id: editItem?.id ?? generateId(),
      title: title.trim(),
      day,
      startHour,
      endHour,
      color,
    };

    onAdd(item);
    onClose();
  };

  if (!isOpen) return null;

  // 루틴 타입에 따른 날짜 옵션
  const getDayOptions = () => {
    switch (routineType) {
      case 'day':
        return [{ value: 0, label: '오늘' }];
      case 'week':
        return WEEKDAYS.map((w, i) => ({ value: i, label: w }));
      case 'month':
        return Array.from({ length: 31 }, (_, i) => ({
          value: i + 1,
          label: `${i + 1}일`,
        }));
      case 'custom':
        return Array.from({ length: customDays }, (_, i) => ({
          value: i + 1,
          label: `${i + 1}일차`,
        }));
      default:
        return [];
    }
  };

  const dayOptions = getDayOptions();
  const showDaySelector = routineType !== 'day';
  const showTimeSelector = routineType === 'day' || routineType === 'week';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {editItem ? '항목 수정' : '항목 추가'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 폼 */}
        <div className="space-y-5">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              무엇을 공부하나요?
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 수학 문제풀이"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* 날짜/요일 선택 */}
          {showDaySelector && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {routineType === 'week' ? '요일' : routineType === 'month' ? '날짜' : '일차'}
              </label>
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
              >
                {dayOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 시간 선택 */}
          {showTimeSelector && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시작 시간
                </label>
                <select
                  value={startHour}
                  onChange={(e) => {
                    const newStart = Number(e.target.value);
                    setStartHour(newStart);
                    if (endHour <= newStart) {
                      setEndHour(newStart + 1);
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
                >
                  {TIME_OPTIONS.slice(0, -1).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  종료 시간
                </label>
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
                >
                  {TIME_OPTIONS.filter((opt) => opt.value > startHour).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 색상 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              색상
            </label>
            <div className="flex gap-3">
              {ROUTINE_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.bg)}
                  className={cn(
                    'w-10 h-10 rounded-full transition-all',
                    c.bg,
                    color === c.bg
                      ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                      : 'hover:scale-105'
                  )}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className={cn(
              'flex-1 py-3 rounded-md font-medium transition-colors',
              title.trim()
                ? 'bg-gray-800 text-white hover:bg-gray-900'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            {editItem ? '수정' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
}
