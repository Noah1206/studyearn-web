'use client';

import { forwardRef, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Title displayed at the top */
  title?: string;
  /** Height of the sheet: 'auto' | 'half' | 'full' */
  height?: 'auto' | 'half' | 'full';
  /** Show drag handle */
  showHandle?: boolean;
  /** Close on backdrop click */
  closeOnBackdropClick?: boolean;
  /** Enable drag to close */
  dragToClose?: boolean;
  className?: string;
}

const BottomSheet = forwardRef<HTMLDivElement, BottomSheetProps>(
  (
    {
      isOpen,
      onClose,
      children,
      title,
      height = 'auto',
      showHandle = true,
      closeOnBackdropClick = true,
      dragToClose = true,
      className,
    },
    ref
  ) => {
    const dragControls = useDragControls();

    // Handle escape key
    const handleEscape = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      },
      [onClose]
    );

    useEffect(() => {
      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
      }
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }, [isOpen, handleEscape]);

    // Height variants
    const heights = {
      auto: 'max-h-[85vh]',
      half: 'h-[50vh]',
      full: 'h-[calc(100vh-48px)]',
    };

    // Handle drag end
    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (dragToClose && info.velocity.y > 300) {
        onClose();
      }
    };

    if (typeof window === 'undefined') return null;

    return createPortal(
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeOnBackdropClick ? onClose : undefined}
            />

            {/* Bottom Sheet */}
            <motion.div
              ref={ref}
              className={cn(
                'fixed inset-x-0 bottom-0 z-50',
                'bg-white rounded-t-2xl shadow-bottom-sheet',
                'flex flex-col',
                heights[height],
                className
              )}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              drag={dragToClose ? 'y' : false}
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={handleDragEnd}
            >
              {/* Handle */}
              {showHandle && (
                <div
                  className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => dragControls.start(e)}
                >
                  <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>
              )}

              {/* Header */}
              {title && (
                <div className="px-5 py-3 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 text-center">
                    {title}
                  </h3>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    );
  }
);

BottomSheet.displayName = 'BottomSheet';

export { BottomSheet };
