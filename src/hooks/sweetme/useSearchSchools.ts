'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type {
  SchoolWithRelevance,
  SearchSchoolsParams,
  SchoolType,
  Pagination,
} from './types';

/**
 * Query key factory for school search
 */
export const searchSchoolsKeys = {
  all: ['searchSchools'] as const,
  search: (params: SearchSchoolsParams) =>
    [...searchSchoolsKeys.all, params] as const,
};

interface SearchSchoolsResult {
  schools: SchoolWithRelevance[];
  pagination: Pagination;
}

/**
 * Fetch schools using Edge Function with search parameters
 */
async function searchSchools(params: SearchSchoolsParams): Promise<SearchSchoolsResult> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const {
    query,
    latitude,
    longitude,
    radiusKm,
    type,
    region,
    sortBy = 'relevance',
    limit = 20,
    offset = 0,
  } = params;

  // Call Edge Function
  const { data, error } = await supabase.functions.invoke('search-schools', {
    body: {
      query: query?.trim() || undefined,
      latitude,
      longitude,
      radius_km: radiusKm,
      type,
      region,
      sort_by: sortBy,
      limit: Math.min(limit, 100),
      offset,
    },
  });

  if (error) {
    console.error('Error searching schools:', error);
    throw new Error(error.message || '학교 검색에 실패했습니다.');
  }

  if (!data?.success) {
    throw new Error(data?.error || '학교 검색에 실패했습니다.');
  }

  const { schools, pagination } = data.data;

  return {
    schools: (schools || []).map((school: Record<string, unknown>) => ({
      id: school.id as string,
      name: school.name as string,
      type: school.type as SchoolType,
      region: school.region as string,
      address: school.address as string | null,
      latitude: Number(school.latitude),
      longitude: Number(school.longitude),
      distance_km: school.distance_km != null ? Number(school.distance_km) : null,
      active_rooms_count: Number(school.active_rooms_count) || 0,
      total_students: Number(school.total_students) || 0,
      relevance_score: school.relevance_score != null
        ? Number(school.relevance_score)
        : undefined,
    })),
    pagination,
  };
}

/**
 * Hook to search schools with debouncing support
 *
 * @example
 * ```tsx
 * const { data, isLoading, search, searchQuery, clearSearch } = useSearchSchools();
 *
 * // Trigger search
 * <input onChange={(e) => search(e.target.value)} />
 *
 * // With location context
 * const { data, search } = useSearchSchools({
 *   latitude: 37.5665,
 *   longitude: 126.9780,
 *   radiusKm: 50
 * });
 * ```
 */
export function useSearchSchools(
  baseParams?: Omit<SearchSchoolsParams, 'query'>,
  options?: {
    enabled?: boolean;
    debounceMs?: number;
    minQueryLength?: number;
    staleTime?: number;
    cacheTime?: number;
  }
) {
  const {
    enabled = true,
    debounceMs = 300,
    minQueryLength = 1,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 30 * 60 * 1000, // 30 minutes
  } = options || {};

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce the search query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, debounceMs]);

  // Build params for query
  const queryParams: SearchSchoolsParams = {
    ...baseParams,
    query: debouncedQuery,
  };

  const shouldFetch =
    enabled &&
    (debouncedQuery.length >= minQueryLength ||
      (baseParams?.latitude != null && baseParams?.longitude != null));

  const query = useQuery({
    queryKey: searchSchoolsKeys.search(queryParams),
    queryFn: () => searchSchools(queryParams),
    enabled: shouldFetch,
    staleTime,
    gcTime: cacheTime,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  /**
   * Trigger search with a new query string
   */
  const search = useCallback((newQuery: string) => {
    setSearchQuery(newQuery);
  }, []);

  /**
   * Clear the current search
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
  }, []);

  /**
   * Search immediately without debounce
   */
  const searchImmediate = useCallback((newQuery: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchQuery(newQuery);
    setDebouncedQuery(newQuery);
  }, []);

  return {
    ...query,
    searchQuery,
    debouncedQuery,
    search,
    searchImmediate,
    clearSearch,
    isSearching: searchQuery !== debouncedQuery,
  };
}

/**
 * Hook for simple school search query (non-debounced, controlled externally)
 *
 * @example
 * ```tsx
 * const [query, setQuery] = useState('');
 * const { data, isLoading } = useSchoolSearchQuery({
 *   query,
 *   sortBy: 'active_rooms'
 * });
 * ```
 */
export function useSchoolSearchQuery(
  params: SearchSchoolsParams | null,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
  }
) {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000,
    cacheTime = 30 * 60 * 1000,
  } = options || {};

  return useQuery({
    queryKey: params ? searchSchoolsKeys.search(params) : searchSchoolsKeys.all,
    queryFn: () => {
      if (!params) {
        throw new Error('Search params are required');
      }
      return searchSchools(params);
    },
    enabled: enabled && params !== null,
    staleTime,
    gcTime: cacheTime,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

export default useSearchSchools;
