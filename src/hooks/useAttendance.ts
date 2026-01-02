'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  checkTodayAttendance,
  getConsecutiveDays,
  isDismissedToday,
} from '@/lib/attendance';

interface UseAttendanceResult {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  userId: string | null;
  userName: string | null;
  consecutiveDays: number;
  hasCheckedToday: boolean;
  isLoading: boolean;
}

/**
 * Hook to manage attendance modal state and user attendance status
 * Automatically shows the modal if:
 * 1. User is logged in
 * 2. User hasn't checked attendance today
 * 3. User hasn't dismissed the modal for today
 */
export function useAttendance(): UseAttendanceResult {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [consecutiveDays, setConsecutiveDays] = useState(0);
  const [hasCheckedToday, setHasCheckedToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
        return;
      }

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        setUserId(user.id);

        // Get user name from metadata or email
        const displayName = user.user_metadata?.name
          || user.user_metadata?.full_name
          || user.email?.split('@')[0]
          || '회원';
        setUserName(displayName);

        // Check if user already checked today
        const [hasChecked, days] = await Promise.all([
          checkTodayAttendance(user.id),
          getConsecutiveDays(user.id),
        ]);

        setHasCheckedToday(hasChecked);
        setConsecutiveDays(days);

        // Show modal if not checked today and not dismissed
        if (!hasChecked && !isDismissedToday()) {
          // Small delay for better UX
          setTimeout(() => {
            setIsModalOpen(true);
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking attendance status:', error);
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
  };
}
