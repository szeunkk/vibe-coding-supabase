import { useRouter } from "next/navigation";
import { useState } from "react";

interface CancelSubscriptionRequest {
  transactionKey: string;
}

interface CancelSubscriptionResponse {
  success: boolean;
  error?: string;
}

export function useCancelSubscription() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelSubscription = async (transactionKey: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Step 1: API 요청
      console.log("📩 구독 취소 요청 시작:", { transactionKey });
      
      const response = await fetch("/api/payments/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionKey,
        } as CancelSubscriptionRequest),
      });

      const data: CancelSubscriptionResponse = await response.json();

      // Step 2: 응답 확인
      if (!response.ok || !data.success) {
        throw new Error(data.error || "구독 취소에 실패했습니다");
      }

      console.log("✅ 구독 취소 성공:", data);

      // Step 3: 알림 메시지 표시
      alert("구독이 취소되었습니다.");

      // Step 4: 페이지 이동
      router.push("/magazines");

      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다";
      
      console.error("❌ 구독 취소 실패:", errorMessage);
      setError(errorMessage);
      alert(errorMessage);

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cancelSubscription,
    isLoading,
    error,
  };
}

