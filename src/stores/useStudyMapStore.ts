import { create } from 'zustand';
import type { SchoolMarkerData, RoomMarkerData, MapFilters } from '@/components/study-map';

// ============================================
// Types
// ============================================
export interface MapCenter {
  lat: number;
  lng: number;
}

export interface StudyMapState {
  // Map state
  center: MapCenter;
  zoom: number;
  userLocation: MapCenter | null;
  isLocating: boolean;

  // Selection state
  selectedSchool: SchoolMarkerData | null;
  selectedRoom: RoomMarkerData | null;

  // UI state
  isSidebarOpen: boolean;
  isSearchFocused: boolean;
  searchQuery: string;

  // Filters
  filters: MapFilters;

  // Data
  schools: SchoolMarkerData[];
  rooms: RoomMarkerData[];
}

export interface StudyMapActions {
  // Map actions
  setCenter: (center: MapCenter) => void;
  setZoom: (zoom: number) => void;
  setUserLocation: (location: MapCenter | null) => void;
  setIsLocating: (isLocating: boolean) => void;

  // Selection actions
  selectSchool: (school: SchoolMarkerData | null) => void;
  selectRoom: (room: RoomMarkerData | null) => void;

  // UI actions
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  setSearchFocused: (focused: boolean) => void;
  setSearchQuery: (query: string) => void;

  // Filter actions
  setFilters: (filters: Partial<MapFilters>) => void;
  resetFilters: () => void;

  // Data actions
  setSchools: (schools: SchoolMarkerData[]) => void;
  setRooms: (rooms: RoomMarkerData[]) => void;

  // Compound actions
  handleSchoolClick: (school: SchoolMarkerData) => void;
  handleRoomClick: (room: RoomMarkerData) => void;
  closeAllPanels: () => void;
  reset: () => void;
}

// ============================================
// Constants
// ============================================
const DEFAULT_CENTER: MapCenter = { lat: 37.5665, lng: 126.978 }; // Seoul
const DEFAULT_ZOOM = 14; // Closer zoom for Pokemon GO style (was 12)

const DEFAULT_FILTERS: MapFilters = {
  mySchoolOnly: false,
  liveOnly: false,
  schoolTypes: [],
  categories: [],
};

const initialState: StudyMapState = {
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
  userLocation: null,
  isLocating: false,
  selectedSchool: null,
  selectedRoom: null,
  isSidebarOpen: false,
  isSearchFocused: false,
  searchQuery: '',
  filters: DEFAULT_FILTERS,
  schools: [],
  rooms: [],
};

// ============================================
// Store
// ============================================
export const useStudyMapStore = create<StudyMapState & StudyMapActions>((set, get) => ({
  ...initialState,

  // Map actions
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setUserLocation: (location) => set({ userLocation: location }),
  setIsLocating: (isLocating) => set({ isLocating }),

  // Selection actions
  selectSchool: (school) => set({ selectedSchool: school }),
  selectRoom: (room) => set({ selectedRoom: room }),

  // UI actions
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false, selectedSchool: null }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSearchFocused: (focused) => set({ isSearchFocused: focused }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Filter actions
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  // Data actions
  setSchools: (schools) => set({ schools }),
  setRooms: (rooms) => set({ rooms }),

  // Compound actions
  handleSchoolClick: (school) => {
    set({
      selectedSchool: school,
      selectedRoom: null,
      isSidebarOpen: true,
    });
  },

  handleRoomClick: (room) => {
    set({ selectedRoom: room });
  },

  closeAllPanels: () => {
    set({
      isSidebarOpen: false,
      selectedSchool: null,
      selectedRoom: null,
    });
  },

  reset: () => set(initialState),
}));

// ============================================
// Selectors (for optimized re-renders)
// ============================================
export const selectCenter = (state: StudyMapState) => state.center;
export const selectZoom = (state: StudyMapState) => state.zoom;
export const selectUserLocation = (state: StudyMapState) => state.userLocation;
export const selectSelectedSchool = (state: StudyMapState) => state.selectedSchool;
export const selectSelectedRoom = (state: StudyMapState) => state.selectedRoom;
export const selectIsSidebarOpen = (state: StudyMapState) => state.isSidebarOpen;
export const selectFilters = (state: StudyMapState) => state.filters;
export const selectSchools = (state: StudyMapState) => state.schools;
export const selectRooms = (state: StudyMapState) => state.rooms;

// Export constants
export { DEFAULT_CENTER, DEFAULT_ZOOM, DEFAULT_FILTERS };
