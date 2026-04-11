import { describe, it, expect } from "vitest";
import { SYSTEM_PROMPT, buildQuizPrompt, buildAnalysisPrompt, FEW_SHOT_EXAMPLES } from "./prompts";

describe("AI Prompts", () => {
  it("SYSTEM_PROMPT contains key instructions", () => {
    expect(SYSTEM_PROMPT).toContain("안전 교육 전문가");
    expect(SYSTEM_PROMPT).toContain("4개의 선택지");
    expect(SYSTEM_PROMPT).toContain("category");
  });

  it("buildQuizPrompt includes topic", () => {
    const result = buildQuizPrompt("유기화학 실험");
    expect(result).toContain("유기화학 실험");
    expect(result).toContain("안전수칙");
    expect(result).toContain("5개");
  });

  it("buildAnalysisPrompt includes stats", () => {
    const result = buildAnalysisPrompt({
      topic: "화학실험",
      totalParticipants: 30,
      questions: [
        { index: 0, text: "Q1?", category: "화학취급", correctRate: 0.8, optionDistribution: [24, 3, 2, 1], options: ["A", "B", "C", "D"], correctIndex: 0, explanation: "해설" },
      ],
    });

    expect(result).toContain("화학실험");
    expect(result).toContain("30명");
    expect(result).toContain("80.0%");
  });

  it("FEW_SHOT_EXAMPLES has examples", () => {
    expect(FEW_SHOT_EXAMPLES).toContain("예시 1");
    expect(FEW_SHOT_EXAMPLES).toContain("예시 2");
  });
});
