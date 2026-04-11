import { describe, it, expect } from "vitest";
import {
  quizGenerationSchema,
  analysisSchema,
  validateQuizOutput,
  type QuizGenerationOutput,
} from "./schemas";

describe("AI Schemas", () => {
  describe("quizGenerationSchema", () => {
    it("validates a correct quiz output", () => {
      const q = {
        text: "Q1?",
        options: ["A", "B", "C", "D"],
        correctIndex: 0,
        questionDurationMs: 30000,
        explanation: "왜냐하면",
        category: "화학취급",
        commonMisconception: "오개념 설명",
      };
      const input = {
        safetyContent: "안전수칙 내용",
        questions: [q, { ...q, text: "Q2?" }, { ...q, text: "Q3?" }],
      };

      const result = quizGenerationSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("rejects when options are not 4", () => {
      const q = {
        text: "Q?",
        options: ["A", "B"],
        correctIndex: 0,
        questionDurationMs: 30000,
        explanation: "해설",
        category: "화학취급",
        commonMisconception: null,
      };
      const input = {
        safetyContent: "안전수칙",
        questions: [q, { ...q, options: ["A", "B", "C", "D"] }, { ...q, options: ["A", "B", "C", "D"] }],
      };

      const result = quizGenerationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects when correctIndex is out of range", () => {
      const q = {
        text: "Q?",
        options: ["A", "B", "C", "D"],
        correctIndex: 5,
        questionDurationMs: 30000,
        explanation: "해설",
        category: "화학취급",
        commonMisconception: null,
      };
      const input = {
        safetyContent: "안전수칙",
        questions: [q, { ...q, correctIndex: 0 }, { ...q, correctIndex: 0 }],
      };

      const result = quizGenerationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("accepts nullable commonMisconception", () => {
      const q = {
        text: "Q?",
        options: ["A", "B", "C", "D"],
        correctIndex: 0,
        questionDurationMs: 30000,
        explanation: "해설",
        category: "화학취급",
        commonMisconception: null,
      };
      const input = {
        safetyContent: "안전수칙",
        questions: [q, { ...q, text: "Q2?" }, { ...q, text: "Q3?" }],
      };

      const result = quizGenerationSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("analysisSchema", () => {
    it("validates a correct analysis output", () => {
      const input = {
        summary: "그룹 이해도 요약",
        weakAreas: [
          { category: "화학취급", description: "취약함", correctRate: 0.3 },
        ],
        topMisconceptions: [
          { misconception: "오개념", affectedQuestions: [0, 2], explanation: "설명" },
        ],
        recommendations: [
          { priority: "high" as const, title: "추가 교육", description: "설명" },
        ],
      };

      const result = analysisSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("validateQuizOutput", () => {
    it("returns no errors for valid output", () => {
      const output: QuizGenerationOutput = {
        safetyContent: "안전수칙",
        questions: [
          {
            text: "Q1?",
            options: ["A", "B", "C", "D"],
            correctIndex: 0,
            questionDurationMs: 30000,
            explanation: "해설",
            category: "화학취급",
            commonMisconception: null,
          },
        ],
      };

      expect(validateQuizOutput(output)).toEqual([]);
    });

    it("returns error for empty questions", () => {
      const output: QuizGenerationOutput = {
        safetyContent: "안전수칙",
        questions: [],
      };

      const errors = validateQuizOutput(output);
      expect(errors).toContain("생성된 문제가 없습니다");
    });

    it("returns error for duplicate options", () => {
      const output: QuizGenerationOutput = {
        safetyContent: "안전수칙",
        questions: [
          {
            text: "Q?",
            options: ["A", "A", "B", "B"],
            correctIndex: 0,
            questionDurationMs: 30000,
            explanation: "해설",
            category: "화학취급",
            commonMisconception: null,
          },
        ],
      };

      const errors = validateQuizOutput(output);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain("중복");
    });
  });
});
