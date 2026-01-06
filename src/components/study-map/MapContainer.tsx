'use client';

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import Script from 'next/script';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapCenter {
  lat: number;
  lng: number;
}

export interface MapContainerProps {
  /** Kakao Map App Key */
  appKey?: string;
  /** Initial center coordinates */
  initialCenter?: MapCenter;
  /** Initial zoom level (1-14, Kakao uses different scale than Mapbox) */
  initialZoom?: number;
  /** Called when map bounds change (pan/zoom) */
  onBoundsChange?: (bounds: MapBounds, zoom: number) => void;
  /** Called when map is loaded */
  onMapLoad?: (map: kakao.maps.Map) => void;
  /** Called when user location is obtained */
  onUserLocation?: (location: MapCenter) => void;
  /** Custom className */
  className?: string;
  /** Children to render (markers, etc.) */
  children?: React.ReactNode;
}

export interface MapContainerRef {
  getMap: () => kakao.maps.Map | null;
  flyTo: (center: MapCenter, zoom?: number) => void;
  fitBounds: (bounds: MapBounds, padding?: number) => void;
  setZoom: (zoom: number) => void;
  getZoom: () => number;
  getBounds: () => MapBounds | null;
  getCenter: () => MapCenter | null;
}

// Default center: Seoul, South Korea
const DEFAULT_CENTER: MapCenter = { lat: 37.5665, lng: 126.978 };
// Kakao Maps: level 1 = most zoomed in, level 14 = Korea-wide
// Level 7 shows approximately 5km radius
const DEFAULT_ZOOM = 7;

// ============================================
// Component
// ============================================
const MapContainer = forwardRef<MapContainerRef, MapContainerProps>(
  (
    {
      appKey,
      initialCenter = DEFAULT_CENTER,
      initialZoom = DEFAULT_ZOOM,
      onBoundsChange,
      onMapLoad,
      onUserLocation,
      className,
      children,
    },
    ref
  ) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<kakao.maps.Map | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const [kakaoAppKey, setKakaoAppKey] = useState<string>('');

    // Client-side only initialization to avoid hydration mismatch
    useEffect(() => {
      setIsMounted(true);
      const key = appKey || process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || '';
      console.log('[MapContainer] Mounted, API Key:', key ? `${key.substring(0, 8)}...` : 'NOT SET');
      setKakaoAppKey(key);

      if (!key || key.trim() === '' || key === 'your_kakao_javascript_key_here') {
        setMapError('카카오 지도 API 키가 설정되지 않았습니다.');
      }
    }, [appKey]);

    // Get current bounds from map
    const getCurrentBounds = useCallback((): MapBounds | null => {
      if (!mapRef.current) return null;
      const bounds = mapRef.current.getBounds();
      return {
        north: bounds.getNorthEast().getLat(),
        south: bounds.getSouthWest().getLat(),
        east: bounds.getNorthEast().getLng(),
        west: bounds.getSouthWest().getLng(),
      };
    }, []);

    // Initialize map after script loads
    useEffect(() => {
      if (!isScriptLoaded || !mapContainerRef.current || mapRef.current) return;
      if (mapError) return;

      // Wait for kakao object to be available
      if (typeof window === 'undefined' || !window.kakao?.maps) {
        console.error('Kakao maps not available');
        return;
      }

      try {
        window.kakao.maps.load(() => {
          if (!mapContainerRef.current) return;

          const options = {
            center: new window.kakao.maps.LatLng(initialCenter.lat, initialCenter.lng),
            level: initialZoom,
          };

          const map = new window.kakao.maps.Map(mapContainerRef.current, options);
          mapRef.current = map;
          setIsMapReady(true);
          onMapLoad?.(map);

          // Get initial bounds
          const bounds = getCurrentBounds();
          if (bounds) {
            onBoundsChange?.(bounds, map.getLevel());
          }

          // Add event listeners
          window.kakao.maps.event.addListener(map, 'bounds_changed', () => {
            const newBounds = getCurrentBounds();
            if (newBounds) {
              onBoundsChange?.(newBounds, map.getLevel());
            }
          });

          // Try to get user location
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                onUserLocation?.({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                });
              },
              (error) => {
                console.warn('Failed to get user location:', error.message);
              },
              {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000,
              }
            );
          }
        });
      } catch (error) {
        console.error('Failed to initialize Kakao map:', error);
        setMapError('지도 초기화에 실패했습니다.');
      }
    }, [isScriptLoaded, initialCenter, initialZoom, onMapLoad, onBoundsChange, onUserLocation, getCurrentBounds, mapError]);

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        getMap: () => mapRef.current,
        flyTo: (center: MapCenter, zoom?: number) => {
          if (mapRef.current) {
            const position = new window.kakao.maps.LatLng(center.lat, center.lng);
            mapRef.current.panTo(position);
            if (zoom !== undefined) {
              mapRef.current.setLevel(zoom);
            }
          }
        },
        fitBounds: (bounds: MapBounds) => {
          if (mapRef.current) {
            const kakaoBounds = new window.kakao.maps.LatLngBounds(
              new window.kakao.maps.LatLng(bounds.south, bounds.west),
              new window.kakao.maps.LatLng(bounds.north, bounds.east)
            );
            mapRef.current.setBounds(kakaoBounds);
          }
        },
        setZoom: (zoom: number) => {
          if (mapRef.current) {
            mapRef.current.setLevel(zoom);
          }
        },
        getZoom: () => mapRef.current?.getLevel() ?? DEFAULT_ZOOM,
        getBounds: getCurrentBounds,
        getCenter: () => {
          if (!mapRef.current) return null;
          const center = mapRef.current.getCenter();
          return { lat: center.getLat(), lng: center.getLng() };
        },
      }),
      [getCurrentBounds]
    );

    const handleScriptLoad = () => {
      console.log('[MapContainer] Kakao Maps script loaded successfully');
      setIsScriptLoaded(true);
    };

    const handleScriptError = (e: Error) => {
      console.error('[MapContainer] Failed to load Kakao Maps script:', e);
      console.error('[MapContainer] API Key used:', kakaoAppKey ? `${kakaoAppKey.substring(0, 8)}...` : 'EMPTY');
      setMapError('카카오 지도 스크립트를 불러올 수 없습니다.');
    };

    // Show loading state before client-side mount
    if (!isMounted) {
      return (
        <div className={cn('relative w-full h-full', className)}>
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">지도 준비 중...</span>
            </div>
          </div>
        </div>
      );
    }

    // Show error state
    if (mapError) {
      return (
        <div className={cn('relative w-full h-full', className)}>
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-500 text-xl">!</span>
              </div>
              <span className="text-sm text-red-600 text-center max-w-xs">{mapError}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={cn('relative w-full h-full', className)}>
        {kakaoAppKey && (
          <Script
            src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoAppKey}&autoload=false&libraries=services,clusterer`}
            strategy="afterInteractive"
            onLoad={handleScriptLoad}
            onError={handleScriptError}
          />
        )}

        {/* Map container */}
        <div
          ref={mapContainerRef}
          className="w-full h-full"
          style={{ minHeight: '400px' }}
        />

        {/* Loading overlay */}
        {!isMapReady && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">지도 불러오는 중...</span>
            </div>
          </div>
        )}

        {/* Render children when map is ready */}
        {isMapReady && children}
      </div>
    );
  }
);

MapContainer.displayName = 'MapContainer';

export { MapContainer };
