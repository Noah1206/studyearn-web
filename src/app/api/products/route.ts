import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

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
        download_count,
        rating_sum,
        rating_count,
        creator_id
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

    // Get unique creator IDs
    const allCreatorIds = (contents || [])
      .map((c: { creator_id?: string | null }) => c.creator_id)
      .filter((id: string | null | undefined): id is string => id != null);
    const creatorIds = Array.from(new Set(allCreatorIds));

    // Fetch creator settings separately
    interface CreatorInfo {
      display_name?: string;
      profile_image_url?: string;
      subject?: string;
      user_id: string;
    }
    interface ProfileInfo {
      id: string;
      nickname?: string;
      username?: string;
      avatar_url?: string;
    }
    let creatorsMap: Record<string, CreatorInfo> = {};
    let profilesMap: Record<string, ProfileInfo> = {};
    let authNamesMap: Record<string, string> = {};
    if (creatorIds.length > 0) {
      const [{ data: creators }, { data: profiles }] = await Promise.all([
        supabase
          .from('creator_settings')
          .select('user_id, display_name, profile_image_url, subject')
          .in('user_id', creatorIds),
        supabase
          .from('profiles')
          .select('id, nickname, username, avatar_url')
          .in('id', creatorIds),
      ]);

      if (creators) {
        creators.forEach((c: CreatorInfo) => {
          creatorsMap[c.user_id] = c;
        });
      }
      if (profiles) {
        profiles.forEach((p: ProfileInfo) => {
          profilesMap[p.id] = p;
        });
      }

      // Fetch auth user metadata for display name fallback (카카오/구글 이름)
      try {
        const supabaseAdmin = createAdminClient();
        const namePromises = (creatorIds as string[]).map(async (id: string) => {
          const { data } = await supabaseAdmin.auth.admin.getUserById(id);
          if (data?.user) {
            const meta = data.user.user_metadata || {};
            const name = meta.user_name || meta.name || meta.full_name || meta.preferred_username;
            if (name) authNamesMap[id] = name;
          }
        });
        await Promise.all(namePromises);
      } catch (err) {
        console.warn('Failed to fetch auth user names:', err);
      }

    }

    // Transform to include creator as a flat object
    const productsWithCreator = (contents || []).map((content: {
      creator_id?: string | null;
      subject?: string | null;
      content_type?: string | null;
      [key: string]: unknown;
    }) => {
      const creatorSettings = content.creator_id ? creatorsMap[content.creator_id] : null;
      const profile = content.creator_id ? profilesMap[content.creator_id] : null;
      return {
        ...content,
        // Use content's subject, fallback to creator's subject
        subject: content.subject || creatorSettings?.subject || null,
        // Map content_type to display-friendly subject if it's a routine
        ...(content.content_type === 'routine' && !content.subject ? { subject: '루틴' } : {}),
        creator: {
          name: (profile?.nickname && !profile.nickname.includes('@') ? profile.nickname : null) || (creatorSettings?.display_name && !creatorSettings.display_name.includes('@') ? creatorSettings.display_name : null) || (content.creator_id ? authNamesMap[content.creator_id] : null) || '익명',
          avatar_url: creatorSettings?.profile_image_url || profile?.avatar_url,
        },
      };
    });

    return NextResponse.json({ products: productsWithCreator });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
