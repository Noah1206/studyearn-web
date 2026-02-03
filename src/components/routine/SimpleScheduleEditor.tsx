'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoutineItem, RoutineType, generateId } from './types';
import { AddItemModal } from './AddItemModal';
import { ScheduleItemList } from './ScheduleItemList';

interface SimpleScheduleEditorProps {
  routineType: RoutineType;
  items: RoutineItem[];
  onChange: (items: RoutineItem[]) => void;
  customDays?: number;
  className?: string;
}

export function SimpleScheduleEditor({
  routineType,
  items,
  onChange,
  customDays = 30,
  className,
}: SimpleScheduleEditorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoutineItem | null>(null);

  // 항목 추가
  const handleAdd = (item: RoutineItem) => {
    if (editingItem) {
      // 수정 모드
      onChange(items.map((i) => (i.id === item.id ? item : i)));
    } else {
      // 새로 추가
      onChange([...items, item]);
    }
    setEditingItem(null);
  };

  // 항목 삭제
  const handleDelete = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  // 항목 수정
  const handleEdit = (item: RoutineItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // 루틴 타입 라벨
  const getTypeLabel = () => {
    switch (routineType) {
      case 'day':
        return '하루 시간표';
      case 'week':
        return '주간 플래너';
      case 'month':
        return '월간 플래너';
      case 'custom':
        return `${customDays}일 플래너`;
      default:
        return '플래너';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{getTypeLabel()}</h3>
          <p className="text-sm text-gray-500">
            {items.length}개 항목
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-md font-medium hover:bg-gray-900 transition-colors"
        >
          <Plus className="w-5 h-5" />
          항목 추가
        </button>
      </div>

      {/* 아이템 리스트 */}
      <ScheduleItemList
        items={items}
        routineType={routineType}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* 추가/수정 모달 */}
      <AddItemModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAdd={handleAdd}
        routineType={routineType}
        customDays={customDays}
        editItem={editingItem}
      />
    </div>
  );
}
