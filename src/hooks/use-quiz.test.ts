/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useQuiz } from "./use-quiz";

describe("useQuiz", () => {
  it("initializes with waiting phase", () => {
    const { result } = renderHook(() => useQuiz(null, 1));
    expect(result.current.state.phase).toBe("waiting");
    expect(result.current.state.currentQuestion).toBeNull();
    expect(result.current.state.feedback).toBeNull();
  });

  it("does not submit when socket is null", () => {
    const { result } = renderHook(() => useQuiz(null, 1));
    expect(() => result.current.submitAnswer(0, 1)).not.toThrow();
  });
});
