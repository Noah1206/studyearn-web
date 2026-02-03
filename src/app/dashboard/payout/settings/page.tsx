'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowLeft,
  CreditCard,
  Building2,
  Plus,
  Check,
  AlertCircle,
  Trash2,
  Edit2,
  Shield,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, Button, Spinner } from '@/components/ui';
import { useUserStore } from '@/store/userStore';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isDefault: boolean;
  isVerified: boolean;
}

const banks = [
  // 인터넷전문은행
  { code: 'KAKAO', name: '카카오뱅크' },
  { code: 'TOSS', name: '토스뱅크' },
  { code: 'KBANK', name: '케이뱅크' },
  // 시중은행
  { code: 'KB', name: '국민은행' },
  { code: 'SHINHAN', name: '신한은행' },
  { code: 'WOORI', name: '우리은행' },
  { code: 'HANA', name: '하나은행' },
  { code: 'NH', name: '농협은행' },
  { code: 'IBK', name: '기업은행' },
  { code: 'SC', name: 'SC제일은행' },
  { code: 'CITI', name: '한국씨티은행' },
  // 지방은행
  { code: 'KYONGNAM', name: '경남은행' },
  { code: 'KWANGJU', name: '광주은행' },
  { code: 'DAEGU', name: '대구은행' },
  { code: 'BUSAN', name: '부산은행' },
  { code: 'JEONBUK', name: '전북은행' },
  { code: 'JEJU', name: '제주은행' },
  // 특수은행
  { code: 'SUHYUP', name: '수협은행' },
  { code: 'KDB', name: '산업은행' },
  { code: 'EPOST', name: '우체국' },
  { code: 'SAEMAUL', name: '새마을금고' },
  { code: 'SHINHYUP', name: '신협' },
  { code: 'SANLIM', name: '산림조합' },
  { code: 'JOCHUK', name: '저축은행' },
];

export default function PayoutSettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { userType } = useUserStore();

  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user is a creator
      if (userType !== 'creator') {
        router.push('/profile/settings');
        return;
      }

      // Fetch bank accounts (using bank_accounts table)
      const { data: accountData } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (accountData) {
        setAccounts([{
          id: accountData.id,
          bankName: accountData.bank_name,
          accountNumber: accountData.account_number,
          accountHolder: accountData.account_holder,
          isDefault: true,
          isVerified: accountData.is_verified || false,
        }]);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [supabase, router, userType]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedBank) {
      setError('은행을 선택해주세요.');
      return;
    }

    if (!accountNumber.trim()) {
      setError('계좌번호를 입력해주세요.');
      return;
    }

    if (!accountHolder.trim()) {
      setError('예금주를 입력해주세요.');
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const bankName = banks.find(b => b.code === selectedBank)?.name || selectedBank;

      // Use upsert since bank_accounts has unique constraint on user_id
      const { data, error: upsertError } = await supabase
        .from('bank_accounts')
        .upsert({
          user_id: user.id,
          bank_name: bankName,
          account_number: accountNumber.replace(/[^0-9]/g, ''),
          account_holder: accountHolder.trim(),
          is_verified: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (upsertError) {
        throw upsertError;
      }

      if (data) {
        // Replace existing account since only one per user
        setAccounts([{
          id: data.id,
          bankName: data.bank_name,
          accountNumber: data.account_number,
          accountHolder: data.account_holder,
          isDefault: true,
          isVerified: data.is_verified || false,
        }]);
      }

      setSuccess(accounts.length > 0 ? '계좌가 변경되었습니다.' : '계좌가 등록되었습니다.');
      setShowAddForm(false);
      setSelectedBank('');
      setAccountNumber('');
      setAccountHolder('');

      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('계좌 등록에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (accountId: string) => {
    // With bank_accounts having unique user_id constraint, there's only one account per user
    // This function is kept for future multi-account support
    setAccounts(prev => prev.map(acc => ({
      ...acc,
      isDefault: acc.id === accountId,
    })));
    setSuccess('기본 계좌가 변경되었습니다.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', accountId);

      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      setShowDeleteConfirm(null);
      setSuccess('계좌가 삭제되었습니다.');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('계좌 삭제에 실패했습니다.');
    }
  };

  const formatAccountNumber = (num: string) => {
    // Mask middle digits
    if (num.length > 6) {
      return num.slice(0, 3) + '*'.repeat(num.length - 6) + num.slice(-3);
    }
    return num;
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-neutral-light">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-[calc(100vh-4rem)] bg-neutral-light"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-brand-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }} />
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
          <div className="flex items-center gap-4">
            <Link
              href="/profile/settings"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">설정</span>
            </Link>
            <div className="w-px h-6 bg-white/20" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">정산 계좌 관리</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Info Card */}
        <Card variant="outlined" className="mb-6 border-orange-200 bg-orange-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-700">
              <p className="font-medium mb-1">정산 안내</p>
              <ul className="text-xs space-y-1 text-orange-600">
                <li>- 매월 1일 전월 수익이 정산됩니다.</li>
                <li>- 최소 정산 금액은 10,000원입니다.</li>
                <li>- 본인 명의 계좌만 등록 가능합니다.</li>
                <li>- 수수료는 판매 금액의 20%입니다.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Account List */}
        <Card variant="elevated" className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>등록된 계좌</CardTitle>
            {!showAddForm && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                계좌 추가
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {accounts.length === 0 && !showAddForm ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">등록된 정산 계좌가 없습니다.</p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  계좌 등록하기
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {accounts.map(account => (
                  <div
                    key={account.id}
                    className={`p-4 rounded-xl border-2 ${
                      account.isDefault ? 'border-accent bg-accent/5' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          account.isDefault ? 'bg-accent/10' : 'bg-gray-100'
                        }`}>
                          <Building2 className={`w-5 h-5 ${
                            account.isDefault ? 'text-accent' : 'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{account.bankName}</span>
                            {account.isDefault && (
                              <span className="px-2 py-0.5 bg-accent text-white text-xs font-medium rounded-full">
                                기본
                              </span>
                            )}
                            {account.isVerified ? (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-600 text-xs font-medium rounded-full">
                                <Shield className="w-3 h-3" />
                                인증됨
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-600 text-xs font-medium rounded-full">
                                인증 대기
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {formatAccountNumber(account.accountNumber)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            예금주: {account.accountHolder}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!account.isDefault && (
                          <button
                            onClick={() => handleSetDefault(account.id)}
                            className="px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 rounded-lg transition-colors"
                          >
                            기본으로 설정
                          </button>
                        )}
                        <button
                          onClick={() => setShowDeleteConfirm(account.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Delete Confirmation */}
                    {showDeleteConfirm === account.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-3">이 계좌를 삭제하시겠습니까?</p>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(null)}
                          >
                            취소
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDeleteAccount(account.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            삭제
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add Account Form */}
            {showAddForm && (
              <form onSubmit={handleAddAccount} className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">새 계좌 등록</h3>

                <div className="space-y-4">
                  {/* Bank Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      은행 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-accent transition-colors"
                    >
                      <option value="">은행을 선택하세요</option>
                      {banks.map(bank => (
                        <option key={bank.code} value={bank.code}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      계좌번호 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9-]/g, ''))}
                      placeholder="- 없이 숫자만 입력"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>

                  {/* Account Holder */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      예금주 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      placeholder="예금주명 입력"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-accent transition-colors"
                    />
                    <p className="mt-2 text-xs text-gray-400">
                      본인 명의 계좌만 등록 가능합니다.
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => {
                        setShowAddForm(false);
                        setSelectedBank('');
                        setAccountNumber('');
                        setAccountHolder('');
                        setError('');
                      }}
                    >
                      취소
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      isLoading={isSaving}
                      disabled={isSaving}
                    >
                      등록하기
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Payout History Link */}
        <Card variant="outlined">
          <CardContent className="p-4">
            <Link
              href="/dashboard/payout"
              className="flex items-center justify-between hover:bg-gray-50 -m-4 p-4 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">정산 내역 보기</p>
                  <p className="text-xs text-gray-400">수익 및 정산 현황 확인</p>
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 text-gray-300 rotate-180" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
