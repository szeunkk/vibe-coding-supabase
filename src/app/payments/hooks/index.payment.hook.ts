"use client";

import * as PortOne from "@portone/browser-sdk/v2";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * 포트원 v2 빌링키 발급 및 구독 결제 Hook
 */
export const usePayment = () => {
  const router = useRouter();

  /**
   * 구독하기 - 빌링키 발급 및 결제 플로우
   */
  const handleSubscribe = async () => {
    try {
      // 로그인된 사용자 정보 가져오기
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("로그인이 필요합니다.");
        router.push("/auth/login");
        return;
      }

      // 세션 토큰 가져오기
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        alert("인증 세션이 만료되었습니다. 다시 로그인해주세요.");
        router.push("/auth/login");
        return;
      }

      // 환경변수 체크
      const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
      const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

      if (!storeId || !channelKey) {
        alert("포트원 설정이 올바르지 않습니다. 환경변수를 확인해주세요.");
        console.error("Missing environment variables:", {
          storeId,
          channelKey,
        });
        return;
      }

      // 고객 ID는 로그인된 user_id 사용
      const customerId = user.id;

      // 1-1) 포트원 빌링키 발급 화면 노출
      const issueResponse = await PortOne.requestIssueBillingKey({
        storeId,
        channelKey,
        billingKeyMethod: "CARD",
        issueId: `issue_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 15)}`,
        issueName: "IT 매거진 월간 구독",
        customer: {
          customerId,
          fullName: user.user_metadata?.full_name || "고객",
          email: user.email || "customer@example.com",
          phoneNumber: user.user_metadata?.phone_number || "010-0000-0000",
        },
      });

      // 빌링키 발급 실패 처리
      if (!issueResponse || issueResponse.code !== undefined) {
        alert(
          `빌링키 발급 실패: ${issueResponse?.message || "알 수 없는 오류"}`
        );
        return;
      }

      // 빌링키 확인
      if (!issueResponse.billingKey) {
        alert("빌링키 발급에 실패했습니다.");
        return;
      }

      // 1-2) 빌링키 발급 완료 후, 결제 API 요청
      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`, // 인증토큰 추가
        },
        body: JSON.stringify({
          billingKey: issueResponse.billingKey,
          orderName: "IT 매거진 월간 구독",
          amount: 9900,
          customer: {
            id: customerId, // 로그인된 user_id
          },
          customData: user.id, // 로그인된 user_id
        }),
      });

      const paymentResult = await paymentResponse.json();

      // 결제 실패 처리
      if (!paymentResult.success) {
        alert(`결제 실패: ${paymentResult.error || "알 수 없는 오류"}`);
        return;
      }

      // 1-3) 구독결제 성공 이후 로직
      alert("구독에 성공하였습니다.");
      router.push("/magazines");
    } catch (error) {
      console.error("구독 처리 중 오류:", error);
      alert(
        `오류가 발생했습니다: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    }
  };

  return {
    handleSubscribe,
  };
};
