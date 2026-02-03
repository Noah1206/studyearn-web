'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Show search icon on the left */
  showIcon?: boolean;
  /** Size variant */
  inputSize?: 'sm' | 'md' | 'lg';
}

/**
 * SearchInput - 크몽 스타일 검색 입력 필드
 *
 * 둥근 pill 형태의 미니멀한 검색 입력 컴포넌트입니다.
 *
 * @example
 * ```tsx
 * <SearchInput
 *   placeholder="어떤 콘텐츠를 찾고 계세요?"
 *   onChange={(e) => setQuery(e.target.value)}
 * />
 * ```
 */
const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      placeholder = '검색어를 입력하세요',
      showIcon = false,
      inputSize = 'md',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeStyles = {
      sm: 'h-10 text-sm px-4',
      md: 'h-12 text-base px-5',
      lg: 'h-14 text-lg px-6',
    };

    const iconSizeStyles = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    return (
      <div className="relative w-full">
        {showIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Search className={iconSizeStyles[inputSize]} />
          </div>
        )}

        <input
          type="text"
          ref={ref}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            // Base styles - Kmong style
            'w-full rounded-full',
            'bg-white border border-gray-200',
            'text-gray-900 placeholder-gray-400',
            'transition-all duration-200',
            // Focus styles
            'focus:outline-none focus:border-gray-300',
            'focus:ring-2 focus:ring-gray-100',
            // Size
            sizeStyles[inputSize],
            // Icon padding
            showIcon && 'pl-11',
            // Disabled state
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export { SearchInput };
