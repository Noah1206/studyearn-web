/**
 * StudyWithMe Map Components
 *
 * Pokemon Go-style map interface for study room discovery.
 * These components work together to provide a location-based
 * study session discovery experience.
 */

// Map Containers
export {
  MapContainer,
  type MapContainerProps,
  type MapContainerRef,
  type MapBounds,
  type MapCenter,
} from './MapContainer';

// Abstract Map (Mapbox-based) - Legacy
export {
  AbstractMapContainer,
  type AbstractMapContainerProps,
  type AbstractMapContainerRef,
  useMapOverlay,
} from './AbstractMapContainer';

// Abstract Location Map (Pure Canvas - No external API)
export {
  AbstractLocationMap,
  Marker as LocationMarker,
  UserPulse,
  useMapContext,
  type AbstractLocationMapProps,
  type AbstractLocationMapRef,
  type Coordinates,
  type ScreenPoint,
  type MapBounds as LocationMapBounds,
  type MarkerProps,
  type UserPulseProps,
} from './AbstractLocationMap';

// Map Marker Overlays
export {
  MapMarkerOverlay,
  UserLocationPulse,
  type MapMarkerOverlayProps,
  type MarkerPosition,
  type UserLocationPulseProps,
} from './MapMarkerOverlay';

// Markers
export {
  SchoolMarker,
  type SchoolMarkerProps,
  type SchoolMarkerData,
  type SchoolType,
  SCHOOL_TYPE_LABELS,
  SCHOOL_TYPE_COLORS,
} from './SchoolMarker';

export {
  RoomMarker,
  type RoomMarkerProps,
  type RoomMarkerData,
  type SessionStatus,
  type RoomCategory,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  STATUS_CONFIG,
} from './RoomMarker';

// Panels and Cards
export { SchoolPanel, type SchoolPanelProps } from './SchoolPanel';

export {
  RoomPreviewCard,
  type RoomPreviewCardProps,
  CATEGORY_LABELS,
} from './RoomPreviewCard';

// Sidebar (new design - left sliding)
export { MapSidebar, type MapSidebarProps } from './MapSidebar';

// Left Sidebar (always visible with search and nearby schools)
export { MapLeftSidebar, type MapLeftSidebarProps } from './MapLeftSidebar';

// Controls
export {
  MapControls,
  type MapControlsProps,
  type MapFilters,
} from './MapControls';

// User Location
export {
  UserLocationMarker,
  type UserLocationMarkerProps,
} from './UserLocationMarker';

// Nearby Schools Recommendation
export { default as NearbySchoolsRecommendation } from './NearbySchoolsRecommendation';
