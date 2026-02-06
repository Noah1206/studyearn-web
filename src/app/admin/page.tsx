'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Palette,
  FileText,
  CreditCard,
  RefreshCw,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  totalCreators: number;
  totalContent: number;
  activeSubscriptions: number;
  recentPurchases: number;
  totalP2PPurchases: number;
}

interface StatCard {
  label: string;
  key: keyof AnalyticsData;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
}

const STAT_CARDS: StatCard[] = [
  {
    label: '전체 유저',
    key: 'totalUsers',
    icon: <Users className="w-5 h-5" />,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    label: '크리에이터',
    key: 'totalCreators',
    icon: <Palette className="w-5 h-5" />,
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    label: '총 콘텐츠',
    key: 'totalContent',
    icon: <FileText className="w-5 h-5" />,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    label: '활성 구독',
    key: 'activeSubscriptions',
    icon: <RefreshCw className="w-5 h-5" />,
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    label: '최근 구매 (30일)',
    key: 'recentPurchases',
    icon: <CreditCard className="w-5 h-5" />,
    bgColor: 'bg-teal-100',
    iconColor: 'text-teal-600',
  },
  {
    label: 'P2P 거래 완료',
    key: 'totalP2PPurchases',
    icon: <ShoppingCart className="w-5 h-5" />,
    bgColor: 'bg-pink-100',
    iconColor: 'text-pink-600',
  },
];

interface QuickLink {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const QUICK_LINKS: QuickLink[] = [
  {
    href: '/admin/users',
    title: '유저 관리',
    description: '전체 유저 목록 조회 및 관리',
    icon: <Users className="w-5 h-5 text-blue-600" />,
  },
  {
    href: '/admin/creators',
    title: '크리에이터',
    description: '크리에이터 현황 및 인증 관리',
    icon: <Palette className="w-5 h-5 text-purple-600" />,
  },
  {
    href: '/admin/content',
    title: '콘텐츠',
    description: '등록된 콘텐츠 조회 및 관리',
    icon: <FileText className="w-5 h-5 text-green-600" />,
  },
  {
    href: '/admin/transactions',
    title: '거래 내역',
    description: 'IAP 및 P2P 거래 내역 확인',
    icon: <CreditCard className="w-5 h-5 text-orange-600" />,
  },
  {
    href: '/admin/subscriptions',
    title: '구독 관리',
    description: '활성 구독 현황 및 이력 관리',
    icon: <RefreshCw className="w-5 h-5 text-teal-600" />,
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/analytics');

      if (response.status === 403) {
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data: AnalyticsData = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('대시보드 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="text-sm text-gray-500 mt-1">
            StudyEarn 서비스 전체 현황
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))
          : STAT_CARDS.map((card) => (
              <div
                key={card.key}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${card.bgColor} ${card.iconColor}`}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{card.label}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {analytics
                        ? analytics[card.key].toLocaleString()
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Quick Links */}
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          빠른 이동
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                {link.icon}
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                {link.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {link.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
