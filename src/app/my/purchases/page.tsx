'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowLeft,
  ShoppingBag,
  FileText,
  Calendar,
  ChevronRight,
  Info,
  X,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Button, Card, CardContent, Badge, Tabs, TabsList, TabsTrigger, Spinner } from '@/components/ui';

interface Purchase {
  id: string;
  content_id: string;
  amount: number;
  status: 'pending_payment' | 'pending_confirm' | 'completed' | 'rejected';
  payment_method: string;
  created_at: string;
  content: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    price: number;
  };
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

function getStatusBadge(status: Purchase['status']) {
  switch (status) {
    case 'completed':
      return <Badge className="flex-shrink-0 bg-green-100 text-green-700 border-0">구매완료</Badge>;
    case 'pending_confirm':
      return <Badge className="flex-shrink-0 bg-amber-100 text-amber-700 border-0">확인 대기</Badge>;
    case 'pending_payment':
      return <Badge className="flex-shrink-0 bg-orange-100 text-orange-700 border-0">결제 대기</Badge>;
    case 'rejected':
      return <Badge className="flex-shrink-0 bg-red-100 text-red-700 border-0">거절됨</Badge>;
    default:
      return <Badge className="flex-shrink-0 bg-gray-100 text-gray-700 border-0">{status}</Badge>;
  }
}

function getPaymentMethodLabel(method: string) {
  switch (method) {
    case 'toss_id':
      return '토스 송금';
    case 'kakaopay':
      return '카카오페이';
    case 'bank_account':
      return '계좌이체';
    default:
      return 'P2P 결제';
  }
}

function PurchaseCard({ purchase }: { purchase: Purchase }) {
  const isAccessible = purchase.status === 'completed';

  return (
    <motion.div variants={itemVariants}>
      <Card className="overflow-hidden hover:shadow-md transition-all duration-300 border-gray-100">
        <CardContent className="p-0">
          <Link href={isAccessible ? `/content/${purchase.content.id}` : `/purchase/${purchase.content.id}/pending`}>
            <div className="flex gap-4 p-4">
              {/* Thumbnail */}
              <div className="flex-shrink-0">
                <div className="relative w-24 h-24 md:w-32 md:h-24 rounded-xl overflow-hidden bg-gray-100">
                  {purchase.content.thumbnail_url ? (
                    <Image
                      src={purchase.content.thumbnail_url}
                      alt={purchase.content.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 hover:text-orange-500 line-clamp-2 transition-colors">
                      {purchase.content.title}
                    </h3>
                  </div>
                  {getStatusBadge(purchase.status)}
                </div>

                {/* Payment Method Badge */}
                <div className="mb-2">
                  <Badge variant="outline" className="text-xs">
                    {getPaymentMethodLabel(purchase.payment_method)}
                  </Badge>
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(purchase.created_at)}
                    </span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(purchase.amount)}
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex border-t border-gray-100">
            {isAccessible ? (
              <Link
                href={`/content/${purchase.content.id}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-4 h-4" />
                콘텐츠 보기
              </Link>
            ) : (
              <Link
                href={`/purchase/${purchase.content.id}/pending`}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors"
              >
                <FileText className="w-4 h-4" />
                {purchase.status === 'rejected' ? '다시 구매하기' : '결제 상태 확인'}
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <ShoppingBag className="w-10 h-10 text-orange-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        구매 내역이 없습니다
      </h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        다양한 학습 콘텐츠를 둘러보고 구매해보세요
      </p>
      <Link href="/content">
        <Button className="gap-2">
          콘텐츠 둘러보기
          <ChevronRight className="w-4 h-4" />
        </Button>
      </Link>
    </motion.div>
  );
}

export default function PurchasesPage() {
  const searchParams = useSearchParams();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showPaymentNotice, setShowPaymentNotice] = useState(false);

  useEffect(() => {
    // 결제 처리 중 알림 표시
    if (searchParams.get('payment') === 'processing') {
      setShowPaymentNotice(true);
    }
  }, [searchParams]);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      const response = await fetch('/api/me/purchases');
      if (!response.ok) {
        throw new Error('Failed to fetch purchases');
      }
      const data = await response.json();
      setPurchases(data.purchases || []);
    } catch (error) {
      console.error('Failed to load purchases:', error);
      setPurchases([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPurchases = purchases.filter((purchase) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'completed') return purchase.status === 'completed';
    if (activeTab === 'pending') return purchase.status === 'pending_confirm' || purchase.status === 'pending_payment';
    return true;
  });

  const completedPurchases = purchases.filter(p => p.status === 'completed');
  const stats = {
    total: completedPurchases.length,
    totalSpent: completedPurchases.reduce((acc, p) => acc + p.amount, 0),
    pending: purchases.filter(p => p.status === 'pending_confirm' || p.status === 'pending_payment').length,
  };

  return (
    <motion.div
      className="min-h-screen bg-white"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-100 sticky top-0 z-20"
      >
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center">
          <Link href="/profile" className="p-2 -ml-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="flex-1 text-center font-bold text-lg text-gray-900">구매 내역</h1>
          <div className="w-9" />
        </div>
      </motion.header>

      <main className="max-w-4xl mx-auto px-4 py-4">
        {/* 결제 처리 중 알림 */}
        <AnimatePresence>
          {showPaymentNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 bg-orange-50 rounded-xl px-4 py-3 flex items-center gap-3"
            >
              <Info className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <p className="flex-1 text-sm text-orange-700">
                결제 완료! 확인 처리 중입니다.
              </p>
              <button
                onClick={() => setShowPaymentNotice(false)}
                className="p-1 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-orange-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="w-full bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="all" className="flex-1 rounded-lg text-sm">
              전체 {purchases.length > 0 && `(${purchases.length})`}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 rounded-lg text-sm">
              완료 {stats.total > 0 && `(${stats.total})`}
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex-1 rounded-lg text-sm">
              대기 {stats.pending > 0 && `(${stats.pending})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Purchases List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <Spinner size="lg" />
              <span className="text-sm text-gray-500">구매 내역을 불러오는 중...</span>
            </motion.div>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {filteredPurchases.map((purchase) => (
              <PurchaseCard key={purchase.id} purchase={purchase} />
            ))}
          </motion.div>
        )}
      </main>
    </motion.div>
  );
}
