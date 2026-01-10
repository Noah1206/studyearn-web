import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // Check if content exists
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .select('id, like_count')
      .eq('id', id)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { error: '콘텐츠를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('content_likes')
      .select('id')
      .eq('content_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingLike) {
      // Unlike - remove the like
      const { error: deleteError } = await supabase
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

      // Decrement like count
      await supabase
        .from('contents')
        .update({ like_count: Math.max(0, (content.like_count || 0) - 1) })
        .eq('id', id);

      return NextResponse.json({
        isLiked: false,
        like_count: Math.max(0, (content.like_count || 0) - 1),
        message: '찜이 취소되었습니다.',
      });
    } else {
      // Like - add the like
      const { data: insertData, error: insertError } = await supabase
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

      console.log('Like inserted:', insertData);

      // Increment like count
      await supabase
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
