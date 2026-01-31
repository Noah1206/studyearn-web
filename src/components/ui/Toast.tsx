'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Context
interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Convenience methods
export const useToastActions = () => {
  const { addToast, removeToast } = useToast();

  return {
    success: (title: string, message?: string, action?: Toast['action']) =>
      addToast({ type: 'success', title, message, action }),
    error: (title: string, message?: string, action?: Toast['action']) =>
      addToast({ type: 'error', title, message, action }),
    warning: (title: string, message?: string, action?: Toast['action']) =>
      addToast({ type: 'warning', title, message, action }),
    info: (title: string, message?: string, action?: Toast['action']) =>
      addToast({ type: 'info', title, message, action }),
    dismiss: removeToast,
  };
};

// Provider
export interface ToastProviderProps {
  children: ReactNode;
  /** Position of toasts */
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
  /** Maximum number of visible toasts */
  maxToasts?: number;
}

export const ToastProvider = ({
  children,
  position = 'top-right',
  maxToasts = 5,
}: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  // Only render portal after hydration is complete
  useEffect(() => {
    setMounted(true);
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).slice(2);
      const newToast = { ...toast, id };

      setToasts((prev) => {
        const updated = [newToast, ...prev];
        return updated.slice(0, maxToasts);
      });

      // Auto dismiss
      const duration = toast.duration ?? 4000;
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    [maxToasts]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Position classes
  const positions = {
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {mounted &&
        createPortal(
          <div
            className={cn(
              'fixed z-[100] flex flex-col gap-2 w-full max-w-sm',
              positions[position]
            )}
          >
            <AnimatePresence mode="popLayout">
              {toasts.map((toast) => (
                <ToastItem
                  key={toast.id}
                  toast={toast}
                  onDismiss={() => removeToast(toast.id)}
                />
              ))}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};

// Toast Item
interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

const ToastItem = ({ toast, onDismiss }: ToastItemProps) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const iconColors = {
    success: 'text-orange-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
  };

  const Icon = icons[toast.type];

  const bgColors = {
    success: 'bg-gray-900',
    error: 'bg-red-600',
    warning: 'bg-amber-600',
    info: 'bg-gray-900',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -40, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.8 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        mass: 0.8,
      }}
      className={cn(
        'relative flex items-center gap-2.5 px-5 py-3 rounded-full',
        bgColors[toast.type],
        'shadow-lg pointer-events-auto'
      )}
    >
      {/* Icon */}
      <Icon className="w-4 h-4 text-white flex-shrink-0" />

      {/* Content */}
      <p className="text-sm font-medium text-white whitespace-nowrap">
        {toast.title}
        {toast.message && <span className="text-white/70 ml-1">{toast.message}</span>}
      </p>

      {toast.action && (
        <button
          onClick={() => {
            toast.action?.onClick();
            onDismiss();
          }}
          className="text-sm font-semibold text-orange-400 hover:text-orange-300 ml-1 whitespace-nowrap"
        >
          {toast.action.label}
        </button>
      )}
    </motion.div>
  );
};

export { ToastItem };
