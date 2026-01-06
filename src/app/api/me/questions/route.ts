import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/me/questions
 * Get current user's questions (as asker)
 */
export async function GET() {
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

    // Get all questions asked by this user
    const { data: questions, error } = await supabase
      .from('questions')
      .select(`
        id,
        content,
        is_anonymous,
        is_public,
        status,
        created_at,
        answered_at,
        creator:creator_id (
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
      .eq('asker_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch my questions:', error);
      return NextResponse.json(
        { message: '질문을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = {
      total: questions?.length || 0,
      answered: questions?.filter((q: { status: string }) => q.status === 'answered').length || 0,
      pending: questions?.filter((q: { status: string }) => q.status === 'pending').length || 0,
    };

    return NextResponse.json({
      questions: questions || [],
      stats,
    });
  } catch (error) {
    console.error('My questions API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
