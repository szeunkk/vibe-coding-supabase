import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * POST /api/payments
 * PortOne v2 빌링키 결제 API
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 요청 데이터 파싱
    const body = await request.json();
    const { billingKey, orderName, amount, customer, customData } = body;

    // 1-1. 필수 데이터 검증
    if (!billingKey || !orderName || !amount || !customer?.id || !customData) {
      return NextResponse.json(
        {
          success: false,
          error: "필수 데이터가 누락되었습니다.",
        },
        { status: 400 }
      );
    }

    // 2. API 요청자 검증 인가 - Authorization 헤더에서 토큰 확인
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "인증 토큰이 필요합니다.",
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
          error: "인증되지 않은 사용자입니다.",
        },
        { status: 401 }
      );
    }

    console.log("✅ 사용자 인증 완료:", user.id);

    // 3. 결제 가능 여부 검증: 인가된 user_id === customer.id
    if (user.id !== customer.id || user.id !== customData) {
      return NextResponse.json(
        {
          success: false,
          error: "결제 권한이 없습니다.",
        },
        { status: 403 }
      );
    }

    // 4. PortOne API Secret Key 확인
    const apiSecret = process.env.PORTONE_API_SECRET;
    if (!apiSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "PortOne API Secret이 설정되지 않았습니다.",
        },
        { status: 500 }
      );
    }

    // 5. paymentId 생성 (고유한 ID)
    const paymentId = `payment_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;

    // 6. PortOne 결제 요청
    const portoneApiUrl = `https://api.portone.io/payments/${encodeURIComponent(
      paymentId
    )}/billing-key`;

    const portoneResponse = await fetch(portoneApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `PortOne ${apiSecret}`,
      },
      body: JSON.stringify({
        billingKey,
        orderName,
        amount: {
          total: amount,
        },
        customer: {
          id: customer.id,
        },
        customData: customData, // 로그인된 user_id
        currency: "KRW",
      }),
    });

    // 7. PortOne 응답 처리
    const portoneData = await portoneResponse.json();

    if (!portoneResponse.ok) {
      console.error("PortOne 결제 실패:", portoneData);
      return NextResponse.json(
        {
          success: false,
          error: portoneData.message || "결제 요청 실패",
        },
        { status: portoneResponse.status }
      );
    }

    // 8. 성공 응답 반환 (DB에 저장하지 않음)
    return NextResponse.json({
      success: true,
      paymentId,
      portoneData,
    });
  } catch (error) {
    console.error("결제 API 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

