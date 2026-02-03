/**
 * Mock Data Seeding Script for Study With Me
 *
 * Usage: npx tsx scripts/seed-mock-data.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please set:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mock Creator Data
const mockCreators = [
  {
    id: 'creator-1',
    user_id: 'user-creator-1',
    display_name: '수학왕 민지',
    bio: '서울대 수학과 재학 중! 수학을 쉽고 재밌게 알려드려요 🎓',
    profile_image_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    is_verified: true,
    total_subscribers: 1247,
  },
  {
    id: 'creator-2',
    user_id: 'user-creator-2',
    display_name: '영어마스터 준호',
    bio: 'TOEIC 990점 달성! 실전 영어 공부법 공유합니다',
    profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    is_verified: true,
    total_subscribers: 892,
  },
  {
    id: 'creator-3',
    user_id: 'user-creator-3',
    display_name: '코딩하는 소희',
    bio: '현직 개발자가 알려주는 코딩 기초부터 실전까지 💻',
    profile_image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    is_verified: false,
    total_subscribers: 2156,
  },
  {
    id: 'creator-4',
    user_id: 'user-creator-4',
    display_name: '과학탐험가 동현',
    bio: 'KAIST 물리학과 🔬 과학의 신비를 함께 탐험해요',
    profile_image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    is_verified: true,
    total_subscribers: 567,
  },
  {
    id: 'creator-5',
    user_id: 'user-creator-5',
    display_name: '국어천재 서연',
    bio: '수능 국어 만점! 비문학 완전 정복 비법 공개',
    profile_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    is_verified: false,
    total_subscribers: 423,
  },
];

// Mock Content Data
const mockContents = [
  // 수학 콘텐츠
  {
    id: 'content-1',
    creator_id: 'creator-1',
    title: '미적분 완전정복 - 기초부터 심화까지',
    description: '수능 미적분 30일 완성 커리큘럼! 개념부터 킬러문제까지 모두 다룹니다.',
    content_type: 'video',
    thumbnail_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=450&fit=crop',
    access_level: 'public',
    price: null,
    view_count: 15420,
    like_count: 892,
    comment_count: 156,
    is_published: true,
    published_at: new Date().toISOString(),
    tags: ['수학', '미적분', '수능'],
  },
  {
    id: 'content-2',
    creator_id: 'creator-1',
    title: '확률과 통계 핵심 정리',
    description: '헷갈리는 확통 개념, 이 영상 하나로 정리하세요!',
    content_type: 'video',
    thumbnail_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=450&fit=crop',
    access_level: 'subscribers',
    price: null,
    view_count: 8932,
    like_count: 567,
    comment_count: 89,
    is_published: true,
    published_at: new Date(Date.now() - 86400000).toISOString(),
    tags: ['수학', '확률', '통계'],
  },
  // 영어 콘텐츠
  {
    id: 'content-3',
    creator_id: 'creator-2',
    title: 'TOEIC 900+ 달성 비법 공개',
    description: '3개월 만에 900점 돌파한 실전 공부법을 알려드립니다.',
    content_type: 'video',
    thumbnail_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=450&fit=crop',
    access_level: 'paid',
    price: 9900,
    view_count: 12340,
    like_count: 1023,
    comment_count: 234,
    is_published: true,
    published_at: new Date(Date.now() - 172800000).toISOString(),
    tags: ['영어', 'TOEIC', '토익'],
  },
  {
    id: 'content-4',
    creator_id: 'creator-2',
    title: '영어 문법 총정리 노트',
    description: '시험에 나오는 핵심 문법만 모았습니다. PDF 다운로드 가능!',
    content_type: 'document',
    thumbnail_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop',
    access_level: 'public',
    price: null,
    view_count: 6789,
    like_count: 445,
    comment_count: 67,
    is_published: true,
    published_at: new Date(Date.now() - 259200000).toISOString(),
    tags: ['영어', '문법', '노트'],
  },
  // 코딩 콘텐츠
  {
    id: 'content-5',
    creator_id: 'creator-3',
    title: 'Python 기초 - 프로그래밍 첫걸음',
    description: '프로그래밍을 처음 시작하는 분들을 위한 Python 입문 강의',
    content_type: 'video',
    thumbnail_url: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=450&fit=crop',
    access_level: 'public',
    price: null,
    view_count: 23456,
    like_count: 1876,
    comment_count: 312,
    is_published: true,
    published_at: new Date(Date.now() - 345600000).toISOString(),
    tags: ['코딩', 'Python', '프로그래밍'],
  },
  {
    id: 'content-6',
    creator_id: 'creator-3',
    title: '웹 개발 로드맵 2024',
    description: '취업까지 이어지는 웹 개발 학습 로드맵을 공유합니다.',
    content_type: 'post',
    thumbnail_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop',
    access_level: 'subscribers',
    price: null,
    view_count: 9872,
    like_count: 723,
    comment_count: 156,
    is_published: true,
    published_at: new Date(Date.now() - 432000000).toISOString(),
    tags: ['코딩', '웹개발', '로드맵'],
  },
  // 과학 콘텐츠
  {
    id: 'content-7',
    creator_id: 'creator-4',
    title: '물리학 역학 완벽 정리',
    description: '뉴턴 역학부터 에너지 보존까지, 물리의 기초를 다집니다.',
    content_type: 'video',
    thumbnail_url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&h=450&fit=crop',
    access_level: 'public',
    price: null,
    view_count: 5678,
    like_count: 345,
    comment_count: 78,
    is_published: true,
    published_at: new Date(Date.now() - 518400000).toISOString(),
    tags: ['과학', '물리', '역학'],
  },
  {
    id: 'content-8',
    creator_id: 'creator-4',
    title: '화학 반응식 암기법',
    description: '어려운 화학 반응식, 쉽게 외우는 꿀팁 대방출!',
    content_type: 'audio',
    thumbnail_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=450&fit=crop',
    access_level: 'paid',
    price: 4900,
    view_count: 3421,
    like_count: 234,
    comment_count: 45,
    is_published: true,
    published_at: new Date(Date.now() - 604800000).toISOString(),
    tags: ['과학', '화학', '암기'],
  },
  // 국어 콘텐츠
  {
    id: 'content-9',
    creator_id: 'creator-5',
    title: '수능 비문학 공략법',
    description: '비문학 지문 읽는 법부터 선지 분석까지 완벽 가이드',
    content_type: 'video',
    thumbnail_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=450&fit=crop',
    access_level: 'public',
    price: null,
    view_count: 7890,
    like_count: 567,
    comment_count: 123,
    is_published: true,
    published_at: new Date(Date.now() - 691200000).toISOString(),
    tags: ['국어', '비문학', '수능'],
  },
  {
    id: 'content-10',
    creator_id: 'creator-5',
    title: '문학 감상법 - 시 편',
    description: '현대시 감상의 핵심 포인트를 알려드립니다.',
    content_type: 'document',
    thumbnail_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=450&fit=crop',
    access_level: 'subscribers',
    price: null,
    view_count: 4567,
    like_count: 321,
    comment_count: 56,
    is_published: true,
    published_at: new Date(Date.now() - 777600000).toISOString(),
    tags: ['국어', '문학', '시'],
  },
];

async function seedData() {
  console.log('🌱 Starting mock data seeding...\n');

  // 1. Clear existing mock data (optional - comment out if you want to keep existing data)
  console.log('🗑️  Clearing existing mock data...');

  await supabase.from('contents').delete().in('id', mockContents.map(c => c.id));
  await supabase.from('creator_settings').delete().in('id', mockCreators.map(c => c.id));

  console.log('✅ Cleared existing mock data\n');

  // 2. Insert creators
  console.log('👤 Inserting creators...');

  for (const creator of mockCreators) {
    const { error } = await supabase.from('creator_settings').upsert({
      id: creator.id,
      user_id: creator.user_id,
      display_name: creator.display_name,
      bio: creator.bio,
      profile_image_url: creator.profile_image_url,
      is_verified: creator.is_verified,
      total_subscribers: creator.total_subscribers,
      is_accepting_questions: true,
      default_content_access: 'public',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error(`❌ Failed to insert creator ${creator.display_name}:`, error.message);
    } else {
      console.log(`  ✅ ${creator.display_name}`);
    }
  }

  console.log('');

  // 3. Insert contents
  console.log('📄 Inserting contents...');

  for (const content of mockContents) {
    const { error } = await supabase.from('contents').upsert({
      id: content.id,
      creator_id: content.creator_id,
      title: content.title,
      description: content.description,
      content_type: content.content_type,
      thumbnail_url: content.thumbnail_url,
      access_level: content.access_level,
      price: content.price,
      view_count: content.view_count,
      like_count: content.like_count,
      comment_count: content.comment_count,
      is_published: content.is_published,
      published_at: content.published_at,
      tags: content.tags,
      content_data: {},
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error(`❌ Failed to insert content "${content.title}":`, error.message);
    } else {
      console.log(`  ✅ ${content.title}`);
    }
  }

  console.log('\n🎉 Mock data seeding completed!');
  console.log(`   - ${mockCreators.length} creators`);
  console.log(`   - ${mockContents.length} contents`);
}

seedData().catch(console.error);
