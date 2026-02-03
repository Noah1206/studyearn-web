'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { pageVariants } from '@/components/ui/motion/variants';
import {
  ArrowLeft,
  Key,
  Smartphone,
  Shield,
  Check,
  Copy,
  AlertCircle,
  QrCode
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, Button, Spinner } from '@/components/ui';

type TwoFAStatus = 'disabled' | 'setup' | 'enabled';

export default function TwoFactorAuthPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [isLoading, setIsLoading] = useState(true);
  const [twoFAStatus, setTwoFAStatus] = useState<TwoFAStatus>('disabled');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  // Mock secret key for demo (in production, this would come from the server)
  const [secretKey] = useState('JBSWY3DPEHPK3PXP');
  const [backupCodes] = useState(['ABC123', 'DEF456', 'GHI789', 'JKL012', 'MNO345']);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if 2FA is already enabled (mock check)
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('two_factor_enabled')
        .eq('user_id', user.id)
        .single();

      if (preferences?.two_factor_enabled) {
        setTwoFAStatus('enabled');
      }

      setIsLoading(false);
    };
    checkAuth();
  }, [supabase, router]);

  const handleStartSetup = () => {
    setTwoFAStatus('setup');
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('6자리 인증 코드를 입력해주세요.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // Mock verification - in production, verify with server
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo, accept any 6-digit code
      if (verificationCode === '123456' || verificationCode.length === 6) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('user_preferences')
            .upsert({
              user_id: user.id,
              two_factor_enabled: true,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
        }

        setTwoFAStatus('enabled');
      } else {
        setError('잘못된 인증 코드입니다.');
      }
    } catch {
      setError('인증에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    setIsDisabling(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            two_factor_enabled: false,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
      }

      setTwoFAStatus('disabled');
      setShowDisableConfirm(false);
    } catch {
      setError('2단계 인증 해제에 실패했습니다.');
    } finally {
      setIsDisabling(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
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
                <Key className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">2단계 인증</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Status: Disabled */}
        {twoFAStatus === 'disabled' && (
          <Card variant="elevated">
            <CardContent className="p-6 lg:p-8">
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  2단계 인증이 비활성화되어 있습니다
                </h2>
                <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
                  2단계 인증을 활성화하면 로그인 시 추가 보안 단계가 적용되어
                  계정을 더 안전하게 보호할 수 있습니다.
                </p>
                <Button onClick={handleStartSetup} className="px-8">
                  2단계 인증 설정하기
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status: Setup */}
        {twoFAStatus === 'setup' && (
          <div className="space-y-6">
            {/* Step 1: Install App */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-accent text-white text-sm flex items-center justify-center">1</span>
                  인증 앱 설치
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Google Authenticator, Microsoft Authenticator 또는 다른 TOTP 앱을 설치하세요.
                </p>
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                    <Smartphone className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Google Authenticator</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Scan QR Code */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-accent text-white text-sm flex items-center justify-center">2</span>
                  QR 코드 스캔
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  인증 앱에서 QR 코드를 스캔하거나 수동으로 키를 입력하세요.
                </p>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* QR Code Placeholder */}
                  <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                    <QrCode className="w-20 h-20 text-gray-400" />
                  </div>

                  {/* Manual Key */}
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-2">수동 입력 키</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-4 py-3 bg-gray-100 rounded-lg text-sm font-mono text-gray-800">
                        {secretKey}
                      </code>
                      <button
                        onClick={() => copyToClipboard(secretKey)}
                        className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {copiedCode === secretKey ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <Copy className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Verify */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-accent text-white text-sm flex items-center justify-center">3</span>
                  인증 코드 입력
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  인증 앱에 표시된 6자리 코드를 입력하세요.
                </p>
                <div className="flex gap-3 max-w-xs">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none focus:border-accent transition-colors"
                  />
                  <Button
                    onClick={handleVerifyCode}
                    isLoading={isVerifying}
                    disabled={verificationCode.length !== 6 || isVerifying}
                  >
                    확인
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Status: Enabled */}
        {twoFAStatus === 'enabled' && (
          <div className="space-y-6">
            <Card variant="elevated">
              <CardContent className="p-6 lg:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">
                      2단계 인증이 활성화되어 있습니다
                    </h2>
                    <p className="text-sm text-gray-500">
                      로그인 시 인증 앱의 코드가 필요합니다.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Backup Codes */}
            <Card variant="outlined">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-gray-500">복구 코드</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  인증 앱에 접근할 수 없을 때 사용할 수 있는 일회용 코드입니다.
                  안전한 곳에 보관하세요.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  {backupCodes.map((code, index) => (
                    <button
                      key={index}
                      onClick={() => copyToClipboard(code)}
                      className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <code className="text-sm font-mono text-gray-700">{code}</code>
                      {copiedCode === code ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Disable 2FA */}
            <Card variant="outlined" className="border-red-200">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-red-500">2단계 인증 해제</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  2단계 인증을 해제하면 계정 보안이 약해질 수 있습니다.
                </p>
                {!showDisableConfirm ? (
                  <Button
                    variant="secondary"
                    onClick={() => setShowDisableConfirm(true)}
                    className="text-red-500 border-red-200 hover:bg-red-50"
                  >
                    2단계 인증 해제
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => setShowDisableConfirm(false)}
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleDisable2FA}
                      isLoading={isDisabling}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      해제 확인
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </motion.div>
  );
}
