import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { notify } from '@/lib/notifications';

/**
 * GET /api/content/[id]/reviews
 * 리뷰 목록 조회 (최신순)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ message: 'Database connection failed' }, { status: 500 });
    }

    // comment_type = 'review' 필터로 리뷰만 조회
    const { data: comments, error } = await supabase
      .from('content_comments')
      .select('*')
      .eq('content_id', id)
      .eq('comment_type', 'review')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch reviews:', error);
      return NextResponse.json({ message: 'Failed to fetch reviews' }, { status: 500 });
    }

    // 작성자 프로필 조회
    const userIds = Array.from(new Set((comments || []).map((c: any) => c.user_id))) as string[];
    let profileMap: Record<string, { nickname: string; avatar_url: string | null }> = {};

    if (userIds.length > 0) {
      const [profilesResult, creatorResult] = await Promise.all([
        supabase.from('profiles').select('id, nickname, avatar_url').in('id', userIds),
        supabase.from('creator_settings').select('user_id, display_name, profile_image_url').in('user_id', userIds),
      ]);

      const creatorMap = new Map<string, { display_name: string; profile_image_url: string | null }>();
      if (creatorResult.data) {
        for (const c of creatorResult.data) {
          creatorMap.set(c.user_id, { display_name: c.display_name, profile_image_url: c.profile_image_url });
        }
      }

      if (profilesResult.data) {
        for (const p of profilesResult.data) {
          const creator = creatorMap.get(p.id);
          // profiles.nickname 최우선 (사용자가 직접 설정한 닉네임)
          const nick = p.nickname && !p.nickname.includes('@') ? p.nickname : null;
          const displayName = creator?.display_name && !creator.display_name.includes('@') ? creator.display_name : null;
          profileMap[p.id] = {
            nickname: nick || displayName || p.nickname || '익명',
            avatar_url: p.avatar_url || creator?.profile_image_url,
          };
        }
      }

      // 닉네임/아바타가 OAuth 실명일 수 있으므로 admin 메타데이터로 보완
      const adminClient = createAdminClient();
      if (adminClient) {
        for (const uid of userIds) {
          const profile = profileMap[uid];
          const needsAvatar = !profile?.avatar_url;
          const needsNickname = !profile || !profile.nickname || profile.nickname === '익명';

          if (needsAvatar || needsNickname) {
            try {
              const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(uid);
              const meta = authUser?.user_metadata;
              if (meta) {
                const avatarUrl = meta.avatar_url || meta.picture || null;
                const metaNickname = meta.preferred_username || meta.user_name || meta.name || meta.full_name || null;

                if (!profileMap[uid]) {
                  profileMap[uid] = { nickname: metaNickname || '익명', avatar_url: avatarUrl };
                } else {
                  if (needsAvatar && avatarUrl) {
                    profileMap[uid].avatar_url = avatarUrl;
                  }
                  if (needsNickname && metaNickname) {
                    profileMap[uid].nickname = metaNickname;
                  }
                }
              }
            } catch {}
          }
        }
      }
    }

    // rating을 comment_text에서 파싱: "[rating:N] 실제텍스트"
    const reviews = (comments || []).map((c: any) => {
      let rating = 5;
      let text = c.comment_text || '';

      const match = text.match(/^\[rating:(\d)\]\s*/);
      if (match) {
        rating = parseInt(match[1], 10);
        text = text.replace(match[0], '');
      }

      const profile = profileMap[c.user_id];
      return {
        id: c.id,
        user_id: c.user_id,
        rating,
        text,
        created_at: c.created_at,
        nickname: profile?.nickname || '익명',
        avatar_url: profile?.avatar_url || null,
      };
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Reviews GET error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/content/[id]/reviews
 * 리뷰 작성 (구매자만, 중복 방지)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ message: 'Database connection failed' }, { status: 500 });
    }

    // 로그인 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { rating, text } = body;

    // 유효성 검사
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ message: '별점은 1~5 사이여야 합니다.' }, { status: 400 });
    }
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ message: '리뷰 내용을 입력해주세요.' }, { status: 400 });
    }
    if (text.trim().length > 500) {
      return NextResponse.json({ message: '리뷰는 500자 이내로 작성해주세요.' }, { status: 400 });
    }

    // 구매 여부 확인
    const { data: purchase } = await supabase
      .from('content_purchases')
      .select('id')
      .eq('content_id', id)
      .eq('buyer_id', user.id)
      .eq('status', 'completed')
      .maybeSingle();

    if (!purchase) {
      return NextResponse.json({ message: '구매자만 리뷰를 작성할 수 있습니다.' }, { status: 403 });
    }

    // 중복 리뷰 확인
    const { data: existing } = await supabase
      .from('content_comments')
      .select('id')
      .eq('content_id', id)
      .eq('user_id', user.id)
      .eq('comment_type', 'review')
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: '이미 리뷰를 작성하셨습니다.' }, { status: 409 });
    }

    // comment_text에 rating prefix 포함하여 저장
    const commentText = `[rating:${rating}] ${text.trim()}`;

    const { data: newComment, error: insertError } = await supabase
      .from('content_comments')
      .insert({
        content_id: id,
        user_id: user.id,
        comment_text: commentText,
        comment_type: 'review',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert review:', insertError);
      return NextResponse.json({ message: '리뷰 작성에 실패했습니다.' }, { status: 500 });
    }

    // contents 테이블 rating_sum, rating_count 업데이트
    const { data: content } = await supabase
      .from('contents')
      .select('rating_sum, rating_count')
      .eq('id', id)
      .single();

    if (content) {
      await supabase
        .from('contents')
        .update({
          rating_sum: (content.rating_sum || 0) + rating,
          rating_count: (content.rating_count || 0) + 1,
        })
        .eq('id', id);
    }

    // Send notification to content creator
    const { data: contentInfo } = await supabase
      .from('contents')
      .select('creator_id, title')
      .eq('id', id)
      .single();

    if (contentInfo && contentInfo.creator_id !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', user.id)
        .single();
      notify.review(contentInfo.creator_id, profile?.nickname || '누군가', contentInfo.title, rating, id).catch(() => {});
    }

    return NextResponse.json({ success: true, reviewId: newComment.id });
  } catch (error) {
    console.error('Reviews POST error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
