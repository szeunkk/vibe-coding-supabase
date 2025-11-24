import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

/**
 * 사용자 정보 타입
 */
interface UserInfo {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
}

/**
 * 로그인/로그아웃 상태 관리 훅
 * 
 * 기능:
 * - 로그인 상태 조회
 * - 사용자 정보 제공 (프로필 사진, 이름 등)
 * - 로그아웃 처리
 */
export const useLoginStatus = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * 현재 로그인 사용자 정보 조회
   */
  const fetchUser = async () => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('사용자 정보 조회 오류:', error.message);
        setUser(null);
        return;
      }

      if (authUser) {
        // Supabase 사용자 정보를 UserInfo 타입으로 변환
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '사용자',
          profileImage: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('예기치 않은 오류:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 로그아웃 처리
   */
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('로그아웃 오류:', error.message);
        alert('로그아웃에 실패했습니다.');
        return;
      }

      // 로그아웃 성공 시 상태 초기화 및 로그인 페이지로 이동
      setUser(null);
      router.push('/auth/login');
    } catch (err) {
      console.error('예기치 않은 오류:', err);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  /**
   * 마이페이지로 이동
   */
  const goToMyPage = () => {
    router.push('/mypages');
  };

  /**
   * 로그인 페이지로 이동
   */
  const goToLogin = () => {
    router.push('/auth/login');
  };

  useEffect(() => {
    // 초기 사용자 정보 로드
    fetchUser();

    // 인증 상태 변경 감지 (로그인/로그아웃 시 자동 업데이트)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '사용자',
            profileImage: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    isLoggedIn: !!user,
    handleLogout,
    goToMyPage,
    goToLogin,
  };
};

