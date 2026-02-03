'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type HTMLAttributes,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Context for tabs
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

// Tabs Root
export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  /** Initial value for uncontrolled mode */
  defaultValue?: string;
  /** Controlled value */
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

const Tabs = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  ...props
}: TabsProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const activeTab = value ?? internalValue;

  const setActiveTab = (newValue: string) => {
    if (!value) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// Tabs List
export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'pills' | 'underline';
}

const TabsList = ({
  children,
  variant = 'default',
  className,
  ...props
}: TabsListProps) => {
  const variants = {
    default: 'bg-gray-100 p-1 rounded-xl',
    pills: 'gap-2',
    underline: 'border-b border-gray-200 gap-0',
  };

  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Tab Trigger
export interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  disabled?: boolean;
  children: ReactNode;
}

const TabsTrigger = ({
  value,
  disabled = false,
  children,
  className,
  ...props
}: TabsTriggerProps) => {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={cn(
        'relative px-4 py-2 text-sm font-medium',
        'transition-colors duration-fast ease-toss',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/30',
        'disabled:opacity-50 disabled:pointer-events-none',
        isActive
          ? 'text-gray-900'
          : 'text-gray-500 hover:text-gray-700',
        className
      )}
      {...props}
    >
      {children}
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute inset-0 bg-white rounded-lg shadow-toss-2 -z-10"
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
          }}
        />
      )}
    </button>
  );
};

// Underline Tab Trigger (alternative style)
const TabsTriggerUnderline = ({
  value,
  disabled = false,
  children,
  className,
  ...props
}: TabsTriggerProps) => {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={cn(
        'relative px-4 py-3 text-sm font-medium',
        'transition-colors duration-fast ease-toss',
        'focus:outline-none',
        'disabled:opacity-50 disabled:pointer-events-none',
        isActive
          ? 'text-gray-900'
          : 'text-gray-500 hover:text-gray-700',
        className
      )}
      {...props}
    >
      {children}
      {/* Underline indicator */}
      {isActive && (
        <motion.div
          layoutId="tab-underline"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
          }}
        />
      )}
    </button>
  );
};

// Tab Content
export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  children: ReactNode;
  /** Animate content changes */
  animated?: boolean;
}

const TabsContent = ({
  value,
  children,
  animated = true,
  className,
  ...props
}: TabsContentProps) => {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === value;

  if (!isActive) return null;

  if (animated) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          role="tabpanel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cn('focus:outline-none', className)}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div
      role="tabpanel"
      className={cn('focus:outline-none', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsTriggerUnderline, TabsContent };
