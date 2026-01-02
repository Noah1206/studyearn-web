import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/products
 * Get all published contents (including routines, materials, etc.)
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

    // Query contents table (where uploads are saved)
    const { data: contents, error } = await supabase
      .from('contents')
      .select(`
        id,
        title,
        description,
        price,
        thumbnail_url,
        is_published,
        created_at,
        subject,
        grade,
        content_type,
        type,
        view_count,
        like_count,
        creator_settings!contents_creator_id_fkey (
          id,
          display_name,
          profile_image_url,
          subject
        )
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch contents:', error);
      return NextResponse.json(
        { message: 'Failed to fetch contents' },
        { status: 500 }
      );
    }

    // Transform to include creator as a flat object
    const productsWithCreator = (contents || []).map((content: {
      creator_settings?: { display_name?: string; profile_image_url?: string; subject?: string } | null;
      subject?: string | null;
      content_type?: string | null;
      [key: string]: unknown;
    }) => ({
      ...content,
      // Use content's subject, fallback to creator's subject
      subject: content.subject || content.creator_settings?.subject || null,
      // Map content_type to display-friendly subject if it's a routine
      ...(content.content_type === 'routine' && !content.subject ? { subject: '루틴' } : {}),
      creator: content.creator_settings ? {
        name: content.creator_settings.display_name || '익명',
        avatar_url: content.creator_settings.profile_image_url,
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
