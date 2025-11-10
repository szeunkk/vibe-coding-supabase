import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET!;

// 요청 데이터 타입
interface WebhookRequest {
  payment_id: string;
  status: "Paid" | "Cancelled";
}

// 포트원 결제 정보 타입
interface PortOnePaymentInfo {
  paymentId: string;
  amount: {
    total: number;
  };
  billingKey?: string;
  orderName: string;
  customer: {
    id: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // 1. 요청 데이터 파싱
    const data: WebhookRequest = await request.json();
    const { payment_id, status } = data;

    console.log("📩 포트원 웹훅 수신:", { payment_id, status });

    // status가 Paid가 아니면 처리하지 않음
    if (status !== "Paid") {
      console.log("⚠️ Paid 상태가 아니므로 처리 건너뜀");
      return NextResponse.json({ success: true });
    }

    // 2-1. 포트원 API로 결제 정보 조회
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
      throw new Error(`포트원 결제 정보 조회 실패: ${paymentResponse.status}`);
    }

    const paymentInfo: PortOnePaymentInfo = await paymentResponse.json();
    console.log("✅ 결제 정보 조회 완료:", paymentInfo);

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
    const { error: paymentError } = await supabase.from("payment").insert({
      transaction_key: paymentInfo.paymentId,
      amount: paymentInfo.amount.total,
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
            billingKey: paymentInfo.billingKey,
            orderName: paymentInfo.orderName,
            customer: {
              id: paymentInfo.customer.id,
            },
            amount: {
              total: paymentInfo.amount.total,
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

    // 체크리스트 반환
    const checklist = {
      success: true,
      details: {
        "1. 포트원 결제 정보 조회": "✅ 완료",
        "2. Supabase payment 테이블 저장": "✅ 완료",
        "3. 다음 달 구독 결제 예약": "✅ 완료",
        paymentInfo: {
          paymentId: paymentInfo.paymentId,
          amount: paymentInfo.amount.total,
          billingKey: paymentInfo.billingKey,
        },
        schedule: {
          nextScheduleId,
          nextScheduleAt: nextScheduleAt.toISOString(),
          endAt: endAt.toISOString(),
          endGraceAt: endGraceAt.toISOString(),
        },
      },
    };

    console.log("✨ 처리 완료:", checklist);

    return NextResponse.json(checklist);
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
