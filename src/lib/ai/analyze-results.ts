import { generateText, Output } from "ai";
import { openrouter } from "./client";
import { analysisSchema, type AnalysisOutput } from "./schemas";
import { buildAnalysisPrompt } from "./prompts";
import { db } from "@/db";
import { sessions, questions, answers, quizBoxes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function analyzeResults(sessionId: number): Promise<AnalysisOutput> {
  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  if (!session) throw new Error("세션을 찾을 수 없습니다");

  const box = db.select().from(quizBoxes).where(eq(quizBoxes.id, session.quizBoxId)).get();
  if (!box) throw new Error("퀴즈함을 찾을 수 없습니다");

  const questionList = db.select().from(questions)
    .where(eq(questions.quizBoxId, box.id))
    .orderBy(questions.index)
    .all();

  const allAnswers = db.select().from(answers)
    .where(eq(answers.sessionId, sessionId))
    .all();

  if (allAnswers.length === 0) {
    const emptyResult: AnalysisOutput = {
      summary: "참여자가 없어 분석할 데이터가 없습니다.",
      weakAreas: [],
      topMisconceptions: [],
      recommendations: [],
    };
    return emptyResult;
  }

  const questionStats = questionList.map((q, index) => {
    const qAnswers = allAnswers.filter((a) => a.questionId === q.id);
    const correctCount = qAnswers.filter((a) => a.isCorrect).length;
    const distribution = [0, 1, 2, 3].map((i) => qAnswers.filter((a) => a.selectedIndex === i).length);

    return {
      index,
      text: q.text,
      category: q.category ?? "기타",
      correctRate: qAnswers.length > 0 ? correctCount / qAnswers.length : 0,
      optionDistribution: distribution,
    };
  });

  const totalParticipants = new Set(allAnswers.map((a) => a.participantId)).size;

  try {
    const result = await generateText({
      model: openrouter.chatModel("google/gemini-2.0-flash-001"),
      system: "당신은 실험실 안전 교육 분석 전문가입니다. 객관적인 데이터를 기반으로 그룹의 안전 지식 취약점을 분석합니다.",
      prompt: buildAnalysisPrompt({
        topic: box.title,
        totalParticipants,
        questions: questionStats,
      }),
      output: Output.object({
        schema: analysisSchema,
      }),
      maxRetries: 1,
    });

    const analysis = result.output as AnalysisOutput;

    db.update(sessions)
      .set({
        aiAnalysis: JSON.stringify(analysis),
        phase: "analysis",
      })
      .where(eq(sessions.id, sessionId))
      .run();

    return analysis;
  } catch {
    const fallback: AnalysisOutput = {
      summary: `${totalParticipants}명 참여, ${questionList.length}문항 평균 정답률 분석 완료. AI 상세 분석을 사용할 수 없습니다.`,
      weakAreas: questionStats
        .filter((q) => q.correctRate < 0.5)
        .map((q) => ({ category: q.category, description: `문제 ${q.index + 1} 정답률 ${(q.correctRate * 100).toFixed(0)}%`, correctRate: q.correctRate })),
      topMisconceptions: [],
      recommendations: [],
    };

    db.update(sessions)
      .set({
        aiAnalysis: JSON.stringify(fallback),
        phase: "analysis",
      })
      .where(eq(sessions.id, sessionId))
      .run();

    return fallback;
  }
}
