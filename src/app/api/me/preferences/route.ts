import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/me/preferences
 * Get current user's preferences (bypasses RLS)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    if (!supabase || !admin) {
      return NextResponse.json(
        { message: 'Database connection failed' },
        { status: 500 }
      );
    }

    // getSession으로 빠르게 확인
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Admin 클라이언트로 preferences 조회 (RLS 우회)
    const { data: preferences, error } = await admin
      .from('user_preferences')
      .select('notification_settings, privacy_settings')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch preferences:', error);
      return NextResponse.json(
        { message: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      preferences: preferences || null,
    });
  } catch (error) {
    console.error('Preferences API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/me/preferences
 * Update current user's preferences
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    if (!supabase || !admin) {
      return NextResponse.json(
        { message: 'Database connection failed' },
        { status: 500 }
      );
    }

    // getSession으로 빠르게 확인
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notification_settings, privacy_settings } = body;

    // Admin 클라이언트로 preferences upsert (RLS 우회)
    const updateData: Record<string, unknown> = {
      user_id: session.user.id,
      updated_at: new Date().toISOString(),
    };

    if (notification_settings !== undefined) {
      updateData.notification_settings = notification_settings;
    }
    if (privacy_settings !== undefined) {
      updateData.privacy_settings = privacy_settings;
    }

    const { data, error } = await admin
      .from('user_preferences')
      .upsert(updateData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Failed to update preferences:', error);
      return NextResponse.json(
        { message: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      preferences: data,
    });
  } catch (error) {
    console.error('Preferences API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
