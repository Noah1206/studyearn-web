import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Admin API - 카카오 사용자 닉네임 마이그레이션
// 기존 "이름 없음" 사용자를 카카오톡 닉네임으로 업데이트

export async function POST(request: Request) {
  try {
    // Authorization 헤더 확인 (간단한 보안)
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET_KEY;

    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Service Role 키로 Supabase Admin 클라이언트 생성
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. "이름 없음" 닉네임을 가진 프로필 조회
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, nickname')
      .eq('nickname', '이름 없음');

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        message: '업데이트할 사용자가 없습니다.',
        updated: 0
      });
    }

    const results: { userId: string; oldNickname: string; newNickname: string; success: boolean; error?: string }[] = [];

    // 2. 각 사용자의 auth.users에서 메타데이터 조회 및 업데이트
    for (const profile of profiles) {
      try {
        // auth.users에서 사용자 메타데이터 조회
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);

        if (userError || !userData?.user) {
          results.push({
            userId: profile.id,
            oldNickname: profile.nickname,
            newNickname: profile.nickname,
            success: false,
            error: userError?.message || 'User not found',
          });
          continue;
        }

        const metadata = userData.user.user_metadata || {};
        // 카카오 닉네임 추출 (user_name → name → full_name 순서)
        const kakaoNickname = metadata.user_name || metadata.name || metadata.full_name || metadata.preferred_username;

        if (!kakaoNickname) {
          results.push({
            userId: profile.id,
            oldNickname: profile.nickname,
            newNickname: profile.nickname,
            success: false,
            error: 'No Kakao nickname found in metadata',
          });
          continue;
        }

        // 프로필 닉네임 업데이트
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ nickname: kakaoNickname })
          .eq('id', profile.id);

        if (updateError) {
          results.push({
            userId: profile.id,
            oldNickname: profile.nickname,
            newNickname: kakaoNickname,
            success: false,
            error: updateError.message,
          });
        } else {
          results.push({
            userId: profile.id,
            oldNickname: profile.nickname,
            newNickname: kakaoNickname,
            success: true,
          });
        }
      } catch (err) {
        results.push({
          userId: profile.id,
          oldNickname: profile.nickname,
          newNickname: profile.nickname,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      message: `마이그레이션 완료: ${successCount}명 성공, ${failCount}명 실패`,
      updated: successCount,
      failed: failCount,
      details: results,
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Migration failed' },
      { status: 500 }
    );
  }
}
