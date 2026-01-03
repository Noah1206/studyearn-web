import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
