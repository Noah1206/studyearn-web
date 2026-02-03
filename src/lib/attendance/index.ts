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
    console.error('[Attendance] Supabase client not available');
    return false;
  }

  console.log('[Attendance] Checking today attendance for user:', userId);

  try {
    const { data, error } = await supabase.rpc('check_today_attendance', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[Attendance] check_today_attendance RPC Error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return false;
    }

    console.log('[Attendance] check_today_attendance result:', data);
    return data ?? false;
  } catch (err) {
    console.error('[Attendance] check_today_attendance Exception:', err);
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
    console.error('[Attendance] Supabase client not available');
    return null;
  }

  console.log('[Attendance] Recording attendance for user:', userId);

  try {
    const { data, error } = await supabase.rpc('record_attendance', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[Attendance] RPC Error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    console.log('[Attendance] RPC Success:', data);
    return data as AttendanceResult;
  } catch (err) {
    console.error('[Attendance] Exception:', err);
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
      // No records found or table not found is not an error for us
      if (error.code === 'PGRST116' || error.code === 'PGRST205') {
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
      // Already checked today - dismiss modal for the day
      dismissForToday();
      // Return a success result to indicate we handled it
      return {
        success: true,
        consecutive_days: await getConsecutiveDays(userId),
        already_checked: true,
      };
    }

    // Record attendance
    const result = await recordAttendance(userId);

    if (result && result.success) {
      // Only clear pending and dismiss if successful
      clearAttendancePending();
      dismissForToday();
      console.log('Auto attendance recorded successfully:', result.consecutive_days, 'days');
      return result;
    }

    // If failed, keep the pending flag so modal shows and user can try manually
    // But clear it after a few attempts to avoid infinite loops
    const retryCount = getAttendanceRetryCount();
    if (retryCount >= 3) {
      console.error('Auto attendance failed after 3 retries, clearing pending flag');
      clearAttendancePending();
      clearAttendanceRetryCount();
    } else {
      incrementAttendanceRetryCount();
      console.error('Auto attendance failed, will retry. Attempt:', retryCount + 1);
    }

    return null;
  } catch (error) {
    console.error('Error processing pending attendance:', error);
    // Don't clear pending on error - let user try manually via modal
    return null;
  }
}

// Retry count helpers for auto-attendance
const ATTENDANCE_RETRY_KEY = 'studyearn_attendance_retry_count';

function getAttendanceRetryCount(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(ATTENDANCE_RETRY_KEY) || '0', 10);
}

function incrementAttendanceRetryCount(): void {
  if (typeof window === 'undefined') return;
  const count = getAttendanceRetryCount();
  localStorage.setItem(ATTENDANCE_RETRY_KEY, String(count + 1));
}

function clearAttendanceRetryCount(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ATTENDANCE_RETRY_KEY);
}
