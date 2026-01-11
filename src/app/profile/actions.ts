'use server';

import { createClient } from '@/lib/supabase/server';

interface UpdateProfileData {
  nickname: string;
  username: string;
  bio: string;
  school: string;
}

export async function updateProfile(data: UpdateProfileData) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({
      nickname: data.nickname,
      username: data.username,
      bio: data.bio,
      school: data.school,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (updateError) {
    if (updateError.code === '23505' && updateError.message.includes('username')) {
      return { success: false, error: '이미 사용 중인 사용자 이름입니다.' };
    }
    return { success: false, error: `저장 실패: ${updateError.message}` };
  }

  if (!updatedProfile) {
    return { success: false, error: '프로필 저장 권한이 없습니다.' };
  }

  return { success: true, data: updatedProfile };
}
