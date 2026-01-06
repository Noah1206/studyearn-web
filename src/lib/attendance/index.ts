/**
 * Attendance API Functions
 * Supabase RPC calls for attendance stamp feature
 */
import { createClient } from '@/lib/supabase/client';

export interface AttendanceResult {
  success: boolean;
  consecutive_days: number;
  already_checked: boolean;
}

export interface AttendanceStatus {
  hasCheckedToday: boolean;
  consecutiveDays: number;
}

/**
 * Check if user has already checked attendance today
 * @param userId - The user's ID
 * @returns Promise<boolean> - true if already checked today
 */
export async function checkTodayAttendance(userId: string): Promise<boolean> {
  const supabase = createClient();

  if (!supabase) {
    console.error('Supabase client not available');
    return false;
  }

  try {
    const { data, error } = await supabase.rpc('check_today_attendance', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error checking today attendance:', error);
      return false;
    }

    return data ?? false;
  } catch (err) {
    console.error('Failed to check attendance:', err);
    return false;
  }
}

/**
 * Record attendance for the user
 * @param userId - The user's ID
 * @returns Promise<AttendanceResult | null> - Result with success status and consecutive days
 */
export async function recordAttendance(userId: string): Promise<AttendanceResult | null> {
  const supabase = createClient();

  if (!supabase) {
    console.error('Supabase client not available');
    return null;
  }

  try {
    const { data, error } = await supabase.rpc('record_attendance', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error recording attendance:', error);
      return null;
    }

    return data as AttendanceResult;
  } catch (err) {
    console.error('Failed to record attendance:', err);
    return null;
  }
}

/**
 * Get current consecutive days count for the user
 * @param userId - The user's ID
 * @returns Promise<number> - Number of consecutive attendance days
 */
export async function getConsecutiveDays(userId: string): Promise<number> {
  const supabase = createClient();

  if (!supabase) {
    console.error('Supabase client not available');
    return 0;
  }

  try {
    const { data, error } = await supabase
      .from('attendance_stamps')
      .select('consecutive_days')
      .eq('user_id', userId)
      .order('attended_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // No records found is not an error for us
      if (error.code === 'PGRST116') {
        return 0;
      }
      console.error('Error getting consecutive days:', error);
      return 0;
    }

    return data?.consecutive_days ?? 0;
  } catch (err) {
    console.error('Failed to get consecutive days:', err);
    return 0;
  }
}

/**
 * Get complete attendance status for a user
 * @param userId - The user's ID
 * @returns Promise<AttendanceStatus> - Complete attendance status
 */
export async function getAttendanceStatus(userId: string): Promise<AttendanceStatus> {
  const [hasCheckedToday, consecutiveDays] = await Promise.all([
    checkTodayAttendance(userId),
    getConsecutiveDays(userId),
  ]);

  return {
    hasCheckedToday,
    consecutiveDays,
  };
}

// LocalStorage key for "don't show today" feature
const ATTENDANCE_DISMISSED_KEY = 'attendance_modal_dismissed';

/**
 * Check if user dismissed the modal today
 * @returns boolean - true if user clicked "don't show today"
 */
export function isDismissedToday(): boolean {
  if (typeof window === 'undefined') return false;

  const dismissed = localStorage.getItem(ATTENDANCE_DISMISSED_KEY);
  if (!dismissed) return false;

  const today = new Date().toDateString();
  return dismissed === today;
}

/**
 * Set modal as dismissed for today
 */
export function dismissForToday(): void {
  if (typeof window === 'undefined') return;

  const today = new Date().toDateString();
  localStorage.setItem(ATTENDANCE_DISMISSED_KEY, today);
}

/**
 * Clear dismissed status (for testing or next day)
 */
export function clearDismissed(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ATTENDANCE_DISMISSED_KEY);
}

// LocalStorage key for pending attendance after login
const ATTENDANCE_PENDING_KEY = 'studyearn_attendance_pending';

/**
 * Set attendance as pending (to be processed after login)
 */
export function setAttendancePending(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ATTENDANCE_PENDING_KEY, 'true');
}

/**
 * Check if there's a pending attendance
 */
export function hasAttendancePending(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ATTENDANCE_PENDING_KEY) === 'true';
}

/**
 * Clear pending attendance flag
 */
export function clearAttendancePending(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ATTENDANCE_PENDING_KEY);
}

/**
 * Process pending attendance for a user after login
 * @param userId - The user's ID
 * @returns Promise<AttendanceResult | null> - Result if processed, null if no pending or already checked
 */
export async function processPendingAttendance(userId: string): Promise<AttendanceResult | null> {
  // Check if there's a pending attendance
  if (!hasAttendancePending()) {
    return null;
  }

  try {
    // Check if user already checked today
    const alreadyChecked = await checkTodayAttendance(userId);
    if (alreadyChecked) {
      clearAttendancePending();
      return null;
    }

    // Record attendance
    const result = await recordAttendance(userId);

    // Clear pending flag regardless of result
    clearAttendancePending();

    return result;
  } catch (error) {
    console.error('Error processing pending attendance:', error);
    clearAttendancePending();
    return null;
  }
}
