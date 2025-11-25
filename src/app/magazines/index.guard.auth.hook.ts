import { useLoginStatus } from './index.login.logout.status.hook';

/**
 * 로그인 액션 GUARD 훅
 * 
 * 기능:
 * - 로그인 여부를 검사
 * - 비로그인 시 알림을 띄우고 작업을 중단
 */
export const useAuthGuard = () => {
  const { isLoggedIn } = useLoginStatus();

  /**
   * 로그인 상태를 확인하고, 비로그인 시 알림을 표시
   * @param action 로그인 시 실행할 콜백 함수
   * @returns 로그인 상태 확인 후 action 실행 또는 알림 표시
   */
  const checkAuth = (action: () => void) => {
    if (!isLoggedIn) {
      alert('로그인 후 이용 가능합니다');
      return;
    }
    
    // 로그인된 경우에만 action 실행
    action();
  };

  return {
    checkAuth,
    isLoggedIn,
  };
};

