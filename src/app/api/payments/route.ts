import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payments
 * PortOne v2 빌링키 결제 API
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 요청 데이터 파싱
    const body = await request.json();
    const { billingKey, orderName, amount, customer } = body;

    // 1-1. 필수 데이터 검증
    if (!billingKey || !orderName || !amount || !customer?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "필수 데이터가 누락되었습니다.",
        },
        { status: 400 }
      );
    }

    // 2. PortOne API Secret Key 확인
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

    // 3. paymentId 생성 (고유한 ID)
    const paymentId = `payment_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;

    // 4. PortOne 결제 요청
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
        currency: "KRW",
      }),
    });

    // 5. PortOne 응답 처리
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

    // 6. 성공 응답 반환 (DB에 저장하지 않음)
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

