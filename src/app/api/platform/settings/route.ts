import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

/**
 * PUT /api/platform/settings
 * Update platform settings (admin only)
 */
export async function PUT(request: NextRequest) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const supabase = createAdminClient();

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
export async function GET() {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const supabase = createAdminClient();

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
