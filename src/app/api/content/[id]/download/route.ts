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

    // Get content details
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .select('id, title, url, price, creator_id, type')
      .eq('id', id)
      .eq('is_published', true)
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

    // Increment download count
    await supabase.rpc('increment_download_count', { content_id: id }).catch(() => {
      // Fallback to direct update if RPC doesn't exist
      supabase
        .from('contents')
        .update({ download_count: supabase.rpc('coalesce', { val: 'download_count', default_val: 0 }) })
        .eq('id', id);
    });

    // Simple increment
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
