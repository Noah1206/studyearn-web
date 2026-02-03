import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notify } from '@/lib/notifications';

/**
 * POST /api/qa/questions/[id]/answer
 * Answer a question (creator only)
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

    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { message: '답변 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    // Get question and verify ownership
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id, creator_id, asker_id, content, status')
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
        { message: '이미 답변한 질문입니다.' },
        { status: 400 }
      );
    }

    // Create answer
    const { data: answer, error: answerError } = await supabase
      .from('answers')
      .insert({
        question_id: questionId,
        creator_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (answerError) {
      console.error('Failed to create answer:', answerError);
      return NextResponse.json(
        { message: '답변 등록에 실패했습니다.' },
        { status: 500 }
      );
    }

    // Update question status
    const { error: updateError } = await supabase
      .from('questions')
      .update({
        status: 'answered',
        answered_at: new Date().toISOString(),
      })
      .eq('id', questionId);

    if (updateError) {
      console.error('Failed to update question status:', updateError);
    }

    // 질문자에게 알림
    const { data: creatorProfile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();
    notify.qaAnswer(
      question.asker_id,
      creatorProfile?.nickname || '크리에이터',
      question.content.substring(0, 30) + (question.content.length > 30 ? '...' : ''),
      questionId,
    );

    return NextResponse.json({
      success: true,
      message: '답변이 등록되었습니다.',
      answer,
    });
  } catch (error) {
    console.error('Answer API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
