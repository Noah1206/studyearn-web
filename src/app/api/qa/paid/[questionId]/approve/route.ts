import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/qa/paid/[questionId]/approve
 * Creator approves the payment (confirms deposit received)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;
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
      .select('id, creator_id, is_paid, payment_status')
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

    // Check if this is a paid question
    if (!question.is_paid) {
      return NextResponse.json(
        { message: '무료 질문입니다.' },
        { status: 400 }
      );
    }

    // Check if payment is pending
    if (question.payment_status !== 'pending') {
      return NextResponse.json(
        { message: '이미 처리된 결제입니다.' },
        { status: 400 }
      );
    }

    // Update question payment status
    const { error: updateQuestionError } = await supabase
      .from('questions')
      .update({ payment_status: 'confirmed' })
      .eq('id', questionId);

    if (updateQuestionError) {
      console.error('Failed to update question:', updateQuestionError);
      return NextResponse.json(
        { message: '질문 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    // Update payment status
    const { error: updatePaymentError } = await supabase
      .from('qa_payments')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('question_id', questionId);

    if (updatePaymentError) {
      console.error('Failed to update payment:', updatePaymentError);
      return NextResponse.json(
        { message: '결제 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '결제가 승인되었습니다.',
    });
  } catch (error) {
    console.error('Payment approve API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
