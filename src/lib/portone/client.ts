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
 * 결제 ID 생성
 */
export function generatePaymentId(): string {
  return `payment-${crypto.randomUUID()}`;
}

/**
 * 포트원 결제 요청
 */
export async function requestPayment(
  request: PaymentRequest
): Promise<PaymentResponse> {
  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
  const channelKey = process.env.NEXT_PUBLIC_KG_INICIS_CHANNEL_KEY;

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
      message: '결제 설정이 올바르지 않습니다.',
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
    // KG이니시스 V2 카드 결제
    // https://developers.portone.io/opi/ko/integration/pg/v2/inicis-v2
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paymentOptions: any = {
      storeId,
      channelKey,
      paymentId: request.paymentId,
      orderName: request.orderName,
      totalAmount: request.totalAmount,
      currency: 'KRW',
      payMethod: 'CARD',
    };

    // customer 정보 추가 (KG이니시스 필수)
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
