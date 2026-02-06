'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CreditCard,
} from 'lucide-react';

interface Subscription {
  id: string;
  user_id: string;
  product_id: string;
  original_transaction_id: string | null;
  platform: 'ios' | 'android';
  status: string;
  auto_renew_enabled: boolean;
  auto_renew_product_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  grace_period_end: string | null;
  cancellation_date: string | null;
  cancellation_reason: string | null;
  latest_purchase_id: string | null;
  creator_id: string | null;
  tier_id: string | null;
  created_at: string;
  updated_at: string;
  user: {
    nickname: string;
    email: string | null;
  };
  creator: {
    display_name: string;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '활성' },
  { value: 'expired', label: '만료' },
  { value: 'cancelled', label: '취소됨' },
  { value: 'grace_period', label: '유예기간' },
  { value: 'billing_retry', label: '결제 재시도' },
  { value: 'paused', label: '일시정지' },
];

const PLATFORM_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'ios', label: 'iOS' },
  { value: 'android', label: 'Android' },
];

const STATUS_BADGE: Record<string, { className: string; label: string }> = {
  active: { className: 'bg-green-100 text-green-800', label: '활성' },
  expired: { className: 'bg-gray-100 text-gray-800', label: '만료' },
  cancelled: { className: 'bg-red-100 text-red-800', label: '취소됨' },
  grace_period: { className: 'bg-yellow-100 text-yellow-800', label: '유예기간' },
  billing_retry: { className: 'bg-orange-100 text-orange-800', label: '결제 재시도' },
  paused: { className: 'bg-blue-100 text-blue-800', label: '일시정지' },
};

const PLATFORM_BADGE: Record<string, string> = {
  ios: 'bg-gray-100 text-gray-800',
  android: 'bg-green-100 text-green-800',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isPast(dateString: string): boolean {
  return new Date(dateString) < new Date();
}

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        status: statusFilter,
        platform: platformFilter,
        page: String(page),
        limit: String(pagination.limit),
      });

      const response = await fetch(`/api/admin/subscriptions?${params}`);

      if (response.status === 403) {
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data.subscriptions);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError('구독 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions(1);
  }, [statusFilter, platformFilter]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">구독 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          IAP 구독 현황을 조회하고 관리합니다
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">상태</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Platform filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">플랫폼</label>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {PLATFORM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => fetchSubscriptions(pagination.page)}
            className="ml-auto p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">표시할 구독 내역이 없습니다</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">유저</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">크리에이터</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">상품ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">플랫폼</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">자동갱신</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">구독기간</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">만료일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscriptions.map((sub) => {
                  const statusBadge = STATUS_BADGE[sub.status] || {
                    className: 'bg-gray-100 text-gray-800',
                    label: sub.status,
                  };
                  const periodExpired =
                    sub.current_period_end && isPast(sub.current_period_end);

                  return (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {sub.user.nickname}
                        </div>
                        {sub.user.email && (
                          <div className="text-xs text-gray-500">{sub.user.email}</div>
                        )}
                      </td>

                      {/* Creator */}
                      <td className="px-4 py-3 text-gray-700">
                        {sub.creator ? sub.creator.display_name : '-'}
                      </td>

                      {/* Product ID */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-600">
                          {sub.product_id}
                        </span>
                      </td>

                      {/* Platform */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                            PLATFORM_BADGE[sub.platform] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {sub.platform === 'ios' ? 'iOS' : 'Android'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Auto Renew */}
                      <td className="px-4 py-3">
                        {sub.auto_renew_enabled ? (
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            ON
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            OFF
                          </span>
                        )}
                      </td>

                      {/* Period */}
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {sub.current_period_start && sub.current_period_end
                          ? `${formatDate(sub.current_period_start)} ~ ${formatDate(sub.current_period_end)}`
                          : '-'}
                      </td>

                      {/* Expiry */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {sub.current_period_end ? (
                          <span className={periodExpired ? 'text-red-600 font-medium' : 'text-gray-500'}>
                            {formatDate(sub.current_period_end)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => fetchSubscriptions(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
            className="p-2 rounded-lg bg-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            {pagination.page} / {pagination.totalPages}
            <span className="ml-2 text-gray-400">(총 {pagination.total}건)</span>
          </span>
          <button
            onClick={() => fetchSubscriptions(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages || loading}
            className="p-2 rounded-lg bg-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
