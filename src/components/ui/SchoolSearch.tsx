'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, GraduationCap, Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface School {
  name: string;
  type: string;
  region: string;
  address: string;
}

interface SchoolSearchProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export function SchoolSearch({
  value,
  onChange,
  label = '학교',
  placeholder = '학교 이름을 검색하세요',
  disabled = false,
  className,
}: SchoolSearchProps) {
  const [query, setQuery] = useState(value || '');
  const [schools, setSchools] = useState<School[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // 검색 함수
  const searchSchools = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 1) {
      setSchools([]);
      return;
    }

    if (!SUPABASE_URL) {
      console.error('SUPABASE_URL is not defined');
      setSchools([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/search-schools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery, limit: 10 }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Edge Function returns { success, data: { schools } }
        const schools = data.data?.schools || data.schools || [];
        setSchools(schools);
      } else {
        setSchools([]);
      }
    } catch (error) {
      console.error('School search error:', error);
      setSchools([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced 검색
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query && query !== value) {
      debounceRef.current = setTimeout(() => {
        searchSchools(query);
      }, 300);
    } else {
      setSchools([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchSchools, value]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 학교 선택
  const handleSelect = (school: School) => {
    onChange(school.name);
    setQuery(school.name);
    setIsOpen(false);
    setSchools([]);
  };

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || schools.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < schools.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(schools[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  // 입력 초기화
  const handleClear = () => {
    setQuery('');
    onChange('');
    setSchools([]);
    inputRef.current?.focus();
  };

  // 타입별 배지 색상
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case '고등학교':
        return 'bg-blue-100 text-blue-700';
      case '중학교':
        return 'bg-green-100 text-green-700';
      case '초등학교':
        return 'bg-yellow-100 text-yellow-700';
      case '대학교':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200',
            'focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent',
            'disabled:bg-gray-50 disabled:cursor-not-allowed',
            'transition-colors'
          )}
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 드롭다운 */}
      {isOpen && schools.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg max-h-64 overflow-y-auto"
        >
          {schools.map((school, index) => (
            <button
              key={`${school.name}-${index}`}
              type="button"
              onClick={() => handleSelect(school)}
              className={cn(
                'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors',
                'flex items-start gap-3',
                index === 0 && 'rounded-t-xl',
                index === schools.length - 1 && 'rounded-b-xl',
                selectedIndex === index && 'bg-gray-50'
              )}
            >
              <GraduationCap className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate">
                    {school.name}
                  </span>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full flex-shrink-0',
                      getTypeBadgeColor(school.type)
                    )}
                  >
                    {school.type}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{school.address}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 검색 결과 없음 */}
      {isOpen && query && query.length >= 1 && !isLoading && schools.length === 0 && query !== value && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg"
        >
          <div className="px-4 py-6 text-center text-gray-500">
            <GraduationCap className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">검색 결과가 없습니다</p>
            <p className="text-xs mt-1">다른 검색어로 시도해보세요</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SchoolSearch;
