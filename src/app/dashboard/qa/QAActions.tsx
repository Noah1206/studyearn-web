'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Trash2, Loader2, Send, X, Check, XCircle, Banknote } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

interface QAActionsProps {
  questionId: string;
  questionContent: string;
  isPaid?: boolean;
  paymentStatus?: string;
  price?: number;
  buyerNote?: string;
}

export default function QAActions({
  questionId,
  questionContent,
  isPaid = false,
  paymentStatus = 'none',
  price = 0,
  buyerNote = '',
}: QAActionsProps) {
  const router = useRouter();
  const [isAnswering, setIsAnswering] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [answerContent, setAnswerContent] = useState('');
  const [error, setError] = useState('');

  // Payment approval for paid Q&A
  const handleApprovePayment = async () => {
    if (!confirm('입금을 확인했습니다. 결제를 승인하시겠습니까?')) {
      return;
    }

    setIsApproving(true);
    setError('');

    try {
      const response = await fetch(`/api/qa/paid/${questionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Payment rejection for paid Q&A
  const handleRejectPayment = async () => {
    if (!confirm('입금을 확인할 수 없습니다. 결제를 거절하시겠습니까?')) {
      return;
    }

    setIsRejecting(true);
    setError('');

    try {
      const response = await fetch(`/api/qa/paid/${questionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const handleAnswer = async () => {
    if (!answerContent.trim()) {
      setError('답변 내용을 입력해주세요.');
      return;
    }

    setIsAnswering(true);
    setError('');

    try {
      const response = await fetch(`/api/qa/questions/${questionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: answerContent.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '답변 등록에 실패했습니다.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setIsAnswering(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('이 질문을 삭제하시겠습니까?')) {
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/qa/questions/${questionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '삭제에 실패했습니다.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setIsDeleting(false);
    }
  };

  const handleCancelAnswer = () => {
    setShowAnswerForm(false);
    setAnswerContent('');
    setError('');
  };

  if (showAnswerForm) {
    return (
      <div className="space-y-3">
        {/* Original question preview */}
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">질문 내용</p>
          <p className="text-sm text-gray-700 line-clamp-2">{questionContent}</p>
        </div>

        {/* Answer textarea */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            답변 작성
          </label>
          <textarea
            value={answerContent}
            onChange={(e) => setAnswerContent(e.target.value)}
            placeholder="팬에게 보낼 답변을 작성해주세요..."
            rows={4}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelAnswer}
            disabled={isAnswering}
            className="flex-1 h-9"
          >
            <X className="w-4 h-4 mr-1" />
            취소
          </Button>
          <Button
            size="sm"
            onClick={handleAnswer}
            disabled={isAnswering || !answerContent.trim()}
            className="flex-1 h-9 bg-green-500 hover:bg-green-600 text-white"
          >
            {isAnswering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-1" />
                답변 등록
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // For paid Q&A with pending payment - show payment approval UI
  if (isPaid && paymentStatus === 'pending') {
    return (
      <div className="space-y-3">
        {/* Payment Info */}
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">유료 질문</span>
            <span className="ml-auto font-bold text-amber-700">{formatCurrency(price)}</span>
          </div>
          {buyerNote && (
            <div className="text-xs text-amber-600">
              입금자명: <span className="font-medium">{buyerNote}</span>
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-600 text-center">{error}</p>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRejectPayment}
            disabled={isApproving || isRejecting}
            className="flex-1 h-10 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            {isRejecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-1.5" />
                입금 미확인
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={handleApprovePayment}
            disabled={isApproving || isRejecting}
            className="flex-1 h-10 bg-green-500 hover:bg-green-600 text-white"
          >
            {isApproving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4 mr-1.5" />
                입금 확인
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500">
          입금을 확인하면 질문에 답변할 수 있어요
        </p>
      </div>
    );
  }

  // For paid Q&A with confirmed payment - show answer UI
  if (isPaid && paymentStatus === 'confirmed') {
    return (
      <div className="space-y-2">
        {/* Payment confirmed badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-green-600 bg-green-50 rounded-lg py-1.5">
          <Check className="w-3.5 h-3.5" />
          결제 확인 완료 ({formatCurrency(price)})
        </div>

        {error && (
          <p className="text-xs text-red-600 text-center mb-2">{error}</p>
        )}

        <Button
          size="sm"
          onClick={() => setShowAnswerForm(true)}
          disabled={isAnswering}
          className="w-full h-10 bg-green-500 hover:bg-green-600 text-white"
        >
          <MessageCircle className="w-4 h-4 mr-1.5" />
          답변하기
        </Button>

        <p className="text-xs text-center text-gray-500">
          팬에게 답변을 보내세요
        </p>
      </div>
    );
  }

  // Default: free Q&A actions
  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs text-red-600 text-center mb-2">{error}</p>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={isAnswering || isDeleting}
          className="flex-1 h-10 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-1.5" />
              삭제
            </>
          )}
        </Button>
        <Button
          size="sm"
          onClick={() => setShowAnswerForm(true)}
          disabled={isAnswering || isDeleting}
          className="flex-1 h-10 bg-green-500 hover:bg-green-600 text-white"
        >
          <MessageCircle className="w-4 h-4 mr-1.5" />
          답변하기
        </Button>
      </div>

      <p className="text-xs text-center text-gray-500">
        팬에게 답변을 보내세요
      </p>
    </div>
  );
}
