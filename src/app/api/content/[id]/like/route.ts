import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/content/[id]/like
 * Toggle like status for content (찜하기/찜 취소)
 * 자신의 콘텐츠도 찜하기 가능
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Check admin client is available
    if (!adminClient) {
      console.error('Like API - Admin client not available (missing SUPABASE_SERVICE_ROLE_KEY)');
      return NextResponse.json(
        { error: '서버 설정 오류입니다.' },
        { status: 500 }
      );
    }

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Like API - User:', user?.id, 'Content ID:', id);
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // Check if content exists (use admin client to bypass RLS)
    const { data: content, error: contentError } = await adminClient
      .from('contents')
      .select('id, like_count')
      .eq('id', id)
      .single();

    console.log('Like API - Content check:', content?.id, 'Error:', contentError?.message);

    if (contentError || !content) {
      return NextResponse.json(
        { error: '콘텐츠를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Check if already liked (use admin client to bypass RLS)
    const { data: existingLike } = await adminClient
      .from('content_likes')
      .select('id')
      .eq('content_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('Like API - Existing like:', existingLike);

    if (existingLike) {
      // Unlike - remove the like (use admin client to bypass RLS)
      const { error: deleteError } = await adminClient
        .from('content_likes')
        .delete()
        .eq('content_id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Failed to unlike:', deleteError);
        return NextResponse.json(
          { error: '찜 취소에 실패했습니다.' },
          { status: 500 }
        );
      }

      // Decrement like count (use admin client)
      await adminClient
        .from('contents')
        .update({ like_count: Math.max(0, (content.like_count || 0) - 1) })
        .eq('id', id);

      console.log('Like API - Unlike success for content:', id);

      return NextResponse.json({
        isLiked: false,
        like_count: Math.max(0, (content.like_count || 0) - 1),
        message: '찜이 취소되었습니다.',
      });
    } else {
      // Like - add the like (use admin client to bypass RLS)
      const { data: insertData, error: insertError } = await adminClient
        .from('content_likes')
        .insert({
          content_id: id,
          user_id: user.id,
        })
        .select();

      if (insertError) {
        console.error('Failed to like:', insertError);
        return NextResponse.json(
          {
            error: '찜하기에 실패했습니다.',
            details: insertError.message,
            code: insertError.code,
          },
          { status: 500 }
        );
      }

      console.log('Like API - Like inserted:', insertData);

      // Increment like count (use admin client)
      await adminClient
        .from('contents')
        .update({ like_count: (content.like_count || 0) + 1 })
        .eq('id', id);

      return NextResponse.json({
        isLiked: true,
        like_count: (content.like_count || 0) + 1,
        message: '찜 목록에 추가되었습니다.',
      });
    }
  } catch (error) {
    console.error('Like API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
