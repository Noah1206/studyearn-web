import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';

// Toss 앱인토스 연결 끊기 콜백
// 사용자가 Toss 앱에서 연결을 해제하면 이 엔드포인트가 호출됩니다

interface TossDisconnectPayload {
  // Toss에서 전달하는 사용자 식별 정보
  userId?: string;
  email?: string;
  tossUserId?: string;
  // 추가 필드가 있을 수 있음
  [key: string]: unknown;
}

// Basic Auth 검증 (선택적)
function validateBasicAuth(request: NextRequest): boolean {
  const expectedAuth = process.env.TOSS_DISCONNECT_BASIC_AUTH;

  // Basic Auth가 설정되지 않은 경우 검증 스킵
  if (!expectedAuth) {
    return true;
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const credentials = authHeader.slice(6); // 'Basic ' 제거
  return credentials === expectedAuth;
}

export async function GET(request: NextRequest) {
  // Basic Auth 검증
  if (!validateBasicAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  // Toss에서 전달하는 파라미터 (정확한 필드명은 Toss 문서 확인 필요)
  const email = searchParams.get('email');
  const tossUserId = searchParams.get('toss_user_id') || searchParams.get('userId');

  console.log('[Toss Disconnect] GET request:', { email, tossUserId });

  // 테스트 요청인 경우 성공 응답
  if (!email && !tossUserId) {
    console.log('[Toss Disconnect] Test request received (no params)');
    return NextResponse.json({ success: true });
  }

  try {
    await handleDisconnect({ email: email || undefined, tossUserId: tossUserId || undefined });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Toss Disconnect] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Basic Auth 검증
  if (!validateBasicAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: TossDisconnectPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('[Toss Disconnect] POST request:', payload);

  const { email, tossUserId, userId } = payload;

  // 테스트 요청 (빈 바디)인 경우 성공 응답
  if (!email && !tossUserId && !userId) {
    console.log('[Toss Disconnect] Test request received (empty body)');
    return NextResponse.json({ success: true });
  }

  try {
    await handleDisconnect({
      email: email || undefined,
      tossUserId: (tossUserId || userId) as string | undefined
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Toss Disconnect] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleDisconnect(params: { email?: string; tossUserId?: string }) {
  const { email, tossUserId } = params;
  const adminClient = createAdminClient();

  // 이메일로 사용자 찾기
  if (email) {
    const { data: users } = await adminClient.auth.admin.listUsers();
    const user = users?.users?.find((u: User) => u.email === email);

    if (user) {
      // 사용자의 Toss 연동 정보 제거 (user_metadata에서)
      const currentMetadata = user.user_metadata || {};
      const { toss_id, toss_connected, ...restMetadata } = currentMetadata;

      await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...restMetadata,
          toss_disconnected_at: new Date().toISOString(),
        },
      });

      console.log(`[Toss Disconnect] User ${user.id} disconnected from Toss`);
    }
  }

  // Toss 사용자 ID로 찾기 (user_metadata에 저장된 경우)
  if (tossUserId) {
    const { data: users } = await adminClient.auth.admin.listUsers();
    const user = users?.users?.find(
      (u: User) => u.user_metadata?.toss_id === tossUserId
    );

    if (user) {
      const currentMetadata = user.user_metadata || {};
      const { toss_id, toss_connected, ...restMetadata } = currentMetadata;

      await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...restMetadata,
          toss_disconnected_at: new Date().toISOString(),
        },
      });

      console.log(`[Toss Disconnect] User ${user.id} disconnected from Toss`);
    }
  }
}
