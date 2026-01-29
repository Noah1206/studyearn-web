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

  const colors = {
    success: 'bg-success-light border-success-DEFAULT text-success-dark',
    error: 'bg-error-light border-error-DEFAULT text-error-dark',
    warning: 'bg-warning-light border-warning-DEFAULT text-warning-dark',
    info: 'bg-info-light border-info-DEFAULT text-info-dark',
  };

  const iconColors = {
    success: 'text-success-DEFAULT',
    error: 'text-error-DEFAULT',
    warning: 'text-warning-DEFAULT',
    info: 'text-info-DEFAULT',
  };

  const Icon = icons[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-xl border',
        'bg-white shadow-toss-4',
        'pointer-events-auto'
      )}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 mt-0.5', iconColors[toast.type])}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{toast.title}</p>
        {toast.message && (
          <p className="mt-1 text-sm text-gray-500">{toast.message}</p>
        )}
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onDismiss();
            }}
            className={cn(
              'mt-2 text-sm font-medium',
              'text-gray-900 hover:text-gray-700',
              'transition-colors'
            )}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export { ToastItem };
