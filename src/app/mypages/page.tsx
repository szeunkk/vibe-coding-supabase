"use client";

import { useRouter } from "next/navigation";
import { useCancelSubscription } from "./hooks/index.payment.cancel.hook";
import { usePaymentStatus } from "./hooks/index.payment.status.hook";
import { useUserProfile } from "./hooks/index.profile.hook";

function GlossaryMagazinesMypage() {
  const router = useRouter();
  
  // Supabase Auth에서 사용자 프로필 정보 가져오기
  const { profile, isLoading: isProfileLoading, error: profileError } = useUserProfile();
  
  const { cancelSubscription, isLoading: isCanceling } =
    useCancelSubscription();

  // 실제 결제 상태 조회 Hook 사용 (로그인된 사용자의 userId로 필터링)
  const { isSubscribed, status, transactionKey, isLoading: isPaymentLoading, error: paymentError, refresh } =
    usePaymentStatus({ userId: profile?.userId });

  const handleBackToList = () => {
    router.push("/magazines");
  };

  const handleSubscriptionToggle = () => {
    // 로그인하지 않은 경우 로그인 페이지로 이동
    if (!profile) {
      router.push("/auth/login");
      return;
    }
    // 구독하기 버튼 클릭 시 결제 페이지로 이동
    router.push("/payments");
  };

  const handleCancelSubscription = async () => {
    if (confirm("구독을 취소하시겠습니까?")) {
      // transactionKey가 없으면 에러 메시지
      if (!transactionKey) {
        alert("구독 정보가 없습니다.");
        return;
      }

      // Hook을 통해 API 호출
      const result = await cancelSubscription(transactionKey);

      // 성공 시 결제 상태 새로고침
      if (result.success) {
        refresh();
      }
    }
  };

  // 로딩 중일 때 표시
  if (isProfileLoading || isPaymentLoading) {
    return (
      <div className="mypage-wrapper">
        <div className="mypage-header">
          <h1>IT 매거진 구독</h1>
          <p className="mypage-header-desc">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 발생 시 표시
  if (profileError || paymentError) {
    return (
      <div className="mypage-wrapper">
        <div className="mypage-header">
          <h1>IT 매거진 구독</h1>
          <p className="mypage-header-desc" style={{ color: "red" }}>
            오류: {profileError || paymentError}
          </p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우
  if (!profile) {
    return (
      <div className="mypage-wrapper">
        <div className="mypage-header">
          <h1>IT 매거진 구독</h1>
          <p className="mypage-header-desc">로그인이 필요합니다.</p>
        </div>
        <button 
          className="mypage-subscribe-btn"
          onClick={() => router.push("/auth/login")}
          style={{ maxWidth: "300px", margin: "20px auto" }}
        >
          로그인하기
        </button>
      </div>
    );
  }

  return (
    <div className="mypage-wrapper">
      <button className="mypage-back-btn" onClick={handleBackToList}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12.5 15L7.5 10L12.5 5" />
        </svg>
        목록으로
      </button>

      <div className="mypage-header">
        <h1>IT 매거진 구독</h1>
        <p className="mypage-header-desc">
          프리미엄 콘텐츠를 제한 없이 이용하세요
        </p>
      </div>

      <div className="mypage-grid">
        {/* 프로필 카드 */}
        <div className="mypage-profile-card">
          {profile.profileImage ? (
            <img
              src={profile.profileImage}
              alt={profile.name}
              className="mypage-avatar"
            />
          ) : (
            // 프로필 사진이 없는 경우 기본 아바타 아이콘 표시
            <div className="mypage-avatar" style={{ 
              backgroundColor: '#e5e7eb', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <svg 
                width="64" 
                height="64" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#9ca3af" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          )}
          <h2 className="mypage-name">{profile.name}</h2>
          <p className="mypage-bio-text">{profile.email}</p>
          <div className="mypage-join-date">가입일 {profile.joinDate}</div>
        </div>

        {/* 구독 플랜 카드 */}
        <div
          className={`mypage-subscription-card ${isSubscribed ? "active" : ""}`}
        >
          <div className="mypage-subscription-header">
            <h3 className="mypage-card-title">구독 플랜</h3>
            {isSubscribed && (
              <span className="mypage-badge-active">{status}</span>
            )}
            {!isSubscribed && (
              <span className="mypage-badge-free">{status}</span>
            )}
          </div>

          {isSubscribed ? (
            <div className="mypage-subscription-active">
              <div className="mypage-plan-name">IT Magazine Premium</div>
              <div className="mypage-plan-features">
                <div className="mypage-feature-item">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M13.3337 4L6.00033 11.3333L2.66699 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>모든 프리미엄 콘텐츠 무제한 이용</span>
                </div>
                <div className="mypage-feature-item">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M13.3337 4L6.00033 11.3333L2.66699 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>매주 새로운 IT 트렌드 리포트</span>
                </div>
                <div className="mypage-feature-item">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M13.3337 4L6.00033 11.3333L2.66699 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>광고 없는 깔끔한 읽기 환경</span>
                </div>
              </div>
              <button
                className="mypage-cancel-btn"
                onClick={handleCancelSubscription}
                disabled={isCanceling}
              >
                {isCanceling ? "취소 처리 중..." : "구독 취소"}
              </button>
            </div>
          ) : (
            <div className="mypage-subscription-inactive">
              <div className="mypage-unsubscribed-message">
                구독하고 프리미엄 콘텐츠를 즐겨보세요
              </div>
              <div className="mypage-plan-preview">
                <div className="mypage-preview-item">
                  ✓ 모든 프리미엄 콘텐츠
                </div>
                <div className="mypage-preview-item">✓ 매주 트렌드 리포트</div>
                <div className="mypage-preview-item">✓ 광고 없는 환경</div>
              </div>
              <button
                className="mypage-subscribe-btn"
                onClick={handleSubscriptionToggle}
              >
                지금 구독하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GlossaryMagazinesMypage;
