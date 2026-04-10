import { NextResponse } from "next/server";
import { analyzeResults } from "@/lib/ai/analyze-results";

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId || typeof sessionId !== "number") {
      return NextResponse.json({ error: "sessionId가 필요합니다" }, { status: 400 });
    }

    const result = await analyzeResults(sessionId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[AI] 분석 실패:", error);
    return NextResponse.json(
      { error: "분석에 실패했습니다" },
      { status: 500 }
    );
  }
}
