import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/products/[id]
 * Get single product with contents
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { message: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    // Get contents (without URLs - URLs are only returned if purchased)
    const { data: contents, error: contentsError } = await supabase
      .from('contents')
      .select('id, product_id, title, type, thumbnail_url, duration, sort_order')
      .eq('product_id', id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (contentsError) {
      console.error('Failed to fetch contents:', contentsError);
    }

    // Check if current user has purchased
    let hasPurchased = false;
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: purchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .eq('status', 'completed')
        .single();

      hasPurchased = !!purchase;
    }

    return NextResponse.json({
      product,
      contents: contents || [],
      hasPurchased,
    });
  } catch (error) {
    console.error('Product API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
