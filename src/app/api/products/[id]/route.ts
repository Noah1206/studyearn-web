import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/products/[id]
 * Get single content detail with purchase status
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

    // Get content detail from contents table
    const { data: content, error } = await supabase
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
        url,
        access_level,
        view_count,
        like_count,
        download_count,
        rating_sum,
        rating_count,
        routine_type,
        routine_days,
        routine_items,
        creator_id,
        allow_preview
      `)
      .eq('id', id)
      .single();

    if (error || !content) {
      return NextResponse.json(
        { message: 'Content not found' },
        { status: 404 }
      );
    }

    // Get creator info separately (foreign key might not exist for legacy data)
    let creatorInfo = null;
    let profileInfo = null;
    if (content.creator_id) {
      // First get creator settings
      const { data: creator } = await supabase
        .from('creator_settings')
        .select(`
          display_name,
          profile_image_url,
          bio,
          subject,
          payment_method,
          toss_id,
          kakaopay_link,
          bank_name,
          bank_account,
          account_holder
        `)
        .eq('user_id', content.creator_id)
        .maybeSingle();
      creatorInfo = creator;

      // Also get profile info for avatar_url fallback
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url, bio')
        .eq('id', content.creator_id)
        .maybeSingle();
      profileInfo = profile;
    }

    // Check if user is authenticated and has purchased
    let isPurchased = false;
    let isOwner = false;
    let isLiked = false;

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Check if user is the creator (owner)
      if (content.creator_id === user.id) {
        isOwner = true;
        isPurchased = true; // Owners have access
      } else if (content.price && content.price > 0) {
        // Check purchase status for paid content
        const { data: purchase } = await supabase
          .from('content_purchases')
          .select('id')
          .eq('content_id', id)
          .eq('buyer_id', user.id)
          .eq('status', 'completed')
          .maybeSingle();

        isPurchased = !!purchase;
      } else {
        // Free content is accessible
        isPurchased = true;
      }

      // Check if user has liked this content
      const { data: like } = await supabase
        .from('content_likes')
        .select('id')
        .eq('content_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      isLiked = !!like;
    } else if (!content.price || content.price === 0) {
      // Free content accessible without login
      isPurchased = true;
    }

    // Transform to product format for frontend compatibility
    const product = {
      id: content.id,
      title: content.title,
      description: content.description,
      price: content.price || 0,
      thumbnail_url: content.thumbnail_url,
      is_active: content.is_published,
      created_at: content.created_at,
      subject: content.subject || creatorInfo?.subject || null,
      grade: content.grade,
      content_type: content.content_type,
      type: content.type,
      access_level: content.access_level,
      view_count: content.view_count || 0,
      like_count: content.like_count || 0,
      download_count: content.download_count || 0,
      rating_sum: content.rating_sum || 0,
      rating_count: content.rating_count || 0,
      routine_type: content.routine_type,
      routine_days: content.routine_days,
      routine_items: content.routine_items,
      allow_preview: content.allow_preview ?? true,
      creator: {
        name: creatorInfo?.display_name || profileInfo?.username || '익명',
        avatar_url: creatorInfo?.profile_image_url || profileInfo?.avatar_url || null,
        bio: creatorInfo?.bio || profileInfo?.bio || null,
      },
      creator_id: content.creator_id,
      // P2P Payment info (only if creator has set up payment)
      payment_info: creatorInfo?.payment_method ? {
        method: creatorInfo.payment_method,
        toss_id: creatorInfo.payment_method === 'toss_id' ? creatorInfo.toss_id : null,
        kakaopay_link: creatorInfo.payment_method === 'kakaopay' ? creatorInfo.kakaopay_link : null,
        bank_name: creatorInfo.payment_method === 'bank_account' ? creatorInfo.bank_name : null,
        bank_account: creatorInfo.payment_method === 'bank_account' ? creatorInfo.bank_account : null,
        account_holder: creatorInfo.payment_method === 'bank_account' ? creatorInfo.account_holder : null,
      } : null,
    };

    // For routine content, the content itself contains the routine items
    // For other content types, the URL is shown if purchased OR if preview is allowed
    const canShowUrl = isPurchased || content.allow_preview === true;
    const contents = [{
      id: content.id,
      title: content.title,
      type: content.type,
      url: canShowUrl ? content.url : null,
      thumbnail_url: content.thumbnail_url,
      duration: null,
      sort_order: 0,
      allow_preview: content.allow_preview ?? true, // 기본값 true
    }];

    // Increment view count
    await supabase
      .from('contents')
      .update({ view_count: (content.view_count || 0) + 1 })
      .eq('id', id);

    return NextResponse.json({
      product,
      contents,
      isPurchased,
      isOwner,
      isLiked,
      isPreviewAllowed: content.allow_preview ?? true,
    });
  } catch (error) {
    console.error('Product detail API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
