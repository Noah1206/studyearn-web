'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ShoppingBag,
  Play,
  FileText,
  Mic,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Calendar,
  CreditCard,
  Package,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatNumber, formatDate, formatCurrency, cn } from '@/lib/utils';
import { Button, Card, CardContent, Badge, Avatar, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';

interface Purchase {
  id: string;
  content_id: string;
  content: {
    id: string;
    title: string;
    description?: string;
    thumbnail_url?: string;
    content_type: string;
    creator_id: string;
    creator?: {
      display_name: string;
      profile_image_url?: string;
    };
  };
  amount: number;
  purchased_at: string;
  payment_method?: string;
  status: 'completed' | 'pending' | 'refunded';
}

const contentTypeIcons: Record<string, React.ElementType> = {
  video: Play,
  audio: Mic,
  image: ImageIcon,
  document: FileText,
};

const contentTypeLabels: Record<string, string> = {
  video: '동영상',
  audio: '오디오',
  image: '이미지',
  document: '문서',
};

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

function PurchaseCard({ purchase }: { purchase: Purchase }) {
  const TypeIcon = contentTypeIcons[purchase.content.content_type] || FileText;

  return (
    <motion.div variants={itemVariants}>
      <Card className="overflow-hidden hover:shadow-md transition-all duration-300 border-gray-100">
        <CardContent className="p-0">
          <div className="flex gap-4 p-4">
            {/* Thumbnail */}
            <Link href={`/content/${purchase.content.id}`} className="flex-shrink-0">
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
                    <TypeIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
              </div>
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <Badge variant="outline" className="mb-2 text-xs">
                    {contentTypeLabels[purchase.content.content_type]}
                  </Badge>
                  <Link href={`/content/${purchase.content.id}`}>
                    <h3 className="font-semibold text-gray-900 hover:text-orange-500 line-clamp-2 transition-colors">
                      {purchase.content.title}
                    </h3>
                  </Link>
                </div>
                <Badge
                  className={cn(
                    'flex-shrink-0',
                    purchase.status === 'completed' && 'bg-green-100 text-green-700 border-0',
                    purchase.status === 'pending' && 'bg-yellow-100 text-yellow-700 border-0',
                    purchase.status === 'refunded' && 'bg-gray-100 text-gray-600 border-0'
                  )}
                >
                  {purchase.status === 'completed' && '구매완료'}
                  {purchase.status === 'pending' && '처리중'}
                  {purchase.status === 'refunded' && '환불됨'}
                </Badge>
              </div>

              {/* Creator */}
              {purchase.content.creator && (
                <Link
                  href={`/creator/${purchase.content.creator_id}`}
                  className="flex items-center gap-2 mb-2"
                >
                  <Avatar
                    src={purchase.content.creator.profile_image_url}
                    alt={purchase.content.creator.display_name}
                    size="xs"
                  />
                  <span className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {purchase.content.creator.display_name}
                  </span>
                </Link>
              )}

              {/* Meta */}
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(purchase.purchased_at)}
                  </span>
                </div>
                <span className="font-bold text-gray-900">
                  {formatCurrency(purchase.amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex border-t border-gray-100">
            <Link
              href={`/content/${purchase.content.id}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Play className="w-4 h-4" />
              콘텐츠 보기
            </Link>
            <div className="w-px bg-gray-100" />
            <button className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              다운로드
            </button>
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
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // 실제 구현: content_purchases 테이블에서 조회
      const { data, error } = await supabase
        .from('content_purchases')
        .select(`
          id,
          content_id,
          amount,
          purchased_at:created_at,
          payment_method,
          status,
          content:contents(
            id,
            title,
            description,
            thumbnail_url,
            content_type,
            creator_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load purchases:', error);
        // Mock data for demo
        setPurchases([]);
        return;
      }

      // Get creator info for each content
      const purchasesWithCreators = await Promise.all(
        (data || []).map(async (purchase: any) => {
          if (purchase.content?.creator_id) {
            const { data: creator } = await supabase
              .from('creator_settings')
              .select('display_name, profile_image_url')
              .eq('user_id', purchase.content.creator_id)
              .single();

            return {
              ...purchase,
              content: {
                ...purchase.content,
                creator,
              },
            };
          }
          return purchase;
        })
      );

      setPurchases(purchasesWithCreators);
    } catch (error) {
      console.error('Failed to load purchases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPurchases = purchases.filter((purchase) => {
    if (activeTab === 'all') return true;
    return purchase.status === activeTab;
  });

  const stats = {
    total: purchases.length,
    completed: purchases.filter(p => p.status === 'completed').length,
    totalSpent: purchases
      .filter(p => p.status === 'completed')
      .reduce((acc, p) => acc + p.amount, 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-100 sticky top-0 z-20"
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">구매 내역</h1>
                <p className="text-sm text-gray-500">{stats.total}개의 구매</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <Card className="border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">구매 완료</p>
                  <p className="text-xl font-bold text-gray-900">{stats.completed}개</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">총 구매 금액</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="w-full bg-gray-100 p-1 rounded-xl">
              <TabsTrigger value="all" className="flex-1 rounded-lg">
                전체
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex-1 rounded-lg">
                구매완료
              </TabsTrigger>
              <TabsTrigger value="refunded" className="flex-1 rounded-lg">
                환불
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Purchases List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-gray-100">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-xl animate-pulse" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-gray-100 rounded animate-pulse w-3/4" />
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-1/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
    </div>
  );
}
