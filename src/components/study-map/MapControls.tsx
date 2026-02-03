'use client';

import { forwardRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Plus,
  Minus,
  Navigation,
  Layers,
  Filter,
  X,
  Check,
  School,
  Radio,
  Map,
  List,
  Locate,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Badge } from '@/components/ui';
import { type SchoolType, SCHOOL_TYPE_LABELS } from './SchoolMarker';
import { type RoomCategory } from './RoomMarker';

// ============================================
// Types
// ============================================
export interface MapFilters {
  mySchoolOnly: boolean;
  liveOnly: boolean;
  schoolTypes: SchoolType[];
  categories: RoomCategory[];
}

export interface MapControlsProps {
  /** Current zoom level */
  zoom: number;
  /** Current view mode */
  viewMode: 'map' | 'list';
  /** Current filters */
  filters: MapFilters;
  /** Is user location available */
  hasUserLocation?: boolean;
  /** Is locating user */
  isLocating?: boolean;
  /** Zoom in handler */
  onZoomIn: () => void;
  /** Zoom out handler */
  onZoomOut: () => void;
  /** Go to user location handler */
  onLocateUser: () => void;
  /** Toggle view mode handler */
  onToggleViewMode: () => void;
  /** Filter change handler */
  onFiltersChange: (filters: MapFilters) => void;
  /** Custom className */
  className?: string;
}

// ============================================
// Constants
// ============================================
const SCHOOL_TYPE_OPTIONS: SchoolType[] = [
  'elementary',
  'middle',
  'high',
  'university',
  'other',
];

const CATEGORY_OPTIONS: { value: RoomCategory; label: string; color: string }[] = [
  { value: 'math', label: 'Math', color: 'bg-blue-500' },
  { value: 'english', label: 'English', color: 'bg-green-500' },
  { value: 'science', label: 'Science', color: 'bg-purple-500' },
  { value: 'coding', label: 'Coding', color: 'bg-orange-500' },
  { value: 'language', label: 'Language', color: 'bg-cyan-500' },
  { value: 'art', label: 'Art', color: 'bg-pink-500' },
  { value: 'music', label: 'Music', color: 'bg-amber-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-500' },
];

// ============================================
// Animation Variants
// ============================================
const buttonVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

const filterPanelVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.95,
    transition: {
      duration: 0.15,
    },
  },
};

const locatingVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// ============================================
// Sub-components
// ============================================
interface ControlButtonProps {
  icon: React.ReactNode;
  label?: string;
  isActive?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}

const ControlButton = forwardRef<HTMLButtonElement, ControlButtonProps>(
  ({ icon, label, isActive, isLoading, disabled, onClick, className }, ref) => (
    <motion.button
      ref={ref}
      className={cn(
        'w-10 h-10 rounded-xl',
        'flex items-center justify-center',
        'bg-white shadow-lg border border-gray-100',
        'transition-colors duration-200',
        isActive && 'bg-primary-500 text-white border-primary-500',
        !isActive && 'text-gray-700 hover:bg-gray-50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      variants={buttonVariants}
      initial="rest"
      whileHover={disabled ? undefined : 'hover'}
      whileTap={disabled ? undefined : 'tap'}
      onClick={onClick}
      disabled={disabled}
      title={label}
    >
      {isLoading ? (
        <motion.div variants={locatingVariants} animate="animate">
          {icon}
        </motion.div>
      ) : (
        icon
      )}
    </motion.button>
  )
);

ControlButton.displayName = 'ControlButton';

interface FilterChipProps {
  label: string;
  isSelected: boolean;
  color?: string;
  onClick: () => void;
}

const FilterChip = ({ label, isSelected, color, onClick }: FilterChipProps) => (
  <motion.button
    className={cn(
      'px-3 py-1.5 rounded-full text-sm font-medium',
      'flex items-center gap-1.5',
      'transition-colors duration-200',
      isSelected
        ? 'bg-gray-900 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    )}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
  >
    {color && (
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          isSelected ? 'bg-white' : color
        )}
      />
    )}
    {label}
    {isSelected && <Check className="w-3 h-3" />}
  </motion.button>
);

// ============================================
// Main Component
// ============================================
const MapControls = forwardRef<HTMLDivElement, MapControlsProps>(
  (
    {
      zoom,
      viewMode,
      filters,
      hasUserLocation = true,
      isLocating = false,
      onZoomIn,
      onZoomOut,
      onLocateUser,
      onToggleViewMode,
      onFiltersChange,
      className,
    },
    ref
  ) => {
    const [showFilters, setShowFilters] = useState(false);

    // Count active filters
    const activeFilterCount =
      (filters.mySchoolOnly ? 1 : 0) +
      (filters.liveOnly ? 1 : 0) +
      filters.schoolTypes.length +
      filters.categories.length;

    // Filter handlers
    const toggleMySchoolOnly = useCallback(() => {
      onFiltersChange({ ...filters, mySchoolOnly: !filters.mySchoolOnly });
    }, [filters, onFiltersChange]);

    const toggleLiveOnly = useCallback(() => {
      onFiltersChange({ ...filters, liveOnly: !filters.liveOnly });
    }, [filters, onFiltersChange]);

    const toggleSchoolType = useCallback(
      (type: SchoolType) => {
        const newTypes = filters.schoolTypes.includes(type)
          ? filters.schoolTypes.filter((t) => t !== type)
          : [...filters.schoolTypes, type];
        onFiltersChange({ ...filters, schoolTypes: newTypes });
      },
      [filters, onFiltersChange]
    );

    const toggleCategory = useCallback(
      (category: RoomCategory) => {
        const newCategories = filters.categories.includes(category)
          ? filters.categories.filter((c) => c !== category)
          : [...filters.categories, category];
        onFiltersChange({ ...filters, categories: newCategories });
      },
      [filters, onFiltersChange]
    );

    const clearFilters = useCallback(() => {
      onFiltersChange({
        mySchoolOnly: false,
        liveOnly: false,
        schoolTypes: [],
        categories: [],
      });
    }, [onFiltersChange]);

    return (
      <div ref={ref} className={cn('absolute z-30', className)}>
        {/* Right side controls - Zoom & Location */}
        <div className="absolute right-4 top-4 flex flex-col gap-2">
          {/* Zoom controls */}
          <div className="flex flex-col bg-white rounded-xl shadow-lg overflow-hidden">
            <ControlButton
              icon={<Plus className="w-5 h-5" />}
              label="Zoom in"
              onClick={onZoomIn}
              disabled={zoom >= 18}
              className="rounded-none border-0 border-b border-gray-100"
            />
            <ControlButton
              icon={<Minus className="w-5 h-5" />}
              label="Zoom out"
              onClick={onZoomOut}
              disabled={zoom <= 5}
              className="rounded-none border-0"
            />
          </div>

          {/* My location button */}
          {hasUserLocation && (
            <ControlButton
              icon={<Locate className="w-5 h-5" />}
              label="My location"
              onClick={onLocateUser}
              isLoading={isLocating}
            />
          )}
        </div>

        {/* Left side controls - View mode & Filters */}
        <div className="absolute left-4 top-4 flex flex-col gap-2">
          {/* View mode toggle */}
          <div className="flex bg-white rounded-xl shadow-lg overflow-hidden">
            <ControlButton
              icon={<Map className="w-5 h-5" />}
              label="Map view"
              isActive={viewMode === 'map'}
              onClick={() => viewMode !== 'map' && onToggleViewMode()}
              className="rounded-none rounded-l-xl border-0 border-r border-gray-100"
            />
            <ControlButton
              icon={<List className="w-5 h-5" />}
              label="List view"
              isActive={viewMode === 'list'}
              onClick={() => viewMode !== 'list' && onToggleViewMode()}
              className="rounded-none rounded-r-xl border-0"
            />
          </div>

          {/* Filter button */}
          <div className="relative">
            <ControlButton
              icon={<Filter className="w-5 h-5" />}
              label="Filters"
              isActive={showFilters}
              onClick={() => setShowFilters(!showFilters)}
            />
            {/* Active filter count badge */}
            {activeFilterCount > 0 && !showFilters && (
              <div
                className={cn(
                  'absolute -top-1 -right-1',
                  'w-4 h-4 rounded-full',
                  'bg-red-500 text-white',
                  'text-[10px] font-bold',
                  'flex items-center justify-center'
                )}
              >
                {activeFilterCount}
              </div>
            )}
          </div>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className={cn(
                'absolute left-4 top-28',
                'w-72 p-4 rounded-2xl',
                'bg-white shadow-xl border border-gray-100'
              )}
              variants={filterPanelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Quick filters */}
              <div className="space-y-3">
                {/* My School Only */}
                <motion.button
                  className={cn(
                    'w-full p-3 rounded-xl',
                    'flex items-center gap-3',
                    'transition-colors',
                    filters.mySchoolOnly
                      ? 'bg-primary-50 border border-primary-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  )}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleMySchoolOnly}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      filters.mySchoolOnly
                        ? 'bg-primary-500 text-white'
                        : 'bg-white text-gray-600'
                    )}
                  >
                    <School className="w-4 h-4" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      My School Only
                    </p>
                    <p className="text-xs text-gray-500">
                      Show rooms from your school
                    </p>
                  </div>
                  {filters.mySchoolOnly && (
                    <Check className="w-5 h-5 text-primary-500" />
                  )}
                </motion.button>

                {/* Live Only */}
                <motion.button
                  className={cn(
                    'w-full p-3 rounded-xl',
                    'flex items-center gap-3',
                    'transition-colors',
                    filters.liveOnly
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  )}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleLiveOnly}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      filters.liveOnly
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-gray-600'
                    )}
                  >
                    <Radio className="w-4 h-4" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Live Only
                    </p>
                    <p className="text-xs text-gray-500">
                      Show only active study sessions
                    </p>
                  </div>
                  {filters.liveOnly && (
                    <Check className="w-5 h-5 text-red-500" />
                  )}
                </motion.button>
              </div>

              {/* School type filters */}
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                  School Type
                </p>
                <div className="flex flex-wrap gap-2">
                  {SCHOOL_TYPE_OPTIONS.map((type) => (
                    <FilterChip
                      key={type}
                      label={SCHOOL_TYPE_LABELS[type]}
                      isSelected={filters.schoolTypes.includes(type)}
                      onClick={() => toggleSchoolType(type)}
                    />
                  ))}
                </div>
              </div>

              {/* Category filters */}
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                  Subject
                </p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <FilterChip
                      key={cat.value}
                      label={cat.label}
                      color={cat.color}
                      isSelected={filters.categories.includes(cat.value)}
                      onClick={() => toggleCategory(cat.value)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

MapControls.displayName = 'MapControls';

export { MapControls };
