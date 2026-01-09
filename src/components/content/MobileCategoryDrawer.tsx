'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import {
  CategorySidebar,
  defaultCategories,
  defaultGradeFilters,
} from './CategorySidebar';

interface ContentFilters {
  category: string;
  grades: string[];
  freeOnly: boolean;
  minRating: number;
}

interface MobileCategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ContentFilters;
  onFilterChange: (filters: ContentFilters) => void;
}

export function MobileCategoryDrawer({
  isOpen,
  onClose,
  filters,
  onFilterChange,
}: MobileCategoryDrawerProps) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleFilterChange = (newFilters: ContentFilters) => {
    onFilterChange(newFilters);
  };

  const activeFilterCount =
    (filters.category !== 'all' ? 1 : 0) +
    filters.grades.length +
    (filters.freeOnly ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 백드롭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />

          {/* 드로어 */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 lg:hidden max-h-[85vh] bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">필터</h2>
                {activeFilterCount > 0 && (
                  <span className="flex items-center justify-center w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 드래그 핸들 */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 rounded-full" />

            {/* 필터 내용 */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <CategorySidebar
                  categories={defaultCategories}
                  gradeFilters={defaultGradeFilters}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  className="border-0 shadow-none"
                />
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="flex gap-3 p-4 border-t border-gray-100 bg-white">
              <button
                onClick={() => {
                  onFilterChange({
                    category: 'all',
                    grades: [],
                    freeOnly: false,
                    minRating: 0,
                  });
                }}
                className="flex-1 py-3 text-gray-600 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                초기화
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
              >
                적용하기
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default MobileCategoryDrawer;
