import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notifications';

/**
 * GET /api/qa/questions
 * Get questions for a creator (dashboard) or public questions for a creator profile
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const creatorId = searchParams.get('creatorId');
    const status = searchParams.get('status');
    const isPublic = searchParams.get('public') === 'true';

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('questions')
      .select(`
        id,
        content,
        is_anonymous,
        is_public,
        status,
        created_at,
        answered_at,
        asker:asker_id (
          id,
          display_name,
          avatar_url
        ),
        answers (
          id,
          content,
          like_count,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (creatorId) {
      query = query.eq('creator_id', creatorId);

      // If viewing public profile, only show public answered questions
      if (isPublic) {
        query = query.eq('is_public', true).eq('status', 'answered');
      }
    } else if (user) {
      // Dashboard: show all questions received by this creator
      query = query.eq('creator_id', user.id);
    } else {
      return NextResponse.json(
        { message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: questions, error } = await query;

    if (error) {
      console.error('Failed to fetch questions:', error);
      return NextResponse.json(
        { message: '질문을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions: questions || [] });
  } catch (error) {
    console.error('Questions API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/qa/questions
 * Create a new question for a creator
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { creatorId, content, isAnonymous = false } = body;

    if (!creatorId || !content?.trim()) {
      return NextResponse.json(
        { message: '크리에이터 ID와 질문 내용이 필요합니다.' },
        { status: 400 }
      );
    }

    // Check if creator exists and has QA enabled
    const { data: creatorSettings } = await supabase
      .from('creator_qa_settings')
      .select('qa_enabled, allow_anonymous')
      .eq('user_id', creatorId)
      .single();

    // If no settings, assume QA is enabled by default
    if (creatorSettings && !creatorSettings.qa_enabled) {
      return NextResponse.json(
        { message: '이 크리에이터는 Q&A를 받지 않습니다.' },
        { status: 400 }
      );
    }

    // Check anonymous permission
    if (isAnonymous && creatorSettings && !creatorSettings.allow_anonymous) {
      return NextResponse.json(
        { message: '이 크리에이터는 익명 질문을 받지 않습니다.' },
        { status: 400 }
      );
    }

    // Prevent self-questions
    if (creatorId === user.id) {
      return NextResponse.json(
        { message: '자기 자신에게 질문할 수 없습니다.' },
        { status: 400 }
      );
    }

    // Create question
    const { data: question, error: createError } = await supabase
      .from('questions')
      .insert({
        creator_id: creatorId,
        asker_id: user.id,
        content: content.trim(),
        is_anonymous: isAnonymous,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create question:', createError);
      return NextResponse.json(
        { message: '질문 등록에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 크리에이터에게 알림
    const { data: askerProfile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();
    const askerName = isAnonymous ? '익명' : (askerProfile?.nickname || '누군가');
    createNotification({
      userId: creatorId,
      type: 'qa_question',
      title: '새로운 질문',
      message: `${askerName}님이 질문을 남겼습니다.`,
      data: { question_id: question.id },
    });

    return NextResponse.json({
      success: true,
      message: '질문이 등록되었습니다.',
      question,
    });
  } catch (error) {
    console.error('Create question API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
