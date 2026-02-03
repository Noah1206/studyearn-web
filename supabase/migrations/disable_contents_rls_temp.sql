-- =====================================================
-- TEMPORARY: Disable RLS for debugging
-- =====================================================
-- This temporarily disables RLS to test if that's the issue
-- DO NOT USE IN PRODUCTION
-- =====================================================

-- Disable RLS temporarily
ALTER TABLE public.contents DISABLE ROW LEVEL SECURITY;

-- Grant SELECT to authenticated users
GRANT SELECT ON public.contents TO authenticated;
GRANT INSERT ON public.contents TO authenticated;
GRANT UPDATE ON public.contents TO authenticated;
GRANT DELETE ON public.contents TO authenticated;
