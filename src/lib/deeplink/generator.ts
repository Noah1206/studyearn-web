/**
 * Deeplink Generator
 * 송금 딥링크 URL 생성 유틸리티
 */

import { BankCode, TransferInfo, DeeplinkResult, BankInfo } from './types';
import { BANKS, TOSS_BANK_CODES, getBankInfo } from './banks';

/**
 * 토스 송금 딥링크 생성 (계좌번호 방식)
 *
 * 토스 앱에서 송금 화면을 바로 열어주는 딥링크를 생성합니다.
 * 토스 QR 코드와 동일한 형식 사용: bank 파라미터는 은행명(코드 아님)
 *
 * @param recipientBankCode - 수취인 은행 코드
 * @param accountNumber - 수취인 계좌번호
 * @param amount - 송금 금액
 * @param memo - 송금 메모 (선택)
 * @returns 토스 딥링크 URL
 */
export function generateTossDeeplink(
  recipientBankCode: BankCode,
  accountNumber: string,
  amount: number,
  memo?: string
): string {
  // 은행 정보 가져오기 - 은행명 사용 (코드 아님!)
  const bankInfo = getBankInfo(recipientBankCode);
  const bankName = bankInfo?.name || recipientBankCode;
  const cleanAccountNumber = accountNumber.replace(/[^0-9]/g, '');

  // 토스 QR 형식과 동일하게: bank=은행명, origin=qr
  const url = `supertoss://send?amount=${amount}&bank=${encodeURIComponent(bankName)}&accountNo=${cleanAccountNumber}&origin=qr`;

  return url;
}

/**
 * 토스 송금 링크 생성 (toss.me)
 * 토스아이디 기반 웹 링크 - 금액 미리 입력 가능
 */
export function generateTossMeLink(
  tossId: string,
  amount: number
): string {
  return `https://toss.me/${tossId}/${amount}`;
}

/**
 * 토스 아이디 송금 딥링크 생성
 *
 * 토스 아이디로 송금하는 딥링크를 생성합니다.
 * 예금주명 대신 토스아이디가 표시됩니다.
 *
 * @param tossId - 수취인 토스 아이디
 * @param amount - 송금 금액
 * @param memo - 송금 메모 (선택)
 * @returns 토스 딥링크 URL
 */
export function generateTossIdDeeplink(
  tossId: string,
  amount: number,
  memo?: string
): string {
  let url = `supertoss://send?tossId=${encodeURIComponent(tossId)}&amount=${amount}`;

  if (memo) {
    url += `&memo=${encodeURIComponent(memo)}`;
  }

  url += '&origin=studyearn';

  return url;
}

/**
 * 카카오뱅크 송금 딥링크 생성
 *
 * @param recipientBankCode - 수취인 은행 코드
 * @param accountNumber - 수취인 계좌번호
 * @param amount - 송금 금액
 * @returns 카카오뱅크 딥링크 URL
 */
export function generateKakaobankDeeplink(
  recipientBankCode: BankCode,
  accountNumber: string,
  amount: number
): string {
  const bankCode = TOSS_BANK_CODES[recipientBankCode] || recipientBankCode;
  const cleanAccountNumber = accountNumber.replace(/[^0-9]/g, '');

  return `kakaobank://link/transfer?bank=${bankCode}&accountNo=${cleanAccountNumber}&amount=${amount}`;
}

/**
 * 범용 은행 앱 딥링크 생성
 * 각 은행 앱의 딥링크 스킴에 맞게 URL을 생성합니다.
 *
 * @param senderBankCode - 송금자 은행 코드 (어떤 앱으로 열지)
 * @param transferInfo - 송금 정보
 * @returns DeeplinkResult
 */
export function generateBankDeeplink(
  senderBankCode: BankCode,
  transferInfo: TransferInfo
): DeeplinkResult {
  const bankInfo = getBankInfo(senderBankCode);

  if (!bankInfo) {
    return {
      success: false,
      deeplinkUrl: null,
      fallbackUrl: null,
      bankInfo: BANKS[senderBankCode],
      error: '알 수 없는 은행 코드입니다.',
    };
  }

  if (!bankInfo.supportsDeeplink || !bankInfo.deeplinkTemplate) {
    return {
      success: false,
      deeplinkUrl: null,
      fallbackUrl: null,
      bankInfo,
      error: `${bankInfo.name}은(는) 딥링크를 지원하지 않습니다.`,
    };
  }

  const recipientBankCode = TOSS_BANK_CODES[transferInfo.bankCode] || transferInfo.bankCode;
  const cleanAccountNumber = transferInfo.accountNumber.replace(/[^0-9]/g, '');

  // 템플릿에서 플레이스홀더 치환
  let deeplinkUrl = bankInfo.deeplinkTemplate
    .replace('{bankCode}', recipientBankCode)
    .replace('{accountNumber}', cleanAccountNumber)
    .replace('{amount}', String(transferInfo.amount));

  if (transferInfo.memo) {
    deeplinkUrl += `&memo=${encodeURIComponent(transferInfo.memo)}`;
  }

  // Fallback URL 생성 (앱 미설치 시)
  let fallbackUrl: string | null = null;
  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);

  if (isIOS && bankInfo.appStoreUrl) {
    fallbackUrl = bankInfo.appStoreUrl;
  } else if (!isIOS && bankInfo.playStoreUrl) {
    fallbackUrl = bankInfo.playStoreUrl;
  }

  return {
    success: true,
    deeplinkUrl,
    fallbackUrl,
    bankInfo,
  };
}

/**
 * 토스/카카오뱅크 딥링크 옵션 생성
 *
 * 송금 딥링크를 토스와 카카오뱅크 두 가지 옵션으로 생성합니다.
 * 주로 구매 페이지에서 사용됩니다.
 *
 * @param transferInfo - 송금 정보
 * @returns 토스, 카카오뱅크 딥링크 결과
 */
export function generateDeeplinkOptions(
  transferInfo: TransferInfo
): { toss: DeeplinkResult; kakaobank: DeeplinkResult } {
  return {
    toss: generateBankDeeplink('toss', transferInfo),
    kakaobank: generateBankDeeplink('kakaobank', transferInfo),
  };
}

/**
 * 딥링크 열기
 *
 * 생성된 딥링크를 실행하고, 앱이 없으면 스토어로 이동합니다.
 *
 * @param deeplinkResult - 딥링크 생성 결과
 * @param timeout - 앱 실행 대기 시간 (ms)
 */
export function openDeeplink(
  deeplinkResult: DeeplinkResult,
  timeout: number = 2000
): void {
  if (!deeplinkResult.success || !deeplinkResult.deeplinkUrl) {
    console.error('딥링크를 열 수 없습니다:', deeplinkResult.error);
    return;
  }

  const startTime = Date.now();

  // 앱 실행 시도
  window.location.href = deeplinkResult.deeplinkUrl;

  // 앱이 없으면 스토어로 이동
  if (deeplinkResult.fallbackUrl) {
    setTimeout(() => {
      // 페이지가 아직 보이면 (앱이 실행되지 않았으면)
      if (Date.now() - startTime < timeout + 500) {
        window.location.href = deeplinkResult.fallbackUrl!;
      }
    }, timeout);
  }
}

/**
 * 디바이스 타입 감지
 */
export function getDeviceType(): 'ios' | 'android' | 'unknown' {
  if (typeof navigator === 'undefined') return 'unknown';

  const userAgent = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  } else if (/android/.test(userAgent)) {
    return 'android';
  }

  return 'unknown';
}

/**
 * 모바일 기기인지 확인
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * 송금 금액 포맷팅
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * 계좌번호 마스킹
 */
export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;

  const visibleStart = accountNumber.slice(0, 3);
  const visibleEnd = accountNumber.slice(-4);
  const maskedPart = '*'.repeat(Math.max(0, accountNumber.length - 7));

  return `${visibleStart}${maskedPart}${visibleEnd}`;
}
