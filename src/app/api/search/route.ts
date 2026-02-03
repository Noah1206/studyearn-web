import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/search?q=keyword&type=all|content|creator&category=&sort=relevance|latest|popular&page=1&limit=20
 * Server-side search API
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ message: 'Database connection failed' }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim();
    const type = searchParams.get('type') || 'all';
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    if (!query || query.length < 1) {
      return NextResponse.json({ message: '검색어를 입력해주세요.' }, { status: 400 });
    }

    const results: { contents?: any[]; creators?: any[]; total_contents?: number; total_creators?: number } = {};

    // Search contents
    if (type === 'all' || type === 'content') {
      let contentQuery = supabase
        .from('contents')
        .select('id, title, description, price, thumbnail_url, content_type, category, creator_id, rating_sum, rating_count, view_count, created_at', { count: 'exact' })
        .eq('is_published', true)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

      if (category) {
        contentQuery = contentQuery.eq('category', category);
      }

      if (sort === 'latest') {
        contentQuery = contentQuery.order('created_at', { ascending: false });
      } else if (sort === 'popular') {
        contentQuery = contentQuery.order('view_count', { ascending: false });
      } else {
        // relevance: title matches first, then by view_count
        contentQuery = contentQuery.order('view_count', { ascending: false });
      }

      contentQuery = contentQuery.range(offset, offset + limit - 1);

      const { data: contents, error, count } = await contentQuery;

      if (error) {
        console.error('Content search error:', error);
      } else {
        // Fetch creator info for results
        const creatorIds = Array.from(new Set((contents || []).map((c: any) => c.creator_id)));
        let creatorMap: Record<string, { display_name: string; profile_image_url: string | null }> = {};

        if (creatorIds.length > 0) {
          const { data: creators } = await supabase
            .from('creator_settings')
            .select('user_id, display_name, profile_image_url')
            .in('user_id', creatorIds);

          if (creators) {
            for (const c of creators) {
              creatorMap[c.user_id] = { display_name: c.display_name, profile_image_url: c.profile_image_url };
            }
          }
        }

        results.contents = (contents || []).map((c: any) => ({
          ...c,
          creator: creatorMap[c.creator_id] || null,
          average_rating: c.rating_count > 0 ? Math.round((c.rating_sum / c.rating_count) * 10) / 10 : 0,
        }));
        results.total_contents = count || 0;
      }
    }

    // Search creators
    if (type === 'all' || type === 'creator') {
      const { data: creators, error, count } = await supabase
        .from('creator_settings')
        .select('user_id, display_name, profile_image_url, bio, subject, categories, total_subscribers, total_content_count', { count: 'exact' })
        .or(`display_name.ilike.%${query}%,bio.ilike.%${query}%,subject.ilike.%${query}%`)
        .order('total_subscribers', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Creator search error:', error);
      } else {
        results.creators = creators || [];
        results.total_creators = count || 0;
      }
    }

    return NextResponse.json({
      query,
      ...results,
      page,
      limit,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
