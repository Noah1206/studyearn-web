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
