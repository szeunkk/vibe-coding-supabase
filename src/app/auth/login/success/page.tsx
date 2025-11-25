'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginSuccessPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URL에서 OAuth 콜백 파라미터 확인
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (accessToken) {
          // 세션이 설정될 때까지 대기
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('세션 확인 오류:', sessionError);
            setError('로그인 처리 중 오류가 발생했습니다.');
            setTimeout(() => {
              router.push('/auth/login');
            }, 2000);
            return;
          }

          if (session) {
            console.log('로그인 성공:', session.user.email);
            // 메인 페이지로 이동
            router.push('/magazines');
          } else {
            setError('세션을 찾을 수 없습니다.');
            setTimeout(() => {
              router.push('/auth/login');
            }, 2000);
          }
        } else {
          // access_token이 없는 경우 직접 세션 확인
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            console.error('세션 확인 오류:', sessionError);
            setError('로그인 정보를 찾을 수 없습니다.');
            setTimeout(() => {
              router.push('/auth/login');
            }, 2000);
            return;
          }

          console.log('로그인 성공:', session.user.email);
          router.push('/magazines');
        }
      } catch (err) {
        console.error('로그인 처리 오류:', err);
        setError('예기치 않은 오류가 발생했습니다.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">로그인 실패</h2>
              <p className="text-gray-600">{error}</p>
              <p className="text-sm text-gray-500 mt-2">잠시 후 로그인 페이지로 이동합니다...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">로그인 처리 중</h2>
              <p className="text-gray-600">세션을 설정하고 있습니다...</p>
              <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



