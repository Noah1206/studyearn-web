'use client';

import { Clock, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoutineItem, RoutineType, WEEKDAYS } from './types';

interface ScheduleItemListProps {
  items: RoutineItem[];
  routineType: RoutineType;
  onEdit: (item: RoutineItem) => void;
  onDelete: (id: string) => void;
}

export function ScheduleItemList({
  items,
  routineType,
  onEdit,
  onDelete,
}: ScheduleItemListProps) {
  // 항목 정렬: day -> startHour 순서
  const sortedItems = [...items].sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return (a.startHour ?? 0) - (b.startHour ?? 0);
  });

  // 날짜 라벨 가져오기
  const getDayLabel = (day: number): string => {
    switch (routineType) {
      case 'day':
        return '';
      case 'week':
        return WEEKDAYS[day] ?? '';
      case 'month':
        return `${day}일`;
      case 'custom':
        return `${day}일차`;
      default:
        return '';
    }
  };

  // 시간 포맷
  const formatTime = (startHour?: number, endHour?: number): string => {
    if (startHour === undefined) return '';
    const start = `${startHour.toString().padStart(2, '0')}:00`;
    const end = endHour ? `${endHour.toString().padStart(2, '0')}:00` : '';
    return end ? `${start} - ${end}` : start;
  };

  if (sortedItems.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>아직 추가된 항목이 없어요</p>
        <p className="text-sm mt-1">+ 버튼을 눌러 추가해보세요</p>
      </div>
    );
  }

  // 그룹핑 (day 기준)
  const groupedItems: { day: number; label: string; items: RoutineItem[] }[] = [];
  const showGroup = routineType !== 'day';

  if (showGroup) {
    sortedItems.forEach((item) => {
      const existing = groupedItems.find((g) => g.day === item.day);
      if (existing) {
        existing.items.push(item);
      } else {
        groupedItems.push({
          day: item.day,
          label: getDayLabel(item.day),
          items: [item],
        });
      }
    });
  }

  return (
    <div className="space-y-4">
      {showGroup ? (
        // 그룹화된 뷰 (주간/월간/커스텀)
        groupedItems.map((group) => (
          <div key={group.day} className="bg-white rounded-md border border-gray-200 overflow-hidden">
            {/* 그룹 헤더 */}
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <span className="font-medium text-gray-700">{group.label}</span>
              <span className="text-sm text-gray-400 ml-2">{group.items.length}개</span>
            </div>
            {/* 그룹 아이템 */}
            <div className="divide-y divide-gray-100">
              {group.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  showTime={routineType === 'week'}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        // 단순 리스트 (일간)
        <div className="bg-white rounded-md border border-gray-200 divide-y divide-gray-100">
          {sortedItems.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              showTime={true}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 개별 아이템 행
function ItemRow({
  item,
  showTime,
  onEdit,
  onDelete,
}: {
  item: RoutineItem;
  showTime: boolean;
  onEdit: (item: RoutineItem) => void;
  onDelete: (id: string) => void;
}) {
  const formatTime = (startHour?: number, endHour?: number): string => {
    if (startHour === undefined) return '';
    const start = `${startHour.toString().padStart(2, '0')}:00`;
    const end = endHour ? `${endHour.toString().padStart(2, '0')}:00` : '';
    return end ? `${start} - ${end}` : start;
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
      {/* 색상 인디케이터 */}
      <div className={cn('w-3 h-3 rounded-full flex-shrink-0', item.color)} />

      {/* 제목 */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{item.title}</p>
        {showTime && item.startHour !== undefined && (
          <p className="text-sm text-gray-500">
            {formatTime(item.startHour, item.endHour)}
          </p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(item)}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="수정"
        >
          <Pencil className="w-4 h-4 text-gray-500" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-2 hover:bg-red-100 rounded transition-colors"
          title="삭제"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </div>
  );
}
