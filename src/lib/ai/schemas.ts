import { z } from "zod";

export const questionSchema = z.object({
  text: z.string(),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
  category: z.string(),
  commonMisconception: z.string().nullable(),
});

export const quizGenerationSchema = z.object({
  safetyContent: z.string(),
  questions: z.array(questionSchema).min(3).max(10),
});

export type QuestionOutput = z.infer<typeof questionSchema>;
export type QuizGenerationOutput = z.infer<typeof quizGenerationSchema>;

export const analysisSchema = z.object({
  summary: z.string(),
  weakAreas: z.array(z.object({
    category: z.string(),
    description: z.string(),
    correctRate: z.number(),
  })),
  topMisconceptions: z.array(z.object({
    misconception: z.string(),
    affectedQuestions: z.array(z.number()),
    explanation: z.string(),
  })),
  recommendations: z.array(z.object({
    priority: z.enum(["high", "medium", "low"]),
    title: z.string(),
    description: z.string(),
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
