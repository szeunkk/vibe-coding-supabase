import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET!;

// 요청 데이터 타입
interface CancelRequest {
  transactionKey: string;
}

export async function POST(request: NextRequest) {
  try {
    // Step 1: 요청 데이터 파싱
    const data: CancelRequest = await request.json();
    const { transactionKey } = data;

    console.log("📩 결제 취소 요청 수신:", { transactionKey });

    // Step 2: transactionKey 유효성 검사
    if (!transactionKey) {
      console.error("❌ transactionKey가 없습니다");
      return NextResponse.json(
        {
          success: false,
          error: "transactionKey가 필요합니다",
        },
        { status: 400 }
      );
    }

    // Step 3: 인가 - Authorization 헤더에서 토큰 확인
    console.log("🔐 사용자 인증 확인 중...");
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ 인증 토큰이 없습니다");
      return NextResponse.json(
        {
          success: false,
          error: "인증 토큰이 필요합니다",
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = await createServerSupabaseClient();

    // 토큰으로 사용자 인증
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("❌ 인증 실패:", authError);
      return NextResponse.json(
        {
          success: false,
          error: "인증되지 않은 사용자입니다",
        },
        { status: 401 }
      );
    }

    console.log("✅ 사용자 인증 완료:", user.id);

    // Step 4: 취소가능여부 검증 - payment 테이블 조회
    console.log("🔍 결제 정보 조회 중...");
    const { data: paymentData, error: paymentError } = await supabase
      .from("payment")
      .select("*")
      .eq("user_id", user.id)
      .eq("transaction_key", transactionKey)
      .single();

    // Step 5: 조회 결과 없는 경우, 에러 처리
    if (paymentError || !paymentData) {
      console.error("❌ 결제 정보 조회 실패:", paymentError);
      return NextResponse.json(
        {
          success: false,
          error: "취소할 수 있는 결제 정보를 찾을 수 없습니다",
        },
        { status: 404 }
      );
    }

    console.log("✅ 결제 정보 조회 완료:", paymentData);

    // Step 6: 포트원 API로 결제 취소 요청
    console.log("🔄 포트원에 결제 취소 요청 중...");
    const cancelResponse = await fetch(
      `https://api.portone.io/payments/${transactionKey}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `PortOne ${PORTONE_API_SECRET}`,
        },
        body: JSON.stringify({
          reason: "취소 사유 없음",
        }),
      }
    );

    // Step 7: 포트원 응답 확인
    if (!cancelResponse.ok) {
      const errorText = await cancelResponse.text();
      console.error("❌ 포트원 결제 취소 실패:", errorText);
      throw new Error(
        `결제 취소 실패: ${cancelResponse.status} - ${errorText}`
      );
    }

    const cancelData = await cancelResponse.json();
    console.log("✅ 결제 취소 완료:", JSON.stringify(cancelData, null, 2));

    // Step 8: 체크리스트와 함께 성공 응답 반환 (DB에 저장하지 않음)
    const checklist = {
      success: true,
      details: {
        "1. 요청 데이터 수신": "✅ 완료",
        "2. transactionKey 유효성 검사": "✅ 완료",
        "3. 사용자 인증": "✅ 완료",
        "4. 취소가능여부 검증": "✅ 완료",
        "5. 포트원 결제 취소 요청": "✅ 완료",
        "6. DB 저장": "⏭️ 건너뜀 (요구사항에 따라)",
        userId: user.id,
        transactionKey,
        cancelledAt: new Date().toISOString(),
      },
    };

    console.log("✨ 결제 취소 처리 완료:", checklist);

    return NextResponse.json(checklist);
  } catch (error) {
    console.error("💥 결제 취소 중 에러 발생:", error);

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
