"use server";

import { z } from "zod";
import { db } from "@/db";
import { quizBoxes, questions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export type QuestionInput = {
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
  commonMisconception?: string | null;
};

const createQuizBoxSchema = z.object({
  title: z.string().min(1, "실험 주제를 입력해주세요"),
  safetyContent: z.string().min(1, "안전수칙 내용이 필요합니다"),
  questionDurationMs: z.number().int().min(5000).max(120000).default(30000),
  questions: z.array(z.object({
    text: z.string().min(1),
    options: z.array(z.string()).length(4),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string().min(1),
    category: z.string().min(1),
    commonMisconception: z.string().nullable().optional(),
  })).min(1),
});

export async function createQuizBox(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const raw = formData.get("data");
  if (!raw || typeof raw !== "string") {
    return { error: "잘못된 요청입니다" };
  }

  const parsed = JSON.parse(raw);
  const result = createQuizBoxSchema.safeParse(parsed);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { title, safetyContent, questionDurationMs, questions: questionInputs } = result.data;

  const now = new Date().toISOString();
  const box = db.insert(quizBoxes).values({
    title,
    safetyContent,
    instructorId: session.userId,
    questionDurationMs,
    createdAt: now,
    updatedAt: now,
  }).returning().get();

  for (let i = 0; i < questionInputs.length; i++) {
    const q = questionInputs[i];
    db.insert(questions).values({
      quizBoxId: box.id,
      index: i,
      text: q.text,
      options: JSON.stringify(q.options),
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      category: q.category,
      createdAt: now,
    }).run();
  }

  redirect(`/quiz-boxes/${box.id}`);
}

export async function confirmQuizBox(quizBoxId: number) {
  const session = await getSession();
  if (!session) return { error: "인증이 필요합니다" };

  const box = db.select().from(quizBoxes).where(
    and(eq(quizBoxes.id, quizBoxId), eq(quizBoxes.instructorId, session.userId))
  ).get();

  if (!box) return { error: "퀴즈함을 찾을 수 없습니다" };

  db.update(quizBoxes)
    .set({ isConfirmed: true, updatedAt: new Date().toISOString() })
    .where(eq(quizBoxes.id, quizBoxId))
    .run();

  return { success: true };
}

export async function deleteQuizBox(quizBoxId: number) {
  const session = await getSession();
  if (!session) return { error: "인증이 필요합니다" };

  const box = db.select().from(quizBoxes).where(
    and(eq(quizBoxes.id, quizBoxId), eq(quizBoxes.instructorId, session.userId))
  ).get();

  if (!box) return { error: "퀴즈함을 찾을 수 없습니다" };

  db.delete(quizBoxes).where(eq(quizBoxes.id, quizBoxId)).run();
  return { success: true };
}
