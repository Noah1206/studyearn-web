'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Grid3X3, List, SlidersHorizontal, Zap } from 'lucide-react';

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

const categoryOptions = [
  { id: 'all', label: '전체' },
  { id: 'korean', label: '국어' },
  { id: 'math', label: '수학' },
  { id: 'english', label: '영어' },
  { id: 'science', label: '과학' },
  { id: 'social', label: '사회' },
  { id: 'history', label: '한국사' },
  { id: 'routine', label: '루틴/플래너' },
  { id: 'etc', label: '기타' },
];

const gradeOptions = [
  { id: 'all', label: '전체' },
  { id: 'middle', label: '중학교' },
  { id: 'high', label: '고등학교' },
  { id: 'university', label: '대학교' },
  { id: 'cert', label: '자격증' },
];

const sortOptions = [
  { id: 'popular', label: '인기순' },
  { id: 'newest', label: '최신순' },
  { id: 'price-low', label: '낮은 가격순' },
  { id: 'price-high', label: '높은 가격순' },
  { id: 'rating', label: '평점순' },
];

// 드롭다운 컴포넌트
function Dropdown({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.id === value)?.label || label;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors',
          'border border-gray-200 hover:border-gray-300 bg-white',
          value !== 'all' && 'border-gray-900 bg-gray-900 text-white hover:bg-gray-800'
        )}
      >
        {value === 'all' ? label : selectedLabel}
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-30">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
              className={cn(
                'w-full px-4 py-2.5 text-left text-sm transition-colors',
                value === option.id
                  ? 'bg-gray-50 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

  // 활성 필터에서 카테고리와 학년 값 추출
  const activeCategory = activeFilters.find(f => f.type === 'category')?.id || 'all';
  const activeGrade = activeFilters.find(f => f.type === 'grade')?.id || 'all';
  const isFreeOnly = activeFilters.some(f => f.type === 'price');

  const handleCategoryChange = (id: string) => {
    if (id === 'all') {
      onRemoveFilter(activeCategory, 'category');
    } else {
      // 기존 카테고리 제거 후 새로 추가하는 로직은 부모에서 처리
      // 여기서는 단순히 필터 변경 트리거
      if (activeCategory !== 'all') {
        onRemoveFilter(activeCategory, 'category');
      }
    }
  };

  return (
    <div className="mb-6">
      {/* 상단 필터 바 */}
      <div className="flex items-center gap-3 pb-4 overflow-x-auto scrollbar-hide">
        {/* 모바일 필터 버튼 */}
        {onMobileFilterClick && (
          <button
            onClick={onMobileFilterClick}
            className="lg:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors flex-shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
            필터
            {activeFilters.length > 0 && (
              <span className="flex items-center justify-center w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full">
                {activeFilters.length}
              </span>
            )}
          </button>
        )}

        {/* 카테고리 드롭다운 */}
        <Dropdown
          label="카테고리 선택"
          options={categoryOptions}
          value={activeCategory}
          onChange={handleCategoryChange}
        />

        {/* 학년 드롭다운 */}
        <Dropdown
          label="학년"
          options={gradeOptions}
          value={activeGrade}
          onChange={(id) => {
            if (id === 'all' && activeGrade !== 'all') {
              onRemoveFilter(activeGrade, 'grade');
            }
          }}
        />

        {/* 구분선 */}
        <div className="w-px h-6 bg-gray-200 flex-shrink-0" />

        {/* 탭 버튼들 */}
        <button
          onClick={() => {
            if (isFreeOnly) {
              onRemoveFilter('free', 'price');
            }
          }}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0',
            isFreeOnly
              ? 'bg-blue-500 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
          )}
        >
          무료
        </button>

        <button
          onClick={() => onSortChange('popular')}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0',
            sortBy === 'popular'
              ? 'bg-blue-500 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
          )}
        >
          인기
        </button>

        <button
          onClick={() => onSortChange('newest')}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0',
            sortBy === 'newest'
              ? 'bg-blue-500 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
          )}
        >
          최신
        </button>

        <button
          onClick={() => onSortChange('rating')}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0',
            sortBy === 'rating'
              ? 'bg-blue-500 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
          )}
        >
          평점높은순
        </button>

        <button
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-400 to-orange-400 text-white flex-shrink-0"
        >
          <Zap className="w-3.5 h-3.5" />
          빠른 응답
        </button>
      </div>

      {/* 하단: 결과 수 + 정렬 + 뷰모드 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          <span className="font-bold text-gray-900">{totalCount.toLocaleString()}</span>개의 자료
        </span>

        <div className="flex items-center gap-3">
          {/* 정렬 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              {sortOptions.find((o) => o.id === sortBy)?.label}
              <ChevronDown className={cn('w-4 h-4', showSortDropdown && 'rotate-180')} />
            </button>

            {showSortDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        onSortChange(option.id);
                        setShowSortDropdown(false);
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm transition-colors',
                        sortBy === option.id
                          ? 'bg-gray-50 text-gray-900 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 뷰 모드 토글 */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'p-1.5 rounded transition-all',
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
                'p-1.5 rounded transition-all',
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
    </div>
  );
}

export default FilterTagBar;
