"use server";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { sessions, quizBoxes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

export async function createSession(quizBoxId: number, targetParticipantCount?: number) {
  const session = await getSession();
  if (!session) redirect("/login");

  const box = db.select().from(quizBoxes).where(
    and(eq(quizBoxes.id, quizBoxId), eq(quizBoxes.instructorId, session.userId))
  ).get();

  if (!box) return { error: "퀴즈함을 찾을 수 없습니다" };

  const activeSession = db.select().from(sessions).where(
    and(
      eq(sessions.instructorId, session.userId),
      eq(sessions.phase, "waiting")
    )
  ).get();
  if (activeSession) return { error: "이미 활성 세션이 있습니다" };

  const code = crypto.randomBytes(4).toString("hex").toUpperCase();
  const result = db.insert(sessions).values({
    code,
    quizBoxId,
    instructorId: session.userId,
    phase: "waiting",
    targetParticipantCount: targetParticipantCount && targetParticipantCount > 0 ? targetParticipantCount : null,
    createdAt: new Date().toISOString(),
  }).returning().get();

  return { success: true, sessionId: result.id, code: result.code };
}
