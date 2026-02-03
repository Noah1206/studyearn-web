/**
 * PortOne V2 Client-side Payment Utilities
 * 클라이언트에서 결제 요청 시 사용
 */

import * as PortOne from '@portone/browser-sdk/v2';

export type PayMethod = 'CARD' | 'VIRTUAL_ACCOUNT' | 'TRANSFER' | 'MOBILE' | 'EASY_PAY';

export type EasyPayProvider = 'KAKAOPAY' | 'TOSSPAY' | 'NAVERPAY' | 'SAMSUNGPAY' | 'PAYCO';

export interface PaymentCustomer {
  fullName: string;
  phoneNumber: string;
  email?: string;
}

export interface PaymentRequest {
  paymentId: string;
  orderName: string;
  totalAmount: number;
  payMethod: PayMethod;
  customer: PaymentCustomer;
  easyPayProvider?: EasyPayProvider;
  virtualAccountExpiry?: number; // hours
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  code?: string;
  message?: string;
}

/**
 * 결제 ID 생성 (KG이니시스 최대 40자 제한)
 */
export function generatePaymentId(): string {
  // UUID에서 하이픈 제거: 32자
  // 접두사 "pay_": 4자
  // 총 36자 (40자 제한 이내)
  return `pay_${crypto.randomUUID().replace(/-/g, '')}`;
}

/**
 * 포트원 결제 요청
 */
export async function requestPayment(
  request: PaymentRequest
): Promise<PaymentResponse> {
  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;

  // 결제 방식에 따라 다른 채널키 사용
  let channelKey: string | undefined;
  let payMethodStr: string = 'CARD';

  if (request.payMethod === 'EASY_PAY' && request.easyPayProvider === 'KAKAOPAY') {
    channelKey = process.env.NEXT_PUBLIC_KAKAOPAY_CHANNEL_KEY;
    payMethodStr = 'EASY_PAY';
    console.log('[PortOne] Using Kakao Pay channel');
  } else {
    channelKey = process.env.NEXT_PUBLIC_KG_INICIS_CHANNEL_KEY;
    console.log('[PortOne] Using KG Inicis channel');
  }

  console.log('[PortOne Config] storeId:', storeId ? `SET (${storeId.substring(0, 10)}...)` : 'MISSING');
  console.log('[PortOne Config] channelKey:', channelKey ? `SET (${channelKey.substring(0, 15)}...)` : 'MISSING');
  console.log('[PortOne SDK] PortOne object:', typeof PortOne, Object.keys(PortOne || {}));

  if (!storeId || !channelKey) {
    console.error('[PortOne Config] Missing environment variables:', {
      storeId: !!storeId,
      channelKey: !!channelKey,
    });
    return {
      success: false,
      code: 'CONFIG_ERROR',
      message: channelKey ? '결제 설정이 올바르지 않습니다.' : '해당 결제 수단이 아직 준비 중입니다.',
    };
  }

  // Check if PortOne SDK is loaded
  if (!PortOne || typeof PortOne.requestPayment !== 'function') {
    console.error('[PortOne SDK] SDK not properly loaded:', {
      PortOne: typeof PortOne,
      requestPayment: typeof PortOne?.requestPayment,
    });
    return {
      success: false,
      code: 'SDK_ERROR',
      message: '결제 모듈이 로드되지 않았습니다. 페이지를 새로고침 해주세요.',
    };
  }

  try {
    // PortOne V2 결제 요청
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paymentOptions: any = {
      storeId,
      channelKey,
      paymentId: request.paymentId,
      orderName: request.orderName,
      totalAmount: request.totalAmount,
      currency: 'KRW',
      payMethod: payMethodStr,
    };

    // 간편결제 시 easyPay 설정 추가
    if (request.payMethod === 'EASY_PAY' && request.easyPayProvider) {
      paymentOptions.easyPay = {
        easyPayProvider: request.easyPayProvider,
      };
    }

    // customer 정보 추가
    if (request.customer?.fullName) {
      paymentOptions.customer = {
        fullName: request.customer.fullName,
      };
      if (request.customer.phoneNumber) {
        paymentOptions.customer.phoneNumber = request.customer.phoneNumber;
      }
      if (request.customer.email) {
        paymentOptions.customer.email = request.customer.email;
      }
    }

    console.log('[PortOne] Payment options:', JSON.stringify(paymentOptions, null, 2));
    console.log('[PortOne] Calling PortOne.requestPayment()...');

    const response = await PortOne.requestPayment(paymentOptions);

    console.log('[PortOne] Response received:', JSON.stringify(response, null, 2));

    if (response?.code) {
      // 결제 실패 또는 취소
      console.log('[PortOne] Payment failed/cancelled:', response.code, response.message);
      return {
        success: false,
        code: response.code,
        message: response.message || '결제가 취소되었습니다.',
      };
    }

    // 결제 성공
    console.log('[PortOne] Payment success:', response?.paymentId);
    return {
      success: true,
      paymentId: response?.paymentId,
    };
  } catch (error) {
    console.error('[PortOne] Payment request failed with exception:', error);
    console.error('[PortOne] Error details:', {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    return {
      success: false,
      code: 'PAYMENT_ERROR',
      message: error instanceof Error ? error.message : '결제 요청 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 카드 결제 요청 (간편 함수)
 */
export async function requestCardPayment(
  paymentId: string,
  orderName: string,
  amount: number,
  customer: PaymentCustomer
): Promise<PaymentResponse> {
  return requestPayment({
    paymentId,
    orderName,
    totalAmount: amount,
    payMethod: 'CARD',
    customer,
  });
}

/**
 * 가상계좌 결제 요청 (간편 함수)
 */
export async function requestVirtualAccountPayment(
  paymentId: string,
  orderName: string,
  amount: number,
  customer: PaymentCustomer,
  expiryHours: number = 24
): Promise<PaymentResponse> {
  return requestPayment({
    paymentId,
    orderName,
    totalAmount: amount,
    payMethod: 'VIRTUAL_ACCOUNT',
    customer,
    virtualAccountExpiry: expiryHours,
  });
}

/**
 * 카카오페이 결제 요청 (간편 함수)
 */
export async function requestKakaoPayPayment(
  paymentId: string,
  orderName: string,
  amount: number,
  customer: PaymentCustomer
): Promise<PaymentResponse> {
  return requestPayment({
    paymentId,
    orderName,
    totalAmount: amount,
    payMethod: 'EASY_PAY',
    customer,
    easyPayProvider: 'KAKAOPAY',
  });
}
