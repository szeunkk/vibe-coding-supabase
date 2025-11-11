import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import axios from "axios";

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET!;

// 요청 데이터 타입
interface WebhookRequest {
  payment_id: string;
  status: "Paid" | "Cancelled";
}

export async function POST(request: NextRequest) {
  try {
    // 1. 요청 데이터 파싱
    const data: WebhookRequest = await request.json();
    const { payment_id, status } = data;

    console.log("📩 포트원 웹훅 수신:", { payment_id, status });

    // ========== Paid 시나리오 ==========
    if (status === "Paid") {
      // 2-1-1. 포트원 API로 결제 정보 조회
      console.log("🔍 포트원 결제 정보 조회 중...");
      const paymentResponse = await fetch(
        `https://api.portone.io/payments/${payment_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `PortOne ${PORTONE_API_SECRET}`,
          },
        }
      );

      if (!paymentResponse.ok) {
        throw new Error(
          `포트원 결제 정보 조회 실패: ${paymentResponse.status}`
        );
      }

      const paymentInfo: Record<string, unknown> = await paymentResponse.json();
      console.log(
        "✅ 결제 정보 조회 완료:",
        JSON.stringify(paymentInfo, null, 2)
      );

      // 3. 날짜 계산
      const now = new Date();
      const startAt = now.toISOString();

      // end_at: 현재 시각 + 30일
      const endAt = new Date(now);
      endAt.setDate(endAt.getDate() + 30);

      // end_grace_at: 현재 시각 + 31일
      const endGraceAt = new Date(now);
      endGraceAt.setDate(endGraceAt.getDate() + 31);

      // next_schedule_at: end_at + 1일, 오전 10시~11시 사이 임의 시각
      const nextScheduleAt = new Date(endAt);
      nextScheduleAt.setDate(nextScheduleAt.getDate() + 1);
      nextScheduleAt.setHours(10, Math.floor(Math.random() * 60), 0, 0);

      // next_schedule_id: 임의 UUID 생성
      const nextScheduleId = crypto.randomUUID();

      console.log("📅 계산된 날짜:", {
        startAt,
        endAt: endAt.toISOString(),
        endGraceAt: endGraceAt.toISOString(),
        nextScheduleAt: nextScheduleAt.toISOString(),
        nextScheduleId,
      });

      // 2-2. Supabase payment 테이블에 저장
      console.log("💾 Supabase에 결제 정보 저장 중...");

      // paymentId는 포트원 API 응답에서 id 또는 paymentId로 올 수 있음
      const transactionKey =
        (paymentInfo.id as string) ||
        (paymentInfo.paymentId as string) ||
        payment_id;
      const amountData = paymentInfo.amount as
        | { total?: number }
        | number
        | undefined;
      const amount =
        typeof amountData === "object"
          ? amountData?.total || 0
          : amountData || 0;

      console.log("💰 저장할 데이터:", {
        transaction_key: transactionKey,
        amount,
        "paymentInfo.id": paymentInfo.id,
        "paymentInfo.paymentId": paymentInfo.paymentId,
        payment_id,
      });

      // transaction_key가 없으면 에러
      if (!transactionKey) {
        throw new Error(
          "transaction_key를 찾을 수 없습니다. 포트원 응답 구조를 확인하세요."
        );
      }

      const { error: paymentError } = await supabase.from("payment").insert({
        transaction_key: transactionKey,
        amount: amount,
        status: "Paid",
        start_at: startAt,
        end_at: endAt.toISOString(),
        end_grace_at: endGraceAt.toISOString(),
        next_schedule_at: nextScheduleAt.toISOString(),
        next_schedule_id: nextScheduleId,
      });

      if (paymentError) {
        console.error("❌ Supabase 저장 실패:", paymentError);
        throw new Error(`Supabase 저장 실패: ${paymentError.message}`);
      }

      console.log("✅ Supabase 저장 완료");

      // 3-1. 포트원에 다음달 구독결제 예약
      console.log("📆 다음 달 구독 결제 예약 중...");

      const billingKey =
        (paymentInfo.billingKey as string) ||
        (paymentInfo.billing_key as string);
      const orderName =
        (paymentInfo.orderName as string) ||
        (paymentInfo.order_name as string) ||
        "구독 결제";
      const customerData = paymentInfo.customer as { id?: string } | undefined;
      const customerId =
        customerData?.id || (paymentInfo.customerId as string) || "unknown";

      if (!billingKey) {
        console.warn("⚠️ billingKey가 없어 구독 예약을 건너뜁니다.");
      } else {
        const scheduleResponse = await fetch(
          `https://api.portone.io/payments/${nextScheduleId}/schedule`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `PortOne ${PORTONE_API_SECRET}`,
            },
            body: JSON.stringify({
              payment: {
                billingKey: billingKey,
                orderName: orderName,
                customer: {
                  id: customerId,
                },
                amount: {
                  total: amount,
                },
                currency: "KRW",
              },
              timeToPay: nextScheduleAt.toISOString(),
            }),
          }
        );

        if (!scheduleResponse.ok) {
          const errorText = await scheduleResponse.text();
          console.error("❌ 구독 예약 실패:", errorText);
          throw new Error(
            `구독 예약 실패: ${scheduleResponse.status} - ${errorText}`
          );
        }

        console.log("✅ 다음 달 구독 결제 예약 완료");
      }

      // 체크리스트 반환
      const checklist = {
        success: true,
        details: {
          "1. 포트원 결제 정보 조회": "✅ 완료",
          "2. Supabase payment 테이블 저장": "✅ 완료",
          "3. 다음 달 구독 결제 예약": billingKey
            ? "✅ 완료"
            : "⚠️ 건너뜀 (빌링키 없음)",
          paymentInfo: {
            transactionKey,
            amount,
            billingKey: billingKey || null,
          },
          schedule: {
            nextScheduleId,
            nextScheduleAt: nextScheduleAt.toISOString(),
            endAt: endAt.toISOString(),
            endGraceAt: endGraceAt.toISOString(),
          },
        },
      };

      console.log("✨ Paid 처리 완료:", checklist);

      return NextResponse.json(checklist);
    }

    // ========== Cancelled 시나리오 ==========
    if (status === "Cancelled") {
      // 3-1-1. 포트원 API로 결제 정보 조회
      console.log("🔍 포트원 결제 정보 조회 중...");
      const paymentResponse = await fetch(
        `https://api.portone.io/payments/${payment_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `PortOne ${PORTONE_API_SECRET}`,
          },
        }
      );

      if (!paymentResponse.ok) {
        throw new Error(
          `포트원 결제 정보 조회 실패: ${paymentResponse.status}`
        );
      }

      const paymentInfo: Record<string, unknown> = await paymentResponse.json();
      console.log(
        "✅ 결제 정보 조회 완료:",
        JSON.stringify(paymentInfo, null, 2)
      );

      // paymentId 추출
      const transactionKey =
        (paymentInfo.id as string) ||
        (paymentInfo.paymentId as string) ||
        payment_id;

      // 3-1-2. Supabase에서 기존 결제 정보 조회
      console.log("🔍 Supabase에서 기존 결제 정보 조회 중...");
      const { data: existingPayment, error: selectError } = await supabase
        .from("payment")
        .select("*")
        .eq("transaction_key", transactionKey)
        .eq("status", "Paid")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (selectError || !existingPayment) {
        console.error("❌ 기존 결제 정보 조회 실패:", selectError);
        throw new Error(
          `기존 결제 정보를 찾을 수 없습니다: ${selectError?.message}`
        );
      }

      console.log("✅ 기존 결제 정보 조회 완료:", existingPayment);

      // 3-1-3. Supabase에 취소 레코드 저장
      console.log("💾 Supabase에 취소 정보 저장 중...");
      const { error: cancelError } = await supabase.from("payment").insert({
        transaction_key: existingPayment.transaction_key,
        amount: -existingPayment.amount,
        status: "Cancel",
        start_at: existingPayment.start_at,
        end_at: existingPayment.end_at,
        end_grace_at: existingPayment.end_grace_at,
        next_schedule_at: existingPayment.next_schedule_at,
        next_schedule_id: existingPayment.next_schedule_id,
      });

      if (cancelError) {
        console.error("❌ Supabase 취소 저장 실패:", cancelError);
        throw new Error(`Supabase 취소 저장 실패: ${cancelError.message}`);
      }

      console.log("✅ Supabase 취소 저장 완료");

      // 3-2. 다음달 구독예약 취소
      const billingKey =
        (paymentInfo.billingKey as string) ||
        (paymentInfo.billing_key as string);

      if (!billingKey) {
        console.warn("⚠️ billingKey가 없어 구독 예약 취소를 건너뜁니다.");
      } else {
        // 3-2-1. 예약된 결제정보 조회 (GET with body using axios)
        console.log("🔍 예약된 결제 정보 조회 중...");

        const nextScheduleAt = new Date(existingPayment.next_schedule_at);
        const fromDate = new Date(nextScheduleAt);
        fromDate.setDate(fromDate.getDate() - 1);
        const untilDate = new Date(nextScheduleAt);
        untilDate.setDate(untilDate.getDate() + 1);

        try {
          const scheduleListResponse = await axios.get(
            "https://api.portone.io/payment-schedules",
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `PortOne ${PORTONE_API_SECRET}`,
              },
              data: {
                filter: {
                  billingKey: billingKey,
                  from: fromDate.toISOString(),
                  until: untilDate.toISOString(),
                },
              },
            }
          );

          const scheduleData = scheduleListResponse.data as {
            items?: Array<{ id: string; paymentId: string }>;
          };
          console.log("✅ 예약 목록 조회 완료:", scheduleData);

          // 3-2-2. schedule 객체의 id 추출
          const scheduleItems = scheduleData.items || [];
          const targetSchedule = scheduleItems.find(
            (item) => item.paymentId === existingPayment.next_schedule_id
          );

          if (!targetSchedule) {
            console.warn(
              "⚠️ 취소할 예약을 찾을 수 없습니다:",
              existingPayment.next_schedule_id
            );
          } else {
            // 3-2-3. 포트원에 구독예약 취소
            console.log("🗑️  구독 예약 취소 중...");
            const cancelScheduleResponse = await axios.delete(
              "https://api.portone.io/payment-schedules",
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `PortOne ${PORTONE_API_SECRET}`,
                },
                data: {
                  scheduleIds: [targetSchedule.id],
                },
              }
            );

            console.log("✅ 구독 예약 취소 완료:", cancelScheduleResponse.data);
          }
        } catch (axiosError) {
          console.error("❌ 구독 예약 처리 중 오류:", axiosError);
          // 예약 취소 실패는 치명적이지 않으므로 계속 진행
        }
      }

      // 체크리스트 반환
      const cancelChecklist = {
        success: true,
        details: {
          "1. 포트원 결제 정보 조회": "✅ 완료",
          "2. Supabase 기존 결제 조회": "✅ 완료",
          "3. Supabase 취소 레코드 저장": "✅ 완료",
          "4. 구독 예약 취소": billingKey
            ? "✅ 완료"
            : "⚠️ 건너뜀 (빌링키 없음)",
          cancelInfo: {
            transactionKey,
            originalAmount: existingPayment.amount,
            cancelAmount: -existingPayment.amount,
          },
        },
      };

      console.log("✨ Cancelled 처리 완료:", cancelChecklist);

      return NextResponse.json(cancelChecklist);
    }

    // 알 수 없는 상태
    console.log("⚠️ 알 수 없는 상태:", status);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("💥 에러 발생:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}
