/**
 * Deeplink Library
 * 송금 딥링크 유틸리티 라이브러리
 *
 * @example
 * ```typescript
 * import {
 *   generateTossDeeplink,
 *   generateDeeplinkOptions,
 *   openDeeplink,
 *   BANKS,
 *   getDeeplinkSupportedBanks
 * } from '@/lib/deeplink';
 *
 * // 토스 딥링크 직접 생성
 * const tossUrl = generateTossDeeplink('shinhan', '110123456789', 10000, '스터디언 콘텐츠 구매');
 *
 * // 토스/카카오뱅크 딥링크 옵션 생성
 * const options = generateDeeplinkOptions({
 *   bankCode: 'shinhan',
 *   accountNumber: '110123456789',
 *   accountHolder: '홍길동',
 *   amount: 10000,
 *   memo: '콘텐츠 구매',
 * });
 *
 * // 딥링크 열기
 * openDeeplink(options.toss);
 * ```
 */

// Types
export type {
  BankCode,
  BankInfo,
  TransferInfo,
  DeeplinkResult,
  PaymentAccount,
  CreatePaymentAccountRequest,
  UpdatePaymentAccountRequest,
  PaymentAccountResponse,
} from './types';

// Bank configurations
export {
  BANKS,
  TOSS_BANK_CODES,
  RECOMMENDED_BANKS,
  getDeeplinkSupportedBanks,
  getBankInfo,
  getAllBanks,
} from './banks';

// Deeplink generators
export {
  generateTossDeeplink,
  generateTossIdDeeplink,
  generateTossMeLink,
  generateKakaobankDeeplink,
  generateBankDeeplink,
  generateDeeplinkOptions,
  openDeeplink,
  getDeviceType,
  isMobileDevice,
  formatAmount,
  maskAccountNumber,
} from './generator';
