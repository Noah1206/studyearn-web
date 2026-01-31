import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/follow?type=following|followers
 * Get user's following/followers list
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ message: 'Database connection failed' }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const type = request.nextUrl.searchParams.get('type') || 'following';

    if (type === 'following') {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          creator_id,
          is_notified,
          subscribed_at,
          creator:creator_settings(
            user_id,
            display_name,
            profile_image_url,
            bio,
            subject,
            total_content_count,
            total_subscribers
          )
        `)
        .eq('subscriber_id', user.id)
        .order('subscribed_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch following:', error);
        return NextResponse.json({ message: '팔로잉 목록 조회에 실패했습니다.' }, { status: 500 });
      }

      return NextResponse.json({ data: data || [] });
    }

    // followers
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        subscriber_id,
        subscribed_at,
        subscriber:profiles(
          id,
          nickname,
          username,
          avatar_url,
          bio
        )
      `)
      .eq('creator_id', user.id)
      .order('subscribed_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch followers:', error);
      return NextResponse.json({ message: '팔로워 목록 조회에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Follow GET API error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

/**
 * POST /api/follow
 * Follow a creator
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ message: 'Database connection failed' }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { creator_id } = body;

    if (!creator_id) {
      return NextResponse.json({ message: 'creator_id가 필요합니다.' }, { status: 400 });
    }

    if (creator_id === user.id) {
      return NextResponse.json({ message: '자기 자신을 팔로우할 수 없습니다.' }, { status: 400 });
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('subscriber_id', user.id)
      .eq('creator_id', creator_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: '이미 팔로우 중입니다.' }, { status: 409 });
    }

    // Create subscription
    const { error: insertError } = await supabase
      .from('user_subscriptions')
      .insert({
        subscriber_id: user.id,
        creator_id,
        is_notified: true,
      });

    if (insertError) {
      console.error('Follow insert error:', insertError);
      return NextResponse.json({ message: '팔로우에 실패했습니다.' }, { status: 500 });
    }

    // Update follower/following counts
    await Promise.all([
      supabase
        .from('profiles')
        .update({ following_count: (await supabase.from('user_subscriptions').select('id', { count: 'exact' }).eq('subscriber_id', user.id)).count || 0 })
        .eq('id', user.id),
      supabase
        .from('creator_settings')
        .update({ total_subscribers: (await supabase.from('user_subscriptions').select('id', { count: 'exact' }).eq('creator_id', creator_id)).count || 0 })
        .eq('user_id', creator_id),
      supabase
        .from('profiles')
        .update({ follower_count: (await supabase.from('user_subscriptions').select('id', { count: 'exact' }).eq('creator_id', creator_id)).count || 0 })
        .eq('id', creator_id),
    ]);

    // Create notification for the creator
    await createFollowNotification(supabase, user.id, creator_id);

    return NextResponse.json({
      success: true,
      message: '팔로우했습니다.',
    }, { status: 201 });
  } catch (error) {
    console.error('Follow POST API error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

/**
 * DELETE /api/follow
 * Unfollow a creator
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ message: 'Database connection failed' }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { creator_id, subscription_id } = body;

    if (!creator_id && !subscription_id) {
      return NextResponse.json({ message: 'creator_id 또는 subscription_id가 필요합니다.' }, { status: 400 });
    }

    let query = supabase
      .from('user_subscriptions')
      .delete();

    if (subscription_id) {
      query = query.eq('id', subscription_id).eq('subscriber_id', user.id);
    } else {
      query = query.eq('subscriber_id', user.id).eq('creator_id', creator_id);
    }

    const { error: deleteError } = await query;

    if (deleteError) {
      console.error('Unfollow error:', deleteError);
      return NextResponse.json({ message: '언팔로우에 실패했습니다.' }, { status: 500 });
    }

    // Update counts
    const targetCreatorId = creator_id || null;
    if (targetCreatorId) {
      await Promise.all([
        supabase
          .from('profiles')
          .update({ following_count: Math.max(0, (await supabase.from('user_subscriptions').select('id', { count: 'exact' }).eq('subscriber_id', user.id)).count || 0) })
          .eq('id', user.id),
        supabase
          .from('creator_settings')
          .update({ total_subscribers: Math.max(0, (await supabase.from('user_subscriptions').select('id', { count: 'exact' }).eq('creator_id', targetCreatorId)).count || 0) })
          .eq('user_id', targetCreatorId),
        supabase
          .from('profiles')
          .update({ follower_count: Math.max(0, (await supabase.from('user_subscriptions').select('id', { count: 'exact' }).eq('creator_id', targetCreatorId)).count || 0) })
          .eq('id', targetCreatorId),
      ]);
    }

    return NextResponse.json({
      success: true,
      message: '언팔로우했습니다.',
    });
  } catch (error) {
    console.error('Follow DELETE API error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

/**
 * PATCH /api/follow
 * Update follow notification settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ message: 'Database connection failed' }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription_id, is_notified } = body;

    if (!subscription_id || typeof is_notified !== 'boolean') {
      return NextResponse.json({ message: '잘못된 요청입니다.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_subscriptions')
      .update({ is_notified })
      .eq('id', subscription_id)
      .eq('subscriber_id', user.id);

    if (error) {
      console.error('Update notification error:', error);
      return NextResponse.json({ message: '알림 설정 변경에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Follow PATCH API error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// Helper to create follow notification
async function createFollowNotification(supabase: any, followerId: string, creatorId: string) {
  try {
    // Get follower name
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', followerId)
      .single();

    const followerName = profile?.nickname || '누군가';

    await supabase
      .from('notifications')
      .insert({
        user_id: creatorId,
        type: 'follow',
        title: '새로운 팔로워',
        message: `${followerName}님이 회원님을 팔로우했습니다.`,
        data: { follower_id: followerId },
      });
  } catch {
    // Notification table might not exist yet - fail silently
  }
}
