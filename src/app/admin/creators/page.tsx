'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  CheckCircle,
} from 'lucide-react';

interface Profile {
  nickname: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface Creator {
  id: string;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  is_verified: boolean;
  total_subscribers: number;
  created_at: string;
  profiles: Profile | null;
  content_count: number;
  active_subscription_count: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminCreatorsPage() {
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreators = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
      });

      if (search.trim()) {
        params.set('search', search.trim());
      }

      const response = await fetch(`/api/admin/creators?${params.toString()}`);

      if (response.status === 403) {
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch creators');
      }

      const data = await response.json();
      setCreators(data.creators);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching creators:', err);
      setError('크리에이터 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators(1);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCreators(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">크리에이터 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          전체 {pagination.total.toLocaleString()}명의 크리에이터
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="크리에이터명으로 검색"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* Refresh */}
          <button
            onClick={() => fetchCreators(pagination.page)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : creators.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">표시할 크리에이터가 없습니다</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    크리에이터명
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    이메일
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    구독자수
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    콘텐츠수
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    활성구독
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">
                    인증 여부
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    가입일
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {creators.map((creator) => (
                  <tr
                    key={creator.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {creator.display_name || creator.profiles?.nickname || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {creator.profiles?.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {creator.total_subscribers.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {creator.content_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {creator.active_subscription_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {creator.is_verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3.5 h-3.5" />
                          인증됨
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          미인증
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(creator.created_at)}
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
            onClick={() => fetchCreators(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchCreators(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages || loading}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            다음
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
