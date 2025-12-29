import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, Users, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Avatar, Badge, Card, CardContent, LoadingSection } from '@/components/ui';
import type { CreatorSettings, Content } from '@/types/database';

interface CreatorPageProps {
  params: Promise<{ id: string }>;
}

async function getCreator(id: string) {
  const supabase = await createClient();

  const { data: creator, error } = await supabase
    .from('creator_settings')
    .select('*')
    .eq('user_id', id)
    .single();

  if (error || !creator) return null;

  return creator as CreatorSettings;
}


async function getCreatorContents(creatorId: string) {
  const supabase = await createClient();

  const { data: contents } = await supabase
    .from('contents')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(6);

  return (contents || []) as Content[];
}


function ContentCard({ content, creatorId }: { content: Content; creatorId: string }) {
  const accessLevel = content.access_level || 'public';

  const accessLabels: Record<string, string> = {
    public: '공개',
    subscribers: '구독자 전용',
    tier: '티어 전용',
    paid: formatCurrency(content.price || 0),
  };

  const accessColors: Record<string, 'success' | 'primary' | 'warning' | 'error' | 'outline'> = {
    public: 'success',
    subscribers: 'primary',
    tier: 'warning',
    paid: 'error',
  };

  const typeLabels: Record<string, string> = {
    video: '동영상',
    pdf: 'PDF',
    image: '이미지',
  };

  return (
    <Link href={`/content/${content.id}`}>
      <Card variant="outlined" hoverable className="h-full">
        {content.thumbnail_url && (
          <div className="relative aspect-video">
            <Image
              src={content.thumbnail_url}
              alt={content.title}
              fill
              className="object-cover rounded-t-xl"
            />
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={accessColors[accessLevel] || 'outline'} size="sm">
              {accessLabels[accessLevel] || '공개'}
            </Badge>
            <Badge variant="outline" size="sm">
              {typeLabels[content.type] || content.type}
            </Badge>
          </div>
          <h4 className="font-semibold text-gray-900 line-clamp-2">{content.title}</h4>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span>{formatNumber(content.view_count || 0)} 조회</span>
            <span>{formatNumber(content.like_count || 0)} 좋아요</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

async function CreatorContent({ id }: { id: string }) {
  const [creator, contents] = await Promise.all([
    getCreator(id),
    getCreatorContents(id),
  ]);

  if (!creator) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner */}
      <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900 mb-6">
        {creator.banner_image_url && (
          <Image
            src={creator.banner_image_url}
            alt=""
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex flex-col items-center md:items-start -mt-16 md:-mt-20 z-10">
          <Avatar
            src={creator.profile_image_url}
            alt={creator.display_name || '크리에이터'}
            size="2xl"
            className="border-4 border-white shadow-lg"
          />
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {creator.display_name || '크리에이터'}
            </h1>
            {creator.is_verified && (
              <CheckCircle className="w-6 h-6 text-gray-900" />
            )}
          </div>

          {creator.bio && (
            <p className="text-gray-600 mb-4 max-w-2xl">{creator.bio}</p>
          )}

          <div className="flex items-center justify-center md:justify-start gap-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-5 h-5" />
              <span>{formatNumber(creator.total_subscribers)} 구독자</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FileText className="w-5 h-5" />
              <span>{formatNumber(contents.length)} 콘텐츠</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contents */}
      {contents.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">콘텐츠</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contents.map((content) => (
              <ContentCard key={content.id} content={content} creatorId={id} />
            ))}
          </div>
        </section>
      )}

      {contents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">아직 등록된 콘텐츠가 없습니다.</p>
        </div>
      )}
    </div>
  );
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<LoadingSection />}>
      <CreatorContent id={id} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: CreatorPageProps) {
  const { id } = await params;
  const creator = await getCreator(id);

  if (!creator) {
    return {
      title: '크리에이터를 찾을 수 없습니다',
    };
  }

  return {
    title: creator.display_name || '크리에이터',
    description: creator.bio || `${creator.display_name || '크리에이터'}의 학습 콘텐츠를 만나보세요.`,
    openGraph: {
      title: creator.display_name || '크리에이터',
      description: creator.bio || `${creator.display_name || '크리에이터'}의 학습 콘텐츠를 만나보세요.`,
      images: creator.profile_image_url ? [creator.profile_image_url] : [],
    },
  };
}
