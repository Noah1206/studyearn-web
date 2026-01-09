'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Calculator,
  Languages,
  Beaker,
  Globe,
  History,
  CalendarCheck,
  GraduationCap,
  Grid3X3,
  ChevronDown,
  RotateCcw,
  Star,
} from 'lucide-react';

interface Category {
  id: string;
  label: string;
  icon: typeof BookOpen;
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

// 기본 카테고리
export const defaultCategories: Category[] = [
  { id: 'all', label: '전체', icon: Grid3X3 },
  { id: 'korean', label: '국어', icon: BookOpen },
  { id: 'math', label: '수학', icon: Calculator },
  { id: 'english', label: '영어', icon: Languages },
  { id: 'science', label: '과학', icon: Beaker },
  { id: 'social', label: '사회', icon: Globe },
  { id: 'history', label: '한국사', icon: History },
  { id: 'routine', label: '루틴/플래너', icon: CalendarCheck },
  { id: 'etc', label: '기타', icon: GraduationCap },
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
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    grade: true,
    price: true,
    rating: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    onFilterChange({ ...filters, category: categoryId });
  };

  const handleGradeChange = (gradeId: string) => {
    const newGrades = filters.grades.includes(gradeId)
      ? filters.grades.filter((g) => g !== gradeId)
      : [...filters.grades, gradeId];
    onFilterChange({ ...filters, grades: newGrades });
  };

  const handleFreeOnlyChange = () => {
    onFilterChange({ ...filters, freeOnly: !filters.freeOnly });
  };

  const handleRatingChange = (rating: number) => {
    onFilterChange({ ...filters, minRating: filters.minRating === rating ? 0 : rating });
  };

  const resetFilters = () => {
    onFilterChange({
      category: 'all',
      grades: [],
      freeOnly: false,
      minRating: 0,
    });
  };

  const hasActiveFilters =
    filters.category !== 'all' ||
    filters.grades.length > 0 ||
    filters.freeOnly ||
    filters.minRating > 0;

  return (
    <aside
      className={cn(
        'w-60 flex-shrink-0 bg-white rounded-2xl border border-gray-200 shadow-toss-2 overflow-hidden',
        className
      )}
    >
      {/* 카테고리 섹션 */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => toggleSection('category')}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <span className="font-bold text-gray-900">카테고리</span>
          <ChevronDown
            className={cn(
              'w-5 h-5 text-gray-400 transition-transform',
              expandedSections.category && 'rotate-180'
            )}
          />
        </button>
        <AnimatePresence>
          {expandedSections.category && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-4 space-y-1">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = filters.category === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
                        isActive
                          ? 'bg-orange-50 text-orange-600 border-l-2 border-orange-500'
                          : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      <Icon className={cn('w-4 h-4', isActive && 'text-orange-500')} />
                      <span className={cn('text-sm font-medium', isActive && 'font-bold')}>
                        {category.label}
                      </span>
                      {category.count !== undefined && (
                        <span className={cn('ml-auto text-xs', isActive ? 'text-orange-400' : 'text-gray-400')}>
                          {category.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 학년 필터 섹션 */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => toggleSection('grade')}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <span className="font-bold text-gray-900">학년</span>
          <ChevronDown
            className={cn(
              'w-5 h-5 text-gray-400 transition-transform',
              expandedSections.grade && 'rotate-180'
            )}
          />
        </button>
        <AnimatePresence>
          {expandedSections.grade && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 space-y-2">
                {gradeFilters.slice(1).map((grade) => {
                  const isChecked = filters.grades.includes(grade.id);
                  return (
                    <label
                      key={grade.id}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                          isChecked
                            ? 'bg-orange-500 border-orange-500'
                            : 'border-gray-300 group-hover:border-gray-400'
                        )}
                      >
                        {isChecked && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={cn('text-sm', isChecked ? 'text-gray-900 font-medium' : 'text-gray-600')}>
                        {grade.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 가격 필터 섹션 */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <span className="font-bold text-gray-900">가격</span>
          <ChevronDown
            className={cn(
              'w-5 h-5 text-gray-400 transition-transform',
              expandedSections.price && 'rotate-180'
            )}
          />
        </button>
        <AnimatePresence>
          {expandedSections.price && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-colors',
                      filters.freeOnly ? 'bg-orange-500' : 'bg-gray-200'
                    )}
                    onClick={handleFreeOnlyChange}
                  >
                    <div
                      className={cn(
                        'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                        filters.freeOnly ? 'translate-x-5' : 'translate-x-0.5'
                      )}
                    />
                  </div>
                  <span className={cn('text-sm', filters.freeOnly ? 'text-gray-900 font-medium' : 'text-gray-600')}>
                    무료만 보기
                  </span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 평점 필터 섹션 */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => toggleSection('rating')}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <span className="font-bold text-gray-900">평점</span>
          <ChevronDown
            className={cn(
              'w-5 h-5 text-gray-400 transition-transform',
              expandedSections.rating && 'rotate-180'
            )}
          />
        </button>
        <AnimatePresence>
          {expandedSections.rating && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 space-y-2">
                {[4, 3, 2].map((rating) => {
                  const isActive = filters.minRating === rating;
                  return (
                    <button
                      key={rating}
                      onClick={() => handleRatingChange(rating)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all',
                        isActive ? 'bg-orange-50' : 'hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'w-4 h-4',
                              star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                            )}
                          />
                        ))}
                      </div>
                      <span className={cn('text-sm', isActive ? 'text-orange-600 font-medium' : 'text-gray-600')}>
                        {rating}점 이상
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 필터 초기화 */}
      {hasActiveFilters && (
        <div className="p-4">
          <button
            onClick={resetFilters}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            필터 초기화
          </button>
        </div>
      )}
    </aside>
  );
}

export default CategorySidebar;
