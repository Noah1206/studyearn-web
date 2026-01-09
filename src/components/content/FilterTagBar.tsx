'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, ChevronDown, Grid3X3, List, SlidersHorizontal } from 'lucide-react';

interface ActiveFilter {
  id: string;
  type: 'category' | 'grade' | 'price' | 'rating';
  label: string;
}

interface FilterTagBarProps {
  activeFilters: ActiveFilter[];
  onRemoveFilter: (filterId: string, type: string) => void;
  onClearAll: () => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  totalCount: number;
  onMobileFilterClick?: () => void;
}

const sortOptions = [
  { id: 'popular', label: '인기순' },
  { id: 'newest', label: '최신순' },
  { id: 'price-low', label: '낮은 가격순' },
  { id: 'price-high', label: '높은 가격순' },
  { id: 'rating', label: '평점순' },
];

export function FilterTagBar({
  activeFilters,
  onRemoveFilter,
  onClearAll,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalCount,
  onMobileFilterClick,
}: FilterTagBarProps) {
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      {/* 왼쪽: 활성 필터 태그 */}
      <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
        {/* 모바일 필터 버튼 */}
        {onMobileFilterClick && (
          <button
            onClick={onMobileFilterClick}
            className="lg:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            필터
            {activeFilters.length > 0 && (
              <span className="flex items-center justify-center w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full">
                {activeFilters.length}
              </span>
            )}
          </button>
        )}

        {/* 활성 필터 태그 */}
        <AnimatePresence mode="popLayout">
          {activeFilters.map((filter) => (
            <motion.button
              key={`${filter.type}-${filter.id}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={() => onRemoveFilter(filter.id, filter.type)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors"
            >
              {filter.label}
              <X className="w-3.5 h-3.5" />
            </motion.button>
          ))}
        </AnimatePresence>

        {/* 전체 해제 */}
        {activeFilters.length > 1 && (
          <button
            onClick={onClearAll}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            전체 해제
          </button>
        )}

        {/* 검색 결과 수 */}
        <span className="text-sm text-gray-500 ml-auto sm:ml-0">
          총 <span className="font-bold text-gray-900">{totalCount}</span>개
        </span>
      </div>

      {/* 오른쪽: 정렬 + 뷰 모드 */}
      <div className="flex items-center gap-3">
        {/* 정렬 드롭다운 */}
        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {sortOptions.find((o) => o.id === sortBy)?.label}
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform',
                showSortDropdown && 'rotate-180'
              )}
            />
          </button>

          <AnimatePresence>
            {showSortDropdown && (
              <>
                {/* 백드롭 */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortDropdown(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-36 bg-white rounded-xl shadow-toss-4 border border-gray-100 overflow-hidden z-20"
                >
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        onSortChange(option.id);
                        setShowSortDropdown(false);
                      }}
                      className={cn(
                        'w-full px-4 py-3 text-left text-sm font-medium transition-colors',
                        sortBy === option.id
                          ? 'bg-orange-50 text-orange-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* 뷰 모드 토글 */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              'p-2 rounded-md transition-all',
              viewMode === 'grid'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              'p-2 rounded-md transition-all',
              viewMode === 'list'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterTagBar;
