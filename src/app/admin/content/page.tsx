'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  FileText,
} from 'lucide-react';

interface Profile {
  nickname: string | null;
  email: string | null;
}

interface Content {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  content_type: string | null;
  thumbnail_url: string | null;
  price: number | null;
  view_count: number | null;
  like_count: number | null;
  is_published: boolean;
  created_at: string;
  profiles: Profile | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const CONTENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  post: { label: '포스트', color: 'bg-blue-100 text-blue-800' },
  video: { label: '영상', color: 'bg-red-100 text-red-800' },
  audio: { label: '오디오', color: 'bg-purple-100 text-purple-800' },
  document: { label: '문서', color: 'bg-yellow-100 text-yellow-800' },
  image: { label: '이미지', color: 'bg-green-100 text-green-800' },
  live: { label: '라이브', color: 'bg-pink-100 text-pink-800' },
};

export default function AdminContentPage() {
  const router = useRouter();
  const [contents, setContents] = useState<Content[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContents = async (page = 1) => {
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

      const response = await fetch(`/api/admin/content?${params.toString()}`);

      if (response.status === 403) {
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch contents');
      }

      const data = await response.json();
      setContents(data.contents);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching contents:', err);
      setError('콘텐츠 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents(1);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContents(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === 0) return '무료';
    return `${price.toLocaleString()}`;
  };

  const getContentTypeBadge = (contentType: string | null) => {
    if (!contentType) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
          미설정
        </span>
      );
    }

    const typeInfo = CONTENT_TYPE_LABELS[contentType];
    if (!typeInfo) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          {contentType}
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}
      >
        {typeInfo.label}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">콘텐츠 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          전체 {pagination.total.toLocaleString()}개의 콘텐츠
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
                placeholder="제목으로 검색"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* Refresh */}
          <button
            onClick={() => fetchContents(pagination.page)}
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
      ) : contents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">표시할 콘텐츠가 없습니다</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    제목
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    크리에이터
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">
                    타입
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    가격
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    조회수
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    좋아요
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    등록일
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contents.map((content) => (
                  <tr
                    key={content.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-medium truncate max-w-[200px]">
                          {content.title}
                        </span>
                        {!content.is_published && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700">
                            비공개
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {content.profiles?.nickname || content.profiles?.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getContentTypeBadge(content.content_type)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {formatPrice(content.price)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {(content.view_count ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {(content.like_count ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(content.created_at)}
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
            onClick={() => fetchContents(pagination.page - 1)}
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
            onClick={() => fetchContents(pagination.page + 1)}
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
