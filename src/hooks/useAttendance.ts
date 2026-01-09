'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  checkTodayAttendance,
  getConsecutiveDays,
  isDismissedToday,
  hasAttendancePending,
  processPendingAttendance,
  setAttendancePending,
  clearAttendancePending,
} from '@/lib/attendance';

// Re-export for backward compatibility
export { setAttendancePending, hasAttendancePending, clearAttendancePending };

interface UseAttendanceResult {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  userId: string | null;
  userName: string | null;
  consecutiveDays: number;
  hasCheckedToday: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
}

/**
 * Hook to manage attendance modal state and user attendance status
 * Automatically shows the modal if:
 * 1. User hasn't dismissed the modal for today (login status doesn't matter)
 * 2. For logged-in users: User hasn't checked attendance today
 */
export function useAttendance(): UseAttendanceResult {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [consecutiveDays, setConsecutiveDays] = useState(0);
  const [hasCheckedToday, setHasCheckedToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  useEffect(() => {
    const checkAttendanceStatus = async () => {
      const supabase = createClient();
      if (!supabase) {
        setIsLoading(false);
        // Show modal for non-logged in users if not dismissed
        if (!isDismissedToday()) {
          setTimeout(() => {
            setIsModalOpen(true);
          }, 300);
        }
        return;
      }

      try {
        // Get current session (getSession은 로컬에서 읽어서 빠름)
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        if (!user) {
          // User not logged in - still show modal if not dismissed
          setIsLoggedIn(false);
          setIsLoading(false);
          if (!isDismissedToday()) {
            setTimeout(() => {
              setIsModalOpen(true);
            }, 300);
          }
          return;
        }

        // User is logged in
        setIsLoggedIn(true);
        setUserId(user.id);

        // Get user name from metadata or email
        const displayName = user.user_metadata?.name
          || user.user_metadata?.full_name
          || user.email?.split('@')[0]
          || '회원';
        setUserName(displayName);

        // Check if there's a pending attendance from before login
        if (hasAttendancePending()) {
          const pendingResult = await processPendingAttendance(user.id);
          if (pendingResult && pendingResult.success) {
            // Pending attendance was processed successfully
            setHasCheckedToday(true);
            setConsecutiveDays(pendingResult.consecutive_days);
            // Don't show modal since we just auto-checked
            return;
          }
        }

        // Check if user already checked today
        const [hasChecked, days] = await Promise.all([
          checkTodayAttendance(user.id),
          getConsecutiveDays(user.id),
        ]);

        setHasCheckedToday(hasChecked);
        setConsecutiveDays(days);

        // Show modal if not checked today and not dismissed
        if (!hasChecked && !isDismissedToday()) {
          // Reduced delay for faster UX (300ms instead of 1000ms)
          setTimeout(() => {
            setIsModalOpen(true);
          }, 300);
        }
      } catch (error) {
        console.error('Error checking attendance status:', error);
        // On error, still show modal for engagement if not dismissed
        if (!isDismissedToday()) {
          setTimeout(() => {
            setIsModalOpen(true);
          }, 300);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAttendanceStatus();
  }, []);

  return {
    isModalOpen,
    openModal,
    closeModal,
    userId,
    userName,
    consecutiveDays,
    hasCheckedToday,
    isLoading,
    isLoggedIn,
  };
}
