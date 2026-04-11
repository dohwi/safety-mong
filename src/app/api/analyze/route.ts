import { NextResponse } from "next/server";
import { analyzeResults } from "@/lib/ai/analyze-results";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

const inProgress = new Set<number>();

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId || typeof sessionId !== "number") {
      return NextResponse.json({ error: "sessionId가 필요합니다" }, { status: 400 });
    }

    const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) {
      return NextResponse.json({ error: "세션을 찾을 수 없습니다" }, { status: 404 });
    }

    if (session.aiAnalysis) {
      return NextResponse.json(JSON.parse(session.aiAnalysis));
    }

    if (inProgress.has(sessionId)) {
      return NextResponse.json({ pending: true });
    }

    inProgress.add(sessionId);
    try {
      const result = await analyzeResults(sessionId);
      return NextResponse.json(result);
    } finally {
      inProgress.delete(sessionId);
    }
  } catch (error) {
    console.error("[AI] 분석 실패:", error);
    return NextResponse.json({ error: "분석에 실패했습니다" }, { status: 500 });
  }
}
