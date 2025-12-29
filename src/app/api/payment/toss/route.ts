import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

interface CreateTossPaymentRequest {
  productId: string;
  amount: number;
}

/**
 * POST /api/payment/toss
 * Create a pending purchase for Toss MiniApp payment
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateTossPaymentRequest = await request.json();
    const { productId, amount } = body;

    if (!productId || !amount) {
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

    // Verify product exists and price matches
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.price !== amount) {
      return NextResponse.json(
        { message: 'Amount does not match product price' },
        { status: 400 }
      );
    }

    // Check if already purchased
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .eq('status', 'completed')
      .single();

    if (existingPurchase) {
      return NextResponse.json(
        { message: 'Already purchased' },
        { status: 400 }
      );
    }

    // Generate order ID for Toss
    const orderId = `TOSS_${Date.now()}_${uuidv4().substring(0, 8)}`;

    // Create pending purchase with source='toss'
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .upsert({
        user_id: user.id,
        product_id: productId,
        source: 'toss',
        amount: amount,
        status: 'pending',
        order_id: orderId,
      }, {
        onConflict: 'user_id,product_id',
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
      orderName: product.title,
      purchaseId: purchase.id,
    });
  } catch (error) {
    console.error('Payment toss API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
