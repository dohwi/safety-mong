import { db } from "@/db";
import { sessions, participants, questions, answers } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { SessionPhase, LiveParticipant } from "./types";

export interface LiveSessionState {
  sessionId: number;
  phase: SessionPhase;
  currentQuestionIndex: number;
  participants: Map<number, LiveParticipant>;
  currentQuestionAnswers: Map<number, number>;
  questionStats: Map<number, { correctCount: number; optionDistribution: number[] }>;
}

const liveSessions = new Map<number, LiveSessionState>();

export function getLiveSession(sessionId: number): LiveSessionState | undefined {
  return liveSessions.get(sessionId);
}

export function createLiveSession(sessionId: number): LiveSessionState {
  const state: LiveSessionState = {
    sessionId,
    phase: "waiting",
    currentQuestionIndex: 0,
    participants: new Map(),
    currentQuestionAnswers: new Map(),
    questionStats: new Map(),
  };
  liveSessions.set(sessionId, state);
  return state;
}

export function restoreLiveSession(sessionId: number): LiveSessionState | undefined {
  if (liveSessions.has(sessionId)) {
    return liveSessions.get(sessionId);
  }

  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  if (!session || session.phase === "closed") return undefined;

  const state = createLiveSession(sessionId);
  state.phase = session.phase as SessionPhase;
  state.currentQuestionIndex = session.currentQuestionIndex;

  const dbParticipants = db.select().from(participants).where(eq(participants.sessionId, sessionId)).all();
  for (const p of dbParticipants) {
    state.participants.set(p.id, { id: p.id, nickname: p.nickname, hasAnswered: false });
  }

  return state;
}

export function persistPhase(sessionId: number, phase: SessionPhase, currentQuestionIndex: number) {
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { phase, currentQuestionIndex };

  if (phase === "active" && currentQuestionIndex === 0) {
    updates.startedAt = now;
  }
  if (phase === "completed" || phase === "closed") {
    updates.endedAt = now;
  }

  db.update(sessions).set(updates).where(eq(sessions.id, sessionId)).run();
}

export function addParticipant(sessionId: number, participantId: number, nickname: string) {
  const state = getLiveSession(sessionId);
  if (!state) return;
  state.participants.set(participantId, { id: participantId, nickname, hasAnswered: false });
}

export function resetAnswers(sessionId: number) {
  const state = getLiveSession(sessionId);
  if (!state) return;
  state.currentQuestionAnswers.clear();
  for (const p of state.participants.values()) {
    p.hasAnswered = false;
  }
}

export function recordAnswer(
  sessionId: number,
  participantId: number,
  questionId: number,
  selectedIndex: number,
  isCorrect: boolean,
  responseTimeMs: number
) {
  const state = getLiveSession(sessionId);
  if (!state) return;

  state.currentQuestionAnswers.set(participantId, selectedIndex);
  const participant = state.participants.get(participantId);
  if (participant) participant.hasAnswered = true;

  const questionIndex = state.currentQuestionIndex;
  let stats = state.questionStats.get(questionIndex);
  if (!stats) {
    const questionCount = db.select().from(questions).where(eq(questions.quizBoxId, state.sessionId)).all().length;
    stats = { correctCount: 0, optionDistribution: new Array(4).fill(0) };
    state.questionStats.set(questionIndex, stats);
  }
  if (isCorrect) stats.correctCount++;
  if (selectedIndex >= 0 && selectedIndex < 4) stats.optionDistribution[selectedIndex]++;

  db.insert(answers).values({
    sessionId,
    questionId,
    participantId,
    selectedIndex,
    isCorrect,
    responseTimeMs,
    submittedAt: new Date().toISOString(),
  }).run();
}

export function getParticipantCount(sessionId: number): number {
  const state = getLiveSession(sessionId);
  return state?.participants.size ?? 0;
}

export function removeLiveSession(sessionId: number) {
  liveSessions.delete(sessionId);
}
