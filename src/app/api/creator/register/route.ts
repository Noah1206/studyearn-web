import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/creator/register
 * Register user as a creator (create creator_settings)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { message: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // Check if already a creator
    const { data: existing } = await supabase
      .from('creator_settings')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { message: '이미 크리에이터로 등록되어 있습니다.' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const {
      display_name,
      bio,
      categories,
      profile_image_url,
    } = body;

    if (!display_name || display_name.trim().length < 2) {
      return NextResponse.json(
        { message: '크리에이터 이름을 2자 이상 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!categories || categories.length === 0) {
      return NextResponse.json(
        { message: '최소 1개 이상의 전문분야를 선택해주세요.' },
        { status: 400 }
      );
    }

    // Determine profile image URL
    let avatarUrl = profile_image_url || null;
    if (!avatarUrl) {
      // Fallback to existing profile or auth metadata
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || null;
    }

    // Create creator settings
    const { error: settingsError } = await supabase
      .from('creator_settings')
      .insert({
        user_id: user.id,
        display_name: display_name.trim(),
        bio: bio?.trim() || null,
        profile_image_url: avatarUrl,
        categories,
        is_accepting_questions: true,
        default_content_access: 'public',
      });

    if (settingsError) {
      console.error('Creator settings insert error:', settingsError);
      return NextResponse.json(
        { message: '크리에이터 등록에 실패했습니다.' },
        { status: 500 }
      );
    }

    // Update user metadata
    await supabase.auth.updateUser({
      data: {
        user_type: 'creator',
        is_creator_onboarded: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: '크리에이터로 등록되었습니다.',
    }, { status: 201 });
  } catch (error) {
    console.error('Creator register API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
