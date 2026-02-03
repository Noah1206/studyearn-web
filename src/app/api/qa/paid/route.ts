import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/qa/paid
 * Create a paid question with payment record
 */
export async function POST(request: NextRequest) {
  try {
    const { creatorId, content, isAnonymous, buyerNote } = await request.json();

    if (!creatorId || !content?.trim()) {
      return NextResponse.json(
        { message: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    if (!buyerNote?.trim()) {
      return NextResponse.json(
        { message: '입금자명을 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // Can't ask question to yourself
    if (user.id === creatorId) {
      return NextResponse.json(
        { message: '자신에게 질문을 보낼 수 없습니다.' },
        { status: 400 }
      );
    }

    // Get creator's Q&A settings (price)
    const { data: qaSettings, error: settingsError } = await supabase
      .from('creator_qa_settings')
      .select('qa_price, is_qa_enabled')
      .eq('user_id', creatorId)
      .single();

    if (settingsError || !qaSettings) {
      return NextResponse.json(
        { message: '크리에이터 Q&A 설정을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (!qaSettings.is_qa_enabled) {
      return NextResponse.json(
        { message: '이 크리에이터는 Q&A를 받지 않습니다.' },
        { status: 400 }
      );
    }

    const price = qaSettings.qa_price || 0;

    if (price <= 0) {
      return NextResponse.json(
        { message: '유료 Q&A가 설정되지 않았습니다. 무료 Q&A를 이용해주세요.' },
        { status: 400 }
      );
    }

    // Calculate fees (20% platform fee)
    const platformFee = Math.floor(price * 0.2);
    const creatorAmount = price - platformFee;

    // Create question with pending payment status
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        creator_id: creatorId,
        asker_id: user.id,
        content: content.trim(),
        is_anonymous: isAnonymous || false,
        is_paid: true,
        price: price,
        payment_status: 'pending',
        status: 'pending',
      })
      .select()
      .single();

    if (questionError || !question) {
      console.error('Failed to create question:', questionError);
      return NextResponse.json(
        { message: '질문 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // Create payment record
    const { error: paymentError } = await supabase
      .from('qa_payments')
      .insert({
        question_id: question.id,
        buyer_id: user.id,
        creator_id: creatorId,
        amount: price,
        platform_fee: platformFee,
        creator_amount: creatorAmount,
        status: 'pending',
        buyer_note: buyerNote.trim(),
      });

    if (paymentError) {
      console.error('Failed to create payment:', paymentError);
      // Rollback question
      await supabase.from('questions').delete().eq('id', question.id);
      return NextResponse.json(
        { message: '결제 정보 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      questionId: question.id,
      message: '유료 질문이 등록되었습니다.',
    });
  } catch (error) {
    console.error('Paid Q&A API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
