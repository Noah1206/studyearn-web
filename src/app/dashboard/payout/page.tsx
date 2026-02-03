'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Wallet,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  ChevronRight,
  Info,
  Calendar,
  TrendingUp,
  CreditCard,
  Loader2,
  X,
  Check,
  ArrowDownToLine,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate, formatRelativeTime, cn } from '@/lib/utils';
import { Button, Card, CardContent, Badge, Input, Spinner } from '@/components/ui';

// Balance data from API
interface BalanceData {
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  total_paid_out: number;
}

// Payout request from API
interface PayoutRequest {
  id: string;
  creator_id: string;
  amount: number;
  bank_name: string;
  bank_account: string;
  account_holder: string;
  status: string;
  admin_note: string | null;
  requested_at: string;
  processed_at: string | null;
  created_at: string;
}

// Korean Bank Codes (금융결제원 코드)
const BANK_CODES: Record<string, string> = {
  // 인터넷전문은행
  '090': '카카오뱅크',
  '092': '토스뱅크',
  '089': '케이뱅크',
  // 시중은행
  '004': 'KB국민은행',
  '088': '신한은행',
  '020': '우리은행',
  '081': '하나은행',
  '011': 'NH농협은행',
  '012': '농협중앙회',
  '003': 'IBK기업은행',
  '023': 'SC제일은행',
  '027': '씨티은행',
  // 지방은행
  '039': '경남은행',
  '034': '광주은행',
  '031': '대구은행',
  '032': '부산은행',
  '037': '전북은행',
  '035': '제주은행',
  // 특수은행
  '002': '산업은행',
  '007': '수협은행',
  '071': '우체국',
  '045': '새마을금고',
  '048': '신협',
  '064': '산림조합',
  '050': '저축은행',
};

// Popular banks for quick selection (most used by young creators)
const POPULAR_BANKS = [
  { code: '090', name: '카카오뱅크', color: 'bg-yellow-400 text-black' },
  { code: '092', name: '토스뱅크', color: 'bg-cyan-500 text-white' },
  { code: '088', name: '신한', color: 'bg-indigo-600 text-white' },
  { code: '004', name: '국민', color: 'bg-amber-500 text-white' },
];

// Payout Status
const payoutStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: '대기중', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  processing: { label: '처리중', color: 'bg-orange-100 text-orange-700', icon: Loader2 },
  completed: { label: '완료', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: '거절됨', color: 'bg-red-100 text-red-700', icon: XCircle },
};

// Bank Account Interface
interface BankAccount {
  id: string;
  bank_code: string;
  account_number: string;
  account_holder: string;
  is_default: boolean;
}

// Minimum Payout Amount
const MINIMUM_PAYOUT = 10000;
const PAYOUT_FEE_RATE = 0.20; // platform fee

export default function PayoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [accountForm, setAccountForm] = useState({
    bank_code: '',
    account_number: '',
    account_holder: '',
    is_default: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userNickname, setUserNickname] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        router.push('/login?redirectTo=/dashboard/payout');
        return;
      }

      // Load user profile for auto-fill
      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.nickname) {
        setUserNickname(profile.nickname);
      }

      // Load balance and payout data from API
      const response = await fetch('/api/creator/balance');

      if (response.ok) {
        const data = await response.json();
        setBalanceData(data.balance);
        setPayouts(data.recentPayouts || []);
      }

      // Load bank accounts from user_preferences table
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('bank_accounts')
        .eq('user_id', user.id)
        .maybeSingle();

      if (preferences?.bank_accounts) {
        const accounts = preferences.bank_accounts as BankAccount[];
        setBankAccounts(accounts);
        const defaultAccount = accounts.find((a: BankAccount) => a.is_default);
        if (defaultAccount) {
          setSelectedAccountId(defaultAccount.id);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAccount = async () => {
    const newErrors: Record<string, string> = {};

    if (!accountForm.bank_code) {
      newErrors.bank_code = '은행을 선택해주세요';
    }
    if (!accountForm.account_number) {
      newErrors.account_number = '계좌번호를 입력해주세요';
    } else if (!/^\d{10,14}$/.test(accountForm.account_number.replace(/-/g, ''))) {
      newErrors.account_number = '올바른 계좌번호를 입력해주세요';
    }
    if (!accountForm.account_holder) {
      newErrors.account_holder = '예금주명을 입력해주세요';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let updatedAccounts: BankAccount[];

    if (editingAccount) {
      // Update existing account
      updatedAccounts = bankAccounts.map((acc) =>
        acc.id === editingAccount.id
          ? { ...acc, ...accountForm }
          : accountForm.is_default
          ? { ...acc, is_default: false }
          : acc
      );
    } else {
      // Add new account
      const newAccount: BankAccount = {
        id: crypto.randomUUID(),
        ...accountForm,
        is_default: bankAccounts.length === 0 ? true : accountForm.is_default,
      };
      updatedAccounts = accountForm.is_default
        ? [...bankAccounts.map((acc) => ({ ...acc, is_default: false })), newAccount]
        : [...bankAccounts, newAccount];
    }

    // Save to database
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          bank_accounts: updatedAccounts,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setBankAccounts(updatedAccounts);

      // Set selected account if it's default
      const defaultAcc = updatedAccounts.find((a) => a.is_default);
      if (defaultAcc) {
        setSelectedAccountId(defaultAcc.id);
      }

      setShowAccountModal(false);
      setEditingAccount(null);
      setAccountForm({ bank_code: '', account_number: '', account_holder: '', is_default: false });
      setErrors({});
    } catch (error) {
      console.error('Failed to save bank account:', error);
      setErrors({ bank_code: '계좌 저장에 실패했습니다.' });
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    const updatedAccounts = bankAccounts.filter((acc) => acc.id !== accountId);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          bank_accounts: updatedAccounts,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setBankAccounts(updatedAccounts);

      if (selectedAccountId === accountId) {
        const defaultAcc = updatedAccounts.find((a) => a.is_default);
        setSelectedAccountId(defaultAcc?.id || '');
      }
    } catch (error) {
      console.error('Failed to delete bank account:', error);
    }
  };

  const handleRequestPayout = async () => {
    if (!balanceData || !selectedAccountId) return;

    const amount = parseInt(payoutAmount);
    const selectedAccount = bankAccounts.find((a) => a.id === selectedAccountId);

    if (!selectedAccount) {
      setErrors({ payout: '정산받을 계좌를 선택해주세요' });
      return;
    }

    if (isNaN(amount) || amount < MINIMUM_PAYOUT) {
      setErrors({ payout: `최소 정산 금액은 ${formatCurrency(MINIMUM_PAYOUT)}입니다` });
      return;
    }

    if (amount > balanceData.available_balance) {
      setErrors({ payout: '정산 가능 금액을 초과했습니다' });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/creator/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          bankName: BANK_CODES[selectedAccount.bank_code] || selectedAccount.bank_code,
          bankAccount: selectedAccount.account_number,
          accountHolder: selectedAccount.account_holder,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '정산 요청에 실패했습니다.');
      }

      setShowPayoutModal(false);
      setPayoutAmount('');
      setErrors({});
      loadData(); // Reload to get updated data
    } catch (error) {
      console.error('Payout request failed:', error);
      setErrors({ payout: error instanceof Error ? error.message : '정산 요청에 실패했습니다. 다시 시도해주세요.' });
    } finally {
      setIsSaving(false);
    }
  };

  const openEditAccount = (account: BankAccount) => {
    setEditingAccount(account);
    setAccountForm({
      bank_code: account.bank_code,
      account_number: account.account_number,
      account_holder: account.account_holder,
      is_default: account.is_default,
    });
    setShowAccountModal(true);
  };

  const availableBalance = balanceData?.available_balance || 0;
  const pendingBalance = balanceData?.pending_balance || 0;
  const totalEarned = balanceData?.total_earned || 0;
  const totalPaidOut = balanceData?.total_paid_out || 0;
  // No fee on payout request - fee is already deducted when purchase is confirmed (80% to creator)
  const estimatedFee = 0;
  const estimatedNet = payoutAmount ? parseInt(payoutAmount) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">정산 관리</h1>
                <p className="text-gray-500 text-sm mt-1">수익 정산 및 출금 관리</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance & Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Available Balance */}
          <Card className="md:col-span-2 border-0 shadow-sm bg-gradient-to-br from-gray-800 to-gray-900">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-100 text-sm mb-1">정산 가능 금액</p>
                  <p className="text-4xl font-bold">{formatCurrency(availableBalance)}</p>
                  <p className="text-gray-200 text-sm mt-2">
                    최소 정산 금액: {formatCurrency(MINIMUM_PAYOUT)}
                  </p>
                </div>
                <div className="p-4 bg-white/20 rounded-2xl">
                  <Wallet className="w-10 h-10" />
                </div>
              </div>
              <Button
                onClick={() => setShowPayoutModal(true)}
                disabled={availableBalance < MINIMUM_PAYOUT}
                className="mt-4 w-full bg-white text-gray-900 hover:bg-gray-50 disabled:opacity-50"
              >
                <ArrowDownToLine className="w-4 h-4 mr-2" />
                정산 요청하기
              </Button>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">정산 대기 중</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(pendingBalance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">총 수익</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(totalEarned)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Fee Notice */}
        <Card className="border-0 shadow-sm mb-8 bg-orange-50 border border-orange-100">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-1">정산 안내</p>
                <p className="text-orange-700">
                  판매 수익의 80%가 정산 가능 금액에 적립됩니다 (플랫폼 수수료 20%).
                  정산 요청 시 추가 수수료는 없으며, 관리자 확인 후 등록된 계좌로 입금됩니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Accounts */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">정산 계좌</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingAccount(null);
                setAccountForm({ bank_code: '', account_number: '', account_holder: '', is_default: false });
                setShowAccountModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              계좌 추가
            </Button>
          </div>

          {bankAccounts.length > 0 ? (
            <div className="space-y-3">
              {bankAccounts.map((account) => (
                <Card
                  key={account.id}
                  className={cn(
                    'border-0 shadow-sm cursor-pointer transition-all',
                    selectedAccountId === account.id && 'ring-2 ring-gray-900'
                  )}
                  onClick={() => setSelectedAccountId(account.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Building2 className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              {BANK_CODES[account.bank_code] || account.bank_code}
                            </span>
                            {account.is_default && (
                              <Badge variant="secondary" size="sm" className="bg-gray-100 text-gray-700">
                                기본
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {account.account_number.replace(/(\d{4})(\d+)(\d{4})/, '$1-****-$3')}
                            <span className="mx-1">·</span>
                            {account.account_holder}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditAccount(account);
                          }}
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('이 계좌를 삭제하시겠습니까?')) {
                              handleDeleteAccount(account.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">등록된 계좌가 없습니다</h3>
                <p className="text-gray-500 text-sm mb-4">정산받을 계좌를 먼저 등록해주세요.</p>
                <Button
                  onClick={() => {
                    setEditingAccount(null);
                    setAccountForm({ bank_code: '', account_number: '', account_holder: '', is_default: false });
                    setShowAccountModal(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  계좌 등록하기
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payout History */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">정산 내역</h2>
          {payouts.length > 0 ? (
            <div className="space-y-3">
              {payouts.map((payout) => {
                const status = payoutStatusConfig[payout.status] || payoutStatusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <Card key={payout.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn('p-2 rounded-lg', status.color.replace('text-', 'bg-').replace('700', '100'))}>
                            <StatusIcon className={cn('w-5 h-5', status.color.split(' ')[1])} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {formatCurrency(payout.amount)}
                              </span>
                              <Badge variant="secondary" size="sm" className={status.color}>
                                {status.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              {payout.bank_name || '계좌정보 없음'}
                              <span className="mx-1">·</span>
                              {payout.account_holder}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {formatRelativeTime(payout.requested_at)}
                          </p>
                          {payout.processed_at && (
                            <p className="text-xs text-gray-400">
                              처리: {formatDate(payout.processed_at)}
                            </p>
                          )}
                          {payout.admin_note && (
                            <p className="text-xs text-red-500 mt-1">
                              사유: {payout.admin_note}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">정산 내역이 없습니다</h3>
                <p className="text-gray-500 text-sm">정산을 요청하면 여기에 표시됩니다.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">정산 요청</h2>
                <button
                  onClick={() => {
                    setShowPayoutModal(false);
                    setPayoutAmount('');
                    setErrors({});
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Available Balance */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">정산 가능 금액</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(availableBalance)}</p>
              </div>

              {/* Account Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">정산 계좌</label>
                {bankAccounts.length > 0 ? (
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {BANK_CODES[account.bank_code]} {account.account_number.replace(/(\d{4})(\d+)(\d{4})/, '$1-****-$3')} ({account.account_holder})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-red-500">정산받을 계좌를 먼저 등록해주세요.</p>
                )}
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">정산 금액</label>
                <div className="relative">
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="금액을 입력하세요"
                    min={MINIMUM_PAYOUT}
                    max={availableBalance}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  <button
                    onClick={() => setPayoutAmount(availableBalance.toString())}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-900 hover:text-gray-700 font-medium"
                  >
                    전액
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  최소 {formatCurrency(MINIMUM_PAYOUT)} 이상 입력해주세요
                </p>
              </div>

              {/* Amount Confirmation */}
              {payoutAmount && parseInt(payoutAmount) >= MINIMUM_PAYOUT && (
                <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">정산 요청 금액</span>
                    <span className="text-gray-900">{formatCurrency(parseInt(payoutAmount))}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-900">입금 예정 금액</span>
                      <span className="text-gray-900">{formatCurrency(estimatedNet)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * 플랫폼 수수료(20%)는 판매 시점에 이미 차감되었습니다.
                  </p>
                </div>
              )}

              {errors.payout && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.payout}
                </p>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowPayoutModal(false);
                  setPayoutAmount('');
                  setErrors({});
                }}
              >
                취소
              </Button>
              <Button
                className="flex-1"
                onClick={handleRequestPayout}
                disabled={
                  isSaving ||
                  !selectedAccountId ||
                  !payoutAmount ||
                  parseInt(payoutAmount) < MINIMUM_PAYOUT ||
                  parseInt(payoutAmount) > availableBalance
                }
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    처리중...
                  </>
                ) : (
                  '정산 요청'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingAccount ? '계좌 수정' : '계좌 등록'}
                </h2>
                <button
                  onClick={() => {
                    setShowAccountModal(false);
                    setEditingAccount(null);
                    setAccountForm({ bank_code: '', account_number: '', account_holder: '', is_default: false });
                    setErrors({});
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Quick Bank Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">빠른 선택</label>
                <div className="grid grid-cols-4 gap-2">
                  {POPULAR_BANKS.map((bank) => (
                    <button
                      key={bank.code}
                      type="button"
                      onClick={() => setAccountForm({ ...accountForm, bank_code: bank.code })}
                      className={cn(
                        'py-2.5 px-3 rounded-xl text-sm font-medium transition-all',
                        accountForm.bank_code === bank.code
                          ? `${bank.color} ring-2 ring-offset-2 ring-gray-900`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      {bank.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank Selection Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">은행</label>
                <select
                  value={accountForm.bank_code}
                  onChange={(e) => setAccountForm({ ...accountForm, bank_code: e.target.value })}
                  className={cn(
                    'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent',
                    errors.bank_code ? 'border-red-300' : 'border-gray-200'
                  )}
                >
                  <option value="">다른 은행 선택</option>
                  {Object.entries(BANK_CODES).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
                {errors.bank_code && <p className="text-sm text-red-500 mt-1">{errors.bank_code}</p>}
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">계좌번호</label>
                <input
                  type="text"
                  value={accountForm.account_number}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, account_number: e.target.value.replace(/[^0-9]/g, '') })
                  }
                  placeholder="'-' 없이 숫자만 입력"
                  inputMode="numeric"
                  className={cn(
                    'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent',
                    errors.account_number ? 'border-red-300' : 'border-gray-200'
                  )}
                />
                {errors.account_number && <p className="text-sm text-red-500 mt-1">{errors.account_number}</p>}
              </div>

              {/* Account Holder with Auto-fill */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">예금주</label>
                  {userNickname && !accountForm.account_holder && (
                    <button
                      type="button"
                      onClick={() => setAccountForm({ ...accountForm, account_holder: userNickname })}
                      className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      내 닉네임으로 입력
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={accountForm.account_holder}
                  onChange={(e) => setAccountForm({ ...accountForm, account_holder: e.target.value })}
                  placeholder="예금주명 입력"
                  className={cn(
                    'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent',
                    errors.account_holder ? 'border-red-300' : 'border-gray-200'
                  )}
                />
                {errors.account_holder && <p className="text-sm text-red-500 mt-1">{errors.account_holder}</p>}
              </div>

              {/* Default Account Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accountForm.is_default}
                  onChange={(e) => setAccountForm({ ...accountForm, is_default: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-700">기본 정산 계좌로 설정</span>
              </label>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAccountModal(false);
                  setEditingAccount(null);
                  setAccountForm({ bank_code: '', account_number: '', account_holder: '', is_default: false });
                  setErrors({});
                }}
              >
                취소
              </Button>
              <Button className="flex-1" onClick={handleSaveAccount}>
                {editingAccount ? '수정' : '등록'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
