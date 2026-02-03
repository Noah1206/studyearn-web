'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNearbySchools, type School, type SchoolType } from '@/hooks/sweetme';
import { getSchoolsNearLocation, type SchoolData, type SchoolType as StaticSchoolType } from '@/data/schools';
import type { SchoolMarkerData } from './index';

// ============================================
// Types
// ============================================
interface NearbySchoolsRecommendationProps {
  userLocation: { lat: number; lng: number } | null;
  onSchoolSelect: (school: SchoolMarkerData) => void;
  maxSchools?: number;
  radiusKm?: number;
  className?: string;
}

interface NearbySchool {
  id: string;
  name: string;
  short_name: string | null;
  type: SchoolType | StaticSchoolType;
  latitude: number;
  longitude: number;
  distance_km: number;
  active_rooms_count: number;
  isRealtime: boolean; // Flag to indicate if data is from real-time source
}

// ============================================
// Helper Functions
// ============================================
function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

// Client-side Haversine calculation for fallback only
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function schoolToMarkerData(school: NearbySchool): SchoolMarkerData {
  const typeMap: Record<string, 'elementary' | 'middle' | 'high' | 'university' | 'other'> = {
    '초등학교': 'elementary',
    '중학교': 'middle',
    '고등학교': 'high',
    '대학교': 'university',
    '기타': 'other',
  };

  return {
    id: school.id,
    name: school.name,
    shortName: school.short_name || undefined,
    type: typeMap[school.type] || 'other',
    activeRoomsCount: school.active_rooms_count,
    latitude: school.latitude,
    longitude: school.longitude,
  };
}

function getSchoolTypeLabel(type: SchoolType | StaticSchoolType): string {
  const labels: Record<string, string> = {
    '중학교': '중',
    '고등학교': '고',
    '대학교': '대',
    '초등학교': '초',
    '기타': '기타',
  };
  return labels[type] || type;
}

function getSchoolTypeColor(type: SchoolType | StaticSchoolType): string {
  const colors: Record<string, string> = {
    '중학교': 'bg-blue-500',
    '고등학교': 'bg-orange-500',
    '대학교': 'bg-purple-500',
    '초등학교': 'bg-green-500',
    '기타': 'bg-gray-500',
  };
  return colors[type] || 'bg-gray-500';
}

// ============================================
// Main Component
// ============================================
export default function NearbySchoolsRecommendation({
  userLocation,
  onSchoolSelect,
  maxSchools = 5,
  radiusKm = 15,
  className,
}: NearbySchoolsRecommendationProps) {
  // Fetch real-time data from Supabase using PostGIS
  // Only fetches middle and high schools (중학교, 고등학교)
  const {
    data: realtimeSchools,
    isLoading,
    isError,
  } = useNearbySchools(
    userLocation
      ? {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          radiusKm,
        }
      : null,
    {
      enabled: !!userLocation,
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    }
  );

  // Fallback to static data when real-time data is unavailable
  const staticSchools = useMemo((): NearbySchool[] => {
    if (!userLocation) return [];

    // Filter for middle and high schools only from static data
    const schools = getSchoolsNearLocation(
      userLocation.lat,
      userLocation.lng,
      radiusKm,
      ['중학교', '고등학교']
    );

    // Add client-calculated distance
    return schools
      .map((school) => ({
        id: school.id,
        name: school.name,
        short_name: school.short_name,
        type: school.type,
        latitude: school.latitude,
        longitude: school.longitude,
        distance_km: getDistanceKm(
          userLocation.lat,
          userLocation.lng,
          school.latitude,
          school.longitude
        ),
        active_rooms_count: school.active_rooms_count, // Static: always 0
        isRealtime: false,
      }))
      .slice(0, maxSchools);
  }, [userLocation, radiusKm, maxSchools]);

  // Merge real-time data with static data
  // Real-time provides: active_rooms_count (live), distance_km (PostGIS)
  // Static provides: school basic info as fallback
  const nearbySchools = useMemo((): NearbySchool[] => {
    if (!userLocation) return [];

    // If real-time data is available, filter for middle/high schools and use it
    if (realtimeSchools && realtimeSchools.length > 0) {
      return realtimeSchools
        .filter((s) => s.type === '중학교' || s.type === '고등학교')
        .map((school) => ({
          id: school.id,
          name: school.name,
          short_name: school.short_name || null,
          type: school.type,
          latitude: school.latitude,
          longitude: school.longitude,
          distance_km: school.distance_km || 0,
          active_rooms_count: school.active_rooms_count, // Real-time!
          isRealtime: true,
        }))
        .slice(0, maxSchools);
    }

    // Fallback to static data during loading or error
    return staticSchools;
  }, [userLocation, realtimeSchools, staticSchools, maxSchools]);

  const handleSchoolClick = (school: NearbySchool) => {
    const markerData = schoolToMarkerData(school);
    onSchoolSelect(markerData);
  };

  // Don't render if no user location
  if (!userLocation) {
    return null;
  }

  // Don't render if no schools found (after loading)
  if (!isLoading && nearbySchools.length === 0) {
    return null;
  }

  return (
    <motion.div
      className={cn(
        'bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/60',
        'overflow-hidden',
        className
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900">내 근처 학교</h3>
            <p className="text-xs text-gray-500">가까운 중·고등학교를 찾아보세요</p>
          </div>
          {/* Loading indicator */}
          {isLoading && (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          )}
        </div>
      </div>

      {/* School List */}
      <div className="divide-y divide-gray-50">
        <AnimatePresence>
          {nearbySchools.map((school, index) => (
            <motion.button
              key={school.id}
              onClick={() => handleSchoolClick(school)}
              className={cn(
                'w-full px-4 py-3 flex items-center gap-3',
                'hover:bg-gray-50 active:bg-gray-100 transition-colors',
                'text-left group'
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* School Type Badge */}
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0',
                  getSchoolTypeColor(school.type)
                )}
              >
                {getSchoolTypeLabel(school.type)}
              </div>

              {/* School Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {school.name}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {formatDistance(school.distance_km)}
                  </span>
                  {/* Real-time active rooms count */}
                  {school.active_rooms_count > 0 && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-orange-500 font-medium">
                        {school.active_rooms_count}개 스터디 진행중
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Navigate Icon */}
              <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Navigation className="w-4 h-4 text-blue-500" />
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          클릭하면 해당 학교로 이동합니다
        </p>
      </div>
    </motion.div>
  );
}
