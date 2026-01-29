'use client';

import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface Category {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

interface GradeFilter {
  id: string;
  label: string;
}

interface ContentFilters {
  category: string;
  grades: string[];
  freeOnly: boolean;
  minRating: number;
}

interface CategorySidebarProps {
  categories: Category[];
  gradeFilters: GradeFilter[];
  filters: ContentFilters;
  onFilterChange: (filters: ContentFilters) => void;
  className?: string;
}

// 기본 카테고리 (크몽 스타일 - 아이콘 없음)
export const defaultCategories: Category[] = [
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

// 기본 학년 필터
export const defaultGradeFilters: GradeFilter[] = [
  { id: 'all', label: '전체 학년' },
  { id: 'middle', label: '중학교' },
  { id: 'high', label: '고등학교' },
  { id: 'university', label: '대학교' },
  { id: 'cert', label: '자격증' },
];

export function CategorySidebar({
  categories = defaultCategories,
  gradeFilters = defaultGradeFilters,
  filters,
  onFilterChange,
  className,
}: CategorySidebarProps) {
  const handleCategoryChange = (categoryId: string) => {
    onFilterChange({ ...filters, category: categoryId });
  };

  const handleGradeChange = (gradeId: string) => {
    const newGrades = filters.grades.includes(gradeId)
      ? filters.grades.filter((g) => g !== gradeId)
      : [...filters.grades, gradeId];
    onFilterChange({ ...filters, grades: newGrades });
  };

  return (
    <aside className={cn('w-52 flex-shrink-0', className)}>
      {/* 메인 배너 - StudyEarn 스타일 */}
      <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 mb-6 overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute top-3 right-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-yellow-400">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
          </svg>
        </div>
        <div className="absolute bottom-0 right-0 w-20 h-20 opacity-80">
          <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
            {/* 책/노트 아이콘 */}
            <rect x="20" y="25" width="35" height="45" rx="3" fill="#F97316" />
            <rect x="25" y="32" width="25" height="3" rx="1" fill="#FDBA74" />
            <rect x="25" y="39" width="20" height="2" rx="1" fill="#FDBA74" />
            <rect x="25" y="45" width="22" height="2" rx="1" fill="#FDBA74" />
            {/* 연필 */}
            <rect x="48" y="18" width="6" height="40" rx="2" fill="#F59E0B" />
            <polygon points="51,58 48,65 54,65" fill="#F59E0B" />
          </svg>
        </div>

        {/* 콘텐츠 */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="font-bold text-gray-900 text-base leading-tight">
              인기 학습자료<br />모아보기
            </h2>
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white text-xs font-bold">TOP</span>
            </div>
          </div>
          <span className="text-sm text-gray-500 hover:text-orange-600 cursor-pointer transition-colors">바로가기 &gt;</span>
        </div>
      </div>

      {/* 카테고리 목록 */}
      <div className="mb-6">
        {categories.map((category) => {
          const isActive = filters.category === category.id;
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={cn(
                'w-full text-left py-2 text-sm transition-colors',
                isActive
                  ? 'text-gray-900 font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {category.label}
              {category.count !== undefined && (
                <span className="ml-1 text-gray-400">({category.count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 학년 필터 */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-900 text-sm mb-3">학년</h3>
        <div className="space-y-2">
          {gradeFilters.slice(1).map((grade) => {
            const isChecked = filters.grades.includes(grade.id);
            return (
              <button
                key={grade.id}
                onClick={() => handleGradeChange(grade.id)}
                className={cn(
                  'w-full text-left py-1.5 text-sm transition-colors flex items-center gap-2',
                  isChecked
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <ChevronDown
                  className={cn(
                    'w-3 h-3 transition-transform -rotate-90',
                    isChecked && 'text-orange-500'
                  )}
                />
                {grade.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 가격 필터 */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-900 text-sm mb-3">가격</h3>
        <button
          onClick={() => onFilterChange({ ...filters, freeOnly: !filters.freeOnly })}
          className={cn(
            'w-full text-left py-1.5 text-sm transition-colors flex items-center gap-2',
            filters.freeOnly
              ? 'text-gray-900 font-medium'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <ChevronDown
            className={cn(
              'w-3 h-3 transition-transform -rotate-90',
              filters.freeOnly && 'text-orange-500'
            )}
          />
          무료
        </button>
      </div>
    </aside>
  );
}

export default CategorySidebar;
