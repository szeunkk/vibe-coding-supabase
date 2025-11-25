import { useLoginStatus } from './index.login.logout.status.hook';
import { usePaymentStatus } from '../mypages/hooks/index.payment.status.hook';

/**
 * 구독 액션 GUARD 훅
 * 
 * 기능:
 * - 구독 여부를 검사 (payment 테이블 조회)
 * - 비구독 시 알림을 띄우고 작업을 중단
 * 
 * 조회 조건:
 * - user_id === 로그인된 user_id
 * - transaction_key로 그룹화하여 created_at이 최신인 것만
 * - status === "Paid"
 * - start_at <= 현재시각 <= end_grace_at
 */
export const useSubscribeGuard = () => {
  const { user } = useLoginStatus();
  const { isSubscribed, isLoading } = usePaymentStatus({ 
    userId: user?.id 
  });

  /**
   * 구독 상태를 확인하고, 비구독 시 알림을 표시
   * @param action 구독 시 실행할 콜백 함수
   * @returns 구독 상태 확인 후 action 실행 또는 알림 표시
   */
  const checkSubscription = (action: () => void) => {
    // 로딩 중일 때는 대기
    if (isLoading) {
      return;
    }

    // 비구독 상태일 경우 알림 표시 후 중단
    if (!isSubscribed) {
      alert('구독 후 이용 가능합니다.');
      return;
    }
    
    // 구독 상태인 경우에만 action 실행
    action();
  };

  return {
    checkSubscription,
    isSubscribed,
    isLoading,
  };
};

