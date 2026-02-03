// Routine 관련 타입 정의

export interface RoutineItem {
  id: string;
  day: number; // 0-6 for week, 1-31 for month, or day number for custom
  startHour?: number;
  endHour?: number;
  title: string;
  color: string;
}

export type RoutineType = 'day' | 'week' | 'month' | 'custom';

// 색상 팔레트 (차분한 3가지 색상)
export const ROUTINE_COLORS = [
  { id: 'slate', bg: 'bg-slate-400', label: '회색' },
  { id: 'blue', bg: 'bg-blue-400', label: '파랑' },
  { id: 'emerald', bg: 'bg-emerald-400', label: '초록' },
];

// 요일
export const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];
export const WEEKDAYS_FULL = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];

// 시간 옵션 (6시 ~ 21시)
export const TIME_OPTIONS = Array.from({ length: 16 }, (_, i) => ({
  value: i + 6,
  label: `${(i + 6).toString().padStart(2, '0')}:00`,
}));

// ID 생성 유틸
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
