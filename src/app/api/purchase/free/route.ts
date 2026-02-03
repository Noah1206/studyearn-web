import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notify } from '@/lib/notifications';

/**
 * POST /api/purchase/free
 * Claim free content - creates a completed purchase record with 0 amount
 */
export async function POST(request: NextRequest) {
  try {
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
    const { contentId } = body;

    if (!contentId) {
      return NextResponse.json(
        { message: '콘텐츠 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // Get content info
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .select('id, title, price, creator_id, is_published')
      .eq('id', contentId)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { message: '콘텐츠를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (!content.is_published) {
      return NextResponse.json(
        { message: '이용할 수 없는 콘텐츠입니다.' },
        { status: 400 }
      );
    }

    // Verify content is free
    if (content.price && content.price > 0) {
      return NextResponse.json(
        { message: '무료 콘텐츠가 아닙니다.' },
        { status: 400 }
      );
    }

    if (content.creator_id === user.id) {
      return NextResponse.json(
        { message: '자신의 콘텐츠입니다.' },
        { status: 400 }
      );
    }

    // Check if already claimed
    const { data: existingPurchase } = await supabase
      .from('content_purchases')
      .select('id')
      .eq('content_id', contentId)
      .eq('buyer_id', user.id)
      .eq('status', 'completed')
      .single();

    if (existingPurchase) {
      return NextResponse.json(
        { message: '이미 받은 콘텐츠입니다.', alreadyClaimed: true },
        { status: 200 }
      );
    }

    // Create completed purchase record for free content
    const { data: newPurchase, error: insertError } = await supabase
      .from('content_purchases')
      .insert({
        content_id: contentId,
        buyer_id: user.id,
        seller_id: content.creator_id,
        amount: 0,
        status: 'completed',
        payment_confirmed_at: new Date().toISOString(),
        seller_confirmed_at: new Date().toISOString(),
        creator_revenue: 0,
        platform_fee: 0,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to create free purchase:', insertError);
      return NextResponse.json(
        { message: '처리에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 크리에이터에게 알림
    const { data: buyerProfile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();
    notify.purchase(content.creator_id, buyerProfile?.nickname || '누군가', content.title, 0, newPurchase.id);

    return NextResponse.json({
      success: true,
      message: '무료 콘텐츠를 받았습니다!',
      purchaseId: newPurchase.id,
    });
  } catch (error) {
    console.error('Free content claim API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
