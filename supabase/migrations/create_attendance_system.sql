-- =====================================================
-- Attendance System for StudyEarn
-- =====================================================
-- This migration creates the attendance stamp system
-- allowing users to check in daily and track streaks
-- =====================================================

-- 1. Create attendance_stamps table
CREATE TABLE IF NOT EXISTS public.attendance_stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attended_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consecutive_days INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_id
  ON public.attendance_stamps(user_id);

CREATE INDEX IF NOT EXISTS idx_attendance_attended_at
  ON public.attendance_stamps(attended_at DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_user_date
  ON public.attendance_stamps(user_id, attended_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE public.attendance_stamps ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Users can view their own attendance records
CREATE POLICY "Users can view own attendance"
  ON public.attendance_stamps
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own attendance records (through RPC functions)
CREATE POLICY "Users can insert own attendance"
  ON public.attendance_stamps
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Drop existing functions if they exist (to handle return type changes)
DROP FUNCTION IF EXISTS public.check_today_attendance(UUID);
DROP FUNCTION IF EXISTS public.record_attendance(UUID);

-- 6. Create function to check if user has already checked today
CREATE OR REPLACE FUNCTION public.check_today_attendance(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_checked BOOLEAN;
BEGIN
  -- Check if there's an attendance record for today
  SELECT EXISTS (
    SELECT 1
    FROM public.attendance_stamps
    WHERE user_id = p_user_id
      AND DATE(attended_at AT TIME ZONE 'Asia/Seoul') = CURRENT_DATE
  ) INTO v_has_checked;

  RETURN COALESCE(v_has_checked, FALSE);
END;
$$;

-- 7. Create function to record attendance
CREATE OR REPLACE FUNCTION public.record_attendance(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_already_checked BOOLEAN;
  v_last_attendance TIMESTAMPTZ;
  v_last_consecutive INTEGER;
  v_new_consecutive INTEGER;
  v_result JSON;
BEGIN
  -- Check if already checked today
  SELECT public.check_today_attendance(p_user_id) INTO v_already_checked;

  IF v_already_checked THEN
    -- Get current consecutive days
    SELECT consecutive_days INTO v_last_consecutive
    FROM public.attendance_stamps
    WHERE user_id = p_user_id
      AND DATE(attended_at AT TIME ZONE 'Asia/Seoul') = CURRENT_DATE
    LIMIT 1;

    -- Return already checked result
    v_result := json_build_object(
      'success', TRUE,
      'consecutive_days', COALESCE(v_last_consecutive, 1),
      'already_checked', TRUE
    );
    RETURN v_result;
  END IF;

  -- Get last attendance record
  SELECT attended_at, consecutive_days
  INTO v_last_attendance, v_last_consecutive
  FROM public.attendance_stamps
  WHERE user_id = p_user_id
  ORDER BY attended_at DESC
  LIMIT 1;

  -- Calculate new consecutive days
  IF v_last_attendance IS NULL THEN
    -- First time attendance
    v_new_consecutive := 1;
  ELSIF DATE(v_last_attendance AT TIME ZONE 'Asia/Seoul') = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Consecutive day
    v_new_consecutive := COALESCE(v_last_consecutive, 0) + 1;
  ELSE
    -- Streak broken, start over
    v_new_consecutive := 1;
  END IF;

  -- Insert new attendance record
  INSERT INTO public.attendance_stamps (user_id, consecutive_days)
  VALUES (p_user_id, v_new_consecutive);

  -- Return success result
  v_result := json_build_object(
    'success', TRUE,
    'consecutive_days', v_new_consecutive,
    'already_checked', FALSE
  );

  RETURN v_result;
END;
$$;

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.attendance_stamps TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_today_attendance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_attendance(UUID) TO authenticated;

-- 9. Add helpful comments
COMMENT ON TABLE public.attendance_stamps IS 'Stores daily attendance check-ins and consecutive day streaks';
COMMENT ON COLUMN public.attendance_stamps.user_id IS 'Reference to the user who checked in';
COMMENT ON COLUMN public.attendance_stamps.attended_at IS 'Timestamp of when the user checked in';
COMMENT ON COLUMN public.attendance_stamps.consecutive_days IS 'Number of consecutive days the user has checked in';
COMMENT ON FUNCTION public.check_today_attendance IS 'Check if a user has already checked attendance today';
COMMENT ON FUNCTION public.record_attendance IS 'Record a new attendance check-in for a user';
