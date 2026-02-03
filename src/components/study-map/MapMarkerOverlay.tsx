'use client';

import { useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useMapOverlay, type MapCenter } from './AbstractMapContainer';

// ============================================
// Types
// ============================================
export interface MarkerPosition {
  x: number;
  y: number;
  visible: boolean;
}

export interface MapMarkerOverlayProps {
  /** Latitude of the marker */
  latitude: number;
  /** Longitude of the marker */
  longitude: number;
  /** Anchor point of the marker */
  anchor?: 'center' | 'bottom' | 'top';
  /** Children to render as marker content */
  children: ReactNode;
  /** Called when marker position updates */
  onPositionChange?: (position: MarkerPosition) => void;
  /** Z-index for stacking */
  zIndex?: number;
  /** Custom className for the container */
  className?: string;
}

// ============================================
// Component
// ============================================
export function MapMarkerOverlay({
  latitude,
  longitude,
  anchor = 'bottom',
  children,
  onPositionChange,
  zIndex = 10,
  className,
}: MapMarkerOverlayProps) {
  const { map, containerSize } = useMapOverlay();
  const [position, setPosition] = useState<MarkerPosition>({
    x: 0,
    y: 0,
    visible: false,
  });
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Calculate marker position on map
  const updatePosition = useCallback(() => {
    if (!map) return;

    try {
      const point = map.project([longitude, latitude]);
      const bounds = map.getBounds();

      // Check if marker is within visible bounds
      const isVisible = bounds
        ? latitude <= bounds.getNorth() &&
          latitude >= bounds.getSouth() &&
          longitude <= bounds.getEast() &&
          longitude >= bounds.getWest()
        : true;

      const newPosition = {
        x: point.x,
        y: point.y,
        visible: isVisible,
      };

      setPosition(newPosition);
      onPositionChange?.(newPosition);
    } catch {
      // Map not ready or coordinates invalid
    }
  }, [map, latitude, longitude, onPositionChange]);

  // Update position on map move/zoom
  useEffect(() => {
    if (!map) return;

    updatePosition();

    map.on('move', updatePosition);
    map.on('zoom', updatePosition);
    map.on('moveend', updatePosition);
    map.on('zoomend', updatePosition);

    return () => {
      map.off('move', updatePosition);
      map.off('zoom', updatePosition);
      map.off('moveend', updatePosition);
      map.off('zoomend', updatePosition);
    };
  }, [map, updatePosition]);

  // Update on container size change
  useEffect(() => {
    updatePosition();
  }, [containerSize, updatePosition]);

  // Calculate anchor offset
  const getAnchorOffset = () => {
    switch (anchor) {
      case 'top':
        return 'translate(-50%, 0)';
      case 'center':
        return 'translate(-50%, -50%)';
      case 'bottom':
      default:
        return 'translate(-50%, -100%)';
    }
  };

  if (!position.visible) return null;

  // Find the map container to create portal
  const mapContainer = map?.getContainer();
  if (!mapContainer) return null;

  // Ensure overlay container exists
  let overlayContainer = mapContainer.querySelector('.map-marker-overlay-container');
  if (!overlayContainer) {
    overlayContainer = document.createElement('div');
    overlayContainer.className = 'map-marker-overlay-container';
    Object.assign((overlayContainer as HTMLElement).style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      overflow: 'hidden',
    });
    mapContainer.appendChild(overlayContainer);
  }

  return createPortal(
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: getAnchorOffset(),
        zIndex,
        pointerEvents: 'auto',
        willChange: 'transform',
      }}
    >
      {children}
    </div>,
    overlayContainer
  );
}

// ============================================
// User Location Pulse Component
// ============================================
export interface UserLocationPulseProps {
  latitude: number;
  longitude: number;
  accuracy?: number; // in meters
  heading?: number; // in degrees
}

export function UserLocationPulse({
  latitude,
  longitude,
  accuracy = 50,
}: UserLocationPulseProps) {
  const { map } = useMapOverlay();
  const [radiusPixels, setRadiusPixels] = useState(0);

  // Calculate accuracy radius in pixels
  useEffect(() => {
    if (!map) return;

    const updateRadius = () => {
      // Convert meters to pixels at current zoom
      const metersPerPixel =
        (40075016.686 * Math.cos((latitude * Math.PI) / 180)) /
        (512 * Math.pow(2, map.getZoom()));
      const pixels = accuracy / metersPerPixel;
      setRadiusPixels(Math.min(pixels, 200)); // Cap at 200px
    };

    updateRadius();
    map.on('zoom', updateRadius);

    return () => {
      map.off('zoom', updateRadius);
    };
  }, [map, latitude, accuracy]);

  return (
    <MapMarkerOverlay
      latitude={latitude}
      longitude={longitude}
      anchor="center"
      zIndex={5}
    >
      <div className="relative flex items-center justify-center">
        {/* Accuracy circle */}
        {radiusPixels > 20 && (
          <div
            className="absolute rounded-full bg-blue-500/10 border border-blue-500/20"
            style={{
              width: radiusPixels * 2,
              height: radiusPixels * 2,
            }}
          />
        )}

        {/* Outer pulse ring */}
        <div className="absolute w-12 h-12 rounded-full bg-blue-500/20 animate-ping" />

        {/* Middle ring */}
        <div className="absolute w-8 h-8 rounded-full bg-blue-500/30" />

        {/* Inner dot */}
        <div className="relative w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
      </div>
    </MapMarkerOverlay>
  );
}

export default MapMarkerOverlay;
