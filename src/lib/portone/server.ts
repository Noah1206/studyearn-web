/**
 * PortOne V2 Server-side Payment Utilities
 * 서버에서 결제 검증 및 관리 시 사용
 */

const PORTONE_API_URL = 'https://api.portone.io';

export interface PortOnePayment {
  id: string;
  status: 'PENDING' | 'PAID' | 'VIRTUAL_ACCOUNT_ISSUED' | 'FAILED' | 'CANCELLED' | 'PARTIAL_CANCELLED';
  transactionId?: string;
  merchantId: string;
  storeId: string;
  channel?: {
    type: string;
    id: string;
    key: string;
    name: string;
    pgProvider: string;
    pgMerchantId: string;
  };
  amount: {
    total: number;
    paid: number;
    cancelled: number;
    cancelledTaxFree: number;
  };
  method?: {
    type: string;
    card?: {
      issuerCode: string;
      acquirerCode: string;
      number: string;
      approvalNumber: string;
    };
    virtualAccount?: {
      bankCode: string;
      accountNumber: string;
      accountHolder?: string;
      expiresAt?: string;
    };
  };
  orderName: string;
  customer?: {
    id?: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
  };
  requestedAt?: string;
  paidAt?: string;
  cancelledAt?: string;
  failedAt?: string;
  receiptUrl?: string;
  cancellations?: Array<{
    id: string;
    totalAmount: number;
    reason: string;
    cancelledAt: string;
  }>;
}

export interface PortOneError {
  type: string;
  message: string;
}

export class PortOneApiError extends Error {
  type: string;

  constructor(type: string, message: string) {
    super(message);
    this.type = type;
    this.name = 'PortOneApiError';
  }
}

/**
 * 포트원 API 요청 헤더 생성
 */
function getAuthHeaders(): HeadersInit {
  const apiSecret = process.env.PORTONE_V2_API_SECRET;
  if (!apiSecret) {
    throw new PortOneApiError('CONFIG_ERROR', 'PORTONE_V2_API_SECRET is not configured');
  }

  return {
    'Authorization': `PortOne ${apiSecret}`,
    'Content-Type': 'application/json',
  };
}

/**
 * 결제 정보 조회
 */
export async function getPayment(paymentId: string): Promise<PortOnePayment> {
  const response = await fetch(
    `${PORTONE_API_URL}/payments/${encodeURIComponent(paymentId)}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new PortOneApiError(
      data.type || 'API_ERROR',
      data.message || 'Failed to get payment'
    );
  }

  return data;
}

/**
 * 결제 검증
 * 결제 상태와 금액을 확인
 */
export async function verifyPayment(
  paymentId: string,
  expectedAmount: number
): Promise<{ verified: boolean; payment: PortOnePayment; error?: string }> {
  try {
    const payment = await getPayment(paymentId);

    // 결제 상태 확인
    if (payment.status !== 'PAID' && payment.status !== 'VIRTUAL_ACCOUNT_ISSUED') {
      return {
        verified: false,
        payment,
        error: `결제 상태가 유효하지 않습니다: ${payment.status}`,
      };
    }

    // 결제 금액 확인
    if (payment.amount.total !== expectedAmount) {
      return {
        verified: false,
        payment,
        error: `결제 금액이 일치하지 않습니다. 예상: ${expectedAmount}, 실제: ${payment.amount.total}`,
      };
    }

    return {
      verified: true,
      payment,
    };
  } catch (error) {
    if (error instanceof PortOneApiError) {
      return {
        verified: false,
        payment: {} as PortOnePayment,
        error: error.message,
      };
    }
    throw error;
  }
}

/**
 * 결제 취소
 */
export async function cancelPayment(
  paymentId: string,
  reason: string,
  amount?: number
): Promise<PortOnePayment> {
  const body: { reason: string; amount?: number } = { reason };
  if (amount !== undefined) {
    body.amount = amount;
  }

  const response = await fetch(
    `${PORTONE_API_URL}/payments/${encodeURIComponent(paymentId)}/cancel`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new PortOneApiError(
      data.type || 'API_ERROR',
      data.message || 'Failed to cancel payment'
    );
  }

  return data;
}

/**
 * 웹훅 페이로드 타입
 */
export interface PortOneWebhookPayload {
  type: string;
  timestamp: string;
  data: {
    paymentId: string;
    transactionId?: string;
    storeId: string;
    [key: string]: unknown;
  };
}

/**
 * 결제 상태를 purchases 테이블 상태로 매핑
 */
export function mapPaymentStatusToPurchaseStatus(
  portoneStatus: string
): 'pending' | 'completed' | 'failed' | 'refunded' | 'awaiting_deposit' {
  const statusMap: Record<string, 'pending' | 'completed' | 'failed' | 'refunded' | 'awaiting_deposit'> = {
    PENDING: 'pending',
    PAID: 'completed',
    VIRTUAL_ACCOUNT_ISSUED: 'awaiting_deposit',
    FAILED: 'failed',
    CANCELLED: 'refunded',
    PARTIAL_CANCELLED: 'refunded',
  };

  return statusMap[portoneStatus] || 'pending';
}
