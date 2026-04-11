import { z } from "zod";

export const questionSchema = z.object({
  text: z.string(),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  questionDurationMs: z.number().int().min(5000).max(120000),
  explanation: z.string(),
  category: z.string(),
  commonMisconception: z.string().nullable(),
});

export const quizGenerationSchema = z.object({
  icon: z.string().describe("실험 주제에 가장 잘 어울리는 이모지 하나 (예: 🧪, 🔬, ⚡, 🔥, 🛡️, ☢️, 🧬, 🦠, 💊, 🧫, ⚗️, 🌡️, 🧯, 💡)"),
  safetyContent: z.string(),
  questions: z.array(questionSchema).min(3).max(10),
});

export type QuestionOutput = z.infer<typeof questionSchema>;
export type QuizGenerationOutput = z.infer<typeof quizGenerationSchema>;

export const questionBreakdownSchema = z.object({
  questionIndex: z.number(),
  questionText: z.string(),
  category: z.string(),
  correctRate: z.number(),
  correctOptionText: z.string(),
  topWrongOptionIndex: z.number().nullable(),
  topWrongOptionText: z.string().nullable(),
  topWrongSelectionRate: z.number().nullable(),
  whyStudentsConfused: z.string(),
  teachingTip: z.string(),
});

export const analysisSchema = z.object({
  summary: z.string(),
  overallCorrectRate: z.number(),
  questionBreakdowns: z.array(questionBreakdownSchema),
  topMisconceptions: z.array(z.object({
    misconception: z.string(),
    affectedQuestions: z.array(z.number()),
    explanation: z.string(),
  })),
  recommendations: z.array(z.object({
    priority: z.enum(["high", "medium", "low"]).default("medium"),
    title: z.string().default("추가 교육 필요"),
    description: z.string().default("해당 영역에 대한 보완 교육을 권장합니다."),
  })),
});

export type AnalysisOutput = z.infer<typeof analysisSchema>;

export function validateQuizOutput(output: QuizGenerationOutput): string[] {
  const errors: string[] = [];

  if (output.questions.length === 0) {
    errors.push("생성된 문제가 없습니다");
  }

  for (let i = 0; i < output.questions.length; i++) {
    const q = output.questions[i];
    const optionCount = new Set(q.options).size;
    if (optionCount < 4) {
      errors.push(`문제 ${i + 1}: 선택지에 중복이 있습니다`);
    }
  }

  return errors;
}
