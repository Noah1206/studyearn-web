'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Calculator,
  Languages,
  Beaker,
  Globe,
  History,
  CalendarCheck,
  GraduationCap,
  FileText,
} from 'lucide-react';

interface ContentThumbnailProps {
  thumbnailUrl?: string | null;
  subject?: string;
  title: string;
  aspectRatio?: '4/3' | '16/9' | '1/1';
  className?: string;
}

// 과목별 그라데이션 배경
const subjectGradients: Record<string, string> = {
  '국어': 'from-rose-400 to-rose-600',
  '수학': 'from-orange-400 to-orange-600',
  '영어': 'from-purple-400 to-purple-600',
  '과학': 'from-emerald-400 to-emerald-600',
  '물리': 'from-emerald-400 to-emerald-600',
  '화학': 'from-emerald-400 to-emerald-600',
  '생물': 'from-emerald-400 to-emerald-600',
  '지구과학': 'from-emerald-400 to-emerald-600',
  '사회': 'from-yellow-400 to-yellow-600',
  '한국사': 'from-orange-400 to-orange-600',
  '세계사': 'from-orange-400 to-orange-600',
  '루틴': 'from-indigo-400 to-indigo-600',
  '플래너': 'from-indigo-400 to-indigo-600',
};

// 과목별 아이콘
const subjectIcons: Record<string, typeof BookOpen> = {
  '국어': BookOpen,
  '수학': Calculator,
  '영어': Languages,
  '과학': Beaker,
  '물리': Beaker,
  '화학': Beaker,
  '생물': Beaker,
  '지구과학': Beaker,
  '사회': Globe,
  '한국사': History,
  '세계사': History,
  '루틴': CalendarCheck,
  '플래너': CalendarCheck,
};

export function ContentThumbnail({
  thumbnailUrl,
  subject,
  title,
  aspectRatio = '4/3',
  className,
}: ContentThumbnailProps) {
  const aspectClass = {
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-video',
    '1/1': 'aspect-square',
  }[aspectRatio];

  // 썸네일이 있는 경우
  if (thumbnailUrl) {
    return (
      <div className={cn(aspectClass, 'relative overflow-hidden bg-gray-100', className)}>
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
        />
      </div>
    );
  }

  // 썸네일이 없는 경우 - 과목별 그라데이션 폴백
  const gradient = subject ? subjectGradients[subject] : null;
  const Icon = subject ? subjectIcons[subject] : null;

  if (gradient && Icon) {
    return (
      <div
        className={cn(
          aspectClass,
          'relative overflow-hidden bg-gradient-to-br',
          gradient,
          className
        )}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/90">
          <Icon className="w-12 h-12 mb-2 opacity-80" />
          <span className="text-sm font-semibold opacity-90">{subject}</span>
        </div>
        {/* 패턴 오버레이 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
      </div>
    );
  }

  // 기본 폴백 (과목 정보도 없는 경우)
  return (
    <div
      className={cn(
        aspectClass,
        'relative overflow-hidden bg-gradient-to-br from-gray-300 to-gray-500',
        className
      )}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white/90">
        <FileText className="w-12 h-12 mb-2 opacity-80" />
        <span className="text-sm font-semibold opacity-90">학습자료</span>
      </div>
    </div>
  );
}

export default ContentThumbnail;
