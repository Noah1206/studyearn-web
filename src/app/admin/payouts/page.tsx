'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Banknote,
  Calendar,
  Building2,
  Settings,
  CreditCard,
  Bell,
} from 'lucide-react';

interface Payout {
  id: string;
  creator_id: string;
  amount: number;
  bank_name: string;
  bank_account: string;
  account_holder: string;
  status: string;
  admin_note: string | null;
  requested_at: string;
  processed_at: string | null;
  created_at: string;
  creator: {
    nickname: string;
    email: string | null;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminPayoutsPage() {
  const router = useRouter();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [newRequestAlert, setNewRequestAlert] = useState(false);
  const [lastKnownCount, setLastKnownCount] = useState<number | null>(null);

  const fetchPayouts = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/payouts?status=${status}&page=${page}&limit=${pagination.limit}`
      );

      if (response.status === 403) {
        router.push('/');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch payouts');
      }

      const data = await response.json();
      setPayouts(data.payouts);
      setPagination(data.pagination);

      // 새 정산 요청 알림 (pending 탭에서만)
      if (status === 'pending' && lastKnownCount !== null && data.pagination.total > lastKnownCount) {
        setNewRequestAlert(true);
        // 브라우저 알림 (권한 있는 경우)
        if (Notification.permission === 'granted') {
          new Notification('새 정산 요청', {
            body: `${data.pagination.total - lastKnownCount}건의 새 정산 요청이 있습니다.`,
            icon: '/favicon.ico',
          });
        }
      }
      if (status === 'pending') {
        setLastKnownCount(data.pagination.total);
      }
    } catch (err) {
      console.error('Error fetching payouts:', err);
      setError('정산 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts(1);
    // 브라우저 알림 권한 요청
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [status]);

  // 실시간 업데이트: 10초마다 새 정산 요청 확인
  useEffect(() => {
    // pending 탭에서만 자동 새로고침
    if (status !== 'pending') return;

    const interval = setInterval(() => {
      fetchPayouts(pagination.page);
    }, 10000); // 10초마다

    return () => clearInterval(interval);
  }, [status, pagination.page]);

  const handleProcess = async (payoutId: string) => {
    if (processingId) return;

    setProcessingId(payoutId);
    try {
      const response = await fetch(`/api/admin/payouts/${payoutId}/process`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to process');
      }

      fetchPayouts(pagination.page);
    } catch (err) {
      console.error('Error processing payout:', err);
      alert('정산 처리에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (payoutId: string) => {
    if (processingId) return;

    const reason = prompt('거절 사유를 입력해주세요 (선택):');
    if (reason === null) return; // Cancelled

    setProcessingId(payoutId);
    try {
      const response = await fetch(`/api/admin/payouts/${payoutId}/process`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to reject');
      }

      fetchPayouts(pagination.page);
    } catch (err) {
      console.error('Error rejecting payout:', err);
      alert('정산 거절에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">정산 관리</h1>
                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  실시간
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                크리에이터 정산 요청을 처리합니다 (수익의 80% 지급)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/purchases"
                className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors text-sm font-medium"
              >
                <CreditCard className="w-4 h-4" />
                입금 확인
              </Link>
              <Link
                href="/admin/settings"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
              >
                <Settings className="w-4 h-4" />
                설정
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 새 정산 요청 알림 */}
        {newRequestAlert && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium">
                새로운 정산 요청이 있습니다!
              </span>
            </div>
            <button
              onClick={() => {
                setNewRequestAlert(false);
                fetchPayouts(1);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              확인
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setStatus('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Clock className="w-4 h-4 inline-block mr-1" />
                대기 중 ({status === 'pending' ? pagination.total : '-'})
              </button>
              <button
                onClick={() => setStatus('processing')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  status === 'processing'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <RefreshCw className="w-4 h-4 inline-block mr-1" />
                처리 중
              </button>
              <button
                onClick={() => setStatus('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <CheckCircle className="w-4 h-4 inline-block mr-1" />
                완료
              </button>
              <button
                onClick={() => setStatus('rejected')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <XCircle className="w-4 h-4 inline-block mr-1" />
                거절
              </button>
            </div>
            <button
              onClick={() => fetchPayouts(pagination.page)}
              className="p-2 text-gray-500 hover:text-gray-700"
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

        {/* Payouts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Banknote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">표시할 정산 요청이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payouts.map((payout) => (
              <div
                key={payout.id}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Creator Icon */}
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-orange-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">
                      {payout.creator.nickname}
                    </h3>
                    {payout.creator.email && (
                      <p className="text-sm text-gray-500">{payout.creator.email}</p>
                    )}

                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Building2 className="w-4 h-4" />
                        <span className="font-medium">{payout.bank_name}</span>
                      </div>
                      <div className="text-sm text-gray-900">
                        {payout.bank_account}
                      </div>
                      <div className="text-sm text-gray-500">
                        예금주: {payout.account_holder}
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        요청: {formatDate(payout.requested_at)}
                      </span>
                      {payout.processed_at && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          처리: {formatDate(payout.processed_at)}
                        </span>
                      )}
                    </div>

                    {payout.admin_note && (
                      <div className="mt-2 text-sm text-red-600">
                        거절 사유: {payout.admin_note}
                      </div>
                    )}
                  </div>

                  {/* Amount & Actions */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {formatPrice(payout.amount)}원
                    </div>

                    {(status === 'pending' || status === 'processing') && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleProcess(payout.id)}
                          disabled={processingId === payout.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          완료
                        </button>
                        <button
                          onClick={() => handleReject(payout.id)}
                          disabled={processingId === payout.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          거절
                        </button>
                      </div>
                    )}

                    {status === 'completed' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">지급 완료</span>
                      </div>
                    )}

                    {status === 'rejected' && (
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">거절됨</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => fetchPayouts(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
              className="p-2 rounded-lg bg-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchPayouts(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || loading}
              className="p-2 rounded-lg bg-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
