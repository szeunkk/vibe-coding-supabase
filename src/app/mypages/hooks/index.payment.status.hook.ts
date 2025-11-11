import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Payment {
  id?: number;
  transaction_key: string;
  amount: number;
  status: string;
  start_at?: string;
  end_at?: string;
  end_grace_at?: string;
  next_schedule_at?: string;
  next_schedule_id?: string;
  created_at: string;
  user_id?: string;
}

interface PaymentStatusResult {
  isSubscribed: boolean;
  status: "구독중" | "Free";
  transactionKey?: string;
  isLoading: boolean;
  error?: string;
}

interface UsePaymentStatusParams {
  userId?: string; // 사용자 ID로 필터링
  transactionKeys?: string[]; // 또는 특정 transaction_key 목록으로 필터링
}

/**
 * 결제 상태 조회 Hook
 * - payment 테이블에서 특정 사용자의 transaction_key별 최신 레코드 조회
 * - 구독 활성 상태 확인 (status: Paid, 기간 내)
 *
 * @param params.userId - 사용자 ID (있으면 해당 사용자의 결제만 조회)
 * @param params.transactionKeys - transaction_key 목록 (있으면 해당 키만 조회)
 */
export const usePaymentStatus = (params?: UsePaymentStatusParams) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResult>({
    isSubscribed: false,
    status: "Free",
    isLoading: true,
  });

  useEffect(() => {
    checkPaymentStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.userId, params?.transactionKeys?.join(",")]);

  const checkPaymentStatus = async () => {
    try {
      setPaymentStatus((prev) => ({ ...prev, isLoading: true }));

      // Step 1: payment 테이블에서 레코드 조회
      let query = supabase.from("payment").select("*");

      // 사용자 ID로 필터링 (user_id 컬럼이 있다면)
      if (params?.userId) {
        query = query.eq("user_id", params.userId);
      }

      // transaction_key 목록으로 필터링
      if (params?.transactionKeys && params.transactionKeys.length > 0) {
        query = query.in("transaction_key", params.transactionKeys);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) {
        throw error;
      }

      const payments = (data as Payment[]) || [];

      if (payments.length === 0) {
        // 결과 0건: Free 상태
        setPaymentStatus({
          isSubscribed: false,
          status: "Free",
          isLoading: false,
        });
        return;
      }

      // Step 2: transaction_key로 그룹화하여 각 그룹의 최신 1건만 추출
      const groupedByTransactionKey = payments.reduce((acc, payment) => {
        const key = payment.transaction_key;
        if (
          !acc[key] ||
          new Date(payment.created_at) > new Date(acc[key].created_at)
        ) {
          acc[key] = payment;
        }
        return acc;
      }, {} as Record<string, Payment>);

      const latestPayments = Object.values(groupedByTransactionKey);

      // Step 3: 조건 필터링 (status === "Paid" && start_at <= 현재시각 <= end_grace_at)
      const currentTime = new Date();
      const activePayments = latestPayments.filter((payment) => {
        const isPaid = payment.status === "Paid";
        const startAt = payment.start_at ? new Date(payment.start_at) : null;
        const endGraceAt = payment.end_grace_at
          ? new Date(payment.end_grace_at)
          : null;

        const isWithinPeriod =
          startAt &&
          endGraceAt &&
          startAt <= currentTime &&
          currentTime <= endGraceAt;

        return isPaid && isWithinPeriod;
      });

      // Step 4: 결과에 따른 상태 설정
      if (activePayments.length > 0) {
        // 구독중 상태 (첫 번째 활성 구독 사용)
        setPaymentStatus({
          isSubscribed: true,
          status: "구독중",
          transactionKey: activePayments[0].transaction_key,
          isLoading: false,
        });
      } else {
        // Free 상태
        setPaymentStatus({
          isSubscribed: false,
          status: "Free",
          isLoading: false,
        });
      }
    } catch (error) {
      setPaymentStatus({
        isSubscribed: false,
        status: "Free",
        isLoading: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    }
  };

  return {
    ...paymentStatus,
    refresh: checkPaymentStatus,
  };
};
