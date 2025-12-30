'use client';

import { loadTossPayments, TossPaymentsSDK } from '@tosspayments/tosspayments-sdk';

let tossPaymentsInstance: TossPaymentsSDK | null = null;

/**
 * Initialize TossPayments SDK
 */
export async function getTossPayments(): Promise<TossPaymentsSDK> {
  if (tossPaymentsInstance) {
    return tossPaymentsInstance;
  }

  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  if (!clientKey) {
    throw new Error('NEXT_PUBLIC_TOSS_CLIENT_KEY is not defined');
  }

  tossPaymentsInstance = await loadTossPayments(clientKey);
  return tossPaymentsInstance;
}

/**
 * Payment request parameters for TossPayments
 */
export interface PaymentRequestParams {
  orderId: string;
  orderName: string;
  amount: number;
  customerEmail?: string;
  customerName?: string;
  customerMobilePhone?: string;
  successUrl: string;
  failUrl: string;
  metadata?: Record<string, string>;
}

/**
 * Request card payment
 */
export async function requestCardPayment(params: PaymentRequestParams): Promise<void> {
  const tossPayments = await getTossPayments();
  const payment = tossPayments.payment({ customerKey: params.orderId });

  await payment.requestPayment({
    method: 'CARD',
    amount: {
      value: params.amount,
      currency: 'KRW',
    },
    orderId: params.orderId,
    orderName: params.orderName,
    successUrl: params.successUrl,
    failUrl: params.failUrl,
    customerEmail: params.customerEmail,
    customerName: params.customerName,
    customerMobilePhone: params.customerMobilePhone,
    card: {
      useEscrow: false,
      flowMode: 'DEFAULT',
      useCardPoint: false,
      useAppCardOnly: false,
    },
  });
}

/**
 * Request bank transfer payment
 */
export async function requestTransferPayment(params: PaymentRequestParams): Promise<void> {
  const tossPayments = await getTossPayments();
  const payment = tossPayments.payment({ customerKey: params.orderId });

  await payment.requestPayment({
    method: 'TRANSFER',
    amount: {
      value: params.amount,
      currency: 'KRW',
    },
    orderId: params.orderId,
    orderName: params.orderName,
    successUrl: params.successUrl,
    failUrl: params.failUrl,
    customerEmail: params.customerEmail,
    customerName: params.customerName,
    transfer: {
      cashReceipt: {
        type: '소득공제',
      },
    },
  });
}

/**
 * Request virtual account payment (가상계좌)
 */
export async function requestVirtualAccountPayment(params: PaymentRequestParams): Promise<void> {
  const tossPayments = await getTossPayments();
  const payment = tossPayments.payment({ customerKey: params.orderId });

  await payment.requestPayment({
    method: 'VIRTUAL_ACCOUNT',
    amount: {
      value: params.amount,
      currency: 'KRW',
    },
    orderId: params.orderId,
    orderName: params.orderName,
    successUrl: params.successUrl,
    failUrl: params.failUrl,
    customerEmail: params.customerEmail,
    customerName: params.customerName,
    virtualAccount: {
      cashReceipt: {
        type: '소득공제',
      },
      validHours: 168, // 7일 (168시간)
    },
  });
}

/**
 * Request easy pay (Kakao Pay, Naver Pay, etc.)
 */
export async function requestEasyPayPayment(
  params: PaymentRequestParams & { provider: 'KAKAOPAY' | 'NAVERPAY' | 'TOSSPAY' }
): Promise<void> {
  const tossPayments = await getTossPayments();
  const payment = tossPayments.payment({ customerKey: params.orderId });

  await (payment.requestPayment as any)({
    method: 'EASY_PAY',
    amount: {
      value: params.amount,
      currency: 'KRW',
    },
    orderId: params.orderId,
    orderName: params.orderName,
    successUrl: params.successUrl,
    failUrl: params.failUrl,
    customerEmail: params.customerEmail,
    customerName: params.customerName,
    easyPay: {
      provider: params.provider,
    },
  });
}

/**
 * Billing key request for recurring payments
 */
export interface BillingKeyRequestParams {
  customerKey: string;
  successUrl: string;
  failUrl: string;
  customerEmail?: string;
  customerName?: string;
}

/**
 * Request billing key for recurring subscription payments
 */
export async function requestBillingKey(params: BillingKeyRequestParams): Promise<void> {
  const tossPayments = await getTossPayments();
  const payment = tossPayments.payment({ customerKey: params.customerKey });

  await payment.requestBillingAuth({
    method: 'CARD',
    successUrl: params.successUrl,
    failUrl: params.failUrl,
    customerEmail: params.customerEmail,
    customerName: params.customerName,
  });
}
