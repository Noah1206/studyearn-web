'use client';

import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Bug,
  Zap,
  Shield,
  Wrench,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';

type ChangeType = 'feature' | 'improvement' | 'bugfix' | 'security' | 'performance';

interface ChangeItem {
  type: ChangeType;
  description: string;
}

interface VersionEntry {
  version: string;
  date: string;
  title: string;
  isLatest?: boolean;
  changes: ChangeItem[];
}

const changeTypeConfig: Record<ChangeType, { icon: React.ElementType; label: string; color: string; bgColor: string }> = {
  feature: { icon: Sparkles, label: '새 기능', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  improvement: { icon: Zap, label: '개선', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  bugfix: { icon: Bug, label: '버그 수정', color: 'text-red-600', bgColor: 'bg-red-100' },
  security: { icon: Shield, label: '보안', color: 'text-green-600', bgColor: 'bg-green-100' },
  performance: { icon: Wrench, label: '성능', color: 'text-orange-600', bgColor: 'bg-orange-100' },
};

const changelog: VersionEntry[] = [
  {
    version: '1.0.0',
    date: '2024-12-20',
    title: '정식 출시',
    isLatest: true,
    changes: [
      { type: 'feature', description: '스터디윗미 - 실시간 공부 세션 기능 추가' },
      { type: 'feature', description: '크리에이터 콘텐츠 판매 기능' },
      { type: 'feature', description: '프로필 및 설정 페이지' },
      { type: 'feature', description: '2단계 인증 지원' },
      { type: 'improvement', description: '모바일 반응형 UI 개선' },
      { type: 'security', description: '계정 보안 강화' },
    ],
  },
  {
    version: '0.9.0',
    date: '2024-12-10',
    title: '오픈 베타',
    changes: [
      { type: 'feature', description: '콘텐츠 검색 및 필터 기능' },
      { type: 'feature', description: '구독 시스템 도입' },
      { type: 'improvement', description: '페이지 로딩 속도 50% 개선' },
      { type: 'bugfix', description: '알림이 간헐적으로 오지 않던 문제 수정' },
      { type: 'bugfix', description: '프로필 이미지 업로드 오류 수정' },
    ],
  },
  {
    version: '0.8.0',
    date: '2024-11-25',
    title: '클로즈드 베타 2',
    changes: [
      { type: 'feature', description: '크리에이터 대시보드 추가' },
      { type: 'feature', description: '정산 시스템 구축' },
      { type: 'improvement', description: '콘텐츠 에디터 UI/UX 개선' },
      { type: 'performance', description: '이미지 최적화로 로딩 속도 개선' },
      { type: 'bugfix', description: '다크모드 스타일 오류 수정' },
    ],
  },
  {
    version: '0.7.0',
    date: '2024-11-10',
    title: '클로즈드 베타 1',
    changes: [
      { type: 'feature', description: '스터디룸 기본 기능 구현' },
      { type: 'feature', description: '사용자 프로필 시스템' },
      { type: 'feature', description: '콘텐츠 업로드 및 관리' },
      { type: 'security', description: '휴대폰 인증 시스템 도입' },
    ],
  },
  {
    version: '0.5.0',
    date: '2024-10-20',
    title: '알파 테스트',
    changes: [
      { type: 'feature', description: '기본 인증 시스템 구현' },
      { type: 'feature', description: '홈 화면 및 탐색 구조' },
      { type: 'feature', description: '콘텐츠 뷰어 프로토타입' },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <motion.div
      className="min-h-[calc(100vh-4rem)] bg-neutral-light"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-brand-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }} />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/profile/settings"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">설정</span>
            </Link>
            <div className="w-px h-6 bg-white/20" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">업데이트 내역</h1>
                <p className="text-sm text-white/60">스터플의 변화를 확인하세요</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Version Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-8">
            {changelog.map((entry, index) => (
              <div key={entry.version} className="relative pl-16">
                {/* Timeline Dot */}
                <div className={`absolute left-4 -translate-x-1/2 w-5 h-5 rounded-full border-4 border-white ${
                  entry.isLatest ? 'bg-accent' : 'bg-gray-300'
                }`} />

                <Card variant="elevated" className={entry.isLatest ? 'ring-2 ring-accent/20' : ''}>
                  <CardContent className="p-6">
                    {/* Version Header */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">v{entry.version}</span>
                        {entry.isLatest && (
                          <span className="px-2 py-0.5 bg-accent text-white text-xs font-medium rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            최신
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{entry.date}</span>
                      <span className="text-sm font-medium text-gray-700">- {entry.title}</span>
                    </div>

                    {/* Changes List */}
                    <div className="space-y-3">
                      {entry.changes.map((change, changeIndex) => {
                        const config = changeTypeConfig[change.type];
                        const Icon = config.icon;

                        return (
                          <div key={changeIndex} className="flex items-start gap-3">
                            <div className={`w-6 h-6 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`text-xs font-medium ${config.color} mr-2`}>
                                [{config.label}]
                              </span>
                              <span className="text-sm text-gray-700">{change.description}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <Card variant="outlined" className="mt-8">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-3">변경 유형</p>
            <div className="flex flex-wrap gap-4">
              {Object.entries(changeTypeConfig).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded ${config.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-3 h-3 ${config.color}`} />
                    </div>
                    <span className="text-xs text-gray-600">{config.label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            더 좋은 서비스를 위해 지속적으로 업데이트하고 있습니다.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            문의사항이 있으시면{' '}
            <Link href="/help/contact" className="text-accent hover:underline">
              1:1 문의
            </Link>
            를 이용해주세요.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
