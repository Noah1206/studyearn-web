'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  X,
  ChevronRight,
  Wallet,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { Spinner } from '@/components/ui';
import {
  type PaymentAccount,
  type BankCode,
  BANKS,
  getAllBanks,
  maskAccountNumber,
} from '@/lib/deeplink';

// 애니메이션 variants
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' as const }
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const successVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 10,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// 은행 로고 컴포넌트
function BankLogo({ bankCode, size = 'md' }: { bankCode: BankCode; size?: 'sm' | 'md' | 'lg' }) {
  const [imgError, setImgError] = useState(false);
  const bank = BANKS[bankCode];

  const sizeConfig = {
    sm: { className: 'w-8 h-8 text-[10px]', imgSize: 32 },
    md: { className: 'w-10 h-10 text-xs', imgSize: 40 },
    lg: { className: 'w-12 h-12 text-sm', imgSize: 48 },
  };

  const config = sizeConfig[size];

  // 이미지 URL이 있고 에러가 없으면 이미지 표시
  if (bank?.iconUrl && !imgError) {
    return (
      <div
        className={`${config.className} rounded-lg flex items-center justify-center overflow-hidden bg-white border border-gray-100 shadow-sm`}
      >
        <Image
          src={bank.iconUrl}
          alt={bank.name}
          width={config.imgSize - 8}
          height={config.imgSize - 8}
          className="object-contain"
          onError={() => setImgError(true)}
          unoptimized
        />
      </div>
    );
  }

  // 폴백: 텍스트 로고
  return (
    <div
      className={`${config.className} rounded-lg flex items-center justify-center text-white font-bold shadow-sm`}
      style={{ backgroundColor: bank?.color || '#6B7280' }}
    >
      {bank?.shortName || '은행'}
    </div>
  );
}

export default function PaymentAccountsPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showBankSelectModal, setShowBankSelectModal] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState({
    bankCode: '' as BankCode | '',
    accountNumber: '',
    isPrimary: false,
  });

  // 계좌 목록 로드
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const response = await fetch('/api/me/payment-accounts');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.accounts) {
            setPaymentAccounts(data.accounts);
          }
        }
      } catch (err) {
        console.error('Failed to fetch payment accounts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAccounts();
  }, []);

  const handleAddAccount = async () => {
    if (!newAccount.bankCode || !newAccount.accountNumber) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }

    setIsAddingAccount(true);
    try {
      const bankInfo = BANKS[newAccount.bankCode as BankCode];
      const response = await fetch('/api/me/payment-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankCode: newAccount.bankCode,
          bankName: bankInfo?.name || newAccount.bankCode,
          accountNumber: newAccount.accountNumber,
          isPrimary: newAccount.isPrimary,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPaymentAccounts(prev => [...prev, data.data]);
        setShowAddAccountModal(false);
        setNewAccount({
          bankCode: '' as BankCode | '',
          accountNumber: '',
          isPrimary: false,
        });
        // 성공 애니메이션
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } else {
        alert(data.error || '계좌 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to add account:', error);
      alert('계좌 등록에 실패했습니다.');
    } finally {
      setIsAddingAccount(false);
    }
  };

  const handleSetPrimary = async (accountId: string) => {
    try {
      const response = await fetch(`/api/me/payment-accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrimary: true }),
      });

      if (response.ok) {
        setPaymentAccounts(prev =>
          prev.map(acc => ({
            ...acc,
            isPrimary: acc.id === accountId,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to set primary account:', error);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('이 계좌를 삭제하시겠습니까?')) return;

    setDeletingId(accountId);
    try {
      const response = await fetch(`/api/me/payment-accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 삭제 애니메이션 후 목록에서 제거
        setTimeout(() => {
          setPaymentAccounts(prev => prev.filter(acc => acc.id !== accountId));
          setDeletingId(null);
        }, 300);
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      setDeletingId(null);
    }
  };

  const handleBankSelect = (bankCode: BankCode) => {
    setNewAccount(prev => ({ ...prev, bankCode }));
    setShowBankSelectModal(false);
  };

  const allBanks = getAllBanks();
  const selectedBank = newAccount.bankCode ? BANKS[newAccount.bankCode as BankCode] : null;

  return (
    <motion.div
      className="min-h-screen bg-[#F4F4F4]"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      {/* 성공 토스트 */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <CheckCircle2 className="w-5 h-5 text-orange-400" />
            </motion.div>
            <span className="font-medium">계좌가 등록되었어요!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 헤더 */}
      <motion.div
        className="sticky top-0 z-40 bg-white"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center">
          <motion.button
            onClick={() => router.back()}
            className="p-2 -ml-2 active:bg-gray-100 rounded-full transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </motion.button>
          <motion.h1
            className="ml-1 text-[17px] font-semibold text-gray-900"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            내 계좌
          </motion.h1>
        </div>
      </motion.div>

      {/* 콘텐츠 */}
      <motion.div
        className="max-w-lg mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 계좌 추가 버튼 */}
        <div className="px-5 pt-4 pb-2">
          <motion.button
            onClick={() => setShowAddAccountModal(true)}
            className="w-full bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm active:bg-gray-50 transition-colors"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center"
              whileHover={{ rotate: 90 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
            </motion.div>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-semibold text-gray-900">계좌 추가하기</p>
              <p className="text-[13px] text-gray-500 mt-0.5">정산받을 계좌를 등록하세요</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </motion.button>
        </div>

        {/* 계좌 목록 */}
        <div className="px-5 py-3">
          {isLoading ? (
            <motion.div
              className="flex flex-col items-center justify-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Spinner size="md" />
              </motion.div>
              <motion.p
                className="text-[14px] text-gray-400 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                계좌 정보를 불러오는 중...
              </motion.p>
            </motion.div>
          ) : paymentAccounts.length === 0 ? (
            /* 빈 상태 */
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-[16px] font-semibold text-gray-900 mb-1">
                등록된 계좌가 없어요
              </p>
              <p className="text-[14px] text-gray-500">
                계좌를 등록하면 정산금을 받을 수 있어요
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-[13px] font-medium text-gray-500">
                    등록된 계좌 {paymentAccounts.length}개
                  </p>
                </div>

                {paymentAccounts.map((account, index) => (
                  <div
                    key={account.id}
                    className={`px-5 py-6 ${index !== paymentAccounts.length - 1 ? 'border-b border-gray-50' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      {/* 라디오 버튼 */}
                      <button
                        onClick={() => handleSetPrimary(account.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          account.isPrimary
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {account.isPrimary && (
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        )}
                      </button>

                      {/* 은행 로고 */}
                      <BankLogo bankCode={account.bankCode} size="md" />

                      {/* 계좌 정보 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-gray-900">
                          {account.bankName}
                        </p>
                        <p className="text-[14px] text-gray-500 mt-0.5 font-medium tracking-wide">
                          {maskAccountNumber(account.accountNumber)}
                        </p>
                      </div>

                      {/* 삭제 버튼 */}
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* 계좌 추가 모달 */}
      <AnimatePresence>
        {showAddAccountModal && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowAddAccountModal(false)}
            />

            {/* 바텀시트 */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[28px] max-h-[90vh] overflow-hidden"
            >
              {/* 핸들 바 */}
              <motion.div
                className="flex justify-center pt-3 pb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  className="w-10 h-1 bg-gray-200 rounded-full"
                />
              </motion.div>

              {/* 헤더 */}
              <motion.div
                className="px-6 pb-4 flex items-center justify-between"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div>
                  <motion.h3
                    className="text-[20px] font-bold text-gray-900"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    계좌 등록
                  </motion.h3>
                </div>
                <motion.button
                  onClick={() => setShowAddAccountModal(false)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-6 h-6 text-gray-500" />
                </motion.button>
              </motion.div>

              {/* 폼 */}
              <motion.div
                className="px-6 pb-6 space-y-4 max-h-[60vh] overflow-y-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {/* 은행 선택 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <button
                    onClick={() => setShowBankSelectModal(true)}
                    className="w-full rounded-xl p-4 flex items-center justify-between transition-colors hover:bg-gray-50"
                  >
                    {selectedBank ? (
                      <div className="flex items-center gap-3">
                        <BankLogo bankCode={newAccount.bankCode as BankCode} size="sm" />
                        <span className="text-[15px] font-medium text-gray-900">
                          {selectedBank.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[15px] text-gray-400">은행 선택</span>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </motion.div>

                {/* 계좌번호 - 인풋 내 라벨 스타일 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative rounded-xl border border-gray-200 focus-within:border-orange-500 transition-colors"
                >
                  <label className="absolute left-4 top-2 text-[11px] font-medium text-gray-400">
                    계좌번호
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newAccount.accountNumber}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, accountNumber: e.target.value.replace(/[^0-9]/g, '') }))}
                    placeholder="'-' 없이 숫자만 입력"
                    className="w-full px-4 pt-7 pb-3 bg-transparent text-[15px] font-medium placeholder:text-gray-300 focus:outline-none"
                  />
                </motion.div>


                {/* 안내 문구 */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-[12px] text-gray-400 px-1"
                >
                  가상계좌 및 적금 펀드 계좌는 등록 불가
                </motion.p>
              </motion.div>

              {/* 등록 버튼 */}
              <motion.div
                className="px-6 pb-8 pt-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {(() => {
                  const isActive = !isAddingAccount && newAccount.bankCode && newAccount.accountNumber;
                  return (
                    <motion.button
                      onClick={handleAddAccount}
                      disabled={isAddingAccount || !newAccount.bankCode || !newAccount.accountNumber}
                      className={`w-full py-4 rounded-xl text-[16px] font-bold transition-all relative overflow-hidden ${
                        isActive
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                      whileHover={isActive ? { scale: 1.02 } : {}}
                      whileTap={isActive ? { scale: 0.98 } : {}}
                    >
                      {isAddingAccount ? (
                        <motion.div
                          className="flex items-center justify-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <motion.div
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          />
                          <span>등록 중...</span>
                        </motion.div>
                      ) : (
                        '확인'
                      )}
                    </motion.button>
                  );
                })()}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 은행 선택 모달 */}
      <AnimatePresence>
        {showBankSelectModal && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
              onClick={() => setShowBankSelectModal(false)}
            />

            {/* 은행 선택 바텀시트 */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-[28px] max-h-[80vh] overflow-hidden"
            >
              {/* 핸들 바 */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              {/* 헤더 */}
              <div className="px-6 pb-4 flex items-center justify-between">
                <h3 className="text-[18px] font-bold text-gray-900">
                  은행 선택
                </h3>
                <button
                  onClick={() => setShowBankSelectModal(false)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* 은행 그리드 */}
              <div className="px-6 pb-8 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-3 gap-3">
                  {allBanks.map((bank) => (
                    <motion.button
                      key={bank.code}
                      onClick={() => handleBankSelect(bank.code)}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        newAccount.bankCode === bank.code
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-100 bg-white hover:bg-gray-50'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <BankLogo bankCode={bank.code} size="lg" />
                      <span className="text-[12px] font-medium text-gray-700 text-center leading-tight">
                        {bank.name}
                      </span>
                      {newAccount.bankCode === bank.code && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2"
                        >
                          <Check className="w-4 h-4 text-orange-500" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
