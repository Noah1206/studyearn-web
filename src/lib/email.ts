/**
 * 이메일 발송 헬퍼 함수
 * Supabase Edge Function (send-email)을 호출하여 이메일 발송
 */

type EmailTemplate =
  | "welcome"
  | "new_subscriber"
  | "new_comment"
  | "new_like"
  | "payout_complete"
  | "purchase_confirm"
  | "qa_answered"
  | "qa_received"
  | "digest";

interface SendEmailOptions {
  to: string;
  template: EmailTemplate;
  data?: Record<string, unknown>;
  subject?: string;
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * 이메일 발송
 * @param options 이메일 발송 옵션
 * @returns 발송 결과
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase environment variables not configured");
    return { success: false, error: "Configuration error" };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(options),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Email send failed:", result);
      return { success: false, error: result.error || "Failed to send email" };
    }

    return { success: true, id: result.id };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * 가입 환영 이메일
 */
export async function sendWelcomeEmail(to: string, nickname: string): Promise<SendEmailResult> {
  return sendEmail({
    to,
    template: "welcome",
    data: { nickname },
  });
}

/**
 * 새 구독자 알림 이메일
 */
export async function sendNewSubscriberEmail(
  to: string,
  subscriberName: string,
  totalSubscribers: number
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    template: "new_subscriber",
    data: { subscriberName, totalSubscribers },
  });
}

/**
 * 새 댓글 알림 이메일
 */
export async function sendNewCommentEmail(
  to: string,
  commenterName: string,
  contentTitle: string,
  contentId: string,
  commentPreview: string
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    template: "new_comment",
    data: { commenterName, contentTitle, contentId, commentPreview },
  });
}

/**
 * 좋아요 알림 이메일
 */
export async function sendNewLikeEmail(
  to: string,
  likerName: string,
  contentTitle: string
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    template: "new_like",
    data: { likerName, contentTitle },
  });
}

/**
 * 정산 완료 이메일
 */
export async function sendPayoutCompleteEmail(
  to: string,
  amount: number,
  bankName: string,
  accountNumber: string
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    template: "payout_complete",
    data: { amount, bankName, accountNumber },
  });
}

/**
 * 구매 확인 이메일
 */
export async function sendPurchaseConfirmEmail(
  to: string,
  contentTitle: string,
  contentId: string
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    template: "purchase_confirm",
    data: { contentTitle, contentId },
  });
}

/**
 * Q&A 답변 완료 이메일 (질문자에게)
 */
export async function sendQAAnsweredEmail(
  to: string,
  question: string,
  answerPreview: string,
  creatorName: string,
  questionId: string
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    template: "qa_answered",
    data: { question, answerPreview, creatorName, questionId },
  });
}

/**
 * Q&A 질문 수신 이메일 (크리에이터에게)
 */
export async function sendQAReceivedEmail(
  to: string,
  askerName: string,
  question: string,
  isPaid: boolean,
  price?: number
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    template: "qa_received",
    data: { askerName, question, isPaid, price },
  });
}

/**
 * 주간 요약 이메일
 */
export async function sendDigestEmail(
  to: string,
  views: number,
  likes: number,
  newSubscribers: number,
  revenue: number
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    template: "digest",
    data: { views, likes, newSubscribers, revenue },
  });
}
