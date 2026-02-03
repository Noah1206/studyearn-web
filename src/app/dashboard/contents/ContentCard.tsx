'use client';

import Link from 'next/link';
import {
  Eye,
  Heart,
  Edit3,
  BarChart2,
  Clock,
  CheckCircle,
  Calendar,
  Download,
} from 'lucide-react';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils';
import type { Content } from '@/types/database';

export interface ContentWithStats extends Content {
  purchase_count?: number;
  revenue?: number;
  tags?: string[];
}

// 과목 색상
function getSubjectStyle(subject?: string | null) {
  const styles: Record<string, { bg: string; text: string }> = {
    '국어': { bg: 'bg-rose-50', text: 'text-rose-600' },
    '수학': { bg: 'bg-orange-50', text: 'text-orange-600' },
    '영어': { bg: 'bg-purple-50', text: 'text-purple-600' },
    '과학': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    '사회': { bg: 'bg-yellow-50', text: 'text-yellow-600' },
    '한국사': { bg: 'bg-orange-50', text: 'text-orange-600' },
    '루틴': { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    '플래너': { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  };
  return styles[subject || ''] || { bg: 'bg-gray-50', text: 'text-gray-600' };
}

export function ContentCard({ content }: { content: ContentWithStats }) {
  const now = new Date();
  const publishedAt = content.published_at ? new Date(content.published_at) : null;
  const isScheduled = content.is_published && publishedAt && publishedAt > now;
  const isDraft = !content.is_published;
  const subjectStyle = getSubjectStyle(content.subject);

  const getStatusBadge = () => {
    if (isDraft) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-600">
          임시저장
        </span>
      );
    }
    if (isScheduled) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-600">
          예약됨
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-600">
        발행중
      </span>
    );
  };

  return (
    <div>
      {/* 콘텐츠 카드 */}
      <div className="relative bg-white rounded-xl p-5 border border-gray-200">
        <div className="flex gap-5">
          {/* 콘텐츠 정보 */}
          <div className="flex-1 min-w-0">
            {/* 태그 라인 */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${subjectStyle.bg} ${subjectStyle.text}`}>
                {content.subject || '학습자료'}
              </span>
              {content.grade && (
                <span className="px-2 py-1 border border-gray-200 text-gray-600 text-xs font-semibold rounded">
                  {content.grade}
                </span>
              )}
              {getStatusBadge()}
              <span className="text-xs text-gray-400">• {formatRelativeTime(content.created_at)}</span>
            </div>

            {/* 제목 */}
            <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 leading-snug">
              {content.title}
            </h3>

            {/* 하단: 통계 */}
            <div className="flex items-center gap-3 text-sm mb-2">
              <span className="flex items-center gap-1 text-gray-400">
                <Eye className="w-3.5 h-3.5" />
                <span className="font-medium">{formatNumber(content.view_count || 0)}</span>
              </span>
              <span className="flex items-center gap-1 text-gray-400">
                <Heart className="w-3.5 h-3.5" />
                <span className="font-medium">{formatNumber(content.like_count || 0)}</span>
              </span>
              <span className="flex items-center gap-1 text-gray-400">
                <Download className="w-3.5 h-3.5" />
                <span className="font-medium">{formatNumber(content.download_count || 0)}</span>
              </span>
            </div>

            {/* 판매 정보 */}
            {(content.purchase_count || 0) > 0 && (
              <span className="text-xs text-gray-400">
                {formatNumber(content.purchase_count || 0)}건 판매
              </span>
            )}
          </div>

          {/* 우측: 가격 */}
          <div className="flex flex-col items-end justify-start min-w-[100px]">
            <div className="text-right">
              {content.price === 0 ? (
                <span className="text-base font-bold text-orange-600">무료</span>
              ) : (
                <div>
                  <span className="block text-xs text-gray-400 mb-0.5">가격</span>
                  <span className="text-base font-bold text-gray-900">{formatCurrency(content.price || 0)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 액션 버튼 - 카드 아래 */}
      <div className="flex items-center gap-2 mt-3">
        <Link
          href={`/dashboard/contents/${content.id}/edit`}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Edit3 className="w-4 h-4" />
          편집
        </Link>
        <Link
          href={`/dashboard/analytics?content=${content.id}`}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-sm font-medium"
        >
          <BarChart2 className="w-4 h-4" />
          분석
        </Link>
      </div>
    </div>
  );
}
