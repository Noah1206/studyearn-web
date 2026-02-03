/**
 * Notification trigger utility
 * Call these functions from API routes to create notifications for users
 */

import { createAdminClient } from '@/lib/supabase/server';

type NotificationType = 'follow' | 'like' | 'comment' | 'purchase' | 'review' | 'payout' | 'system' | 'qa_answer' | 'qa_question';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const supabase = createAdminClient();
    if (!supabase) return;

    // Check user's notification preferences
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('notification_settings')
      .eq('user_id', params.userId)
      .single();

    const settings = prefs?.notification_settings as Record<string, boolean> | null;

    // Check if notification type is enabled
    const typeSettingMap: Record<string, string> = {
      follow: 'push_follows',
      like: 'push_likes',
      comment: 'push_comments',
      purchase: 'push_purchases',
      review: 'push_comments',
      payout: 'push_purchases',
      system: 'push_announcements',
      qa_answer: 'push_comments',
      qa_question: 'push_comments',
    };

    const settingKey = typeSettingMap[params.type];
    if (settings && settingKey && settings[settingKey] === false) {
      return; // User has disabled this notification type
    }

    await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        metadata: params.data || {},
      });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

/**
 * Pre-built notification creators for common events
 */
export const notify = {
  /** Someone followed a creator */
  async follow(creatorId: string, followerName: string, followerId: string) {
    await createNotification({
      userId: creatorId,
      type: 'follow',
      title: '새로운 팔로워',
      message: `${followerName}님이 회원님을 팔로우했습니다.`,
      data: { follower_id: followerId },
    });
  },

  /** Someone liked a content */
  async like(creatorId: string, likerName: string, contentId: string, contentTitle: string) {
    await createNotification({
      userId: creatorId,
      type: 'like',
      title: '좋아요',
      message: `${likerName}님이 "${contentTitle}"을(를) 좋아합니다.`,
      data: { content_id: contentId },
    });
  },

  /** Someone purchased content */
  async purchase(sellerId: string, buyerName: string, contentTitle: string, amount: number, purchaseId: string) {
    await createNotification({
      userId: sellerId,
      type: 'purchase',
      title: '새로운 구매',
      message: `${buyerName}님이 "${contentTitle}"을(를) ${amount.toLocaleString()}원에 구매했습니다.`,
      data: { purchase_id: purchaseId },
    });
  },

  /** Someone left a review */
  async review(creatorId: string, reviewerName: string, contentTitle: string, rating: number, contentId: string) {
    await createNotification({
      userId: creatorId,
      type: 'review',
      title: '새로운 리뷰',
      message: `${reviewerName}님이 "${contentTitle}"에 ${rating}점 리뷰를 남겼습니다.`,
      data: { content_id: contentId, rating },
    });
  },

  /** Payout status update */
  async payoutStatusChange(creatorId: string, status: string, amount: number) {
    const statusMessages: Record<string, string> = {
      processing: `${amount.toLocaleString()}원 정산이 처리 중입니다.`,
      completed: `${amount.toLocaleString()}원 정산이 완료되었습니다.`,
      failed: `${amount.toLocaleString()}원 정산 처리에 실패했습니다.`,
    };

    await createNotification({
      userId: creatorId,
      type: 'payout',
      title: '정산 알림',
      message: statusMessages[status] || `정산 상태가 ${status}(으)로 변경되었습니다.`,
      data: { status, amount },
    });
  },

  /** Someone commented on content */
  async comment(creatorId: string, commenterName: string, contentTitle: string, contentId: string) {
    await createNotification({
      userId: creatorId,
      type: 'comment',
      title: '새로운 댓글',
      message: `${commenterName}님이 "${contentTitle}"에 댓글을 남겼습니다.`,
      data: { content_id: contentId },
    });
  },

  /** QA answer received */
  async qaAnswer(questionerId: string, answererName: string, questionTitle: string, questionId: string) {
    await createNotification({
      userId: questionerId,
      type: 'qa_answer',
      title: '답변이 도착했습니다',
      message: `${answererName}님이 "${questionTitle}" 질문에 답변했습니다.`,
      data: { question_id: questionId },
    });
  },

  /** Purchase completed notification for buyer */
  async purchaseComplete(buyerId: string, contentTitle: string, contentId: string) {
    await createNotification({
      userId: buyerId,
      type: 'purchase',
      title: '구매 완료',
      message: `"${contentTitle}" 구매가 완료되었습니다.`,
      data: { content_id: contentId },
    });
  },

  /** Purchase rejected notification for buyer */
  async purchaseRejected(buyerId: string, contentTitle: string, contentId: string) {
    await createNotification({
      userId: buyerId,
      type: 'purchase',
      title: '구매 거절',
      message: `"${contentTitle}" 구매가 거절되었습니다.`,
      data: { content_id: contentId },
    });
  },

  /** Refund notification */
  async refund(buyerId: string, contentTitle: string, amount: number) {
    await createNotification({
      userId: buyerId,
      type: 'purchase',
      title: '환불 완료',
      message: `"${contentTitle}" ${amount.toLocaleString()}원이 환불되었습니다.`,
      data: { amount },
    });
  },
};
