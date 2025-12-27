import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, Eye, Heart, Calendar, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import { Button, Avatar, Badge, Card, CardContent, LoadingSection } from '@/components/ui';
import type { Content, CreatorSettings } from '@/types/database';

export const dynamic = 'force-dynamic';

interface ContentPageProps {
  params: Promise<{ id: string }>;
}

async function getContent(id: string) {
  const supabase = await createClient();

  const { data: content, error } = await supabase
    .from('contents')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single();

  if (error || !content) return null;

  return content as Content;
}

async function getCreator(userId: string) {
  const supabase = await createClient();

  const { data: creator } = await supabase
    .from('creator_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  return creator as CreatorSettings | null;
}

async function checkAccess(contentId: string, userId: string | null) {
  if (!userId) return { hasAccess: false, reason: 'login' as const };

  const supabase = await createClient();

  // Check content purchase
  const { data: purchase } = await supabase
    .from('content_purchases')
    .select('id')
    .eq('content_id', contentId)
    .eq('buyer_id', userId)
    .eq('status', 'completed')
    .single();

  if (purchase) return { hasAccess: true, reason: 'purchased' as const };

  // Get content to check access level
  const { data: content } = await supabase
    .from('contents')
    .select('access_level, creator_id, required_tier_id')
    .eq('id', contentId)
    .single();

  if (!content) return { hasAccess: false, reason: 'not_found' as const };

  // Public content
  if (content.access_level === 'public') {
    return { hasAccess: true, reason: 'public' as const };
  }

  // Check subscription
  const { data: subscription } = await supabase
    .from('creator_subscriptions')
    .select('*, tier:subscription_tiers(price)')
    .eq('subscriber_id', userId)
    .eq('creator_id', content.creator_id)
    .eq('status', 'active')
    .single();

  if (content.access_level === 'subscribers' && subscription) {
    return { hasAccess: true, reason: 'subscription' as const };
  }

  if (content.access_level === 'tier' && subscription && content.required_tier_id) {
    // Check if user's tier is equal or higher
    const { data: requiredTier } = await supabase
      .from('subscription_tiers')
      .select('price')
      .eq('id', content.required_tier_id)
      .single();

    if (requiredTier && subscription.tier && subscription.tier.price >= requiredTier.price) {
      return { hasAccess: true, reason: 'tier' as const };
    }
  }

  return { hasAccess: false, reason: 'no_access' as const };
}

async function ContentPageContent({ id }: { id: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const content = await getContent(id);

  if (!content) {
    notFound();
  }

  const [creator, accessCheck] = await Promise.all([
    getCreator(content.creator_id),
    checkAccess(id, user?.id || null),
  ]);

  const accessLabels = {
    public: '공개',
    subscribers: '구독자 전용',
    tier: '티어 전용',
    paid: `${formatCurrency(content.price || 0)}`,
  };

  const accessColors = {
    public: 'success',
    subscribers: 'primary',
    tier: 'warning',
    paid: 'error',
  } as const;

  const contentTypeLabels = {
    post: '포스트',
    video: '영상',
    audio: '오디오',
    document: '문서',
    image: '이미지',
    live: '라이브',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Content Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant={accessColors[content.access_level]}>
            {accessLabels[content.access_level]}
          </Badge>
          <Badge variant="outline">
            {contentTypeLabels[content.content_type]}
          </Badge>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{content.title}</h1>

        {/* Creator Info */}
        {creator && (
          <Link
            href={`/creator/${creator.user_id}`}
            className="flex items-center gap-3 mb-6 group"
          >
            <Avatar
              src={creator.profile_image_url}
              alt={creator.display_name || '크리에이터'}
              size="md"
            />
            <div>
              <p className="font-medium text-gray-900 group-hover:text-gray-900">
                {creator.display_name || '크리에이터'}
              </p>
              <p className="text-sm text-gray-500">
                {formatNumber(creator.total_subscribers)} 구독자
              </p>
            </div>
          </Link>
        )}

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(content.published_at || content.created_at)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            <span>{formatNumber(content.view_count)} 조회</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart className="w-4 h-4" />
            <span>{formatNumber(content.like_count)} 좋아요</span>
          </div>
        </div>
      </div>

      {/* Thumbnail */}
      {content.thumbnail_url && (
        <div className="relative aspect-video rounded-xl overflow-hidden mb-8">
          <Image
            src={content.thumbnail_url}
            alt={content.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content or Access Gate */}
      {accessCheck.hasAccess ? (
        <Card variant="outlined">
          <CardContent>
            {content.description && (
              <div className="prose prose-gray max-w-none">
                <p>{content.description}</p>
              </div>
            )}

            {content.content_url && (
              <div className="mt-6 p-6 bg-gray-50 rounded-xl text-center">
                <p className="text-gray-600 mb-4">
                  전체 콘텐츠는 앱에서 확인할 수 있습니다.
                </p>
                <a
                  href={process.env.NEXT_PUBLIC_APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button>앱에서 보기</Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card variant="outlined" className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-gray-400" />
            </div>

            {accessCheck.reason === 'login' ? (
              <>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  로그인이 필요합니다
                </h3>
                <p className="text-gray-600 mb-6">
                  이 콘텐츠를 보려면 로그인해주세요.
                </p>
                <Link href={`/login?redirectTo=/content/${id}`}>
                  <Button>로그인</Button>
                </Link>
              </>
            ) : content.access_level === 'paid' ? (
              <>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  유료 콘텐츠입니다
                </h3>
                <p className="text-gray-600 mb-2">
                  이 콘텐츠를 보려면 구매가 필요합니다.
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-6">
                  {formatCurrency(content.price || 0)}
                </p>
                <Link href={`/purchase/${id}`}>
                  <Button>구매하기</Button>
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  비공개 콘텐츠입니다
                </h3>
                <p className="text-gray-600 mb-6">
                  이 콘텐츠는 현재 접근이 제한되어 있습니다.
                </p>
                <Link href={`/creator/${content.creator_id}`}>
                  <Button>크리에이터 프로필 보기</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {content.tags && content.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {content.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<LoadingSection />}>
      <ContentPageContent id={id} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: ContentPageProps) {
  const { id } = await params;
  const content = await getContent(id);

  if (!content) {
    return {
      title: '콘텐츠를 찾을 수 없습니다',
    };
  }

  return {
    title: content.title,
    description: content.description || `${content.title} - StuPle`,
    openGraph: {
      title: content.title,
      description: content.description || `${content.title} - StuPle`,
      images: content.thumbnail_url ? [content.thumbnail_url] : [],
    },
  };
}
