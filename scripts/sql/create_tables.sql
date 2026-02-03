-- StudyEarn Additional Tables
-- Run this SQL in Supabase SQL Editor

-- ============================================
-- 1. DM Conversations Table
-- ============================================
CREATE TABLE IF NOT EXISTS dm_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_conversation UNIQUE (participant1_id, participant2_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dm_conversations_participant1 ON dm_conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_participant2 ON dm_conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_last_message ON dm_conversations(last_message_at DESC);

-- RLS for dm_conversations
ALTER TABLE dm_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations" ON dm_conversations
  FOR SELECT USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can create conversations" ON dm_conversations
  FOR INSERT WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can update their own conversations" ON dm_conversations
  FOR UPDATE USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- ============================================
-- 2. DM Messages Table
-- ============================================
CREATE TABLE IF NOT EXISTS dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster message retrieval
CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation ON dm_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_created ON dm_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_messages_sender ON dm_messages(sender_id);

-- RLS for dm_messages
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations" ON dm_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dm_conversations
      WHERE id = dm_messages.conversation_id
      AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages" ON dm_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM dm_conversations
      WHERE id = conversation_id
      AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update read status" ON dm_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM dm_conversations
      WHERE id = dm_messages.conversation_id
      AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
  );

-- ============================================
-- 3. Content Likes Table
-- ============================================
CREATE TABLE IF NOT EXISTS content_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_content_like UNIQUE (user_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_content_likes_user ON content_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_content_likes_content ON content_likes(content_id);

-- RLS for content_likes
ALTER TABLE content_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes" ON content_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like content" ON content_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike content" ON content_likes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 4. Content Saves Table
-- ============================================
CREATE TABLE IF NOT EXISTS content_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_content_save UNIQUE (user_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_content_saves_user ON content_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_content_saves_content ON content_saves(content_id);

-- RLS for content_saves
ALTER TABLE content_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their saves" ON content_saves
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save content" ON content_saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave content" ON content_saves
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 5. User Preferences Table (JSONB approach for flexible settings)
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_settings JSONB DEFAULT '{}'::jsonb,
  privacy_settings JSONB DEFAULT '{}'::jsonb,
  account_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- RLS for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 6. Content Views Table
-- ============================================
CREATE TABLE IF NOT EXISTS content_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  duration_seconds INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_content_views_content ON content_views(content_id);
CREATE INDEX IF NOT EXISTS idx_content_views_user ON content_views(user_id);
CREATE INDEX IF NOT EXISTS idx_content_views_viewed ON content_views(viewed_at DESC);

-- RLS for content_views
ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record views" ON content_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Creators can view their content analytics" ON content_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contents
      WHERE contents.id = content_views.content_id
      AND contents.creator_id = auth.uid()
    )
    OR auth.uid() = user_id
  );

-- ============================================
-- 7. Content Comments Table
-- ============================================
CREATE TABLE IF NOT EXISTS content_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  comment_type TEXT DEFAULT 'comment' CHECK (comment_type IN ('comment', 'question')),
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_reported BOOLEAN DEFAULT FALSE,
  is_replied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_comments_content ON content_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_user ON content_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_created ON content_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_comments_type ON content_comments(comment_type);

-- RLS for content_comments
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON content_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON content_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON content_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON content_comments
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Creators can update comments on their content" ON content_comments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM contents
      WHERE contents.id = content_comments.content_id
      AND contents.creator_id = auth.uid()
    )
  );

CREATE POLICY "Creators can delete comments on their content" ON content_comments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM contents
      WHERE contents.id = content_comments.content_id
      AND contents.creator_id = auth.uid()
    )
  );

-- ============================================
-- 8. Comment Replies Table
-- ============================================
CREATE TABLE IF NOT EXISTS comment_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES content_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL,
  is_creator_reply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comment_replies_comment ON comment_replies(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_replies_user ON comment_replies(user_id);

-- RLS for comment_replies
ALTER TABLE comment_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view replies" ON comment_replies
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create replies" ON comment_replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own replies" ON comment_replies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies" ON comment_replies
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 9. Helper Functions
-- ============================================

-- Function to get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
BEGIN
  -- Try to find existing conversation
  SELECT id INTO conv_id
  FROM dm_conversations
  WHERE (participant1_id = user1_id AND participant2_id = user2_id)
     OR (participant1_id = user2_id AND participant2_id = user1_id);

  -- Create new if not exists
  IF conv_id IS NULL THEN
    INSERT INTO dm_conversations (participant1_id, participant2_id)
    VALUES (user1_id, user2_id)
    RETURNING id INTO conv_id;
  END IF;

  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle like
CREATE OR REPLACE FUNCTION toggle_content_like(p_content_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  existing_like UUID;
BEGIN
  SELECT id INTO existing_like
  FROM content_likes
  WHERE user_id = auth.uid() AND content_id = p_content_id;

  IF existing_like IS NOT NULL THEN
    DELETE FROM content_likes WHERE id = existing_like;
    UPDATE contents SET like_count = COALESCE(like_count, 0) - 1 WHERE id = p_content_id;
    RETURN FALSE;
  ELSE
    INSERT INTO content_likes (user_id, content_id) VALUES (auth.uid(), p_content_id);
    UPDATE contents SET like_count = COALESCE(like_count, 0) + 1 WHERE id = p_content_id;
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle save
CREATE OR REPLACE FUNCTION toggle_content_save(p_content_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  existing_save UUID;
BEGIN
  SELECT id INTO existing_save
  FROM content_saves
  WHERE user_id = auth.uid() AND content_id = p_content_id;

  IF existing_save IS NOT NULL THEN
    DELETE FROM content_saves WHERE id = existing_save;
    RETURN FALSE;
  ELSE
    INSERT INTO content_saves (user_id, content_id) VALUES (auth.uid(), p_content_id);
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement like count
CREATE OR REPLACE FUNCTION decrement_like_count(p_content_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE contents
  SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
  WHERE id = p_content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create user preferences
CREATE OR REPLACE FUNCTION get_or_create_user_preferences()
RETURNS user_preferences AS $$
DECLARE
  prefs user_preferences;
BEGIN
  SELECT * INTO prefs
  FROM user_preferences
  WHERE user_id = auth.uid();

  IF prefs IS NULL THEN
    INSERT INTO user_preferences (user_id)
    VALUES (auth.uid())
    RETURNING * INTO prefs;
  END IF;

  RETURN prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete user account and all related data
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Delete user preferences
  DELETE FROM user_preferences WHERE user_id = current_user_id;

  -- Delete content likes
  DELETE FROM content_likes WHERE user_id = current_user_id;

  -- Delete content saves
  DELETE FROM content_saves WHERE user_id = current_user_id;

  -- Delete content views
  DELETE FROM content_views WHERE user_id = current_user_id;

  -- Delete DM messages (sender)
  DELETE FROM dm_messages WHERE sender_id = current_user_id;

  -- Delete DM conversations
  DELETE FROM dm_conversations
  WHERE participant1_id = current_user_id OR participant2_id = current_user_id;

  -- Delete comment replies
  DELETE FROM comment_replies WHERE user_id = current_user_id;

  -- Delete content comments
  DELETE FROM content_comments WHERE user_id = current_user_id;

  -- Note: The actual user deletion from auth.users must be done via Supabase Admin API
  -- This function cleans up all user data from custom tables

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add reply to comment
CREATE OR REPLACE FUNCTION add_comment_reply(
  p_comment_id UUID,
  p_reply_text TEXT,
  p_is_creator BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  new_reply_id UUID;
BEGIN
  INSERT INTO comment_replies (comment_id, user_id, reply_text, is_creator_reply)
  VALUES (p_comment_id, auth.uid(), p_reply_text, p_is_creator)
  RETURNING id INTO new_reply_id;

  -- Update reply count and is_replied flag on comment
  UPDATE content_comments
  SET
    reply_count = reply_count + 1,
    is_replied = CASE WHEN p_is_creator THEN TRUE ELSE is_replied END,
    updated_at = NOW()
  WHERE id = p_comment_id;

  RETURN new_reply_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dm_conversations_updated_at
  BEFORE UPDATE ON dm_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER content_comments_updated_at
  BEFORE UPDATE ON content_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 11. Storage Buckets Setup
-- ============================================
-- Note: This must be run separately from SQL Editor OR via Supabase Dashboard Storage settings

-- Create 'contents' bucket for content files (PDF, images, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contents',
  'contents',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/zip']
)
ON CONFLICT (id) DO NOTHING;

-- Create 'avatars' bucket for profile images (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for 'contents' bucket
CREATE POLICY "Anyone can view content files" ON storage.objects
  FOR SELECT USING (bucket_id = 'contents');

CREATE POLICY "Authenticated users can upload content files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'contents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own content files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'contents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own content files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'contents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS Policies for 'avatars' bucket
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );
