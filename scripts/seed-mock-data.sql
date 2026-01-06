-- Mock Data for Study With Me
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- 0. Add category column if not exists
ALTER TABLE contents ADD COLUMN IF NOT EXISTS category TEXT;

-- 1. Temporarily disable all constraints that block mock data
ALTER TABLE creator_settings DROP CONSTRAINT IF EXISTS creator_settings_user_id_fkey;
ALTER TABLE contents DROP CONSTRAINT IF EXISTS contents_category_check;
ALTER TABLE contents DROP CONSTRAINT IF EXISTS contents_creator_id_fkey;

-- 2. Insert Mock Creators
INSERT INTO creator_settings (id, user_id, display_name, bio, profile_image_url, is_verified, total_subscribers, is_accepting_questions, default_content_access, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '수학왕 민지', '서울대 수학과 재학 중! 수학을 쉽고 재밌게 알려드려요', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', true, 1247, true, 'public', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '영어마스터 준호', 'TOEIC 990점 달성! 실전 영어 공부법 공유합니다', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', true, 892, true, 'public', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '코딩하는 소희', '현직 개발자가 알려주는 코딩 기초부터 실전까지', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', false, 2156, true, 'public', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '과학탐험가 동현', 'KAIST 물리학과 - 과학의 신비를 함께 탐험해요', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop', true, 567, true, 'public', NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '국어천재 서연', '수능 국어 만점! 비문학 완전 정복 비법 공개', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop', false, 423, true, 'public', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  total_subscribers = EXCLUDED.total_subscribers,
  updated_at = NOW();

-- 3. Insert Mock Contents
INSERT INTO contents (id, creator_id, title, description, content_type, thumbnail_url, access_level, price, view_count, like_count, comment_count, is_published, published_at, tags, content_data, is_pinned, category, created_at, updated_at)
VALUES
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '미적분 완전정복', '수능 미적분 30일 완성!', 'video', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=450&fit=crop', 'public', NULL, 15420, 892, 156, true, NOW(), ARRAY['수학'], '{}', false, 'math', NOW(), NOW()),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '확률과 통계 핵심 정리', '헷갈리는 확통 개념 정리', 'video', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=450&fit=crop', 'subscribers', NULL, 8932, 567, 89, true, NOW(), ARRAY['수학'], '{}', false, 'math', NOW(), NOW()),
  ('a3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'TOEIC 900+ 비법', '3개월 만에 900점!', 'video', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=450&fit=crop', 'paid', 9900, 12340, 1023, 234, true, NOW(), ARRAY['영어'], '{}', false, 'english', NOW(), NOW()),
  ('a4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '영어 문법 총정리', '핵심 문법만 모았습니다', 'document', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop', 'public', NULL, 6789, 445, 67, true, NOW(), ARRAY['영어'], '{}', false, 'english', NOW(), NOW()),
  ('a5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Python 기초', '프로그래밍 첫걸음', 'video', 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=450&fit=crop', 'public', NULL, 23456, 1876, 312, true, NOW(), ARRAY['코딩'], '{}', false, 'coding', NOW(), NOW()),
  ('a6666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', '웹 개발 로드맵 2024', '취업까지 이어지는 학습법', 'post', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop', 'subscribers', NULL, 9872, 723, 156, true, NOW(), ARRAY['코딩'], '{}', false, 'coding', NOW(), NOW()),
  ('a7777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', '물리학 역학 완벽 정리', '뉴턴 역학부터 에너지 보존까지', 'video', 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&h=450&fit=crop', 'public', NULL, 5678, 345, 78, true, NOW(), ARRAY['과학'], '{}', false, 'science', NOW(), NOW()),
  ('a8888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', '화학 반응식 암기법', '쉽게 외우는 꿀팁!', 'audio', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=450&fit=crop', 'paid', 4900, 3421, 234, 45, true, NOW(), ARRAY['과학'], '{}', false, 'science', NOW(), NOW()),
  ('a9999999-9999-9999-9999-999999999999', '55555555-5555-5555-5555-555555555555', '수능 비문학 공략법', '비문학 완벽 가이드', 'video', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=450&fit=crop', 'public', NULL, 7890, 567, 123, true, NOW(), ARRAY['국어'], '{}', false, 'korean', NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', '문학 감상법 - 시 편', '현대시 감상 포인트', 'document', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=450&fit=crop', 'subscribers', NULL, 4567, 321, 56, true, NOW(), ARRAY['국어'], '{}', false, 'korean', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, view_count = EXCLUDED.view_count, updated_at = NOW();
