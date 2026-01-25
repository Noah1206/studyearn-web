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

  console.log('[PortOne Config] storeId:', storeId ? 'SET' : 'MISSING');
  console.log('[PortOne Config] channelKey:', channelKey ? 'SET' : 'MISSING');

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

  try {
    // KG이니시스 카드 결제용
    // https://developers.portone.io/opi/ko/integration/pg/v2/inicis-v2
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paymentOptions: any = {
      storeId,
      channelKey,
      paymentId: request.paymentId,
      orderName: request.orderName,
      totalAmount: request.totalAmount,
      currency: 'CURRENCY_KRW',
      payMethod: request.payMethod,
      customer: {
        fullName: request.customer.fullName || '구매자',
        phoneNumber: request.customer.phoneNumber,
        email: request.customer.email,
      },
    };

    console.log('[PortOne] Payment options:', JSON.stringify(paymentOptions, null, 2));

    const response = await PortOne.requestPayment(paymentOptions);

    if (response?.code) {
      // 결제 실패 또는 취소
      return {
        success: false,
        code: response.code,
        message: response.message || '결제가 취소되었습니다.',
      };
    }

    // 결제 성공
    return {
      success: true,
      paymentId: response?.paymentId,
    };
  } catch (error) {
    console.error('Payment request failed:', error);
    return {
      success: false,
      code: 'PAYMENT_ERROR',
      message: '결제 요청 중 오류가 발생했습니다.',
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
