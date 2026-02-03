'use client';

import { useState, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { PLATFORM_ACCOUNT } from '@/lib/constants/platform';
import {
  generateTossDeeplink,
  generateKakaobankDeeplink,
  formatAmount,
  isMobileDevice,
} from '@/lib/deeplink';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  amount: number;
  contentTitle: string;
  onPaymentConfirm: () => Promise<void>;
}

export function PurchaseModal({
  isOpen,
  onClose,
  orderNumber,
  amount,
  contentTitle,
  onPaymentConfirm,
}: PurchaseModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [copied, setCopied] = useState<'account' | 'amount' | 'order' | null>(null);

  // Generate deeplinks
  const tossDeeplink = generateTossDeeplink(
    PLATFORM_ACCOUNT.bankCode,
    PLATFORM_ACCOUNT.accountNumber,
    amount,
    orderNumber // 주문번호를 메모로 사용
  );

  const kakaoDeeplink = generateKakaobankDeeplink(
    PLATFORM_ACCOUNT.bankCode,
    PLATFORM_ACCOUNT.accountNumber,
    amount
  );

  const handleCopy = useCallback(async (text: string, type: 'account' | 'amount' | 'order') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const handleDeeplinkClick = useCallback((url: string) => {
    if (isMobileDevice()) {
      window.location.href = url;
    } else {
      // PC에서는 새 탭으로 열기 시도 (제한적)
      window.open(url, '_blank');
    }
  }, []);

  const handlePaymentConfirm = async () => {
    setIsConfirming(true);
    try {
      await onPaymentConfirm();
      onClose();
    } catch (error) {
      console.error('Payment confirm failed:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="결제하기"
      size="md"
      closeOnBackdropClick={!isConfirming}
    >
      <div className="space-y-6">
        {/* 콘텐츠 정보 */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-1">구매 콘텐츠</p>
          <p className="font-medium text-gray-900 line-clamp-2">{contentTitle}</p>
        </div>

        {/* 주문번호 & 금액 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <p className="text-xs text-orange-600 mb-1">주문번호</p>
            <p className="font-bold text-lg text-orange-700">{orderNumber}</p>
            <button
              onClick={() => handleCopy(orderNumber, 'order')}
              className="mt-2 text-xs text-orange-600 hover:text-orange-700 flex items-center justify-center gap-1 mx-auto"
            >
              {copied === 'order' ? (
                <>
                  <Check className="w-3 h-3" /> 복사됨
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> 복사
                </>
              )}
            </button>
          </div>

          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <p className="text-xs text-orange-600 mb-1">결제 금액</p>
            <p className="font-bold text-lg text-orange-700">{formatAmount(amount)}</p>
            <button
              onClick={() => handleCopy(String(amount), 'amount')}
              className="mt-2 text-xs text-orange-600 hover:text-orange-700 flex items-center justify-center gap-1 mx-auto"
            >
              {copied === 'amount' ? (
                <>
                  <Check className="w-3 h-3" /> 복사됨
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> 복사
                </>
              )}
            </button>
          </div>
        </div>

        {/* 빠른 송금 버튼 */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">빠른 송금</p>

          <button
            onClick={() => handleDeeplinkClick(tossDeeplink)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#0064FF] hover:bg-[#0052D4] text-white rounded-xl font-medium transition-colors"
          >
            토스로 송금하기
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleDeeplinkClick(kakaoDeeplink)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#FFEB00] hover:bg-[#FFE100] text-[#3C1E1E] rounded-xl font-medium transition-colors"
          >
            카카오뱅크로 송금하기
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {/* 계좌 정보 (수동 송금용) */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">직접 송금하기</p>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">은행</span>
              <span className="font-medium">{PLATFORM_ACCOUNT.bankName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">계좌번호</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{PLATFORM_ACCOUNT.accountNumber}</span>
                <button
                  onClick={() => handleCopy(PLATFORM_ACCOUNT.accountNumber, 'account')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {copied === 'account' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">예금주</span>
              <span className="font-medium">{PLATFORM_ACCOUNT.accountHolder}</span>
            </div>
          </div>

          <p className="mt-3 text-xs text-orange-600 bg-orange-50 rounded-lg p-3">
            송금 시 입금자명에 <strong>주문번호({orderNumber})</strong>를 꼭 포함해주세요!
          </p>
        </div>

        {/* 결제 완료 버튼 */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handlePaymentConfirm}
          isLoading={isConfirming}
        >
          송금 완료했어요
        </Button>

        <p className="text-xs text-gray-400 text-center">
          관리자 확인 후 콘텐츠가 열람 가능해집니다.
          <br />
          평균 확인 시간: 1~24시간
        </p>
      </div>
    </Modal>
  );
}
