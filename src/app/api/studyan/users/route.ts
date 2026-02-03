import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const isDefaultKakao = (url: string | null | undefined) =>
  url?.includes('default_profile') || url?.includes('account_images/default');

/**
 * GET /api/studyan/users
 * Returns users (creators or those with public routines) with properly resolved avatars
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    if (!supabase) {
      return NextResponse.json({ message: 'Database connection failed' }, { status: 500 });
    }

    // Get current user for follow status
    let currentUserId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      currentUserId = user?.id || null;
    } catch {}

    // Parallel fetch
    const [profilesResult, creatorSettingsResult, routinesResult, followingResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, nickname, username, avatar_url, bio, follower_count, streak_days, total_study_minutes')
        .order('created_at', { ascending: false }),
      supabase
        .from('creator_settings')
        .select('user_id, display_name, profile_image_url, bio'),
      supabase
        .from('routines')
        .select('id, user_id, title, routine_type, routine_days, routine_items, created_at')
        .eq('is_active', true)
        .eq('is_public', true)
        .order('created_at', { ascending: false }),
      currentUserId
        ? supabase.from('user_subscriptions').select('creator_id').eq('subscriber_id', currentUserId)
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (profilesResult.error) throw profilesResult.error;
    if (routinesResult.error) throw routinesResult.error;

    const profiles = profilesResult.data || [];
    const creatorSettings = creatorSettingsResult.data || [];
    const routines = routinesResult.data || [];
    const followingIds = new Set((followingResult.data || []).map((f: any) => f.creator_id));

    // Build maps
    const creatorMap = new Map<string, any>();
    creatorSettings.forEach((cs: any) => creatorMap.set(cs.user_id, cs));

    const usersWithRoutines = new Set<string>();
    routines.forEach((r: any) => usersWithRoutines.add(r.user_id));

    // Filter: only creators or users with public routines
    const eligibleProfiles = profiles.filter(
      (p: any) => creatorMap.has(p.id) || usersWithRoutines.has(p.id)
    );

    // Resolve avatars from auth metadata (same logic as studyan/[userId]/page.tsx)
    const users = await Promise.all(
      eligibleProfiles.map(async (profile: any) => {
        const creator = creatorMap.get(profile.id);

        let resolvedAvatar: string | null = null;
        let resolvedName: string | null = null;
        let resolvedBio: string | null = null;

        // 1. Creator settings
        if (creator?.display_name && !creator.display_name.includes('@')) {
          resolvedName = creator.display_name;
        }
        if (creator?.bio) resolvedBio = creator.bio;
        if (creator?.profile_image_url && !isDefaultKakao(creator.profile_image_url)) {
          resolvedAvatar = creator.profile_image_url;
        }

        // 2. Profiles table
        if (!resolvedName) {
          const nick = profile.nickname;
          resolvedName = nick && !nick.includes('@')
            ? nick
            : (profile.username || nick?.split('@')[0] || null);
        }
        if (!resolvedBio && profile.bio) resolvedBio = profile.bio;
        if (!resolvedAvatar && profile.avatar_url?.includes('supabase') && !isDefaultKakao(profile.avatar_url)) {
          resolvedAvatar = profile.avatar_url;
        }

        // 3. OAuth metadata via admin
        if (admin) {
          try {
            const { data: { user: authUser } } = await admin.auth.admin.getUserById(profile.id);
            if (authUser) {
              const meta = authUser.user_metadata;
              const oauthAvatar = meta?.avatar_url || meta?.picture || meta?.profile_image;
              if (oauthAvatar && (!resolvedAvatar || isDefaultKakao(resolvedAvatar))) {
                resolvedAvatar = oauthAvatar;
              }
              const oauthName = meta?.full_name || meta?.name || meta?.user_name;
              if (oauthName && !resolvedName) {
                resolvedName = oauthName;
              }
            }
          } catch {}
        }

        // 4. Fallback
        if (!resolvedAvatar && profile.avatar_url) {
          resolvedAvatar = profile.avatar_url;
        }

        // Ensure HTTPS
        if (resolvedAvatar && resolvedAvatar.startsWith('http://')) {
          resolvedAvatar = resolvedAvatar.replace('http://', 'https://');
        }

        // Attach routines
        const userRoutines = routines
          .filter((r: any) => r.user_id === profile.id)
          .map((r: any) => ({
            id: r.id,
            title: r.title,
            routine_type: r.routine_type,
            routine_days: r.routine_days,
            routine_items: r.routine_items || [],
            created_at: r.created_at,
          }));

        return {
          id: profile.id,
          display_name: resolvedName || '익명 사용자',
          avatar_url: resolvedAvatar,
          bio: resolvedBio,
          routines: userRoutines,
          isFollowing: followingIds.has(profile.id),
          follower_count: profile.follower_count || 0,
          streak_days: profile.streak_days || 0,
          total_study_minutes: profile.total_study_minutes || 0,
        };
      })
    );

    return NextResponse.json({ users, currentUserId });
  } catch (error) {
    console.error('Studyan users API error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
