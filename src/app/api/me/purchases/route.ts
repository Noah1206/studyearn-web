import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ContentPurchase {
  id: string;
  content_id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  completed_at: string | null;
  contents: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    price: number;
  } | null;
}

/**
 * GET /api/me/purchases
 * Get current user's content purchases (P2P model)
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

    // Get content purchases (P2P model)
    const { data: purchases, error } = await supabase
      .from('content_purchases')
      .select(`
        id,
        content_id,
        amount,
        status,
        payment_method,
        created_at,
        completed_at,
        contents:content_id (
          id,
          title,
          thumbnail_url,
          price
        )
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch purchases:', error);
      return NextResponse.json(
        { message: 'Failed to fetch purchases' },
        { status: 500 }
      );
    }

    // Transform to match frontend expected format
    const formattedPurchases = (purchases as ContentPurchase[] || []).map((purchase) => ({
      id: purchase.id,
      content_id: purchase.content_id,
      amount: purchase.amount,
      status: purchase.status,
      payment_method: purchase.payment_method || 'p2p',
      created_at: purchase.completed_at || purchase.created_at,
      content: purchase.contents ? {
        id: purchase.contents.id,
        title: purchase.contents.title,
        thumbnail_url: purchase.contents.thumbnail_url,
        price: purchase.contents.price,
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
