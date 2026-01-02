'use client';

import { useAttendance } from '@/hooks/useAttendance';
import { AttendanceModal } from '@/components/modals/AttendanceModal';

/**
 * AttendanceProvider Component
 *
 * Add this component to your page or layout to enable the attendance modal.
 * It automatically handles:
 * - Showing the modal for all users (logged in or not)
 * - Checking if user has checked attendance today (for logged-in users)
 * - Redirecting non-logged-in users to login page when they try to check attendance
 * - Dismissing for today functionality
 *
 * Usage:
 * ```tsx
 * import { AttendanceProvider } from '@/components/attendance/AttendanceProvider';
 *
 * function MyPage() {
 *   return (
 *     <>
 *       <AttendanceProvider />
 *       {/* Your page content *\/}
 *     </>
 *   );
 * }
 * ```
 */
export function AttendanceProvider() {
  const {
    isModalOpen,
    closeModal,
    userId,
    userName,
    consecutiveDays,
    isLoading,
    isLoggedIn,
  } = useAttendance();

  // Don't render anything if still loading
  if (isLoading) {
    return null;
  }

  return (
    <AttendanceModal
      isOpen={isModalOpen}
      onClose={closeModal}
      userId={userId}
      userName={userName}
      initialConsecutiveDays={consecutiveDays}
      isLoggedIn={isLoggedIn}
    />
  );
}
