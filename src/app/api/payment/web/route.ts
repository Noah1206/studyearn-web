import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

interface CreatePaymentRequest {
  productId: string;  // Actually contentId
  amount: number;
}

/**
 * POST /api/payment/web
 * Create a pending purchase for web payment
 * Uses contents table and content_purchases table
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentRequest = await request.json();
    const { productId: contentId, amount } = body;

    if (!contentId || !amount) {
      return NextResponse.json(
        { message: 'productId and amount are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { message: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify content exists and price matches (using contents table)
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .select('id, title, price, creator_id, is_published')
      .eq('id', contentId)
      .eq('is_published', true)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { message: 'Content not found' },
        { status: 404 }
      );
    }

    if (content.price !== amount) {
      return NextResponse.json(
        { message: 'Amount does not match content price' },
        { status: 400 }
      );
    }

    // Check if already purchased (using content_purchases table)
    const { data: existingPurchase } = await supabase
      .from('content_purchases')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('content_id', contentId)
      .eq('status', 'completed')
      .single();

    if (existingPurchase) {
      return NextResponse.json(
        { message: 'Already purchased' },
        { status: 400 }
      );
    }

    // Generate order ID
    const orderId = `STUPLE_${Date.now()}_${uuidv4().substring(0, 8)}`;

    // Delete any existing pending purchases for this content by this user
    await supabase
      .from('content_purchases')
      .delete()
      .eq('buyer_id', user.id)
      .eq('content_id', contentId)
      .eq('status', 'pending');

    // Create pending purchase in content_purchases table
    const { data: purchase, error: purchaseError } = await supabase
      .from('content_purchases')
      .insert({
        buyer_id: user.id,
        content_id: contentId,
        seller_id: content.creator_id,
        amount: amount,
        status: 'pending',
        order_id: orderId,
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Failed to create purchase:', purchaseError);
      return NextResponse.json(
        { message: 'Failed to create purchase' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId,
      amount,
      orderName: content.title,
      purchaseId: purchase.id,
    });
  } catch (error) {
    console.error('Payment web API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
