/**
 * Platform Constants
 * 플랫폼 관련 상수 정의
 */

import { BankCode } from '@/lib/deeplink/types';

/**
 * 플랫폼 결제 계좌 정보
 * 모든 P2P 결제가 이 계좌로 입금됩니다.
 */
export const PLATFORM_ACCOUNT = {
  bankCode: 'busan' as BankCode,
  bankName: '부산은행',
  accountNumber: '1122236487202',
  accountHolder: '스터플',
} as const;

/**
 * 플랫폼 수수료율
 */
export const PLATFORM_FEE_RATE = 0.20; // 20%

/**
 * 크리에이터 수익률
 */
export const CREATOR_REVENUE_RATE = 0.80; // 80%
