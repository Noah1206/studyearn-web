/**
 * 이메일 발송 헬퍼 함수
 * Resend API를 사용하여 이메일 발송
 */

import { Resend } from 'resend';

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

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'StudyEarn <noreply@studyearn.kr>';

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

// 템플릿별 제목과 HTML 생성
function getEmailContent(template: EmailTemplate, data: Record<string, unknown> = {}): { subject: string; html: string } {
  switch (template) {
    case 'welcome':
      return {
        subject: `${data.nickname}님, StudyEarn에 오신 것을 환영합니다!`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 24px; color: #111;">환영합니다! 🎉</h1>
            <p style="color: #555; line-height: 1.6;">${data.nickname}님, StudyEarn에 가입해주셔서 감사합니다.</p>
            <p style="color: #555; line-height: 1.6;">다양한 학습 자료를 탐색하고, 나만의 콘텐츠를 공유해보세요.</p>
            <a href="https://studyearn.kr" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #f97316; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">시작하기</a>
          </div>`,
      };

    case 'new_subscriber':
      return {
        subject: `새로운 구독자가 생겼어요!`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 24px; color: #111;">새 구독자 알림</h1>
            <p style="color: #555; line-height: 1.6;"><strong>${data.subscriberName}</strong>님이 구독했습니다.</p>
            <p style="color: #555; line-height: 1.6;">현재 총 <strong>${data.totalSubscribers}</strong>명의 구독자가 있습니다.</p>
          </div>`,
      };

    case 'new_comment':
      return {
        subject: `"${data.contentTitle}"에 새 댓글이 달렸어요`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 24px; color: #111;">새 댓글 알림</h1>
            <p style="color: #555; line-height: 1.6;"><strong>${data.commenterName}</strong>님이 "<strong>${data.contentTitle}</strong>"에 댓글을 남겼습니다.</p>
            <div style="margin: 16px 0; padding: 16px; background: #f9fafb; border-radius: 8px; color: #333;">${data.commentPreview}</div>
            <a href="https://studyearn.kr/content/${data.contentId}" style="display: inline-block; margin-top: 12px; padding: 12px 24px; background: #f97316; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">댓글 확인하기</a>
          </div>`,
      };

    case 'new_like':
      return {
        subject: `"${data.contentTitle}"에 좋아요가 눌렸어요`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 24px; color: #111;">좋아요 알림 ❤️</h1>
            <p style="color: #555; line-height: 1.6;"><strong>${data.likerName}</strong>님이 "<strong>${data.contentTitle}</strong>"을 좋아합니다.</p>
          </div>`,
      };

    case 'payout_complete':
      return {
        subject: `정산이 완료되었습니다`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 24px; color: #111;">정산 완료 💰</h1>
            <p style="color: #555; line-height: 1.6;">요청하신 정산이 완료되었습니다.</p>
            <div style="margin: 16px 0; padding: 16px; background: #f9fafb; border-radius: 8px;">
              <p style="margin: 4px 0; color: #333;"><strong>금액:</strong> ${Number(data.amount).toLocaleString()}원</p>
              <p style="margin: 4px 0; color: #333;"><strong>은행:</strong> ${data.bankName}</p>
              <p style="margin: 4px 0; color: #333;"><strong>계좌:</strong> ${data.accountNumber}</p>
            </div>
          </div>`,
      };

    case 'purchase_confirm':
      return {
        subject: `구매가 확인되었습니다`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 24px; color: #111;">구매 확인 완료 ✅</h1>
            <p style="color: #555; line-height: 1.6;">"<strong>${data.contentTitle}</strong>" 구매가 확인되었습니다.</p>
            <p style="color: #555; line-height: 1.6;">이제 콘텐츠를 이용하실 수 있습니다.</p>
            <a href="https://studyearn.kr/content/${data.contentId}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #f97316; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">콘텐츠 보기</a>
          </div>`,
      };

    case 'qa_answered':
      return {
        subject: `질문에 답변이 달렸어요`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 24px; color: #111;">답변 알림</h1>
            <p style="color: #555; line-height: 1.6;"><strong>${data.creatorName}</strong>님이 질문에 답변했습니다.</p>
            <div style="margin: 16px 0; padding: 16px; background: #f9fafb; border-radius: 8px;">
              <p style="margin: 4px 0; color: #666;"><strong>질문:</strong> ${data.question}</p>
              <p style="margin: 4px 0; color: #333;"><strong>답변:</strong> ${data.answerPreview}</p>
            </div>
            <a href="https://studyearn.kr/qa/${data.questionId}" style="display: inline-block; margin-top: 12px; padding: 12px 24px; background: #f97316; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">답변 확인하기</a>
          </div>`,
      };

    case 'qa_received':
      return {
        subject: `새로운 질문이 도착했어요`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 24px; color: #111;">새 질문 알림</h1>
            <p style="color: #555; line-height: 1.6;"><strong>${data.askerName}</strong>님이 질문을 보냈습니다. ${data.isPaid ? `(${Number(data.price).toLocaleString()}원)` : '(무료)'}</p>
            <div style="margin: 16px 0; padding: 16px; background: #f9fafb; border-radius: 8px; color: #333;">${data.question}</div>
          </div>`,
      };

    case 'digest':
      return {
        subject: `이번 주 활동 요약`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 24px; color: #111;">주간 리포트 📊</h1>
            <div style="margin: 16px 0; padding: 16px; background: #f9fafb; border-radius: 8px;">
              <p style="margin: 4px 0; color: #333;">👀 조회수: <strong>${data.views}</strong></p>
              <p style="margin: 4px 0; color: #333;">❤️ 좋아요: <strong>${data.likes}</strong></p>
              <p style="margin: 4px 0; color: #333;">👥 새 구독자: <strong>${data.newSubscribers}</strong></p>
              <p style="margin: 4px 0; color: #333;">💰 수익: <strong>${Number(data.revenue).toLocaleString()}원</strong></p>
            </div>
            <a href="https://studyearn.kr/dashboard" style="display: inline-block; margin-top: 12px; padding: 12px 24px; background: #f97316; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">대시보드 보기</a>
          </div>`,
      };

    default:
      return { subject: 'StudyEarn 알림', html: '<p>새로운 알림이 있습니다.</p>' };
  }
}

/**
 * 이메일 발송
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const resend = getResend();

  if (!resend) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'Configuration error' };
  }

  try {
    const { subject, html } = options.subject
      ? { subject: options.subject, html: getEmailContent(options.template, options.data).html }
      : getEmailContent(options.template, options.data);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject,
      html,
    });

    if (error) {
      console.error('Email send failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * 가입 환영 이메일
 */
export async function sendWelcomeEmail(to: string, nickname: string): Promise<SendEmailResult> {
  return sendEmail({ to, template: 'welcome', data: { nickname } });
}

/**
 * 새 구독자 알림 이메일
 */
export async function sendNewSubscriberEmail(to: string, subscriberName: string, totalSubscribers: number): Promise<SendEmailResult> {
  return sendEmail({ to, template: 'new_subscriber', data: { subscriberName, totalSubscribers } });
}

/**
 * 새 댓글 알림 이메일
 */
export async function sendNewCommentEmail(to: string, commenterName: string, contentTitle: string, contentId: string, commentPreview: string): Promise<SendEmailResult> {
  return sendEmail({ to, template: 'new_comment', data: { commenterName, contentTitle, contentId, commentPreview } });
}

/**
 * 좋아요 알림 이메일
 */
export async function sendNewLikeEmail(to: string, likerName: string, contentTitle: string): Promise<SendEmailResult> {
  return sendEmail({ to, template: 'new_like', data: { likerName, contentTitle } });
}

/**
 * 정산 완료 이메일
 */
export async function sendPayoutCompleteEmail(to: string, amount: number, bankName: string, accountNumber: string): Promise<SendEmailResult> {
  return sendEmail({ to, template: 'payout_complete', data: { amount, bankName, accountNumber } });
}

/**
 * 구매 확인 이메일
 */
export async function sendPurchaseConfirmEmail(to: string, contentTitle: string, contentId: string): Promise<SendEmailResult> {
  return sendEmail({ to, template: 'purchase_confirm', data: { contentTitle, contentId } });
}

/**
 * Q&A 답변 완료 이메일 (질문자에게)
 */
export async function sendQAAnsweredEmail(to: string, question: string, answerPreview: string, creatorName: string, questionId: string): Promise<SendEmailResult> {
  return sendEmail({ to, template: 'qa_answered', data: { question, answerPreview, creatorName, questionId } });
}

/**
 * Q&A 질문 수신 이메일 (크리에이터에게)
 */
export async function sendQAReceivedEmail(to: string, askerName: string, question: string, isPaid: boolean, price?: number): Promise<SendEmailResult> {
  return sendEmail({ to, template: 'qa_received', data: { askerName, question, isPaid, price } });
}

/**
 * 주간 요약 이메일
 */
export async function sendDigestEmail(to: string, views: number, likes: number, newSubscribers: number, revenue: number): Promise<SendEmailResult> {
  return sendEmail({ to, template: 'digest', data: { views, likes, newSubscribers, revenue } });
}
