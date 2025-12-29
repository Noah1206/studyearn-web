import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface PurchaseWithProduct {
  id: string;
  product_id: string;
  amount: number;
  status: string;
  source: string | null;
  paid_at: string | null;
  created_at: string;
  product: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    price: number;
  } | null;
}

/**
 * GET /api/me/purchases
 * Get current user's purchases (MVP structure)
 */
export async function GET() {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { message: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get purchases with product info (MVP structure)
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select(`
        id,
        product_id,
        amount,
        status,
        source,
        paid_at,
        created_at,
        product:products(
          id,
          title,
          thumbnail_url,
          price
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch purchases:', error);
      return NextResponse.json(
        { message: 'Failed to fetch purchases' },
        { status: 500 }
      );
    }

    // Transform to match frontend expected format
    const formattedPurchases = (purchases as PurchaseWithProduct[] || []).map((purchase) => ({
      id: purchase.id,
      product_id: purchase.product_id,
      amount: purchase.amount,
      status: purchase.status,
      source: purchase.source || 'web',
      created_at: purchase.paid_at || purchase.created_at,
      product: purchase.product ? {
        id: purchase.product.id,
        title: purchase.product.title,
        thumbnail_url: purchase.product.thumbnail_url,
        price: purchase.product.price,
      } : null,
    }));

    return NextResponse.json({ purchases: formattedPurchases });
  } catch (error) {
    console.error('Purchases API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
