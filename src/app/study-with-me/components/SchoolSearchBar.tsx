'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Search,
  X,
  GraduationCap,
  Loader2,
  MapPin,
  Clock,
  School,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type SchoolMarkerData, type SchoolType, SCHOOL_TYPE_LABELS } from '@/components/study-map';

// ============================================
// Types
// ============================================
export interface SchoolSearchResult extends SchoolMarkerData {
  address?: string;
  region?: string;
}

export interface SchoolSearchBarProps {
  /** Callback when a school is selected */
  onSchoolSelect: (school: SchoolSearchResult) => void;
  /** Currently selected school */
  selectedSchool?: SchoolSearchResult | null;
  /** Placeholder text */
  placeholder?: string;
  /** Custom className */
  className?: string;
  /** Show recent searches */
  showRecent?: boolean;
  /** Filter by school types */
  schoolTypes?: SchoolType[];
}

// ============================================
// Constants
// ============================================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const RECENT_SEARCHES_KEY = 'studyWithMe_recentSchools';
const MAX_RECENT_SEARCHES = 5;

const SCHOOL_TYPE_COLORS: Record<SchoolType, string> = {
  elementary: 'bg-green-100 text-green-700',
  middle: 'bg-orange-100 text-orange-700',
  high: 'bg-purple-100 text-purple-700',
  university: 'bg-indigo-100 text-indigo-700',
  other: 'bg-gray-100 text-gray-700',
};

// Korean school type mapping
const KOREAN_SCHOOL_TYPE_MAP: Record<string, SchoolType> = {
  '초등학교': 'elementary',
  '중학교': 'middle',
  '고등학교': 'high',
  '대학교': 'university',
  '기타': 'other',
};

// ============================================
// Animation Variants
// ============================================
const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: {
      duration: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.03,
    },
  }),
};

// ============================================
// Utility Functions
// ============================================
const getRecentSearches = (): SchoolSearchResult[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecentSearch = (school: SchoolSearchResult) => {
  if (typeof window === 'undefined') return;
  try {
    const recent = getRecentSearches();
    const filtered = recent.filter((s) => s.id !== school.id);
    const updated = [school, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
};

// ============================================
// Component
// ============================================
export function SchoolSearchBar({
  onSchoolSelect,
  selectedSchool,
  placeholder = '학교를 검색하세요...',
  className,
  showRecent = true,
  schoolTypes,
}: SchoolSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SchoolSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<SchoolSearchResult[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Filter recent searches by school type if specified
  const filteredRecentSearches = useMemo(() => {
    if (!schoolTypes || schoolTypes.length === 0) return recentSearches;
    return recentSearches.filter((s) => schoolTypes.includes(s.type));
  }, [recentSearches, schoolTypes]);

  // Search function
  const searchSchools = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < 1) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/search-schools`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: 15,
            types: schoolTypes,
          }),
        });

        const data = await response.json();
        if (data.success && data.schools) {
          const mapped: SchoolSearchResult[] = data.schools.map((school: {
            name: string;
            type: string;
            region?: string;
            address?: string;
            latitude?: number;
            longitude?: number;
          }) => ({
            id: `${school.name}-${school.address}`,
            name: school.name,
            type: KOREAN_SCHOOL_TYPE_MAP[school.type] || 'other',
            activeRoomsCount: 0, // Will be updated from actual data
            latitude: school.latitude || 37.5665,
            longitude: school.longitude || 126.978,
            address: school.address,
            region: school.region,
          }));
          setResults(mapped);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('School search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [schoolTypes]
  );

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query) {
      debounceRef.current = setTimeout(() => {
        searchSchools(query);
      }, 300);
    } else {
      setResults([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchSchools]);

  // Click outside handler
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

  // Handle school selection
  const handleSelect = (school: SchoolSearchResult) => {
    onSchoolSelect(school);
    saveRecentSearch(school);
    setRecentSearches(getRecentSearches());
    setQuery('');
    setIsOpen(false);
    setResults([]);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = query ? results : filteredRecentSearches;
    if (!isOpen || items.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          handleSelect(items[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  // Clear input
  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  // Display items (search results or recent searches)
  const displayItems = query ? results : (showRecent ? filteredRecentSearches : []);
  const showDropdown = isOpen && (displayItems.length > 0 || isLoading);

  return (
    <div className={cn('relative w-full', className)}>
      {/* Search Input */}
      <div
        className={cn(
          'relative flex items-center',
          'bg-white rounded-2xl',
          'border border-gray-300',
          'transition-all duration-200',
          'hover:border-gray-400',
          isOpen && 'border-primary-500'
        )}
      >
        <div className="absolute left-4 text-gray-400">
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
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedSchool ? selectedSchool.name : placeholder}
          className={cn(
            'w-full pl-12 pr-12 py-4',
            'bg-transparent rounded-2xl',
            'text-gray-900 placeholder-gray-400',
            'focus:outline-none',
            'text-base'
          )}
          aria-label="학교 검색"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />

        {/* Clear/Selected indicator */}
        {(query || selectedSchool) && (
          <button
            type="button"
            onClick={query ? handleClear : () => onSchoolSelect(null as unknown as SchoolSearchResult)}
            className={cn(
              'absolute right-4',
              'p-1 rounded-full',
              'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
              'transition-colors'
            )}
            aria-label="초기화"
          >
            {query ? (
              <X className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            className={cn(
              'absolute z-50 w-full mt-2',
              'bg-white rounded-2xl',
              'border border-gray-100 shadow-xl',
              'max-h-80 overflow-y-auto',
              'scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent'
            )}
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="listbox"
          >
            {/* Section Header */}
            {!query && showRecent && filteredRecentSearches.length > 0 && (
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <Clock className="w-3.5 h-3.5 inline mr-1.5" />
                최근 검색
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="px-4 py-6 text-center">
                <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-primary-500" />
                <p className="text-sm text-gray-500">검색중...</p>
              </div>
            )}

            {/* Results list */}
            {!isLoading && displayItems.length > 0 && (
              <div className="py-1">
                {displayItems.map((school, index) => (
                  <motion.button
                    key={school.id}
                    type="button"
                    custom={index}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    onClick={() => handleSelect(school)}
                    className={cn(
                      'w-full px-4 py-3 text-left',
                      'flex items-start gap-3',
                      'transition-colors',
                      selectedIndex === index
                        ? 'bg-primary-50'
                        : 'hover:bg-gray-50',
                      index === 0 && 'rounded-t-xl',
                      index === displayItems.length - 1 && 'rounded-b-xl'
                    )}
                    role="option"
                    aria-selected={selectedIndex === index}
                  >
                    {/* School icon */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-xl',
                        'flex items-center justify-center',
                        school.type === 'university'
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {school.type === 'university' ? (
                        <GraduationCap className="w-5 h-5" />
                      ) : (
                        <School className="w-5 h-5" />
                      )}
                    </div>

                    {/* School info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {school.name}
                        </span>
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full flex-shrink-0',
                            SCHOOL_TYPE_COLORS[school.type]
                          )}
                        >
                          {SCHOOL_TYPE_LABELS[school.type]}
                        </span>
                      </div>
                      {school.address && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{school.address}</span>
                        </div>
                      )}
                      {school.activeRoomsCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-green-600 mt-0.5">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          <span>{school.activeRoomsCount}개 스터디룸 운영중</span>
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && query && results.length === 0 && (
              <div className="px-4 py-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <School className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  검색 결과가 없습니다
                </p>
                <p className="text-xs text-gray-500">
                  다른 검색어로 시도해보세요
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SchoolSearchBar;
