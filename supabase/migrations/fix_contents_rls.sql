-- =====================================================
-- Fix Contents Table RLS Policies
-- =====================================================
-- This adds proper Row Level Security policies for the contents table
-- =====================================================

-- 1. Enable RLS if not already enabled
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Creators can view own contents" ON public.contents;
DROP POLICY IF EXISTS "Creators can insert own contents" ON public.contents;
DROP POLICY IF EXISTS "Creators can update own contents" ON public.contents;
DROP POLICY IF EXISTS "Creators can delete own contents" ON public.contents;
DROP POLICY IF EXISTS "Public contents are viewable by everyone" ON public.contents;

-- 3. Create SELECT policy - Creators can view their own contents
CREATE POLICY "Creators can view own contents"
ON public.contents
FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

-- 4. Create INSERT policy - Creators can create their own contents
CREATE POLICY "Creators can insert own contents"
ON public.contents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- 5. Create UPDATE policy - Creators can update their own contents
CREATE POLICY "Creators can update own contents"
ON public.contents
FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- 6. Create DELETE policy - Creators can delete their own contents
CREATE POLICY "Creators can delete own contents"
ON public.contents
FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);

-- 7. Create SELECT policy for public/paid contents - Everyone can view published contents
CREATE POLICY "Public contents are viewable by everyone"
ON public.contents
FOR SELECT
TO authenticated, anon
USING (
  is_published = true
  AND access_level IN ('public', 'paid')
);

-- 8. Add helpful comments
COMMENT ON POLICY "Creators can view own contents" ON public.contents
  IS 'Allows creators to view all their own contents regardless of publish status';
COMMENT ON POLICY "Public contents are viewable by everyone" ON public.contents
  IS 'Allows anyone to view published public or paid contents';
