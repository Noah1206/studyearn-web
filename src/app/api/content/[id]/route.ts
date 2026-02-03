import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/content/[id]
 * Get content with URL (validates purchase first)
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

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get content
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { message: 'Content not found' },
        { status: 404 }
      );
    }

    // Validate purchase
    const { data: purchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', content.product_id)
      .eq('status', 'completed')
      .single();

    if (!purchase) {
      return NextResponse.json(
        { message: 'Purchase required to access this content' },
        { status: 403 }
      );
    }

    // Return full content including URL
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Content API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
