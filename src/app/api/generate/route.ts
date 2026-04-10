import { NextResponse } from "next/server";
import { generateQuiz } from "@/lib/ai/generate-quiz";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topic = body.topic;

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json(
        { error: "실험 주제를 입력해주세요" },
        { status: 400 }
      );
    }

    const result = await generateQuiz(topic.trim());
    return NextResponse.json(result);
  } catch (error) {
    console.error("[AI] 퀴즈 생성 실패:", error);

    if (error instanceof Error && error.message.includes("NoObjectGeneratedError")) {
      return NextResponse.json(
        { error: "AI가 올바른 형식의 응답을 생성하지 못했습니다. 다시 시도해주세요." },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { error: "퀴즈 생성에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
