import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = createAdminClient();

    // 1. Check creator_settings first
    const { data: creator } = await supabase
      .from('creator_settings')
      .select('profile_image_url')
      .eq('user_id', id)
      .single();

    if (creator?.profile_image_url) {
      return NextResponse.json({ avatar_url: creator.profile_image_url });
    }

    // 2. Check profiles table (only trust supabase-uploaded avatars)
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', id)
      .single();

    if (profile?.avatar_url?.includes('supabase')) {
      return NextResponse.json({ avatar_url: profile.avatar_url });
    }

    // 3. Get from auth.users metadata (the actual OAuth photo)
    const { data: { user } } = await supabase.auth.admin.getUserById(id);

    if (user) {
      let oauthAvatar = user.user_metadata?.avatar_url ||
                          user.user_metadata?.picture ||
                          user.user_metadata?.profile_image;

      // Ensure HTTPS (Kakao uses http://)
      if (oauthAvatar && oauthAvatar.startsWith('http://')) {
        oauthAvatar = oauthAvatar.replace('http://', 'https://');
      }

      if (oauthAvatar) {
        // Sync to profiles for future use
        await supabase
          .from('profiles')
          .update({ avatar_url: oauthAvatar })
          .eq('id', id)
          .catch(() => {});

        return NextResponse.json({ avatar_url: oauthAvatar });
      }
    }

    // 4. Fallback
    return NextResponse.json({ avatar_url: profile?.avatar_url || null });
  } catch {
    return NextResponse.json({ avatar_url: null }, { status: 200 });
  }
}
