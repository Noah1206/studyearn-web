/**
 * Deeplink Types
 * 송금 딥링크 관련 타입 정의
 */

// 지원하는 은행/앱 코드
export type BankCode =
  | 'toss'           // 토스
  | 'kakaobank'      // 카카오뱅크
  | 'kbstar'         // KB국민은행
  | 'shinhan'        // 신한은행
  | 'woori'          // 우리은행
  | 'hana'           // 하나은행
  | 'nh'             // NH농협은행
  | 'ibk'            // IBK기업은행
  | 'sc'             // SC제일은행
  | 'citi'           // 씨티은행
  | 'kbank'          // 케이뱅크
  | 'post'           // 우체국
  | 'saemaul'        // 새마을금고
  | 'shinhyup'       // 신협
  | 'suhyup'         // 수협
  | 'busan'          // 부산은행
  | 'dgb'            // 대구은행
  | 'kwangju'        // 광주은행
  | 'jeju'           // 제주은행
  | 'jeonbuk'        // 전북은행
  | 'kyongnam';      // 경남은행

// 은행 정보
export interface BankInfo {
  code: BankCode;
  name: string;
  shortName: string;
  color: string;
  iconUrl?: string;
  deeplinkScheme: string | null;  // 딥링크 스킴 (null이면 미지원)
  supportsDeeplink: boolean;
  deeplinkTemplate?: string;  // 딥링크 URL 템플릿
  appStoreUrl?: string;
  playStoreUrl?: string;
}

// 송금 정보
export interface TransferInfo {
  bankCode: BankCode;
  accountNumber: string;
  accountHolder: string;
  amount: number;
  memo?: string;
}

// 딥링크 생성 결과
export interface DeeplinkResult {
  success: boolean;
  deeplinkUrl: string | null;
  fallbackUrl: string | null;  // 앱 미설치 시 대체 URL
  bankInfo: BankInfo;
  error?: string;
}

// 계좌 정보 (DB에서 가져온)
export interface PaymentAccount {
  id: string;
  userId: string;
  bankCode: BankCode;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  supportsDeeplink: boolean;
  isPrimary: boolean;
  nickname?: string;
  createdAt: string;
  updatedAt: string;
}

// API 요청 타입
export interface CreatePaymentAccountRequest {
  bankCode: BankCode;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  nickname?: string;
  isPrimary?: boolean;
}

export interface UpdatePaymentAccountRequest {
  nickname?: string;
  isPrimary?: boolean;
}

// API 응답 타입
export interface PaymentAccountResponse {
  success: boolean;
  data?: PaymentAccount;
  accounts?: PaymentAccount[];
  error?: string;
}
