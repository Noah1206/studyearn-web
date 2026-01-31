import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

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
        .select('nickname, username, avatar_url, bio')
        .eq('id', content.creator_id)
        .maybeSingle();
      profileInfo = profile;

      // Always try to get OAuth avatar from auth.users metadata
      try {
        const adminClient = createAdminClient();
        if (adminClient) {
          const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(content.creator_id);
          console.log('[Products API] auth.admin user_metadata:', JSON.stringify(authUser?.user_metadata));
          if (authUser) {
            let oauthAvatar = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture;
            if (oauthAvatar && oauthAvatar.startsWith('http://')) {
              oauthAvatar = oauthAvatar.replace('http://', 'https://');
            }
            if (oauthAvatar) {
              // Always set OAuth avatar on profileInfo
              if (!profileInfo) profileInfo = { nickname: null, username: null, avatar_url: oauthAvatar, bio: null };
              else profileInfo = { ...profileInfo, avatar_url: oauthAvatar };
            }
            // Store OAuth name separately (don't overwrite profileInfo.nickname)
            const oauthName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.user_metadata?.user_name;
            if (oauthName) {
              if (!profileInfo) profileInfo = { nickname: null, username: null, avatar_url: null, bio: null };
              // Only set if profileInfo has no valid nickname
              if (!profileInfo.nickname || profileInfo.nickname.includes('@')) {
                profileInfo = { ...profileInfo, nickname: oauthName };
              }
            }
          }
        }
      } catch (e) {
        console.error('[Products API] Failed to get OAuth avatar:', e);
      }
    }

    // Check if user is authenticated and has purchased
    let isPurchased = false;
    let isPending = false;
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
          .select('id, status')
          .eq('content_id', id)
          .eq('buyer_id', user.id)
          .in('status', ['completed', 'pending_confirm'])
          .maybeSingle();

        if (purchase?.status === 'completed') {
          isPurchased = true;
        } else if (purchase?.status === 'pending_confirm') {
          isPending = true;
        }
      } else {
        // Free content is accessible
        isPurchased = true;
      }

      // Check if user has liked this content (use admin to bypass RLS)
      const admin = createAdminClient();
      if (admin) {
        const { data: like } = await admin
          .from('content_likes')
          .select('id')
          .eq('content_id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        isLiked = !!like;
      }
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
      creator: (() => {
        // Resolve name: skip email-like values
        const displayName = creatorInfo?.display_name;
        const nick = profileInfo?.nickname;
        const resolvedDisplayName = displayName && !displayName.includes('@') ? displayName : null;
        const resolvedNick = nick && !nick.includes('@') ? nick : null;
        const name = resolvedNick
          || resolvedDisplayName
          || profileInfo?.username
          || (nick?.split('@')[0])
          || (creatorInfo?.display_name?.split('@')[0])
          || '익명';

        // Resolve avatar: prefer OAuth metadata over creator_settings if creator has default kakao image
        const isDefaultKakao = (url: string | null | undefined) =>
          url?.includes('default_profile') || url?.includes('account_images/default');

        let avatarUrl: string | null = null;
        // 1. creator_settings image (only if not default kakao)
        if (creatorInfo?.profile_image_url && !isDefaultKakao(creatorInfo.profile_image_url)) {
          avatarUrl = creatorInfo.profile_image_url;
        }
        // 2. OAuth avatar from profileInfo (set by admin getUserById above)
        if (!avatarUrl && profileInfo?.avatar_url && !isDefaultKakao(profileInfo.avatar_url)) {
          avatarUrl = profileInfo.avatar_url;
        }
        // 3. Any avatar as fallback
        if (!avatarUrl) {
          avatarUrl = profileInfo?.avatar_url || creatorInfo?.profile_image_url || null;
        }
        // Ensure HTTPS
        if (avatarUrl && avatarUrl.startsWith('http://')) {
          avatarUrl = avatarUrl.replace('http://', 'https://');
        }

        console.log('[Products API] Final creator:', { name, avatar_url: avatarUrl });
        return { name, avatar_url: avatarUrl, bio: creatorInfo?.bio || profileInfo?.bio || null };
      })(),
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
      isPending,
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
