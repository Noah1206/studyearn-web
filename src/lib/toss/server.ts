/**
 * TossPayments Server-side API Integration
 *
 * Documentation: https://docs.tosspayments.com/reference
 */

const TOSS_API_URL = 'https://api.tosspayments.com/v1';

/**
 * Get authorization header for TossPayments API
 */
function getAuthHeader(): string {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    throw new Error('TOSS_SECRET_KEY is not defined');
  }
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
}

/**
 * Payment confirmation response from TossPayments
 */
export interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  orderName: string;
  status: 'READY' | 'IN_PROGRESS' | 'WAITING_FOR_DEPOSIT' | 'DONE' | 'CANCELED' | 'PARTIAL_CANCELED' | 'ABORTED' | 'EXPIRED';
  requestedAt: string;
  approvedAt: string | null;
  totalAmount: number;
  balanceAmount: number;
  currency: string;
  method: string | null;
  card?: {
    company: string;
    number: string;
    installmentPlanMonths: number;
    isInterestFree: boolean;
    approveNo: string;
    acquireStatus: string;
    cardType: string;
    ownerType: string;
  };
  virtualAccount?: {
    accountNumber: string;
    accountType: string;
    bank: string;
    customerName: string;
    dueDate: string;
    expired: boolean;
    settlementStatus: string;
  };
  transfer?: {
    bank: string;
    settlementStatus: string;
  };
  easyPay?: {
    provider: string;
    amount: number;
    discountAmount: number;
  };
  receipt?: {
    url: string;
  };
  failure?: {
    code: string;
    message: string;
  };
}

/**
 * Confirm payment with TossPayments API
 */
export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<TossPaymentResponse> {
  const response = await fetch(`${TOSS_API_URL}/payments/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new TossPaymentError(error.code, error.message);
  }

  return response.json();
}

/**
 * Get payment details
 */
export async function getPayment(paymentKey: string): Promise<TossPaymentResponse> {
  const response = await fetch(`${TOSS_API_URL}/payments/${paymentKey}`, {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new TossPaymentError(error.code, error.message);
  }

  return response.json();
}

/**
 * Get payment by order ID
 */
export async function getPaymentByOrderId(orderId: string): Promise<TossPaymentResponse> {
  const response = await fetch(`${TOSS_API_URL}/payments/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new TossPaymentError(error.code, error.message);
  }

  return response.json();
}

/**
 * Cancel payment request
 */
export interface CancelPaymentRequest {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number;
  refundReceiveAccount?: {
    bank: string;
    accountNumber: string;
    holderName: string;
  };
}

/**
 * Cancel payment
 */
export async function cancelPayment(request: CancelPaymentRequest): Promise<TossPaymentResponse> {
  const response = await fetch(`${TOSS_API_URL}/payments/${request.paymentKey}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cancelReason: request.cancelReason,
      cancelAmount: request.cancelAmount,
      refundReceiveAccount: request.refundReceiveAccount,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new TossPaymentError(error.code, error.message);
  }

  return response.json();
}

/**
 * Billing key response
 */
export interface BillingKeyResponse {
  billingKey: string;
  customerKey: string;
  authenticatedAt: string;
  method: string;
  card: {
    company: string;
    number: string;
    cardType: string;
    ownerType: string;
  };
}

/**
 * Issue billing key (for recurring payments)
 */
export async function issueBillingKey(
  authKey: string,
  customerKey: string
): Promise<BillingKeyResponse> {
  const response = await fetch(`${TOSS_API_URL}/billing/authorizations/issue`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      authKey,
      customerKey,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new TossPaymentError(error.code, error.message);
  }

  return response.json();
}

/**
 * Bill with billing key (recurring payment)
 */
export interface BillWithKeyRequest {
  billingKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  customerEmail?: string;
  customerName?: string;
}

/**
 * Process recurring payment with billing key
 */
export async function billWithKey(request: BillWithKeyRequest): Promise<TossPaymentResponse> {
  const response = await fetch(`${TOSS_API_URL}/billing/${request.billingKey}`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerKey: request.customerKey,
      amount: request.amount,
      orderId: request.orderId,
      orderName: request.orderName,
      customerEmail: request.customerEmail,
      customerName: request.customerName,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new TossPaymentError(error.code, error.message);
  }

  return response.json();
}

/**
 * Custom error class for TossPayments API errors
 */
export class TossPaymentError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'TossPaymentError';
  }
}

/**
 * Verify webhook signature from TossPayments
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secretKey: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(payload)
    .digest('hex');

  return signature === expectedSignature;
}
