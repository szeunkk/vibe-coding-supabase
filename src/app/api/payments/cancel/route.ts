import { NextRequest, NextResponse } from "next/server";

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

    // Step 3: 포트원 API로 결제 취소 요청
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

    // Step 4: 포트원 응답 확인
    if (!cancelResponse.ok) {
      const errorText = await cancelResponse.text();
      console.error("❌ 포트원 결제 취소 실패:", errorText);
      throw new Error(
        `결제 취소 실패: ${cancelResponse.status} - ${errorText}`
      );
    }

    const cancelData = await cancelResponse.json();
    console.log("✅ 결제 취소 완료:", JSON.stringify(cancelData, null, 2));

    // Step 5: 체크리스트와 함께 성공 응답 반환
    const checklist = {
      success: true,
      details: {
        "1. 요청 데이터 수신": "✅ 완료",
        "2. transactionKey 유효성 검사": "✅ 완료",
        "3. 포트원 결제 취소 요청": "✅ 완료",
        "4. DB 저장": "⏭️ 건너뜀 (요구사항에 따라)",
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
