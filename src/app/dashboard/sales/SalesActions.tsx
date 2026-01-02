'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';

interface SalesActionsProps {
  purchaseId: string;
}

export default function SalesActions({ purchaseId }: SalesActionsProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');

  const handleApprove = async () => {
    setIsApproving(true);
    setError('');

    try {
      const response = await fetch('/api/purchase/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '승인에 실패했습니다.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!showRejectReason) {
      setShowRejectReason(true);
      return;
    }

    setIsRejecting(true);
    setError('');

    try {
      const response = await fetch('/api/purchase/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseId,
          reason: rejectReason.trim() || '입금 확인 불가',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '거절에 실패했습니다.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setIsRejecting(false);
    }
  };

  const handleCancelReject = () => {
    setShowRejectReason(false);
    setRejectReason('');
  };

  if (showRejectReason) {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            거절 사유 (선택)
          </label>
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="입금 확인 불가"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelReject}
            disabled={isRejecting}
            className="flex-1 h-9"
          >
            취소
          </Button>
          <Button
            size="sm"
            onClick={handleReject}
            disabled={isRejecting}
            className="flex-1 h-9 bg-red-500 hover:bg-red-600 text-white"
          >
            {isRejecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <X className="w-4 h-4 mr-1" />
                거절 확정
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs text-red-600 text-center mb-2">{error}</p>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReject}
          disabled={isApproving || isRejecting}
          className="flex-1 h-10 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
        >
          <X className="w-4 h-4 mr-1.5" />
          거절
        </Button>
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={isApproving || isRejecting}
          className="flex-1 h-10 bg-green-500 hover:bg-green-600 text-white"
        >
          {isApproving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4 mr-1.5" />
              입금확인
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-center text-gray-500">
        입금을 확인한 후 &apos;입금확인&apos; 버튼을 눌러주세요
      </p>
    </div>
  );
}
