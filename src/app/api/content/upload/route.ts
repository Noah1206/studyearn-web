import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/content/upload
 * Create new content with optional file upload via Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { message: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // Verify user is a creator
    const { data: creatorSettings } = await supabase
      .from('creator_settings')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!creatorSettings) {
      return NextResponse.json(
        { message: '크리에이터만 콘텐츠를 업로드할 수 있습니다.' },
        { status: 403 }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    // Handle multipart form data (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const thumbnail = formData.get('thumbnail') as File | null;
      const title = formData.get('title') as string;
      const description = formData.get('description') as string | null;
      const type = formData.get('type') as string; // 'pdf' | 'image' | 'video'
      const subject = formData.get('subject') as string | null;
      const grade = formData.get('grade') as string | null;
      const price = parseInt(formData.get('price') as string || '0');
      const allowPreview = formData.get('allow_preview') === 'true';

      if (!title || !title.trim()) {
        return NextResponse.json(
          { message: '제목을 입력해주세요.' },
          { status: 400 }
        );
      }

      if (!file) {
        return NextResponse.json(
          { message: '파일을 첨부해주세요.' },
          { status: 400 }
        );
      }

      // Validate file size (50MB)
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { message: '파일 크기는 50MB 이하여야 합니다.' },
          { status: 400 }
        );
      }

      // Upload file to Supabase Storage
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.id}/${Date.now()}-${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from('contents')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('File upload error:', uploadError);
        return NextResponse.json(
          { message: '파일 업로드에 실패했습니다.' },
          { status: 500 }
        );
      }

      const { data: { publicUrl } } = supabase.storage
        .from('contents')
        .getPublicUrl(filePath);

      // Upload thumbnail if provided
      let thumbnailUrl: string | null = null;
      if (thumbnail) {
        if (thumbnail.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { message: '썸네일 크기는 5MB 이하여야 합니다.' },
            { status: 400 }
          );
        }

        const thumbPath = `${user.id}/thumbnails/${Date.now()}-${thumbnail.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { error: thumbError } = await supabase.storage
          .from('contents')
          .upload(thumbPath, thumbnail, {
            contentType: thumbnail.type,
            cacheControl: '3600',
          });

        if (!thumbError) {
          const { data: { publicUrl: thumbPublicUrl } } = supabase.storage
            .from('contents')
            .getPublicUrl(thumbPath);
          thumbnailUrl = thumbPublicUrl;
        }
      }

      // If no thumbnail and file is an image, use the file itself
      const fileType = (type || 'pdf') as 'video' | 'pdf' | 'image';
      if (!thumbnailUrl && fileType === 'image') {
        thumbnailUrl = publicUrl;
      }

      // Insert content record
      const { data: content, error: insertError } = await supabase
        .from('contents')
        .insert({
          creator_id: user.id,
          title: title.trim(),
          description: description?.trim() || null,
          type: fileType,
          content_type: fileType,
          url: publicUrl,
          thumbnail_url: thumbnailUrl,
          subject: subject || null,
          grade: grade || null,
          allow_preview: allowPreview,
          access_level: price > 0 ? 'paid' : 'public',
          price: price > 0 ? price : null,
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Content insert error:', insertError);
        return NextResponse.json(
          { message: '콘텐츠 저장에 실패했습니다.' },
          { status: 500 }
        );
      }

      // Update creator content count
      await supabase.rpc('increment_creator_content_count', {
        p_creator_id: user.id,
      }).catch(() => {
        // RPC might not exist yet, update manually
        supabase
          .from('creator_settings')
          .update({ total_content_count: (creatorSettings as any).total_content_count + 1 })
          .eq('user_id', user.id);
      });

      return NextResponse.json({
        success: true,
        content: { id: content.id },
        message: '콘텐츠가 업로드되었습니다.',
      }, { status: 201 });
    }

    // Handle JSON body (routine type)
    const body = await request.json();
    const {
      title,
      description,
      content_type,
      subject,
      grade,
      price = 0,
      allow_preview = true,
      routine_type,
      routine_days,
      routine_items,
      thumbnail_url,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { message: '제목을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (content_type === 'routine' && (!routine_items || routine_items.length === 0)) {
      return NextResponse.json(
        { message: '루틴 일정을 하나 이상 추가해주세요.' },
        { status: 400 }
      );
    }

    const { data: content, error: insertError } = await supabase
      .from('contents')
      .insert({
        creator_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        type: 'pdf' as const, // Default type for routines
        content_type: content_type || 'routine',
        url: 'routine://data',
        thumbnail_url: thumbnail_url || null,
        subject: subject || null,
        grade: grade || null,
        allow_preview: allow_preview,
        routine_type: routine_type || null,
        routine_days: routine_type === 'custom' ? routine_days : null,
        routine_items: routine_items || null,
        access_level: price > 0 ? 'paid' : 'public',
        price: price > 0 ? price : null,
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Content insert error:', insertError);
      return NextResponse.json(
        { message: '콘텐츠 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      content: { id: content.id },
      message: '콘텐츠가 업로드되었습니다.',
    }, { status: 201 });
  } catch (error) {
    console.error('Content upload API error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
