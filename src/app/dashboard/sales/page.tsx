import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Calendar,
  AlertCircle,
  Wallet,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { Button, LoadingSection } from '@/components/ui';
import SalesActions from './SalesActions';

export const dynamic = 'force-dynamic';

interface PurchaseWithDetails {
  id: string;
  content_id: string;
  buyer_id: string;
  amount: number;
  status: string;
  created_at: string;
  payment_confirmed_at: string | null;
  buyer_note: string | null;
  content: {
    id: string;
    title: string;
    thumbnail_url: string | null;
  } | null;
  buyer: {
    display_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
}

async function getSalesPurchases(userId: string) {
  const supabase = await createClient();

  // Get all purchases where user is the seller
  const { data: purchases, error } = await supabase
    .from('content_purchases')
    .select(`
      id,
      content_id,
      buyer_id,
      amount,
      status,
      created_at,
      payment_confirmed_at,
      buyer_note
    `)
    .eq('seller_id', userId)
    .order('created_at', { ascending: false });

  if (error || !purchases) {
    return { pending: [], completed: [], rejected: [] };
  }

  // Get unique content IDs and buyer IDs
  const contentIds = Array.from(new Set(purchases.map((p: { content_id: string }) => p.content_id)));
  const buyerIds = Array.from(new Set(purchases.map((p: { buyer_id: string }) => p.buyer_id)));

  // Batch fetch contents
  const { data: contents } = await supabase
    .from('contents')
    .select('id, title, thumbnail_url')
    .in('id', contentIds);

  // Batch fetch buyer profiles
  const { data: buyerProfiles } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, email')
    .in('id', buyerIds);

  // Create lookup maps
  type ContentInfo = { id: string; title: string; thumbnail_url: string | null };
  type BuyerInfo = { id: string; display_name: string | null; avatar_url: string | null; email: string | null };

  const contentMap = new Map<string, ContentInfo>(
    contents?.map((c: ContentInfo) => [c.id, c]) || []
  );
  const buyerMap = new Map<string, BuyerInfo>(
    buyerProfiles?.map((b: BuyerInfo) => [b.id, b]) || []
  );

  // Build purchases with details
  const purchasesWithDetails: PurchaseWithDetails[] = purchases.map((purchase: {
    id: string;
    content_id: string;
    buyer_id: string;
    amount: number;
    status: string;
    created_at: string;
    payment_confirmed_at: string | null;
    buyer_note: string | null;
  }) => ({
    ...purchase,
    content: contentMap.get(purchase.content_id) || null,
    buyer: buyerMap.get(purchase.buyer_id) || null,
  }));

  // Separate by status
  const pending = purchasesWithDetails.filter(p =>
    p.status === 'pending_confirm' || p.status === 'pending_payment'
  );
  const completed = purchasesWithDetails.filter(p => p.status === 'completed');
  const rejected = purchasesWithDetails.filter(p => p.status === 'rejected');

  return { pending, completed, rejected };
}

// Purchase Card Component
function PurchaseCard({ purchase, showActions }: { purchase: PurchaseWithDetails; showActions?: boolean }) {
  const isPending = purchase.status === 'pending_confirm' || purchase.status === 'pending_payment';
  const isCompleted = purchase.status === 'completed';
  const isRejected = purchase.status === 'rejected';

  const getStatusBadge = () => {
    if (isPending) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <Clock className="w-3 h-3" />
          확인 대기
        </span>
      );
    }
    if (isCompleted) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" />
          승인완료
        </span>
      );
    }
    if (isRejected) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <XCircle className="w-3 h-3" />
          거절됨
        </span>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-2xl border ${isPending ? 'border-amber-200 shadow-amber-100/50' : 'border-gray-100'} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}>
      <div className="p-4">
        <div className="flex gap-4">
          {/* Content Thumbnail */}
          <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
            {purchase.content?.thumbnail_url ? (
              <Image
                src={purchase.content.thumbnail_url}
                alt={purchase.content.title || ''}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-300" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {purchase.content?.title || '삭제된 콘텐츠'}
              </h3>
              {getStatusBadge()}
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {purchase.buyer?.display_name || purchase.buyer?.email?.split('@')[0] || '익명'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatRelativeTime(purchase.payment_confirmed_at || purchase.created_at)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-orange-600">
                {formatCurrency(purchase.amount)}
              </span>

              {purchase.buyer_note && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  입금자명: {purchase.buyer_note}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions for pending purchases */}
        {showActions && isPending && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <SalesActions purchaseId={purchase.id} />
          </div>
        )}
      </div>
    </div>
  );
}

// Empty State
function EmptyState({ type }: { type: 'pending' | 'completed' | 'rejected' }) {
  const messages = {
    pending: {
      icon: Clock,
      title: '대기 중인 결제가 없어요',
      description: '구매자가 결제완료 버튼을 누르면 여기에 표시됩니다.',
    },
    completed: {
      icon: CheckCircle,
      title: '완료된 판매가 없어요',
      description: '승인한 판매 내역이 여기에 표시됩니다.',
    },
    rejected: {
      icon: XCircle,
      title: '거절된 판매가 없어요',
      description: '거절한 판매 내역이 여기에 표시됩니다.',
    },
  };

  const message = messages[type];
  const Icon = message.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-gray-300" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{message.title}</h3>
      <p className="text-sm text-gray-500">{message.description}</p>
    </div>
  );
}

// Filter Tab
function FilterTab({
  label,
  count,
  active,
  href,
  color,
}: {
  label: string;
  count: number;
  active?: boolean;
  href: string;
  color?: 'amber' | 'green' | 'red';
}) {
  const colorClasses = {
    amber: active ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
    green: active ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100',
    red: active ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100',
  };

  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
        color ? colorClasses[color] : (active ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200')
      }`}
    >
      {label} <span className="opacity-70">{count}</span>
    </Link>
  );
}

async function SalesContent({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/dashboard/sales');
  }

  // Check if user is a creator
  const { data: creatorCheck } = await supabase
    .from('creator_settings')
    .select('id, payment_method')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!creatorCheck) {
    redirect('/dashboard');
  }

  const { pending, completed, rejected } = await getSalesPurchases(user.id);
  const filter = (searchParams?.filter as string) || 'pending';

  const getPurchasesToShow = () => {
    switch (filter) {
      case 'completed':
        return completed;
      case 'rejected':
        return rejected;
      default:
        return pending;
    }
  };

  const purchasesToShow = getPurchasesToShow();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900">판매 관리</h1>
            </div>
          </div>
          {pending.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {pending.length}건 대기 중
            </span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Payment Method Warning */}
        {!creatorCheck.payment_method && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 mb-1">
                결제수단을 등록해주세요
              </p>
              <p className="text-xs text-amber-600 mb-2">
                결제수단을 등록해야 구매자가 콘텐츠를 구매할 수 있어요.
              </p>
              <Link href="/dashboard/settings?tab=payment">
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white h-8 px-3 text-xs">
                  <Wallet className="w-3.5 h-3.5 mr-1.5" />
                  결제수단 등록하기
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          <FilterTab
            label="대기 중"
            count={pending.length}
            active={filter === 'pending'}
            href="/dashboard/sales"
            color="amber"
          />
          <FilterTab
            label="승인완료"
            count={completed.length}
            active={filter === 'completed'}
            href="/dashboard/sales?filter=completed"
            color="green"
          />
          <FilterTab
            label="거절됨"
            count={rejected.length}
            active={filter === 'rejected'}
            href="/dashboard/sales?filter=rejected"
            color="red"
          />
        </div>

        {/* Pending Alert */}
        {filter === 'pending' && pending.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2 text-sm text-amber-700">
            <Clock className="w-4 h-4" />
            <span>입금을 확인하고 승인해주세요. 승인 후 구매자가 콘텐츠를 열람할 수 있어요.</span>
          </div>
        )}

        {/* Purchase List */}
        {purchasesToShow.length > 0 ? (
          <div className="space-y-3">
            {purchasesToShow.map((purchase) => (
              <PurchaseCard
                key={purchase.id}
                purchase={purchase}
                showActions={filter === 'pending'}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl">
            <EmptyState type={filter as 'pending' | 'completed' | 'rejected'} />
          </div>
        )}
      </main>
    </div>
  );
}

export default function SalesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return (
    <Suspense fallback={<LoadingSection fullHeight />}>
      <SalesContent searchParams={searchParams} />
    </Suspense>
  );
}

export const metadata = {
  title: '판매 관리 - 스터플',
  description: '판매 내역을 관리하세요.',
};
