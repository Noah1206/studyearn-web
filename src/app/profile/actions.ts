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

  // upsert를 사용하여 프로필이 없으면 생성, 있으면 업데이트
  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      nickname: data.nickname,
      username: data.username,
      bio: data.bio,
      school: data.school,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id',
    })
    .select()
    .single();

  if (updateError) {
    console.error('[Profile] Update error:', updateError);
    if (updateError.code === '23505' && updateError.message.includes('username')) {
      return { success: false, error: '이미 사용 중인 사용자 이름입니다.' };
    }
    return { success: false, error: `저장 실패: ${updateError.message}` };
  }

  // creator_settings.display_name에도 동기화 (크리에이터인 경우)
  const { error: creatorSyncError } = await supabase
    .from('creator_settings')
    .update({
      display_name: data.nickname,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (creatorSyncError) {
    // 크리에이터가 아닌 경우 에러는 무시 (레코드가 없을 수 있음)
    console.log('[Profile] Creator settings sync skipped (not a creator):', creatorSyncError.message);
  }

  return { success: true, data: updatedProfile };
}
