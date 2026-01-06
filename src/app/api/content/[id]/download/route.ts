import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/content/[id]/download
 * Get download URL and increment download count
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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get content details (without is_published filter for owner check)
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .select('id, title, url, price, creator_id, type, is_published')
      .eq('id', id)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { message: 'Content not found' },
        { status: 404 }
      );
    }

    // Check access: owner, free content, or purchased
    const isOwner = content.creator_id === user.id;
    const isFree = !content.price || content.price === 0;

    // Owner can always download their own content (even unpublished)
    // Others can only download published content
    if (!isOwner && !content.is_published) {
      return NextResponse.json(
        { message: 'Content not available' },
        { status: 404 }
      );
    }

    if (!isOwner && !isFree) {
      // Check if user has purchased
      const { data: purchase } = await supabase
        .from('content_purchases')
        .select('id')
        .eq('content_id', id)
        .eq('buyer_id', user.id)
        .eq('status', 'completed')
        .single();

      if (!purchase) {
        return NextResponse.json(
          { message: 'Purchase required to download' },
          { status: 403 }
        );
      }
    }

    if (!content.url) {
      return NextResponse.json(
        { message: 'Download URL not available' },
        { status: 404 }
      );
    }

    // Increment download count (simple approach)
    const { data: currentContent } = await supabase
      .from('contents')
      .select('download_count')
      .eq('id', id)
      .single();

    await supabase
      .from('contents')
      .update({ download_count: (currentContent?.download_count || 0) + 1 })
      .eq('id', id);

    return NextResponse.json({
      downloadUrl: content.url,
      filename: `${content.title}.${content.type === 'pdf' ? 'pdf' : content.type === 'image' ? 'jpg' : 'mp4'}`,
    });
  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
