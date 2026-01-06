import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/qa/questions/[id]/reject
 * Reject/delete a question (creator only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // Get question and verify ownership
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id, creator_id, status')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { message: '질문을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Verify user is the creator who received the question
    if (question.creator_id !== user.id) {
      return NextResponse.json(
        { message: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // Check if already answered
    if (question.status === 'answered') {
      return NextResponse.json(
        { message: '이미 답변한 질문은 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    // Update question status to rejected
    const { error: updateError } = await supabase
      .from('questions')
      .update({ status: 'rejected' })
      .eq('id', questionId);

    if (updateError) {
      console.error('Failed to reject question:', updateError);
      return NextResponse.json(
        { message: '질문 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '질문이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Reject question API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
