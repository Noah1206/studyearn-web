import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PUT /api/platform/settings
 * Update platform settings (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { message: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { message: 'key와 value가 필요합니다.' },
        { status: 400 }
      );
    }

    // Upsert the setting
    const { error } = await supabase
      .from('platform_settings')
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) {
      console.error('Failed to update platform setting:', error);
      return NextResponse.json(
        { message: '설정 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Platform settings PUT error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/platform/settings
 * Get platform settings (payment account, payout settings)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      // Get specific setting
      const { data, error } = await supabase
        .from('platform_settings')
        .select('key, value')
        .eq('key', key)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { message: '설정을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      return NextResponse.json(data);
    }

    // Get all settings
    const { data, error } = await supabase
      .from('platform_settings')
      .select('key, value');

    if (error) {
      return NextResponse.json(
        { message: '설정을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // Convert to object format
    const settings = data.reduce((acc: Record<string, unknown>, item: { key: string; value: unknown }) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Platform settings API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
