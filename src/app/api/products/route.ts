import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/products
 * Get all active products
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

    // Join products with creator_settings to get creator info
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        title,
        description,
        price,
        thumbnail_url,
        is_active,
        created_at,
        subject,
        grade,
        creator_settings!products_creator_id_fkey (
          id,
          display_name,
          profile_image_url,
          subject
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch products:', error);
      return NextResponse.json(
        { message: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Transform to include creator as a flat object
    const productsWithCreator = (products || []).map((product: {
      creator_settings?: { display_name?: string; profile_image_url?: string; subject?: string } | null;
      subject?: string | null;
      [key: string]: unknown;
    }) => ({
      ...product,
      // Use product's subject, fallback to creator's subject
      subject: product.subject || product.creator_settings?.subject || null,
      creator: product.creator_settings ? {
        name: product.creator_settings.display_name || '익명',
        avatar_url: product.creator_settings.profile_image_url,
      } : { name: '익명' },
      creator_settings: undefined, // Remove the nested object
    }));

    return NextResponse.json({ products: productsWithCreator });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
