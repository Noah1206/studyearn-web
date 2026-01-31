import { createAdminClient } from '@/lib/supabase/server';
import StudyanUserClient from './StudyanUserClient';

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function StudyanUserPage({ params }: PageProps) {
  const { userId } = await params;

  // Resolve avatar and nickname server-side using admin client
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

      if (creator?.display_name) resolvedNickname = creator.display_name;
      if (creator?.bio) resolvedBio = creator.bio;
      if (creator?.profile_image_url) resolvedAvatar = creator.profile_image_url;

      // 2. Check profiles
      const { data: profile } = await admin
        .from('profiles')
        .select('nickname, username, avatar_url, bio')
        .eq('id', userId)
        .maybeSingle();

      if (!resolvedNickname && profile) {
        const nick = profile.nickname;
        resolvedNickname = nick?.includes('@')
          ? (profile.username || nick.split('@')[0])
          : (nick || profile.username || null);
      }
      if (!resolvedBio && profile?.bio) resolvedBio = profile.bio;

      // Only use profile avatar if it's a supabase-uploaded one
      if (!resolvedAvatar && profile?.avatar_url?.includes('supabase')) {
        resolvedAvatar = profile.avatar_url;
      }

      // 3. Get real OAuth avatar from auth.users metadata
      if (!resolvedAvatar) {
        const { data: { user } } = await admin.auth.admin.getUserById(userId);
        if (user) {
          const oauthAvatar = user.user_metadata?.avatar_url ||
                              user.user_metadata?.picture ||
                              user.user_metadata?.profile_image;
          if (oauthAvatar) {
            resolvedAvatar = oauthAvatar;
            // Sync to profiles for future use
            if (profile && profile.avatar_url !== oauthAvatar) {
              await admin
                .from('profiles')
                .update({ avatar_url: oauthAvatar })
                .eq('id', userId)
                .catch(() => {});
            }
          }
        }
      }

      // 4. Fallback to whatever profile has
      if (!resolvedAvatar && profile?.avatar_url) {
        resolvedAvatar = profile.avatar_url;
      }
    }
  } catch (e) {
    console.error('Failed to resolve user data server-side:', e);
  }

  // Ensure HTTPS for all avatar URLs (Kakao uses http:// which causes mixed content)
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
