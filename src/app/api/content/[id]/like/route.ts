import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      .eq('content_id', id)
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
        .insert({ content_id: id, user_id: user.id });

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json({ error: '저장 오류' }, { status: 500 });
      }
      return NextResponse.json({ isLiked: true });
    }
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json({ error: '오류 발생' }, { status: 500 });
  }
}
