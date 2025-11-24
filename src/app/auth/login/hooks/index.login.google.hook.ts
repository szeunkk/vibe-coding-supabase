import { supabase } from '@/lib/supabase';

/**
 * 구글 로그인 훅
 * Supabase OAuth를 사용하여 구글 로그인을 처리합니다.
 */
export const useGoogleLogin = () => {
  const handleGoogleLogin = async () => {
    try {
      // Supabase 구글 OAuth 로그인 호출
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/login/success`,
        },
      });

      if (error) {
        console.error('구글 로그인 오류:', error.message);
        alert('구글 로그인에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      // OAuth 로그인은 자동으로 리다이렉트됩니다
      console.log('구글 로그인 프로세스 시작');
    } catch (err) {
      console.error('예기치 않은 오류:', err);
      alert('로그인 중 오류가 발생했습니다.');
    }
  };

  return { handleGoogleLogin };
};

