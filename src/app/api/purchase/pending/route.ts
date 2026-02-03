import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/purchase/pending
 * Check if user has a pending purchase for a content
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { hasPending: false },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json(
        { message: 'contentId가 필요합니다.' },
        { status: 400 }
      );
    }

    // Check if there's a pending purchase (only pending_confirm for P2P transfers)
    // pending_payment is for card payments and should allow retry
    const { data: pendingPurchase, error } = await supabase
      .from('content_purchases')
      .select('id, status')
      .eq('content_id', contentId)
      .eq('buyer_id', user.id)
      .eq('status', 'pending_confirm')
      .maybeSingle();

    if (error) {
      console.error('Failed to check pending purchase:', error);
      return NextResponse.json(
        { hasPending: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      hasPending: !!pendingPurchase,
      status: pendingPurchase?.status || null,
    });
  } catch (error) {
    console.error('Pending purchase check API error:', error);
    return NextResponse.json(
      { hasPending: false },
      { status: 200 }
    );
  }
}
