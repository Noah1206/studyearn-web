'use client';

import { useAttendance } from '@/hooks/useAttendance';
import { AttendanceModal } from '@/components/modals/AttendanceModal';

/**
 * AttendanceProvider Component
 *
 * Add this component to your page or layout to enable the attendance modal.
 * It automatically handles:
 * - Checking if user is logged in
 * - Checking if user has checked attendance today
 * - Showing the modal if attendance hasn't been checked
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
    consecutiveDays,
    isLoading,
  } = useAttendance();

  // Don't render anything if still loading or no user
  if (isLoading || !userId) {
    return null;
  }

  return (
    <AttendanceModal
      isOpen={isModalOpen}
      onClose={closeModal}
      userId={userId}
      initialConsecutiveDays={consecutiveDays}
    />
  );
}
