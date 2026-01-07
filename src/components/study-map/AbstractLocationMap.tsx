'use client';

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { createPortal } from 'react-dom';

// ============================================
// Types
// ============================================
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface AbstractLocationMapProps {
  /** Center coordinates of the map */
  center: Coordinates;
  /** Zoom level (1-20, higher = more zoomed in) */
  zoom?: number;
  /** Minimum zoom level */
  minZoom?: number;
  /** Maximum zoom level */
  maxZoom?: number;
  /** Background color */
  backgroundColor?: string;
  /** Grid pattern color */
  gridColor?: string;
  /** Show distance rings */
  showDistanceRings?: boolean;
  /** Distance ring intervals in km */
  distanceRings?: number[];
  /** Ring color */
  ringColor?: string;
  /** User location (if different from center) */
  userLocation?: Coordinates | null;
  /** Show user location pulse */
  showUserPulse?: boolean;
  /** Location name to display */
  locationName?: string;
  /** Show built-in map controls (zoom, center) */
  showControls?: boolean;
  /** Selected destination to draw connection line */
  selectedDestination?: Coordinates | null;
  /** Show connection line from user to destination */
  showConnectionLine?: boolean;
  /** Children (markers) */
  children?: React.ReactNode;
  /** Called when map moves */
  onMove?: (center: Coordinates, zoom: number) => void;
  /** Called when map click */
  onClick?: (coords: Coordinates) => void;
  /** Called when connection line is clicked */
  onConnectionLineClick?: () => void;
  /** Class name */
  className?: string;
}

export interface AbstractLocationMapRef {
  /** Get current center */
  getCenter: () => Coordinates;
  /** Get current zoom */
  getZoom: () => number;
  /** Set center with optional animation */
  setCenter: (coords: Coordinates, animate?: boolean) => void;
  /** Set zoom with optional animation */
  setZoom: (zoom: number, animate?: boolean) => void;
  /** Convert lat/lng to screen coordinates */
  project: (coords: Coordinates) => ScreenPoint;
  /** Convert screen coordinates to lat/lng */
  unproject: (point: ScreenPoint) => Coordinates;
  /** Get current bounds */
  getBounds: () => MapBounds;
  /** Fit bounds to show all points */
  fitBounds: (bounds: MapBounds, padding?: number) => void;
}

// ============================================
// Constants
// ============================================
const TILE_SIZE = 256;
const EARTH_RADIUS = 6371; // km
const DEFAULT_ZOOM = 14;
const DEFAULT_MIN_ZOOM = 10;
const DEFAULT_MAX_ZOOM = 18;
// Brand colors from StuPle design system
const BRAND_COLORS = {
  background: '#F6F6F7',      // neutral.light
  backgroundAlt: '#FFFFFF',   // white
  grid: 'rgba(26, 26, 26, 0.04)',  // primary with low opacity
  gridAccent: 'rgba(34, 197, 94, 0.08)', // brand.green with low opacity
  ring: 'rgba(49, 130, 246, 0.12)',  // secondary blue
  accent: '#22C55E',          // brand.green (Study With Me)
  accentLight: 'rgba(34, 197, 94, 0.1)',
  dot: 'rgba(26, 26, 26, 0.03)',
  dotAccent: 'rgba(34, 197, 94, 0.06)',
};

const DEFAULT_BG_COLOR = BRAND_COLORS.background;
const DEFAULT_GRID_COLOR = BRAND_COLORS.grid;
const DEFAULT_RING_COLOR = BRAND_COLORS.ring;
const DEFAULT_RINGS = [1, 3, 5, 10];

// Carto Positron - Clean, minimal styled map tiles (free, no API key needed)
const TILE_URL = 'https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}@2x.png';

// Tile cache for performance
const tileCache = new Map<string, HTMLImageElement>();

/** Convert lat/lng to tile coordinates */
function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n);
  return { x, y };
}

/** Convert tile coordinates to lat/lng */
function tileToLatLng(x: number, y: number, zoom: number): { lat: number; lng: number } {
  const n = Math.pow(2, zoom);
  const lng = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { lat, lng };
}

/** Load a tile image with caching */
function loadTile(x: number, y: number, z: number): Promise<HTMLImageElement> {
  const key = `${z}/${x}/${y}`;

  if (tileCache.has(key)) {
    return Promise.resolve(tileCache.get(key)!);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      tileCache.set(key, img);
      // Limit cache size
      if (tileCache.size > 200) {
        const firstKey = tileCache.keys().next().value;
        if (firstKey) tileCache.delete(firstKey);
      }
      resolve(img);
    };
    img.onerror = reject;
    img.src = TILE_URL.replace('{z}', z.toString())
      .replace('{x}', x.toString())
      .replace('{y}', y.toString());
  });
}

// ============================================
// Utility Functions
// ============================================

/** Convert latitude to Mercator Y */
function latToMercatorY(lat: number): number {
  const latRad = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + latRad / 2));
}

/** Convert Mercator Y to latitude */
function mercatorYToLat(y: number): number {
  return ((2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180) / Math.PI;
}

/** Get meters per pixel at given latitude and zoom */
function getMetersPerPixel(lat: number, zoom: number): number {
  return (
    (Math.cos((lat * Math.PI) / 180) * 2 * Math.PI * EARTH_RADIUS * 1000) /
    (TILE_SIZE * Math.pow(2, zoom))
  );
}

/** Calculate distance between two coordinates in km */
function getDistance(a: Coordinates, b: Coordinates): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(h));
}

// ============================================
// Context for Markers
// ============================================
interface MapContextValue {
  project: (coords: Coordinates) => ScreenPoint;
  zoom: number;
  center: Coordinates;
  containerSize: { width: number; height: number };
}

const MapContext = React.createContext<MapContextValue | null>(null);

export function useMapContext() {
  const context = React.useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within AbstractLocationMap');
  }
  return context;
}

// ============================================
// Marker Overlay Component
// ============================================
export interface MarkerProps {
  position: Coordinates;
  anchor?: 'center' | 'bottom' | 'top';
  zIndex?: number;
  children: React.ReactNode;
}

export function Marker({ position, anchor = 'bottom', zIndex = 10, children }: MarkerProps) {
  const { project, containerSize } = useMapContext();

  // Don't render until container is ready
  if (containerSize.width === 0 || containerSize.height === 0) return null;

  // Compute screen position directly (no state needed)
  const screenPos = project(position);

  // Check if marker is within viewport
  const padding = 150; // Generous padding for edge visibility
  if (
    screenPos.x < -padding ||
    screenPos.x > containerSize.width + padding ||
    screenPos.y < -padding ||
    screenPos.y > containerSize.height + padding
  ) {
    return null;
  }

  const anchorTransform = {
    center: 'translate(-50%, -50%)',
    bottom: 'translate(-50%, -100%)',
    top: 'translate(-50%, 0%)',
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: screenPos.x,
        top: screenPos.y,
        transform: anchorTransform[anchor],
        zIndex,
        pointerEvents: 'auto',
      }}
    >
      {children}
    </div>
  );
}

// ============================================
// User Location Pulse Component
// ============================================
export interface UserPulseProps {
  position: Coordinates;
  color?: string;
  size?: number;
}

export function UserPulse({ position, color = '#3B82F6', size = 16 }: UserPulseProps) {
  const { project, containerSize } = useMapContext();

  // Don't render until container is ready
  if (containerSize.width === 0 || containerSize.height === 0) return null;

  // Compute screen position directly
  const screenPos = project(position);

  return (
    <div
      style={{
        position: 'absolute',
        left: screenPos.x,
        top: screenPos.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      {/* Outer pulse ring */}
      <div
        className="absolute animate-ping"
        style={{
          width: size * 3,
          height: size * 3,
          borderRadius: '50%',
          backgroundColor: color,
          opacity: 0.3,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      {/* Middle ring */}
      <div
        className="absolute"
        style={{
          width: size * 2,
          height: size * 2,
          borderRadius: '50%',
          backgroundColor: color,
          opacity: 0.2,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      {/* Center dot */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
          border: '3px solid white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  );
}

// ============================================
// Main Component
// ============================================
export const AbstractLocationMap = forwardRef<AbstractLocationMapRef, AbstractLocationMapProps>(
  function AbstractLocationMap(
    {
      center: initialCenter,
      zoom: initialZoom = DEFAULT_ZOOM,
      minZoom = DEFAULT_MIN_ZOOM,
      maxZoom = DEFAULT_MAX_ZOOM,
      backgroundColor = DEFAULT_BG_COLOR,
      gridColor = DEFAULT_GRID_COLOR,
      showDistanceRings = true,
      distanceRings = DEFAULT_RINGS,
      ringColor = DEFAULT_RING_COLOR,
      userLocation,
      showUserPulse = true,
      locationName,
      showControls = true,
      selectedDestination,
      showConnectionLine = true,
      children,
      onMove,
      onClick,
      onConnectionLineClick,
      className,
    },
    ref
  ) {
    // State
    const [center, setCenter] = useState<Coordinates>(initialCenter);
    const [zoom, setZoom] = useState(initialZoom);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dragStartRef = useRef<{ x: number; y: number; center: Coordinates } | null>(null);
    const lastTouchDistRef = useRef<number | null>(null);
    const animationRef = useRef<number | null>(null);

    // Update center when prop changes
    useEffect(() => {
      setCenter(initialCenter);
    }, [initialCenter.lat, initialCenter.lng]);

    // Projection functions
    const project = useCallback(
      (coords: Coordinates): ScreenPoint => {
        const scale = Math.pow(2, zoom);
        const worldSize = TILE_SIZE * scale;

        // Convert to Mercator
        const centerMercX = ((center.lng + 180) / 360) * worldSize;
        const centerMercY =
          ((1 - latToMercatorY(center.lat) / Math.PI) / 2) * worldSize;

        const pointMercX = ((coords.lng + 180) / 360) * worldSize;
        const pointMercY =
          ((1 - latToMercatorY(coords.lat) / Math.PI) / 2) * worldSize;

        return {
          x: containerSize.width / 2 + (pointMercX - centerMercX),
          y: containerSize.height / 2 + (pointMercY - centerMercY),
        };
      },
      [center, zoom, containerSize]
    );

    const unproject = useCallback(
      (point: ScreenPoint): Coordinates => {
        const scale = Math.pow(2, zoom);
        const worldSize = TILE_SIZE * scale;

        const centerMercX = ((center.lng + 180) / 360) * worldSize;
        const centerMercY =
          ((1 - latToMercatorY(center.lat) / Math.PI) / 2) * worldSize;

        const pointMercX = centerMercX + (point.x - containerSize.width / 2);
        const pointMercY = centerMercY + (point.y - containerSize.height / 2);

        const lng = (pointMercX / worldSize) * 360 - 180;
        const mercY = Math.PI * (1 - (2 * pointMercY) / worldSize);
        const lat = mercatorYToLat(mercY);

        return { lat, lng };
      },
      [center, zoom, containerSize]
    );

    const getBounds = useCallback((): MapBounds => {
      const topLeft = unproject({ x: 0, y: 0 });
      const bottomRight = unproject({ x: containerSize.width, y: containerSize.height });
      return {
        north: topLeft.lat,
        south: bottomRight.lat,
        east: bottomRight.lng,
        west: topLeft.lng,
      };
    }, [unproject, containerSize]);

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        getCenter: () => center,
        getZoom: () => zoom,
        setCenter: (coords, animate = true) => {
          if (animate) {
            animateTo(coords, zoom);
          } else {
            setCenter(coords);
          }
        },
        setZoom: (newZoom, animate = true) => {
          const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
          if (animate) {
            animateTo(center, clampedZoom);
          } else {
            setZoom(clampedZoom);
          }
        },
        project,
        unproject,
        getBounds,
        fitBounds: (bounds, padding = 50) => {
          // Calculate center
          const newCenter = {
            lat: (bounds.north + bounds.south) / 2,
            lng: (bounds.east + bounds.west) / 2,
          };

          // Calculate zoom to fit bounds
          const latDiff = bounds.north - bounds.south;
          const lngDiff = bounds.east - bounds.west;
          const latZoom = Math.log2(
            (containerSize.height - padding * 2) / (latDiff * TILE_SIZE / 180)
          );
          const lngZoom = Math.log2(
            (containerSize.width - padding * 2) / (lngDiff * TILE_SIZE / 360)
          );
          const newZoom = Math.max(minZoom, Math.min(maxZoom, Math.min(latZoom, lngZoom)));

          animateTo(newCenter, newZoom);
        },
      }),
      [center, zoom, project, unproject, getBounds, minZoom, maxZoom, containerSize]
    );

    // Animation helper
    const animateTo = useCallback(
      (targetCenter: Coordinates, targetZoom: number) => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        const startCenter = { ...center };
        const startZoom = zoom;
        const startTime = performance.now();
        const duration = 300;

        setIsAnimating(true);

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

          const newCenter = {
            lat: startCenter.lat + (targetCenter.lat - startCenter.lat) * eased,
            lng: startCenter.lng + (targetCenter.lng - startCenter.lng) * eased,
          };
          const newZoom = startZoom + (targetZoom - startZoom) * eased;

          setCenter(newCenter);
          setZoom(newZoom);

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          } else {
            setIsAnimating(false);
            onMove?.(targetCenter, targetZoom);
          }
        };

        animationRef.current = requestAnimationFrame(animate);
      },
      [center, zoom, onMove]
    );

    // Resize observer
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const resizeObserver = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        setContainerSize({ width, height });
      });

      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }, []);

    // Canvas rendering with Carto Positron map tiles + branded overlay
    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx || containerSize.width === 0) return;

      const { width, height } = containerSize;
      const dpr = window.devicePixelRatio || 1;

      // Set canvas size
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      // ============================================
      // 1. Calculate tile positions
      // ============================================
      const tileZoom = Math.floor(zoom);
      const scale = Math.pow(2, zoom);
      const tileScale = Math.pow(2, zoom - tileZoom);
      // Fix: Use TILE_SIZE (256) not TILE_SIZE * 2 for coordinate consistency
      // @2x tiles are 512px images but cover 256 logical pixels of map area
      // This matches the project() function which uses 256 * scale
      const tilePixelSize = TILE_SIZE * tileScale;

      // Calculate which tiles we need
      const centerTile = latLngToTile(center.lat, center.lng, tileZoom);

      // Calculate tile offset within the center tile
      const n = Math.pow(2, tileZoom);
      const exactX = ((center.lng + 180) / 360) * n;
      const latRad = (center.lat * Math.PI) / 180;
      const exactY = (1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n;

      const tileOffsetX = (exactX - centerTile.x) * tilePixelSize;
      const tileOffsetY = (exactY - centerTile.y) * tilePixelSize;

      // Calculate tile range needed to cover the viewport
      const tilesX = Math.ceil(width / tilePixelSize) + 2;
      const tilesY = Math.ceil(height / tilePixelSize) + 2;

      // Load tiles asynchronously
      const tilesToLoad: { x: number; y: number; screenX: number; screenY: number }[] = [];

      for (let dx = -Math.floor(tilesX / 2); dx <= Math.ceil(tilesX / 2); dx++) {
        for (let dy = -Math.floor(tilesY / 2); dy <= Math.ceil(tilesY / 2); dy++) {
          const tileX = centerTile.x + dx;
          const tileY = centerTile.y + dy;

          // Wrap X coordinate
          const wrappedTileX = ((tileX % n) + n) % n;

          // Skip invalid Y tiles
          if (tileY < 0 || tileY >= n) continue;

          const screenX = width / 2 + dx * tilePixelSize - tileOffsetX;
          const screenY = height / 2 + dy * tilePixelSize - tileOffsetY;

          tilesToLoad.push({ x: wrappedTileX, y: tileY, screenX, screenY });
        }
      }

      // Draw overlays on top of tiles
      const drawOverlays = () => {

        // ============================================
        // 3. Draw branded overlay elements on top
        // ============================================
        const userPos = userLocation || center;
        const userScreen = project(userPos);

        // Soft accent glow around user position
        const accentGradient = ctx.createRadialGradient(
          userScreen.x, userScreen.y, 0,
          userScreen.x, userScreen.y, 250
        );
        accentGradient.addColorStop(0, 'rgba(34, 197, 94, 0.15)');
        accentGradient.addColorStop(0.5, 'rgba(34, 197, 94, 0.05)');
        accentGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = accentGradient;
        ctx.fillRect(0, 0, width, height);

        // ============================================
        // 4. Draw distance rings
        // ============================================
        if (showDistanceRings) {
          const metersPerPixel = getMetersPerPixel(userPos.lat, zoom);

          distanceRings.forEach((km, index) => {
            const radiusPx = (km * 1000) / metersPerPixel;

            if (radiusPx > 10 && radiusPx < Math.max(width, height) * 2) {
              // Ring stroke with better visibility on map
              ctx.strokeStyle = index === 0
                ? 'rgba(34, 197, 94, 0.5)'  // Green for closest ring
                : 'rgba(49, 130, 246, 0.35)'; // Blue for other rings
              ctx.lineWidth = index === 0 ? 2.5 : 2;
              ctx.setLineDash([10, 6]);
              ctx.beginPath();
              ctx.arc(userScreen.x, userScreen.y, radiusPx, 0, Math.PI * 2);
              ctx.stroke();

              // Distance label with pill background
              ctx.setLineDash([]);
              const labelText = `${km}km`;
              ctx.font = '600 12px Pretendard, -apple-system, sans-serif';
              const textWidth = ctx.measureText(labelText).width;
              const labelX = userScreen.x;
              const labelY = userScreen.y - radiusPx - 12;
              const pillWidth = textWidth + 18;
              const pillHeight = 24;

              // Pill shadow
              ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
              ctx.beginPath();
              ctx.roundRect(labelX - pillWidth / 2 + 1, labelY - pillHeight / 2 + 2, pillWidth, pillHeight, 12);
              ctx.fill();

              // Pill background
              ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
              ctx.beginPath();
              ctx.roundRect(labelX - pillWidth / 2, labelY - pillHeight / 2, pillWidth, pillHeight, 12);
              ctx.fill();

              // Pill border
              ctx.strokeStyle = index === 0
                ? 'rgba(34, 197, 94, 0.3)'
                : 'rgba(49, 130, 246, 0.25)';
              ctx.lineWidth = 1.5;
              ctx.stroke();

              // Label text
              ctx.fillStyle = index === 0 ? '#16A34A' : '#3B82F6';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(labelText, labelX, labelY);
            }
          });

          ctx.setLineDash([]);
        }

        // ============================================
        // 5. Draw connection line from user to destination
        // ============================================
        if (showConnectionLine && selectedDestination && userLocation) {
          const destScreen = project(selectedDestination);

          // Calculate distance for label
          const distKm = getDistance(userLocation, selectedDestination);
          const distLabel = distKm < 1
            ? `${Math.round(distKm * 1000)}m`
            : `${distKm.toFixed(1)}km`;

          // Draw curved connection line with gradient
          const midX = (userScreen.x + destScreen.x) / 2;
          const midY = (userScreen.y + destScreen.y) / 2;
          const controlOffset = Math.min(100, Math.abs(destScreen.x - userScreen.x) * 0.3);
          const controlY = midY - controlOffset;

          // Line gradient
          const lineGradient = ctx.createLinearGradient(
            userScreen.x, userScreen.y,
            destScreen.x, destScreen.y
          );
          lineGradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
          lineGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.8)');
          lineGradient.addColorStop(1, 'rgba(236, 72, 153, 0.8)');

          // Draw shadow
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.lineWidth = 5;
          ctx.lineCap = 'round';
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(userScreen.x + 1, userScreen.y + 2);
          ctx.quadraticCurveTo(midX + 1, controlY + 2, destScreen.x + 1, destScreen.y + 2);
          ctx.stroke();

          // Draw main line
          ctx.strokeStyle = lineGradient;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(userScreen.x, userScreen.y);
          ctx.quadraticCurveTo(midX, controlY, destScreen.x, destScreen.y);
          ctx.stroke();

          // Draw animated dots along the line (using dashed line as static representation)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 12]);
          ctx.beginPath();
          ctx.moveTo(userScreen.x, userScreen.y);
          ctx.quadraticCurveTo(midX, controlY, destScreen.x, destScreen.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw distance label at midpoint
          const labelX = midX;
          const labelY = controlY - 8;
          ctx.font = '600 11px Pretendard, -apple-system, sans-serif';
          const textWidth = ctx.measureText(distLabel).width;
          const pillWidth = textWidth + 16;
          const pillHeight = 22;

          // Label background
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.beginPath();
          ctx.roundRect(labelX - pillWidth / 2, labelY - pillHeight / 2, pillWidth, pillHeight, 11);
          ctx.fill();

          // Label border
          ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Label text
          ctx.fillStyle = '#7C3AED';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(distLabel, labelX, labelY);

          // Draw endpoint indicator at destination
          ctx.fillStyle = 'rgba(236, 72, 153, 0.2)';
          ctx.beginPath();
          ctx.arc(destScreen.x, destScreen.y, 20, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(236, 72, 153, 0.4)';
          ctx.beginPath();
          ctx.arc(destScreen.x, destScreen.y, 12, 0, Math.PI * 2);
          ctx.fill();
        }

        // ============================================
        // 6. Draw StuPle branding badge
        // ============================================
        const brandingX = width - 12;
        const brandingY = height - 12;
        const brandText = 'StuPle';
        ctx.font = '600 10px Pretendard, -apple-system, sans-serif';
        const brandWidth = ctx.measureText(brandText).width;

        // Background pill for branding
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.roundRect(brandingX - brandWidth - 12, brandingY - 16, brandWidth + 16, 20, 10);
        ctx.fill();

        ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(brandText, brandingX - 4, brandingY - 4);
      };

      // Step 1: Draw cached tiles immediately (sync), mark uncached areas
      const uncachedTiles: typeof tilesToLoad = [];
      tilesToLoad.forEach(({ x, y, screenX, screenY }) => {
        const key = `${tileZoom}/${x}/${y}`;
        const cachedImg = tileCache.get(key);
        if (cachedImg) {
          ctx.drawImage(cachedImg, screenX, screenY, tilePixelSize, tilePixelSize);
        } else {
          // Draw placeholder background only for uncached tiles
          ctx.fillStyle = BRAND_COLORS.background;
          ctx.fillRect(screenX, screenY, tilePixelSize, tilePixelSize);
          uncachedTiles.push({ x, y, screenX, screenY });
        }
      });

      // Draw overlays immediately with cached tiles
      drawOverlays();

      // Step 2: Load uncached tiles and redraw (async)
      if (uncachedTiles.length > 0) {
        Promise.allSettled(
          uncachedTiles.map(({ x, y }) => loadTile(x, y, tileZoom))
        ).then((results) => {
          // Draw newly loaded tiles
          results.forEach((result, i) => {
            if (result.status === 'fulfilled') {
              const { screenX, screenY } = uncachedTiles[i];
              ctx.drawImage(result.value, screenX, screenY, tilePixelSize, tilePixelSize);
            }
          });
          // Redraw overlays on top
          drawOverlays();
        });
      }
    }, [
      containerSize,
      backgroundColor,
      gridColor,
      showDistanceRings,
      distanceRings,
      ringColor,
      center,
      zoom,
      userLocation,
      selectedDestination,
      showConnectionLine,
      project,
    ]);

    // Mouse event handlers
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (isAnimating) return;
        setIsDragging(true);
        dragStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          center: { ...center },
        };
      },
      [center, isAnimating]
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (!isDragging || !dragStartRef.current) return;

        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;

        const scale = Math.pow(2, zoom);
        const worldSize = TILE_SIZE * scale;

        // Drag direction = map move direction (push to move style)
        const dLng = (dx / worldSize) * 360;
        const startMercY =
          ((1 - latToMercatorY(dragStartRef.current.center.lat) / Math.PI) / 2) *
          worldSize;
        const newMercY = startMercY - dy;
        const newLat = mercatorYToLat(
          Math.PI * (1 - (2 * newMercY) / worldSize)
        );

        setCenter({
          lat: Math.max(-85, Math.min(85, newLat)),
          lng: dragStartRef.current.center.lng + dLng,
        });
      },
      [isDragging, zoom]
    );

    // Helper: Check if point is near the connection line (quadratic bezier)
    const isNearConnectionLine = useCallback(
      (clickX: number, clickY: number): boolean => {
        if (!showConnectionLine || !selectedDestination || !userLocation) return false;

        const userScreen = project(userLocation);
        const destScreen = project(selectedDestination);

        // Calculate bezier control point (same as in canvas rendering)
        const midX = (userScreen.x + destScreen.x) / 2;
        const midY = (userScreen.y + destScreen.y) / 2;
        const controlOffset = Math.min(100, Math.abs(destScreen.x - userScreen.x) * 0.3);
        const controlY = midY - controlOffset;

        // Sample points along the bezier curve and check distance
        const threshold = 35; // pixels - generous for easy clicking
        for (let t = 0; t <= 1; t += 0.02) {
          // Quadratic bezier formula: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
          const oneMinusT = 1 - t;
          const bx = oneMinusT * oneMinusT * userScreen.x + 2 * oneMinusT * t * midX + t * t * destScreen.x;
          const by = oneMinusT * oneMinusT * userScreen.y + 2 * oneMinusT * t * controlY + t * t * destScreen.y;

          const dist = Math.sqrt((clickX - bx) ** 2 + (clickY - by) ** 2);
          if (dist < threshold) return true;
        }

        // Also check the endpoint circle area (destination)
        const distToEnd = Math.sqrt((clickX - destScreen.x) ** 2 + (clickY - destScreen.y) ** 2);
        if (distToEnd < 40) return true;

        // Also check the startpoint circle area (user location)
        const distToStart = Math.sqrt((clickX - userScreen.x) ** 2 + (clickY - userScreen.y) ** 2);
        if (distToStart < 40) return true;

        return false;
      },
      [showConnectionLine, selectedDestination, userLocation, project]
    );

    const handleMouseUp = useCallback(
      (e: React.MouseEvent) => {
        const wasDragging = isDragging;
        const dragStart = dragStartRef.current;

        setIsDragging(false);
        dragStartRef.current = null;

        if (wasDragging) {
          onMove?.(center, zoom);

          // Check if it was a click (not a drag) - less than 10px movement
          if (dragStart) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 10) {
              // This was a click, not a drag
              const rect = containerRef.current?.getBoundingClientRect();
              if (rect) {
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;

                // Check if clicked on connection line
                if (onConnectionLineClick && isNearConnectionLine(clickX, clickY)) {
                  onConnectionLineClick();
                  return;
                }

                // Otherwise, trigger normal map click
                if (onClick) {
                  const coords = unproject({ x: clickX, y: clickY });
                  onClick(coords);
                }
              }
            }
          }
        }
      },
      [isDragging, center, zoom, onMove, onClick, onConnectionLineClick, isNearConnectionLine, unproject]
    );

    const handleWheel = useCallback(
      (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = -e.deltaY / 500;
        const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom + delta));
        setZoom(newZoom);
        onMove?.(center, newZoom);
      },
      [zoom, minZoom, maxZoom, center, onMove]
    );

    // Touch event handlers
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    const handleTouchStart = useCallback(
      (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
          setIsDragging(true);
          const touch = e.touches[0];
          touchStartRef.current = { x: touch.clientX, y: touch.clientY };
          dragStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            center: { ...center },
          };
        } else if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          lastTouchDistRef.current = Math.sqrt(dx * dx + dy * dy);
        }
      },
      [center]
    );

    const handleTouchMove = useCallback(
      (e: React.TouchEvent) => {
        if (e.touches.length === 1 && isDragging && dragStartRef.current) {
          const dx = e.touches[0].clientX - dragStartRef.current.x;
          const dy = e.touches[0].clientY - dragStartRef.current.y;

          const scale = Math.pow(2, zoom);
          const worldSize = TILE_SIZE * scale;

          // Drag direction = map move direction (push to move style)
          const dLng = (dx / worldSize) * 360;
          const startMercY =
            ((1 - latToMercatorY(dragStartRef.current.center.lat) / Math.PI) / 2) *
            worldSize;
          const newMercY = startMercY - dy;
          const newLat = mercatorYToLat(
            Math.PI * (1 - (2 * newMercY) / worldSize)
          );

          setCenter({
            lat: Math.max(-85, Math.min(85, newLat)),
            lng: dragStartRef.current.center.lng + dLng,
          });
        } else if (e.touches.length === 2 && lastTouchDistRef.current) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const delta = (dist - lastTouchDistRef.current) / 100;
          const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom + delta));
          setZoom(newZoom);

          lastTouchDistRef.current = dist;
        }
      },
      [isDragging, zoom, minZoom, maxZoom]
    );

    const handleTouchEnd = useCallback(
      (e: React.TouchEvent) => {
        const touchStart = touchStartRef.current;
        const dragStart = dragStartRef.current;

        setIsDragging(false);
        dragStartRef.current = null;
        lastTouchDistRef.current = null;
        touchStartRef.current = null;
        onMove?.(center, zoom);

        // Check if it was a tap (not a drag)
        if (touchStart && dragStart && e.changedTouches.length > 0) {
          const touch = e.changedTouches[0];
          const dx = touch.clientX - touchStart.x;
          const dy = touch.clientY - touchStart.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 10) {
            // This was a tap, not a drag
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              const clickX = touch.clientX - rect.left;
              const clickY = touch.clientY - rect.top;

              // Check if tapped on connection line
              if (onConnectionLineClick && isNearConnectionLine(clickX, clickY)) {
                onConnectionLineClick();
                return;
              }

              // Otherwise, trigger normal map click
              if (onClick) {
                const coords = unproject({ x: clickX, y: clickY });
                onClick(coords);
              }
            }
          }
        }
      },
      [center, zoom, onMove, onClick, onConnectionLineClick, isNearConnectionLine, unproject]
    );

    // Context value
    const contextValue = useMemo(
      () => ({
        project,
        zoom,
        center,
        containerSize,
      }),
      [project, zoom, center, containerSize]
    );

    return (
      <div
        ref={containerRef}
        className={`relative overflow-hidden touch-none select-none ${className || ''}`}
        style={{ width: '100%', height: '100%' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Canvas background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        />

        {/* Location name header */}
        {showControls && locationName && (
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                {locationName} 주변
              </span>
            </div>
          </div>
        )}

        {/* Marker container */}
        <MapContext.Provider value={contextValue}>
          <div className="absolute inset-0 pointer-events-none">
            {children}

            {/* User location pulse */}
            {showUserPulse && userLocation && (
              <UserPulse position={userLocation} />
            )}
          </div>
        </MapContext.Provider>

        {/* Zoom controls */}
        {showControls && (
          <div className="absolute right-4 bottom-24 z-20 flex flex-col gap-1">
            <button
              className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              onClick={() => {
                const newZoom = Math.min(maxZoom, zoom + 1);
                animateTo(center, newZoom);
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
              </svg>
            </button>
            <button
              className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              onClick={() => {
                const newZoom = Math.max(minZoom, zoom - 1);
                animateTo(center, newZoom);
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
              </svg>
            </button>
          </div>
        )}

        {/* Center on user button */}
        {showControls && userLocation && (
          <button
            className="absolute right-4 bottom-40 z-20 w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-blue-500 hover:bg-blue-50 active:bg-blue-100 transition-colors"
            onClick={() => animateTo(userLocation, 15)}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

export default AbstractLocationMap;
