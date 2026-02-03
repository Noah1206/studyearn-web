'use client';

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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

export interface AbstractMapContainerProps {
  /** Mapbox Access Token */
  accessToken?: string;
  /** Initial center coordinates */
  initialCenter?: MapCenter;
  /** Initial zoom level (0-22, Mapbox standard) */
  initialZoom?: number;
  /** Called when map bounds change (pan/zoom) */
  onBoundsChange?: (bounds: MapBounds, zoom: number) => void;
  /** Called when map is loaded */
  onMapLoad?: (map: mapboxgl.Map) => void;
  /** Called when user location is obtained */
  onUserLocation?: (location: MapCenter) => void;
  /** Called when map is clicked */
  onMapClick?: (lngLat: MapCenter) => void;
  /** Custom className */
  className?: string;
  /** Children to render (overlays) */
  children?: React.ReactNode;
  /** Background color for abstract map */
  backgroundColor?: string;
  /** Enable grid pattern */
  showGrid?: boolean;
  /** Grid opacity (0-1) */
  gridOpacity?: number;
}

export interface AbstractMapContainerRef {
  getMap: () => mapboxgl.Map | null;
  flyTo: (center: MapCenter, zoom?: number) => void;
  fitBounds: (bounds: MapBounds, padding?: number) => void;
  setZoom: (zoom: number) => void;
  getZoom: () => number;
  getBounds: () => MapBounds | null;
  getCenter: () => MapCenter | null;
  project: (lngLat: MapCenter) => { x: number; y: number } | null;
  unproject: (point: { x: number; y: number }) => MapCenter | null;
}

// Default center: Seoul, South Korea
const DEFAULT_CENTER: MapCenter = { lat: 37.5665, lng: 126.978 };
// Mapbox: zoom 0 = world, 22 = building level
// Zoom 14 shows approximately 5km radius
const DEFAULT_ZOOM = 14;

// Abstract map style - completely blank with subtle grid
const ABSTRACT_STYLE: mapboxgl.Style = {
  version: 8,
  name: 'Abstract Style',
  sources: {
    // Grid pattern source
    'grid-source': {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    },
  },
  layers: [
    // Background layer - clean, subtle color
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#FAFBFC', // Very subtle off-white
      },
    },
  ],
  glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
  sprite: 'mapbox://sprites/mapbox/streets-v12',
};

// ============================================
// Component
// ============================================
const AbstractMapContainer = forwardRef<AbstractMapContainerRef, AbstractMapContainerProps>(
  (
    {
      accessToken,
      initialCenter = DEFAULT_CENTER,
      initialZoom = DEFAULT_ZOOM,
      onBoundsChange,
      onMapLoad,
      onUserLocation,
      onMapClick,
      className,
      children,
      backgroundColor = '#FAFBFC',
      showGrid = true,
      gridOpacity = 0.08,
    },
    ref
  ) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const [mapboxToken, setMapboxToken] = useState<string>('');
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // Client-side only initialization
    useEffect(() => {
      setIsMounted(true);
      const token = accessToken || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
      setMapboxToken(token);

      if (!token) {
        setMapError('Mapbox access token이 설정되지 않았습니다.');
      }
    }, [accessToken]);

    // Get current bounds from map
    const getCurrentBounds = useCallback((): MapBounds | null => {
      if (!mapRef.current) return null;
      const bounds = mapRef.current.getBounds();
      if (!bounds) return null;
      return {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      };
    }, []);

    // Initialize map
    useEffect(() => {
      if (!isMounted || !mapContainerRef.current || mapRef.current || !mapboxToken) return;
      if (mapError) return;

      try {
        mapboxgl.accessToken = mapboxToken;

        // Create custom style with user's background color
        const customStyle: mapboxgl.Style = {
          ...ABSTRACT_STYLE,
          layers: [
            {
              id: 'background',
              type: 'background',
              paint: {
                'background-color': backgroundColor,
              },
            },
          ],
        };

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: customStyle,
          center: [initialCenter.lng, initialCenter.lat],
          zoom: initialZoom,
          attributionControl: false,
          logoPosition: 'bottom-right',
          pitchWithRotate: false,
          dragRotate: false,
          touchPitch: false,
          maxPitch: 0,
          minPitch: 0,
        });

        // Disable rotation
        map.touchZoomRotate.disableRotation();

        map.on('load', () => {
          mapRef.current = map;
          setIsMapReady(true);
          onMapLoad?.(map);

          // Add subtle grid pattern
          if (showGrid) {
            addGridPattern(map, gridOpacity);
          }

          // Get initial bounds
          const bounds = getCurrentBounds();
          if (bounds) {
            onBoundsChange?.(bounds, map.getZoom());
          }
        });

        // Handle move events
        map.on('moveend', () => {
          const bounds = getCurrentBounds();
          if (bounds) {
            onBoundsChange?.(bounds, map.getZoom());
          }
        });

        // Handle zoom events
        map.on('zoomend', () => {
          const bounds = getCurrentBounds();
          if (bounds) {
            onBoundsChange?.(bounds, map.getZoom());
          }
        });

        // Handle click events
        map.on('click', (e) => {
          onMapClick?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        });

        // Try to get user location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userLoc = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              onUserLocation?.(userLoc);

              // Fly to user location
              map.flyTo({
                center: [userLoc.lng, userLoc.lat],
                zoom: DEFAULT_ZOOM,
                duration: 1500,
              });
            },
            (error) => {
              console.warn('Failed to get user location:', error.message);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000,
            }
          );
        }

        // Cleanup
        return () => {
          map.remove();
          mapRef.current = null;
        };
      } catch (error) {
        console.error('Failed to initialize Mapbox:', error);
        setMapError('지도 초기화에 실패했습니다.');
      }
    }, [
      isMounted,
      mapboxToken,
      initialCenter,
      initialZoom,
      onMapLoad,
      onBoundsChange,
      onUserLocation,
      onMapClick,
      getCurrentBounds,
      mapError,
      backgroundColor,
      showGrid,
      gridOpacity,
    ]);

    // Track container size for overlay positioning
    useEffect(() => {
      if (!mapContainerRef.current) return;

      const updateSize = () => {
        if (mapContainerRef.current) {
          setContainerSize({
            width: mapContainerRef.current.offsetWidth,
            height: mapContainerRef.current.offsetHeight,
          });
        }
      };

      updateSize();
      const resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(mapContainerRef.current);

      return () => resizeObserver.disconnect();
    }, [isMapReady]);

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        getMap: () => mapRef.current,
        flyTo: (center: MapCenter, zoom?: number) => {
          mapRef.current?.flyTo({
            center: [center.lng, center.lat],
            zoom: zoom ?? mapRef.current.getZoom(),
            duration: 1000,
          });
        },
        fitBounds: (bounds: MapBounds, padding = 50) => {
          mapRef.current?.fitBounds(
            [
              [bounds.west, bounds.south],
              [bounds.east, bounds.north],
            ],
            { padding }
          );
        },
        setZoom: (zoom: number) => {
          mapRef.current?.setZoom(zoom);
        },
        getZoom: () => mapRef.current?.getZoom() ?? DEFAULT_ZOOM,
        getBounds: getCurrentBounds,
        getCenter: () => {
          if (!mapRef.current) return null;
          const center = mapRef.current.getCenter();
          return { lat: center.lat, lng: center.lng };
        },
        project: (lngLat: MapCenter) => {
          if (!mapRef.current) return null;
          const point = mapRef.current.project([lngLat.lng, lngLat.lat]);
          return { x: point.x, y: point.y };
        },
        unproject: (point: { x: number; y: number }) => {
          if (!mapRef.current) return null;
          const lngLat = mapRef.current.unproject([point.x, point.y]);
          return { lat: lngLat.lat, lng: lngLat.lng };
        },
      }),
      [getCurrentBounds]
    );

    // Loading state
    if (!isMounted) {
      return (
        <div className={cn('relative w-full h-full', className)}>
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">지도 준비 중...</span>
            </div>
          </div>
        </div>
      );
    }

    // Error state
    if (mapError) {
      return (
        <div className={cn('relative w-full h-full', className)}>
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-500 text-xl">!</span>
              </div>
              <span className="text-sm text-red-600">{mapError}</span>
              <span className="text-xs text-gray-400">
                NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN 환경 변수를 확인하세요
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={cn('relative w-full h-full overflow-hidden', className)}>
        {/* Map container */}
        <div
          ref={mapContainerRef}
          className="w-full h-full"
          style={{ minHeight: '100%' }}
        />

        {/* Loading overlay */}
        {!isMapReady && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">지도 불러오는 중...</span>
            </div>
          </div>
        )}

        {/* Overlay container for markers - positioned over map */}
        {isMapReady && (
          <MapOverlayContext.Provider
            value={{ map: mapRef.current, containerSize }}
          >
            {children}
          </MapOverlayContext.Provider>
        )}
      </div>
    );
  }
);

AbstractMapContainer.displayName = 'AbstractMapContainer';

// ============================================
// Grid Pattern Helper
// ============================================
function addGridPattern(map: mapboxgl.Map, opacity: number) {
  // Create a subtle dot pattern using a canvas
  const size = 20;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  map.addImage('dot-pattern', { width: size, height: size, data: new Uint8Array(ctx!.getImageData(0, 0, size, size).data) });
}

// ============================================
// Context for Overlay Components
// ============================================
import { createContext, useContext } from 'react';

interface MapOverlayContextType {
  map: mapboxgl.Map | null;
  containerSize: { width: number; height: number };
}

const MapOverlayContext = createContext<MapOverlayContextType>({
  map: null,
  containerSize: { width: 0, height: 0 },
});

export const useMapOverlay = () => useContext(MapOverlayContext);

export { AbstractMapContainer };
