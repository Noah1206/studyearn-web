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

    // Get product with creator info
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        creator_settings!products_creator_id_fkey (
          id,
          display_name,
          profile_image_url,
          bio
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    // Transform product to include creator as flat object
    const productWithCreator = {
      ...product,
      creator: product.creator_settings ? {
        name: product.creator_settings.display_name || '익명',
        avatar_url: product.creator_settings.profile_image_url,
        bio: product.creator_settings.bio,
      } : { name: '익명' },
      creator_settings: undefined,
    };

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
      product: productWithCreator,
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
