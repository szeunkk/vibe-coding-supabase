"use client";

import * as PortOne from "@portone/browser-sdk/v2";
import { useRouter } from "next/navigation";

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

      // 고객 ID 생성
      const customerId = `customer_${Date.now()}`;

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
          fullName: "고객",
          email: "customer@example.com",
          phoneNumber: "010-0000-0000",
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
        },
        body: JSON.stringify({
          billingKey: issueResponse.billingKey,
          orderName: "IT 매거진 월간 구독",
          amount: 9900,
          customer: {
            id: customerId,
          },
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
