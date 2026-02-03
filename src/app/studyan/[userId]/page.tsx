import { createAdminClient } from '@/lib/supabase/server';
import StudyanUserClient from './StudyanUserClient';

interface PageProps {
  params: Promise<{ userId: string }>;
}

const isDefaultKakao = (url: string | null | undefined) =>
  url?.includes('default_profile') || url?.includes('account_images/default');

export default async function StudyanUserPage({ params }: PageProps) {
  const { userId } = await params;

  let resolvedAvatar: string | null = null;
  let resolvedNickname: string | null = null;
  let resolvedBio: string | null = null;

  try {
    const admin = createAdminClient();
    if (admin) {
      // 1. Check creator_settings
      const { data: creator } = await admin
        .from('creator_settings')
        .select('profile_image_url, display_name, bio')
        .eq('user_id', userId)
        .maybeSingle();

      if (creator?.bio) resolvedBio = creator.bio;
      // Only use creator avatar if not default kakao
      if (creator?.profile_image_url && !isDefaultKakao(creator.profile_image_url)) {
        resolvedAvatar = creator.profile_image_url;
      }

      // 2. Check profiles (nickname 최우선)
      const { data: profile } = await admin
        .from('profiles')
        .select('nickname, username, avatar_url, bio')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        const nick = profile.nickname;
        if (nick && !nick.includes('@')) {
          resolvedNickname = nick;
        }
      }
      // profiles.nickname이 없으면 creator_settings.display_name 사용
      if (!resolvedNickname && creator?.display_name && !creator.display_name.includes('@')) {
        resolvedNickname = creator.display_name;
      }
      if (!resolvedNickname && profile) {
        resolvedNickname = profile.username || profile.nickname?.split('@')[0] || null;
      }
      if (!resolvedBio && profile?.bio) resolvedBio = profile.bio;

      // Only use profile avatar if supabase-uploaded and not default kakao
      if (!resolvedAvatar && profile?.avatar_url?.includes('supabase') && !isDefaultKakao(profile.avatar_url)) {
        resolvedAvatar = profile.avatar_url;
      }

      // 3. ALWAYS get OAuth avatar from auth.users metadata
      const { data: { user } } = await admin.auth.admin.getUserById(userId);
      if (user) {
        const oauthAvatar = user.user_metadata?.avatar_url ||
                            user.user_metadata?.picture ||
                            user.user_metadata?.profile_image;
        // Use OAuth avatar if we don't have a good one yet, or current one is default kakao
        if (oauthAvatar && (!resolvedAvatar || isDefaultKakao(resolvedAvatar))) {
          resolvedAvatar = oauthAvatar;
        }
        // Use OAuth name if we don't have a good one yet
        const oauthName = user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.user_name;
        if (oauthName && !resolvedNickname) {
          resolvedNickname = oauthName;
        }
      }

      // 4. Fallback
      if (!resolvedAvatar && profile?.avatar_url) {
        resolvedAvatar = profile.avatar_url;
      }
    }
  } catch (e) {
    // Silent fail - client will handle missing data
  }

  // Ensure HTTPS (Kakao uses http://)
  if (resolvedAvatar && resolvedAvatar.startsWith('http://')) {
    resolvedAvatar = resolvedAvatar.replace('http://', 'https://');
  }

  return (
    <StudyanUserClient
      userId={userId}
      serverAvatar={resolvedAvatar}
      serverNickname={resolvedNickname}
      serverBio={resolvedBio}
    />
  );
}
