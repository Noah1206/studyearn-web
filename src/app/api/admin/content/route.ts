import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/admin/content
 * Get paginated list of contents with optional search filtering
 */
export async function GET(request: NextRequest) {
  const adminError = await requireAdmin();
  if (adminError) return adminError;

  try {
    const supabase = createAdminClient();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('contents')
      .select('*', { count: 'exact' });

    // Apply search filter on title
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: contents, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch contents:', error);
      return NextResponse.json(
        { message: '콘텐츠 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // Fetch profiles separately
    const creatorIds = (contents || []).map((c: { creator_id: string }) => c.creator_id);
    let profilesMap = new Map();

    if (creatorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname, email')
        .in('id', creatorIds);

      if (profiles) {
        profilesMap = new Map(profiles.map((p: { id: string; nickname: string; email: string }) => [p.id, p]));
      }
    }

    // Add profiles to contents
    const enrichedContents = (contents || []).map((content: { creator_id: string }) => ({
      ...content,
      profiles: profilesMap.get(content.creator_id) || null,
    }));

    return NextResponse.json({
      contents: enrichedContents,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin content API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
