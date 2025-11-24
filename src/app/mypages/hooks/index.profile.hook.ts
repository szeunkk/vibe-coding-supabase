import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * 사용자 프로필 정보 인터페이스
 */
export interface UserProfile {
  userId: string;
  profileImage: string | null;
  name: string;
  email: string;
  joinDate: string;
}

/**
 * 사용자 프로필 조회 훅
 * Supabase Auth를 사용하여 현재 로그인한 사용자의 프로필 정보를 가져옵니다.
 */
export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Supabase에서 현재 사용자 정보 가져오기
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) {
          throw new Error(userError.message);
        }

        if (!user) {
          setProfile(null);
          setIsLoading(false);
          return;
        }

        // 사용자 정보를 UserProfile 형식으로 변환
        const userProfile: UserProfile = {
          // 사용자 ID
          userId: user.id,
          // Google OAuth의 경우 user_metadata에 picture 또는 avatar_url이 있음
          profileImage: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          // 이름 (user_metadata에서 full_name 또는 name 사용)
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '사용자',
          // 이메일
          email: user.email || '',
          // 가입일 (YYYY.MM 형식으로 포맷)
          joinDate: formatJoinDate(user.created_at),
        };

        setProfile(userProfile);
      } catch (err) {
        console.error('프로필 조회 오류:', err);
        setError(err instanceof Error ? err.message : '프로필을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();

    // Auth 상태 변경 시 프로필 다시 가져오기
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile();
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { profile, isLoading, error };
};

/**
 * 날짜를 YYYY.MM 형식으로 포맷하는 헬퍼 함수
 */
function formatJoinDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}.${month}`;
  } catch {
    return new Date().getFullYear() + '.' + String(new Date().getMonth() + 1).padStart(2, '0');
  }
}

