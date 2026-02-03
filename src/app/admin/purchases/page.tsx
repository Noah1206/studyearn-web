'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Package,
  Calendar,
  CreditCard,
  Settings,
  Banknote,
} from 'lucide-react';

interface Purchase {
  id: string;
  content_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: string;
  order_number: string | null;
  buyer_note: string | null;
  payment_confirmed_at: string | null;
  platform_confirmed_at: string | null;
  creator_revenue: number | null;
  platform_fee: number | null;
  created_at: string;
  content: {
    title: string;
    thumbnail_url: string | null;
  };
  buyer: {
    nickname: string;
    email: string | null;
  };
  seller: {
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

export default function AdminPurchasesPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [status, setStatus] = useState<'pending' | 'completed' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPurchases = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/purchases?status=${status}&page=${page}&limit=${pagination.limit}`
      );

      if (response.status === 403) {
        router.push('/');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch purchases');
      }

      const data = await response.json();
      setPurchases(data.purchases);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching purchases:', err);
      setError('구매 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases(1);
  }, [status]);

  const handleConfirm = async (purchaseId: string) => {
    if (processingId) return;

    setProcessingId(purchaseId);
    try {
      const response = await fetch(`/api/admin/purchases/${purchaseId}/confirm`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to confirm');
      }

      // Remove from list or refresh
      fetchPurchases(pagination.page);
    } catch (err) {
      console.error('Error confirming purchase:', err);
      alert('입금 확인에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (purchaseId: string) => {
    if (processingId) return;

    if (!confirm('정말 이 구매를 거절하시겠습니까?')) return;

    setProcessingId(purchaseId);
    try {
      const response = await fetch(`/api/admin/purchases/${purchaseId}/confirm`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to reject');
      }

      fetchPurchases(pagination.page);
    } catch (err) {
      console.error('Error rejecting purchase:', err);
      alert('구매 거절에 실패했습니다.');
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
              <h1 className="text-xl font-bold text-gray-900">입금 확인 관리</h1>
              <p className="text-sm text-gray-500 mt-1">
                구매자 입금을 확인하고 크리에이터 정산을 처리합니다
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/payouts"
                className="flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors text-sm font-medium"
              >
                <Banknote className="w-4 h-4" />
                정산 관리
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
                대기 ({status === 'pending' ? pagination.total : '-'})
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
              onClick={() => fetchPurchases(pagination.page)}
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

        {/* Purchases List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : purchases.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">표시할 구매 내역이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {purchase.content.thumbnail_url ? (
                      <Image
                        src={purchase.content.thumbnail_url}
                        alt={purchase.content.title}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {purchase.content.title}
                      </h3>
                      {purchase.order_number && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-mono font-medium rounded">
                          {purchase.order_number}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        구매자: {purchase.buyer.nickname}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        판매자: {purchase.seller.nickname}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(purchase.created_at)}
                      </span>
                    </div>

                    {purchase.buyer_note && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">입금자명:</span>{' '}
                        <span className="font-medium text-gray-900">{purchase.buyer_note}</span>
                      </div>
                    )}

                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span className="font-bold text-gray-900">
                          {formatPrice(purchase.amount)}원
                        </span>
                      </div>
                      {purchase.creator_revenue && (
                        <span className="text-sm text-gray-500">
                          (크리에이터 {formatPrice(purchase.creator_revenue)}원 /
                          수수료 {formatPrice(purchase.platform_fee || 0)}원)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {(purchase.status === 'pending_confirm' || purchase.status === 'pending_payment') && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleConfirm(purchase.id)}
                        disabled={processingId === purchase.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        확인
                      </button>
                      <button
                        onClick={() => handleReject(purchase.id)}
                        disabled={processingId === purchase.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        거절
                      </button>
                    </div>
                  )}

                  {purchase.status === 'completed' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">확인됨</span>
                    </div>
                  )}

                  {purchase.status === 'rejected' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">거절됨</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => fetchPurchases(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
              className="p-2 rounded-lg bg-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchPurchases(pagination.page + 1)}
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
