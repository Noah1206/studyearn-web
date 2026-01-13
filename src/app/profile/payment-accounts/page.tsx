'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  X,
  ChevronRight,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { Spinner } from '@/components/ui';
import {
  type PaymentAccount,
  type BankCode,
  BANKS,
  getAllBanks,
  getDeeplinkSupportedBanks,
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

export default function PaymentAccountsPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState({
    bankCode: '' as BankCode | '',
    accountNumber: '',
    accountHolder: '',
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
    if (!newAccount.bankCode || !newAccount.accountNumber || !newAccount.accountHolder) {
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
          accountHolder: newAccount.accountHolder,
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
          accountHolder: '',
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

  const deeplinkBanks = getDeeplinkSupportedBanks();
  const allBanks = getAllBanks();

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
            variants={successVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <CheckCircle2 className="w-5 h-5 text-green-400" />
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
                    className={`px-5 py-4 ${index !== paymentAccounts.length - 1 ? 'border-b border-gray-50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      {/* 계좌 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[15px] font-semibold text-gray-900">
                            {account.bankName}
                          </p>
                          {account.isPrimary && (
                            <span className="px-2 py-0.5 bg-gray-900 text-white rounded text-[10px] font-medium">
                              주계좌
                            </span>
                          )}
                        </div>
                        <p className="text-[14px] text-gray-500 mt-0.5 font-medium tracking-wide">
                          {maskAccountNumber(account.accountNumber)}
                        </p>
                      </div>

                      {/* 빠른송금 지원 */}
                      {account.supportsDeeplink && (
                        <span className="text-[11px] text-gray-400">
                          빠른송금
                        </span>
                      )}
                    </div>

                    {/* 액션 버튼들 */}
                    <div className="flex items-center gap-2 mt-4">
                      {!account.isPrimary && (
                        <button
                          onClick={() => handleSetPrimary(account.id)}
                          className="flex-1 py-2.5 text-[13px] font-semibold text-gray-700 bg-gray-100 rounded-xl active:bg-gray-200 transition-colors"
                        >
                          주계좌로 설정
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className={`${account.isPrimary ? 'flex-1' : ''} py-2.5 px-4 text-[13px] font-semibold text-gray-500 bg-gray-100 rounded-xl active:bg-gray-200 transition-colors`}
                      >
                        삭제
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
                  className="w-10 h-1 bg-gray-300 rounded-full"
                  whileHover={{ scaleX: 1.2, backgroundColor: '#9CA3AF' }}
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
                  <motion.p
                    className="text-[14px] text-gray-500 mt-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    정산받을 계좌를 등록해주세요
                  </motion.p>
                </div>
                <motion.button
                  onClick={() => setShowAddAccountModal(false)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-6 h-6 text-gray-400" />
                </motion.button>
              </motion.div>

              {/* 폼 */}
              <motion.div
                className="px-6 pb-6 space-y-5 max-h-[60vh] overflow-y-auto"
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
                  <label className="block text-[14px] font-semibold text-gray-900 mb-2">
                    은행
                  </label>
                  <motion.select
                    value={newAccount.bankCode}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, bankCode: e.target.value as BankCode }))}
                    className="w-full px-4 py-4 bg-gray-100 border-0 rounded-2xl text-[15px] font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '20px' }}
                    whileFocus={{ scale: 1.01 }}
                  >
                    <option value="">은행을 선택해주세요</option>
                    <optgroup label="빠른송금 지원">
                      {deeplinkBanks.map(bank => (
                        <option key={bank.code} value={bank.code}>{bank.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="일반 은행">
                      {allBanks.filter(b => !b.supportsDeeplink).map(bank => (
                        <option key={bank.code} value={bank.code}>{bank.name}</option>
                      ))}
                    </optgroup>
                  </motion.select>
                </motion.div>

                {/* 계좌번호 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-[14px] font-semibold text-gray-900 mb-2">
                    계좌번호
                  </label>
                  <motion.input
                    type="text"
                    inputMode="numeric"
                    value={newAccount.accountNumber}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, accountNumber: e.target.value.replace(/[^0-9]/g, '') }))}
                    placeholder="계좌번호 입력"
                    className="w-full px-4 py-4 bg-gray-100 border-0 rounded-2xl text-[15px] font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                    whileFocus={{ scale: 1.01 }}
                  />
                </motion.div>

                {/* 예금주명 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <label className="block text-[14px] font-semibold text-gray-900 mb-2">
                    예금주
                  </label>
                  <motion.input
                    type="text"
                    value={newAccount.accountHolder}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, accountHolder: e.target.value }))}
                    placeholder="예금주명 입력"
                    className="w-full px-4 py-4 bg-gray-100 border-0 rounded-2xl text-[15px] font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                    whileFocus={{ scale: 1.01 }}
                  />
                </motion.div>

                {/* 주계좌 설정 토글 */}
                <motion.div
                  onClick={() => setNewAccount(prev => ({ ...prev, isPrimary: !prev.isPrimary }))}
                  className="flex items-center justify-between bg-gray-50 rounded-2xl p-4 cursor-pointer active:bg-gray-100 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors`}
                      animate={{
                        backgroundColor: newAccount.isPrimary ? '#F97316' : '#E5E7EB',
                        rotate: newAccount.isPrimary ? 360 : 0,
                      }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <CheckCircle2 className={`w-5 h-5 ${newAccount.isPrimary ? 'text-white' : 'text-gray-400'}`} />
                    </motion.div>
                    <div>
                      <p className="text-[14px] font-semibold text-gray-900">주계좌로 설정</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">기본으로 사용할 계좌예요</p>
                    </div>
                  </div>
                  <motion.div
                    className="w-12 h-7 rounded-full relative"
                    animate={{
                      backgroundColor: newAccount.isPrimary ? '#F97316' : '#E5E7EB',
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
                      animate={{
                        x: newAccount.isPrimary ? 24 : 4,
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* 등록 버튼 */}
              <motion.div
                className="px-6 pb-8 pt-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  onClick={handleAddAccount}
                  disabled={isAddingAccount || !newAccount.bankCode || !newAccount.accountNumber || !newAccount.accountHolder}
                  className="w-full py-4 bg-orange-500 text-white rounded-2xl text-[16px] font-bold disabled:bg-gray-200 disabled:text-gray-400 transition-colors relative overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
                    '등록하기'
                  )}
                  {/* 버튼 쉬머 효과 */}
                  {!isAddingAccount && newAccount.bankCode && newAccount.accountNumber && newAccount.accountHolder && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      style={{ width: '50%' }}
                    />
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
