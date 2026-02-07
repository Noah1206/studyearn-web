'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Sparkles,
  Calendar,
  FileText,
  Settings,
  ImageIcon,
  BookOpen,
  Users,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CreatorApplication {
  id: string;
  user_id: string;
  categories: string[];
  custom_category: string | null;
  target_ages: string[];
  speciality: string | null;
  proof_documents: string[];
  motivation: string | null;
  status: string;
  admin_note: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  user: {
    nickname: string;
    email: string | null;
    avatar_url: string | null;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  'study-method': '공부법/플래너',
  'note-summary': '노트/요약정리',
  'suneung': '수능/내신',
  'college-admission': '대입/입시전략',
  'certification': '자격증/시험',
  'language': '영어/외국어',
  'math-science': '수학/과학',
  'humanities': '국어/사회',
  'coding': '코딩/IT',
  'design': '디자인/영상',
  'career': '진로/취업',
  'campus-life': '대학생활',
};

const AGE_LABELS: Record<string, string> = {
  'middle': '중학생',
  'high': '고등학생',
  'n-soo': 'N수생',
  'college': '대학생',
  'all': '전체',
};

export default function AdminCreatorApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<CreatorApplication[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [newRequestAlert, setNewRequestAlert] = useState(false);
  const [lastKnownCount, setLastKnownCount] = useState<number | null>(null);

  const supabase = createClient();

  const fetchApplications = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const offset = (page - 1) * pagination.limit;

      // 신청 목록 조회
      const { data, error, count } = await supabase
        .from('creator_applications')
        .select('*', { count: 'exact' })
        .eq('status', status)
        .order('submitted_at', { ascending: false })
        .range(offset, offset + pagination.limit - 1);

      if (error) throw error;

      // 유저 정보 조회
      const enrichedData = await Promise.all(
        (data || []).map(async (app) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nickname, email, avatar_url')
            .eq('id', app.user_id)
            .single();

          return {
            ...app,
            user: {
              nickname: profile?.nickname || '알 수 없음',
              email: profile?.email || null,
              avatar_url: profile?.avatar_url || null,
            },
          };
        })
      );

      setApplications(enrichedData);
      setPagination(prev => ({
        ...prev,
        page,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / prev.limit),
      }));

      // 새 신청 알림
      if (status === 'pending' && lastKnownCount !== null && (count || 0) > lastKnownCount) {
        setNewRequestAlert(true);
      }
      if (status === 'pending') {
        setLastKnownCount(count || 0);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('신청 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(1);
  }, [status]);

  // 10초마다 자동 새로고침 (pending 탭에서만)
  useEffect(() => {
    if (status !== 'pending') return;
    const interval = setInterval(() => fetchApplications(pagination.page), 10000);
    return () => clearInterval(interval);
  }, [status, pagination.page]);

  const handleApprove = async (applicationId: string) => {
    if (processingId) return;
    setProcessingId(applicationId);

    try {
      const { data, error } = await supabase.rpc('approve_creator_application', {
        application_id: applicationId,
        admin_note_text: null,
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to approve');

      fetchApplications(pagination.page);
    } catch (err) {
      console.error('Error approving:', err);
      alert('승인 처리에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    if (processingId) return;

    const reason = prompt('거절 사유를 입력해주세요:');
    if (reason === null) return;

    setProcessingId(applicationId);

    try {
      const { data, error } = await supabase.rpc('reject_creator_application', {
        application_id: applicationId,
        rejection_reason: reason || '심사 결과 승인되지 않았습니다.',
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to reject');

      fetchApplications(pagination.page);
    } catch (err) {
      console.error('Error rejecting:', err);
      alert('거절 처리에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-orange-500" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">스터디언 신청 관리</h1>
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    실시간
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  크리에이터 신청을 검토하고 승인합니다
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/payouts"
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm font-medium"
              >
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
        {/* 새 신청 알림 */}
        {newRequestAlert && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-orange-600" />
              <span className="text-orange-800 font-medium">새로운 스터디언 신청이 있습니다!</span>
            </div>
            <button
              onClick={() => {
                setNewRequestAlert(false);
                fetchApplications(1);
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
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
                onClick={() => setStatus('approved')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <CheckCircle className="w-4 h-4 inline-block mr-1" />
                승인됨
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
                거절됨
              </button>
            </div>
            <button
              onClick={() => fetchApplications(pagination.page)}
              className="p-2 text-gray-500 hover:text-gray-700"
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
        )}

        {/* Applications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">표시할 신청이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* User Avatar */}
                  <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {app.user.avatar_url ? (
                      <Image src={app.user.avatar_url} alt="" width={56} height={56} className="object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-orange-600" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg">{app.user.nickname}</h3>
                    {app.user.email && <p className="text-sm text-gray-500">{app.user.email}</p>}

                    {/* Categories */}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      {app.categories.map((cat) => (
                        <span key={cat} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          {CATEGORY_LABELS[cat] || cat}
                        </span>
                      ))}
                      {app.custom_category && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                          {app.custom_category}
                        </span>
                      )}
                    </div>

                    {/* Target Ages */}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <Users className="w-4 h-4 text-gray-400" />
                      {app.target_ages.map((age) => (
                        <span key={age} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                          {AGE_LABELS[age] || age}
                        </span>
                      ))}
                    </div>

                    {/* Speciality & Motivation */}
                    {app.speciality && (
                      <p className="mt-3 text-sm text-gray-700">
                        <span className="font-medium">특기:</span> {app.speciality}
                      </p>
                    )}
                    {app.motivation && (
                      <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        "{app.motivation}"
                      </p>
                    )}

                    {/* Proof Documents */}
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <ImageIcon className="w-4 h-4" />
                        증빙 자료 ({app.proof_documents.length}개)
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {app.proof_documents.map((url, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImage(url)}
                            className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors"
                          >
                            <Image src={url} alt={`증빙자료 ${idx + 1}`} width={80} height={80} className="object-cover w-full h-full" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        신청: {formatDate(app.submitted_at)}
                      </span>
                      {app.reviewed_at && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          처리: {formatDate(app.reviewed_at)}
                        </span>
                      )}
                    </div>

                    {app.admin_note && (
                      <div className="mt-2 text-sm text-red-600">
                        관리자 메모: {app.admin_note}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(app.id)}
                          disabled={processingId === app.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          disabled={processingId === app.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          거절
                        </button>
                      </div>
                    )}

                    {status === 'approved' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">승인됨</span>
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
              onClick={() => fetchApplications(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
              className="p-2 rounded-lg bg-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchApplications(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || loading}
              className="p-2 rounded-lg bg-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <Image
              src={selectedImage}
              alt="증빙자료"
              width={800}
              height={600}
              className="object-contain max-h-[90vh] rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg"
            >
              <XCircle className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
