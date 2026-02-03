import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/me/liked-contents
 * Get current user's liked contents with full data
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

    // Admin 클라이언트로 likes 조회 (RLS 우회)
    const { data: likes, error } = await admin
      .from('content_likes')
      .select(`
        id,
        created_at,
        content_id,
        contents (
          id,
          product_id,
          creator_id,
          title,
          description,
          type,
          content_type,
          url,
          thumbnail_url,
          duration,
          sort_order,
          is_active,
          access_level,
          price,
          view_count,
          like_count,
          is_published,
          published_at,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch liked contents:', error);
      return NextResponse.json(
        { message: 'Failed to fetch liked contents' },
        { status: 500 }
      );
    }

    // 크리에이터 정보 조회
    const contents = await Promise.all(
      (likes || []).map(async (like: any) => {
        const content = like.contents;
        if (!content) return null;

        // 크리에이터 정보 가져오기
        let creator = null;
        if (content.creator_id) {
          const { data: creatorData } = await admin
            .from('creator_settings')
            .select('display_name, profile_image_url')
            .eq('user_id', content.creator_id)
            .maybeSingle();
          creator = creatorData;
        }

        return {
          ...content,
          liked_at: like.created_at,
          creator: creator ? {
            display_name: creator.display_name,
            profile_image_url: creator.profile_image_url,
          } : null,
        };
      })
    );

    return NextResponse.json({
      contents: contents.filter(Boolean),
    });
  } catch (error) {
    console.error('Liked contents API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
