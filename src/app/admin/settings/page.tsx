'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Save,
  RefreshCw,
  ArrowLeft,
  CreditCard,
  Settings,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface PaymentAccount {
  bank_name: string;
  account_number: string;
  account_holder: string;
}

interface PayoutSettings {
  fee_rate: number;
  minimum_amount: number;
  payout_day: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Payment Account
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount>({
    bank_name: '',
    account_number: '',
    account_holder: '',
  });

  // Payout Settings
  const [payoutSettings, setPayoutSettings] = useState<PayoutSettings>({
    fee_rate: 0.20,
    minimum_amount: 10000,
    payout_day: '매주 금요일',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/platform/settings');

      if (response.status === 403) {
        router.push('/');
        return;
      }

      if (!response.ok) {
        throw new Error('설정을 불러오는데 실패했습니다.');
      }

      const data = await response.json();

      if (data.payment_account) {
        setPaymentAccount(data.payment_account);
      }

      if (data.payout_settings) {
        setPayoutSettings(data.payout_settings);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePaymentAccount = async () => {
    if (!paymentAccount.bank_name || !paymentAccount.account_number || !paymentAccount.account_holder) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/platform/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'payment_account',
          value: paymentAccount,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '저장에 실패했습니다.');
      }

      setSuccess('결제 계좌 정보가 저장되었습니다.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving payment account:', err);
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayoutSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/platform/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'payout_settings',
          value: payoutSettings,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '저장에 실패했습니다.');
      }

      setSuccess('정산 설정이 저장되었습니다.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving payout settings:', err);
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/purchases"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                플랫폼 설정
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                결제 및 정산 관련 설정을 관리합니다
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Alerts */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Payment Account Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">결제 계좌 정보</h2>
                    <p className="text-sm text-gray-500">구매자가 송금할 플랫폼 계좌를 설정합니다</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    은행명
                  </label>
                  <input
                    type="text"
                    value={paymentAccount.bank_name}
                    onChange={(e) => setPaymentAccount({ ...paymentAccount, bank_name: e.target.value })}
                    placeholder="예: 카카오뱅크"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    계좌번호
                  </label>
                  <input
                    type="text"
                    value={paymentAccount.account_number}
                    onChange={(e) => setPaymentAccount({ ...paymentAccount, account_number: e.target.value })}
                    placeholder="예: 3333-12-3456789"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    예금주
                  </label>
                  <input
                    type="text"
                    value={paymentAccount.account_holder}
                    onChange={(e) => setPaymentAccount({ ...paymentAccount, account_holder: e.target.value })}
                    placeholder="예: 홍길동"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleSavePaymentAccount}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 h-12 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      계좌 정보 저장
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* Payout Settings Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">정산 설정</h2>
                    <p className="text-sm text-gray-500">크리에이터 정산 관련 설정을 관리합니다</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    플랫폼 수수료율 (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={payoutSettings.fee_rate * 100}
                      onChange={(e) => setPayoutSettings({ ...payoutSettings, fee_rate: Number(e.target.value) / 100 })}
                      className="w-32 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <span className="text-gray-500">%</span>
                    <span className="text-sm text-gray-400 ml-2">
                      (크리에이터 수익: {Math.round((1 - payoutSettings.fee_rate) * 100)}%)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    최소 정산 금액 (원)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      value={payoutSettings.minimum_amount}
                      onChange={(e) => setPayoutSettings({ ...payoutSettings, minimum_amount: Number(e.target.value) })}
                      className="w-40 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <span className="text-gray-500">원</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    정산일 안내 문구
                  </label>
                  <input
                    type="text"
                    value={payoutSettings.payout_day}
                    onChange={(e) => setPayoutSettings({ ...payoutSettings, payout_day: e.target.value })}
                    placeholder="예: 매주 금요일"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleSavePayoutSettings}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 h-12 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      정산 설정 저장
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* Quick Links */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">관리 메뉴</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/admin/purchases"
                  className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-700">구매 확인</span>
                </Link>
                <Link
                  href="/admin/payouts"
                  className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <Building2 className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-700">정산 관리</span>
                </Link>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
