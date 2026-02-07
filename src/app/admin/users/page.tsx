'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
} from 'lucide-react';

interface CreatorSettings {
  id: string;
  display_name: string | null;
  total_subscribers: number;
}

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  notificationEmail: string;
  marketingEnabled: boolean;
  newContentEnabled: boolean;
  answerEnabled: boolean;
  dmEnabled: boolean;
  newSubscriberEnabled: boolean;
  salesEnabled: boolean;
}

interface UserPreferences {
  notification_settings: NotificationSettings | null;
}

interface User {
  id: string;
  nickname: string | null;
  email: string | null;
  user_type: 'runner' | 'creator' | null;
  is_creator: boolean;
  avatar_url: string | null;
  created_at: string;
  creator_settings: CreatorSettings[] | null;
  user_preferences: UserPreferences[] | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
        user_type: userTypeFilter,
      });

      if (search.trim()) {
        params.set('search', search.trim());
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`);

      if (response.status === 403) {
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('유저 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [userTypeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
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
        <h1 className="text-2xl font-bold text-gray-900">유저 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          전체 {pagination.total}명의 유저
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
                placeholder="닉네임 또는 이메일로 검색"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* User Type Filter */}
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">전체</option>
            <option value="runner">러너</option>
            <option value="creator">크리에이터</option>
          </select>

          {/* Refresh */}
          <button
            onClick={() => fetchUsers(pagination.page)}
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
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">표시할 유저가 없습니다</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    닉네임
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    이메일
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    알림 이메일
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    유저타입
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    크리에이터 여부
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    가입일
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {user.nickname || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {user.email || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {user.user_preferences?.[0]?.notification_settings?.emailEnabled ? (
                        <span className="text-blue-600">
                          {user.user_preferences[0].notification_settings.notificationEmail || '-'}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.user_type === 'runner' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          러너
                        </span>
                      )}
                      {user.user_type === 'creator' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          크리에이터
                        </span>
                      )}
                      {!user.user_type && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          미설정
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.is_creator ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          크리에이터
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(user.created_at)}
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
            onClick={() => fetchUsers(pagination.page - 1)}
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
            onClick={() => fetchUsers(pagination.page + 1)}
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
