"use server";

import { z } from "zod";
import { db } from "@/db";
import { quizBoxes, questions, sessions, participants, answers } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export type QuestionInput = {
  text: string;
  options: string[];
  correctIndex: number;
  questionDurationMs: number;
  explanation: string;
  category: string;
  commonMisconception?: string | null;
};

const createQuizBoxSchema = z.object({
  title: z.string().min(1, "실험 주제를 입력해주세요"),
  icon: z.string().min(1).default("🧪"),
  safetyContent: z.string().min(1, "안전수칙 내용이 필요합니다"),
  questions: z.array(z.object({
    text: z.string().min(1),
    options: z.array(z.string()).length(4),
    correctIndex: z.number().int().min(0).max(3),
    questionDurationMs: z.number().int().min(5000).max(120000),
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

  const { title, icon, safetyContent, questions: questionInputs } = result.data;
  const questionDurationMs = Math.round(
    questionInputs.reduce((sum, question) => sum + question.questionDurationMs, 0) / questionInputs.length
  );

  const now = new Date().toISOString();
  const box = db.insert(quizBoxes).values({
    title,
    icon,
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
        questionDurationMs: q.questionDurationMs,
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

  const boxSessions = db.select().from(sessions).where(eq(sessions.quizBoxId, quizBoxId)).all();
  for (const s of boxSessions) {
    db.delete(answers).where(eq(answers.sessionId, s.id)).run();
    db.delete(participants).where(eq(participants.sessionId, s.id)).run();
  }
  db.delete(sessions).where(eq(sessions.quizBoxId, quizBoxId)).run();
  db.delete(quizBoxes).where(eq(quizBoxes.id, quizBoxId)).run();
  return { success: true };
}

const activePhases = ["waiting", "active", "intermission"];

function hasActiveSession(quizBoxId: number): boolean {
  const active = db.select().from(sessions).where(
    and(eq(sessions.quizBoxId, quizBoxId), inArray(sessions.phase, activePhases))
  ).all();
  return active.length > 0;
}

function verifyOwnership(quizBoxId: number, instructorId: number) {
  return db.select().from(quizBoxes).where(
    and(eq(quizBoxes.id, quizBoxId), eq(quizBoxes.instructorId, instructorId))
  ).get();
}

export async function updateSafetyContent(quizBoxId: number, safetyContent: string) {
  const session = await getSession();
  if (!session) return { error: "인증이 필요합니다" };

  if (!safetyContent.trim()) return { error: "안전수칙 내용을 입력해주세요" };

  const box = verifyOwnership(quizBoxId, session.userId);
  if (!box) return { error: "퀴즈함을 찾을 수 없습니다" };

  if (hasActiveSession(quizBoxId)) return { error: "세션 진행 중에는 편집할 수 없습니다" };

  db.update(quizBoxes)
    .set({ safetyContent: safetyContent.trim(), updatedAt: new Date().toISOString() })
    .where(eq(quizBoxes.id, quizBoxId))
    .run();

  return { success: true };
}

const addQuestionSchema = z.object({
  text: z.string().min(1),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  questionDurationMs: z.number().int().min(5000).max(120000),
  explanation: z.string().min(1),
  category: z.string().min(1),
});

export async function addQuestion(quizBoxId: number, question: QuestionInput) {
  const session = await getSession();
  if (!session) return { error: "인증이 필요합니다" };

  const parsed = addQuestionSchema.safeParse(question);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const box = verifyOwnership(quizBoxId, session.userId);
  if (!box) return { error: "퀴즈함을 찾을 수 없습니다" };

  if (hasActiveSession(quizBoxId)) return { error: "세션 진행 중에는 편집할 수 없습니다" };

  const existing = db.select().from(questions)
    .where(eq(questions.quizBoxId, quizBoxId))
    .all();

  const maxIndex = existing.reduce((max, q) => Math.max(max, q.index), -1);

  db.insert(questions).values({
        quizBoxId,
        index: maxIndex + 1,
        text: parsed.data.text,
        options: JSON.stringify(parsed.data.options),
        correctIndex: parsed.data.correctIndex,
        questionDurationMs: parsed.data.questionDurationMs,
        explanation: parsed.data.explanation,
        category: parsed.data.category,
        createdAt: new Date().toISOString(),
  }).run();

  return { success: true };
}

export async function updateQuestionDuration(questionId: number, quizBoxId: number, questionDurationMs: number) {
  const session = await getSession();
  if (!session) return { error: "인증이 필요합니다" };

  if (!Number.isInteger(questionDurationMs) || questionDurationMs < 5000 || questionDurationMs > 120000) {
    return { error: "제한시간은 5초 이상 120초 이하여야 합니다" };
  }

  const box = verifyOwnership(quizBoxId, session.userId);
  if (!box) return { error: "퀴즈함을 찾을 수 없습니다" };

  if (hasActiveSession(quizBoxId)) return { error: "세션 진행 중에는 편집할 수 없습니다" };

  db.update(questions)
    .set({ questionDurationMs })
    .where(and(eq(questions.id, questionId), eq(questions.quizBoxId, quizBoxId)))
    .run();

  return { success: true };
}

export async function deleteQuestion(questionId: number, quizBoxId: number) {
  const session = await getSession();
  if (!session) return { error: "인증이 필요합니다" };

  const box = verifyOwnership(quizBoxId, session.userId);
  if (!box) return { error: "퀴즈함을 찾을 수 없습니다" };

  if (hasActiveSession(quizBoxId)) return { error: "세션 진행 중에는 편집할 수 없습니다" };

  db.delete(questions).where(
    and(eq(questions.id, questionId), eq(questions.quizBoxId, quizBoxId))
  ).run();

  const remaining = db.select().from(questions)
    .where(eq(questions.quizBoxId, quizBoxId))
    .orderBy(questions.index)
    .all();

  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].index !== i) {
      db.update(questions).set({ index: i }).where(eq(questions.id, remaining[i].id)).run();
    }
  }

  return { success: true };
}

export async function updateQuestion(questionId: number, quizBoxId: number, question: QuestionInput) {
  const session = await getSession();
  if (!session) return { error: "인증이 필요합니다" };

  const parsed = addQuestionSchema.safeParse(question);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const box = verifyOwnership(quizBoxId, session.userId);
  if (!box) return { error: "퀴즈함을 찾을 수 없습니다" };

  if (hasActiveSession(quizBoxId)) return { error: "세션 진행 중에는 편집할 수 없습니다" };

  db.update(questions)
    .set({
      text: parsed.data.text,
      options: JSON.stringify(parsed.data.options),
      correctIndex: parsed.data.correctIndex,
      questionDurationMs: parsed.data.questionDurationMs,
      explanation: parsed.data.explanation,
      category: parsed.data.category,
    })
    .where(and(eq(questions.id, questionId), eq(questions.quizBoxId, quizBoxId)))
    .run();

  return { success: true };
}
