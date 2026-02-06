'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  ArrowDownUp,
} from 'lucide-react';

interface TransactionUser {
  nickname: string;
  email: string | null;
}

interface Transaction {
  id: string;
  user_id: string;
  creator_id: string | null;
  product_id: string | null;
  content_id: string | null;
  status: string;
  platform: string;
  source: string;
  transaction_type: string;
  environment: string;
  external_transaction_id: string | null;
  is_verified: boolean;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  user: TransactionUser;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const SOURCE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'iap', label: 'IAP(인앱)' },
  { value: 'p2p', label: 'P2P(직거래)' },
  { value: 'toss', label: 'Toss(웹)' },
];

const PLATFORM_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'ios', label: 'iOS' },
  { value: 'android', label: 'Android' },
  { value: 'web', label: 'Web' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'purchased', label: 'purchased' },
  { value: 'completed', label: 'completed' },
  { value: 'pending', label: 'pending' },
  { value: 'failed', label: 'failed' },
  { value: 'refunded', label: 'refunded' },
];

const SOURCE_BADGE_COLORS: Record<string, string> = {
  iap: 'bg-blue-100 text-blue-800',
  p2p: 'bg-green-100 text-green-800',
  toss: 'bg-orange-100 text-orange-800',
};

const PLATFORM_BADGE_COLORS: Record<string, string> = {
  ios: 'bg-gray-100 text-gray-800',
  android: 'bg-green-100 text-green-800',
  web: 'bg-blue-100 text-blue-800',
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  purchased: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800',
};

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  subscription: '구독',
  tip: '팁',
  content: '콘텐츠',
  product: '상품',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminTransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [sourceFilter, setSourceFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        source: sourceFilter,
        platform: platformFilter,
        status: statusFilter,
        page: String(page),
        limit: String(pagination.limit),
      });

      const response = await fetch(`/api/admin/transactions?${params}`);

      if (response.status === 403) {
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('거래 내역을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, [sourceFilter, platformFilter, statusFilter]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">거래 내역</h1>
        <p className="text-sm text-gray-500 mt-1">
          IAP, P2P, Toss 등 모든 결제 소스의 통합 거래 내역을 조회합니다
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Source filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">소스</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {SOURCE_OPTIONS.map((opt) => (
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

          {/* Refresh button */}
          <button
            onClick={() => fetchTransactions(pagination.page)}
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
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <ArrowDownUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">표시할 거래 내역이 없습니다</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">유저</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">소스</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">플랫폼</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">거래유형</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">검증여부</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">거래일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{tx.user.nickname}</div>
                      {tx.user.email && (
                        <div className="text-xs text-gray-500">{tx.user.email}</div>
                      )}
                    </td>

                    {/* Source */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                          SOURCE_BADGE_COLORS[tx.source] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {tx.source.toUpperCase()}
                      </span>
                    </td>

                    {/* Platform */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                          PLATFORM_BADGE_COLORS[tx.platform] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {tx.platform}
                      </span>
                    </td>

                    {/* Transaction type */}
                    <td className="px-4 py-3 text-gray-700">
                      {TRANSACTION_TYPE_LABELS[tx.transaction_type] || tx.transaction_type}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                          STATUS_BADGE_COLORS[tx.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>

                    {/* Verified */}
                    <td className="px-4 py-3">
                      {tx.is_verified ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </td>

                    {/* Transaction date */}
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(tx.transaction_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => fetchTransactions(pagination.page - 1)}
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
            onClick={() => fetchTransactions(pagination.page + 1)}
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
