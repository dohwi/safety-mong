import { generateText, Output } from "ai";
import { openrouter } from "./client";
import { quizGenerationSchema, type QuizGenerationOutput, validateQuizOutput } from "./schemas";
import { SYSTEM_PROMPT, buildQuizPrompt, FEW_SHOT_EXAMPLES } from "./prompts";

export async function generateQuiz(topic: string): Promise<QuizGenerationOutput> {
  const result = await generateText({
    model: openrouter.chatModel("google/gemini-2.0-flash-001"),
    system: SYSTEM_PROMPT + "\n\n" + FEW_SHOT_EXAMPLES,
    prompt: buildQuizPrompt(topic),
    output: Output.object({
      schema: quizGenerationSchema,
    }),
    maxRetries: 2,
  });

  const output = result.output as QuizGenerationOutput;

  const errors = validateQuizOutput(output);
  if (errors.length > 0) {
    throw new Error(`퀴즈 검증 실패: ${errors.join(", ")}`);
  }

  return output;
}
