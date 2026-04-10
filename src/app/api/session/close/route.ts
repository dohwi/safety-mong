import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const { sessionId } = await request.json();
    if (!sessionId || typeof sessionId !== "number") {
      return NextResponse.json({ error: "sessionId가 필요합니다" }, { status: 400 });
    }

    const dbSession = db.select().from(sessions).where(
      eq(sessions.id, sessionId)
    ).get();

    if (!dbSession || dbSession.instructorId !== session.userId) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    db.update(sessions)
      .set({ phase: "closed", endedAt: new Date().toISOString() })
      .where(eq(sessions.id, sessionId))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Session] 마감 실패:", error);
    return NextResponse.json({ error: "마감에 실패했습니다" }, { status: 500 });
  }
}
