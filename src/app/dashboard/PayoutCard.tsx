'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ChevronDown, ShoppingBag, Users, Clock } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SaleItem {
  id: string;
  type: 'content' | 'subscription';
  title: string;
  amount: number;
  createdAt: string;
  buyerName?: string;
}

interface PayoutCardProps {
  availableBalance: number;
  recentSales: SaleItem[];
  pendingAmount: number;
  className?: string;
}

export function PayoutCard({ availableBalance, recentSales, pendingAmount, className }: PayoutCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={cn("border-0 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col", className)}>
      {/* Clickable Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <CardHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-500" />
              </div>
              <CardTitle className="text-base font-semibold text-gray-900">정산 가능 금액</CardTitle>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </motion.div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pt-4 pb-6">
          <p className="text-gray-900 text-3xl font-bold">
            {formatCurrency(availableBalance)}
          </p>
          {recentSales.length > 0 && !isExpanded && (
            <p className="text-gray-400 text-sm mt-2">
              탭하여 판매 내역 보기
            </p>
          )}
        </CardContent>
      </button>

      {/* Expandable Sales List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-3">최근 판매 내역</h4>

              {recentSales.length > 0 ? (
                <div className="space-y-3">
                  {recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        sale.type === 'subscription' ? 'bg-orange-100' : 'bg-gray-100'
                      }`}>
                        {sale.type === 'subscription' ? (
                          <Users className="w-5 h-5 text-orange-500" />
                        ) : (
                          <ShoppingBag className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {sale.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(sale.createdAt)}
                          {sale.buyerName && ` · ${sale.buyerName}`}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">
                        +{formatCurrency(sale.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">아직 판매 내역이 없어요</p>
                </div>
              )}

              {recentSales.length > 0 && (
                <Link href="/dashboard/analytics" className="block mt-4">
                  <Button variant="outline" fullWidth size="sm">
                    전체 내역 보기
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payout Button */}
      <div className="px-6 pb-6">
        {availableBalance >= 10000 ? (
          <Link href="/dashboard/payout" className="block">
            <Button fullWidth>
              정산 신청하기
            </Button>
          </Link>
        ) : (
          <div>
            <Button fullWidth disabled>
              정산 신청하기
            </Button>
            <p className="text-center text-gray-400 text-xs mt-2">
              최소 정산 금액: 10,000원
            </p>
          </div>
        )}
      </div>

      {/* Pending Payout Info */}
      {pendingAmount > 0 && (
        <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-100 rounded-b-2xl">
          <div className="flex items-center gap-2 text-yellow-700">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              {formatCurrency(pendingAmount)} 처리 중
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
