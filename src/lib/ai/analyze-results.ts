import { generateText, Output } from "ai";
import { openrouter } from "./client";
import { analysisSchema, type AnalysisOutput } from "./schemas";
import { buildAnalysisPrompt } from "./prompts";
import { db } from "@/db";
import { sessions, questions, answers, quizBoxes } from "@/db/schema";
import { eq } from "drizzle-orm";

interface QuestionStat {
  index: number;
  text: string;
  category: string;
  correctRate: number;
  optionDistribution: number[];
  options: string[];
  correctIndex: number;
  explanation: string;
}

function buildFallbackAnalysis(
  totalParticipants: number,
  questionCount: number,
  questionStats: QuestionStat[],
): AnalysisOutput {
  const overallRate = questionStats.length > 0
    ? questionStats.reduce((sum, q) => sum + q.correctRate, 0) / questionStats.length
    : 0;

  return {
    summary: `${totalParticipants}명 참여, ${questionCount}문항 평균 정답률 ${Math.round(overallRate * 100)}%. AI 상세 분석을 사용할 수 없습니다.`,
    overallCorrectRate: overallRate,
    questionBreakdowns: questionStats.map((q) => {
      const topWrongIdx = q.optionDistribution.reduce((maxI, val, i, arr) =>
        i !== q.correctIndex && val > (arr[maxI] ?? 0) ? i : maxI
      , -1 as number);
      const totalAnswers = q.optionDistribution.reduce((a, b) => a + b, 0);
      return {
        questionIndex: q.index,
        questionText: q.text,
        category: q.category,
        correctRate: q.correctRate,
        correctOptionText: q.options[q.correctIndex],
        topWrongOptionIndex: topWrongIdx >= 0 ? topWrongIdx : null,
        topWrongOptionText: topWrongIdx >= 0 ? q.options[topWrongIdx] : null,
        topWrongSelectionRate: topWrongIdx >= 0 && totalAnswers > 0 ? q.optionDistribution[topWrongIdx] / totalAnswers : null,
        whyStudentsConfused: "AI 분석 없이 통계만 제공됩니다.",
        teachingTip: "정답과 해설을 중심으로 다시 설명해주세요.",
      };
    }),
    topMisconceptions: [],
    recommendations: questionStats
      .filter((q) => q.correctRate < 0.5)
      .slice(0, 3)
      .map((q) => ({
        priority: q.correctRate < 0.3 ? "high" as const : "medium" as const,
        title: `${q.category} 보완 교육`,
        description: `문제 ${q.index + 1} "${q.text}" 정답률 ${Math.round(q.correctRate * 100)}%`,
      })),
  };
}

interface QuestionRow { id: number; options: string; text: string; category: string | null; correctIndex: number; explanation: string | null }
interface AnswerRow { questionId: number; isCorrect: boolean; selectedIndex: number; participantId: number }

function buildQuestionStats(questionList: QuestionRow[], allAnswers: AnswerRow[]) {
  return questionList.map((q, index) => {
    const qAnswers = allAnswers.filter((a) => a.questionId === q.id);
    const correctCount = qAnswers.filter((a) => a.isCorrect).length;
    const distribution = [0, 1, 2, 3].map((i) => {
      return qAnswers.filter((a) => a.selectedIndex === i).length;
    });
    let options: string[] = ["선택지 1", "선택지 2", "선택지 3", "선택지 4"];
    try { options = JSON.parse(q.options); } catch {}

    return {
      index,
      text: q.text,
      category: q.category ?? "기타",
      correctRate: qAnswers.length > 0 ? correctCount / qAnswers.length : 0,
      optionDistribution: distribution,
      options,
      correctIndex: q.correctIndex,
      explanation: q.explanation ?? "",
    };
  });
}

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
      overallCorrectRate: 0,
      questionBreakdowns: [],
      topMisconceptions: [],
      recommendations: [],
    };
    return emptyResult;
  }

  const questionStats = buildQuestionStats(questionList, allAnswers);
  const totalParticipants = new Set(allAnswers.map((a) => a.participantId)).size;

  try {
    console.log(`[AI] 프롬프트 구성 완료 (참여자: ${totalParticipants}명, 문항: ${questionStats.length}개)`);
    
    const result = await generateText({
      model: openrouter.chatModel("google/gemini-2.0-flash-001"),
      system: "당신은 실험실 안전 교육 분석 전문가입니다. 학생들이 실험 시작 전에 안전수칙 퀴즈를 푼 결과를 분석하여, 교강사가 실험 시작 전에 한 번 더 강조해야 할 안전 포인트를 도출합니다. 반드시 한국어로 답변하세요.",
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
    console.log("[AI] 분석 완료 및 DB 저장 중...");

    db.update(sessions)
      .set({
        aiAnalysis: JSON.stringify(analysis),
        phase: "analysis",
      })
      .where(eq(sessions.id, sessionId))
      .run();

    return analysis;
  } catch (error) {
    console.error("[AI] API 분석 중 오류 발생, 폴백 실행:", error);
    const fallback = buildFallbackAnalysis(totalParticipants, questionList.length, questionStats);

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
