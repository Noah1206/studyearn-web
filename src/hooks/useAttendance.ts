'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
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
  const pendingProcessedRef = useRef(false);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Process pending attendance for a user
  const handlePendingAttendance = useCallback(async (user: { id: string }) => {
    // Prevent duplicate processing
    if (pendingProcessedRef.current) return false;

    if (hasAttendancePending()) {
      pendingProcessedRef.current = true;
      console.log('[Attendance] Processing pending attendance for user:', user.id);

      const pendingResult = await processPendingAttendance(user.id);
      if (pendingResult && pendingResult.success) {
        console.log('[Attendance] Pending attendance processed successfully:', pendingResult.consecutive_days, 'days');
        setHasCheckedToday(true);
        setConsecutiveDays(pendingResult.consecutive_days);
        return true;
      }
      console.log('[Attendance] Pending attendance failed, will show modal for manual check');
      pendingProcessedRef.current = false; // Allow retry
    }
    return false;
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setIsLoading(false);
      if (!isDismissedToday()) {
        setTimeout(() => setIsModalOpen(true), 300);
      }
      return;
    }

    const checkAttendanceStatus = async (user: { id: string; email?: string; user_metadata?: Record<string, string> } | null) => {
      if (!user) {
        // User not logged in - show modal if not dismissed
        setIsLoggedIn(false);
        setIsLoading(false);
        if (!isDismissedToday()) {
          setTimeout(() => setIsModalOpen(true), 300);
        }
        return;
      }

      // User is logged in
      setIsLoggedIn(true);
      setUserId(user.id);

      // Get user name from metadata or email
      const displayName = user.user_metadata?.name
        || user.user_metadata?.full_name
        || user.user_metadata?.user_name
        || user.email?.split('@')[0]
        || '회원';
      setUserName(displayName);

      // Check if there's a pending attendance from before login
      const pendingHandled = await handlePendingAttendance(user);
      if (pendingHandled) {
        setIsLoading(false);
        return;
      }

      // Check if user already checked today
      try {
        const [hasChecked, days] = await Promise.all([
          checkTodayAttendance(user.id),
          getConsecutiveDays(user.id),
        ]);

        setHasCheckedToday(hasChecked);
        setConsecutiveDays(days);

        // Show modal if not checked today and not dismissed
        if (!hasChecked && !isDismissedToday()) {
          setTimeout(() => setIsModalOpen(true), 300);
        }
      } catch (error) {
        console.error('[Attendance] Error checking attendance status:', error);
        if (!isDismissedToday()) {
          setTimeout(() => setIsModalOpen(true), 300);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Initial check with getSession
    const initCheck = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await checkAttendanceStatus(session?.user ?? null);
      } catch (error) {
        console.error('[Attendance] Error getting session:', error);
        setIsLoading(false);
        if (!isDismissedToday()) {
          setTimeout(() => setIsModalOpen(true), 300);
        }
      }
    };

    initCheck();

    // Subscribe to auth state changes - handles OAuth callback (Kakao login)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('[Attendance] Auth state changed:', event, 'Has session:', !!session);

        // When user signs in (especially after OAuth), process pending attendance
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[Attendance] SIGNED_IN event detected, checking pending attendance');

          // Update user info
          setIsLoggedIn(true);
          setUserId(session.user.id);
          const displayName = session.user.user_metadata?.name
            || session.user.user_metadata?.full_name
            || session.user.user_metadata?.user_name
            || session.user.email?.split('@')[0]
            || '회원';
          setUserName(displayName);

          // Process pending attendance after sign-in (OAuth callback)
          const pendingHandled = await handlePendingAttendance(session.user);
          if (pendingHandled) {
            setIsLoading(false);
            return;
          }

          // If no pending, check attendance status
          try {
            const [hasChecked, days] = await Promise.all([
              checkTodayAttendance(session.user.id),
              getConsecutiveDays(session.user.id),
            ]);
            setHasCheckedToday(hasChecked);
            setConsecutiveDays(days);

            if (!hasChecked && !isDismissedToday()) {
              setTimeout(() => setIsModalOpen(true), 300);
            }
          } catch (error) {
            console.error('[Attendance] Error after SIGNED_IN:', error);
          }
          setIsLoading(false);
        }

        // When user signs out, reset state
        if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false);
          setUserId(null);
          setUserName(null);
          setHasCheckedToday(false);
          setConsecutiveDays(0);
          pendingProcessedRef.current = false;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [handlePendingAttendance]);

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
