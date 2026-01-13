-- =====================================================
-- Check Contents Table RLS Status
-- =====================================================
-- This script helps diagnose RLS issues by showing current configuration
-- =====================================================

-- 1. Check if RLS is enabled on contents table
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'contents';

-- 2. List all policies on contents table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'contents'
ORDER BY policyname;

-- 3. Check table permissions
SELECT
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'contents'
ORDER BY grantee, privilege_type;

-- 4. Test query as authenticated user (replace USER_ID with actual user ID)
-- This shows what auth.uid() returns
SELECT auth.uid() as current_user_id;

-- 5. Check if contents exist for a specific user
-- Replace 'YOUR_USER_ID' with the actual user ID from the logs
-- SELECT id, title, creator_id, is_published, access_level
-- FROM public.contents
-- WHERE creator_id = 'YOUR_USER_ID'
-- LIMIT 5;
