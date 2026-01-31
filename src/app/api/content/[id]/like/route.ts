import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { notify } from '@/lib/notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // URL의 id는 content.id (contents 테이블의 id)
    const { id: contentId } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    if (!supabase || !admin) {
      return NextResponse.json({ error: '서버 설정 오류' }, { status: 500 });
    }

    // 로그인 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 });
    }

    // 이미 찜했는지 확인
    const { data: existing, error: selectError } = await admin
      .from('content_likes')
      .select('id')
      .eq('content_id', contentId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (selectError) {
      console.error('Select error:', selectError);
      return NextResponse.json({ error: '조회 오류' }, { status: 500 });
    }

    if (existing) {
      // 찜 취소
      const { error: deleteError } = await admin
        .from('content_likes')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        return NextResponse.json({ error: '삭제 오류' }, { status: 500 });
      }
      return NextResponse.json({ isLiked: false });
    } else {
      // 찜하기
      const { error: insertError } = await admin
        .from('content_likes')
        .insert({ content_id: contentId, user_id: user.id });

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json({ error: '저장 오류' }, { status: 500 });
      }
      // Send notification to content creator
      const { data: content } = await admin
        .from('contents')
        .select('creator_id, title')
        .eq('id', contentId)
        .single();

      if (content && content.creator_id !== user.id) {
        const { data: profile } = await admin
          .from('profiles')
          .select('nickname')
          .eq('id', user.id)
          .single();
        notify.like(content.creator_id, profile?.nickname || '누군가', contentId, content.title).catch(() => {});
      }

      return NextResponse.json({ isLiked: true });
    }
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json({ error: '오류 발생' }, { status: 500 });
  }
}
