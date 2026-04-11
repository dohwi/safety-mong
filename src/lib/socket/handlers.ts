import type { Server, Socket } from "socket.io";
import { db } from "@/db";
import { sessions, participants, questions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  getLiveSession,
  createLiveSession,
  restoreLiveSession,
  persistPhase,
  addParticipant,
  resetAnswers,
  recordAnswer,
  getParticipantCount,
} from "./session-state";
import { SessionTimer, IntermissionTimer } from "./timer";
import { decrypt } from "@/lib/auth";
import type { ClientToServerEvents, ServerToClientEvents, SessionStatePayload } from "./types";

const GRACE_PERIOD_MS = 500;
const MAX_PARTICIPANTS = 100;

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type SessionTimerBundle = {
  question: SessionTimer;
  intermission: IntermissionTimer;
  timerBroadcast: ReturnType<typeof setInterval> | null;
};

const sessionTimers = new Map<number, SessionTimerBundle>();

export function registerSocketHandlers(io: TypedServer) {
  io.on("connection", (socket: TypedSocket) => {
    socket.on("session:host", async ({ sessionId }) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        socket.emit("session:error", { message: "인증이 필요합니다" });
        return;
      }

      const session = await decrypt(token);
      if (!session) {
        socket.emit("session:error", { message: "인증이 만료되었습니다" });
        return;
      }

      const dbSession = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
      if (!dbSession || dbSession.instructorId !== session.userId) {
        socket.emit("session:error", { message: "권한이 없습니다" });
        return;
      }

      let state = restoreLiveSession(sessionId);
      if (!state) state = createLiveSession(sessionId);

      socket.join(`session:${sessionId}`);
      socket.join(`session:${sessionId}:host`);

      socket.emit("session:state", buildSessionStatePayload(sessionId, state, sessionTimers));
      emitTimerSnapshot(socket, sessionId, sessionTimers);
    });

    socket.on("session:join", ({ sessionId, nickname, reconnectToken }) => {
      const state = restoreLiveSession(sessionId);
      if (!state) {
        socket.emit("session:error", { message: "세션을 찾을 수 없습니다" });
        return;
      }

      if (state.phase === "closed") {
        socket.emit("session:error", { message: "종료된 세션입니다" });
        return;
      }

      if (reconnectToken) {
        const existing = db.select().from(participants).where(
          eq(participants.reconnectToken, reconnectToken)
        ).get();
        if (existing && existing.sessionId === sessionId) {
          socket.join(`session:${sessionId}`);
          addParticipant(sessionId, existing.id, existing.nickname);
          socket.emit("session:joined", {
            participantId: existing.id,
            nickname: existing.nickname,
            reconnectToken: existing.reconnectToken!,
          });
          socket.emit("session:state", buildSessionStatePayload(sessionId, state, sessionTimers));
          emitTimerSnapshot(socket, sessionId, sessionTimers);
          return;
        }
      }

      if (getParticipantCount(sessionId) >= MAX_PARTICIPANTS) {
        socket.emit("session:error", { message: "세션이 가득 찼습니다 (최대 100명)" });
        return;
      }

      const existing = db.select().from(participants).where(
        and(eq(participants.sessionId, sessionId), eq(participants.nickname, nickname))
      ).get();
      if (existing) {
        socket.emit("session:error", { message: "이미 사용 중인 닉네임입니다" });
        return;
      }

      const reconnect = crypto.randomUUID();
      const p = db.insert(participants).values({
        sessionId,
        nickname,
        reconnectToken: reconnect,
        joinedAt: new Date().toISOString(),
      }).returning().get();

      socket.join(`session:${sessionId}`);
      addParticipant(sessionId, p.id, p.nickname);

      socket.emit("session:joined", {
        participantId: p.id,
        nickname: p.nickname,
        reconnectToken: reconnect,
      });
      socket.emit("session:state", buildSessionStatePayload(sessionId, state, sessionTimers));
      emitTimerSnapshot(socket, sessionId, sessionTimers);

      io.to(`session:${sessionId}:host`).emit("participant:joined", {
        nickname: p.nickname,
        participantCount: getParticipantCount(sessionId),
        targetParticipantCount: state.targetParticipantCount,
      });
      io.to(`session:${sessionId}`).emit("participant:joined", {
        nickname: p.nickname,
        participantCount: getParticipantCount(sessionId),
        targetParticipantCount: state.targetParticipantCount,
      });
      if (state.targetParticipantCount && getParticipantCount(sessionId) >= state.targetParticipantCount && state.phase === "waiting") {
        startQuestion(io, sessionId, state, sessionTimers);
      }
    });

    socket.on("session:start", ({ sessionId }) => {
      const state = getLiveSession(sessionId);
      if (!state || state.phase !== "waiting") return;

      startQuestion(io, sessionId, state, sessionTimers);
    });

    socket.on("session:skip", ({ sessionId }) => {
      const state = getLiveSession(sessionId);
      if (!state || state.phase !== "active") return;

      const timers = sessionTimers.get(sessionId);
      if (timers) {
        timers.question.clear();
        clearTimerBroadcast(timers);
      }
      endQuestion(io, sessionId, state, sessionTimers);
    });

    socket.on("session:end", ({ sessionId }) => {
      const state = getLiveSession(sessionId);
      if (!state) return;

      const timers = sessionTimers.get(sessionId);
      if (timers) {
        timers.question.clear();
        timers.intermission.clear();
        clearTimerBroadcast(timers);
      }

      state.phase = "completed";
      persistPhase(sessionId, "completed", state.currentQuestionIndex);
      io.to(`session:${sessionId}`).emit("session:complete", { sessionId });
    });

    socket.on("answer:submit", ({ sessionId, questionIndex, selectedIndex, submittedAt }) => {
      const state = getLiveSession(sessionId);
      if (!state || state.phase !== "active") return;
      if (questionIndex !== state.currentQuestionIndex) return;

      const now = Date.now();
      const questionTimer = sessionTimers.get(sessionId)?.question;
      const questionStart = questionTimer?.getStartedAt() ?? 0;
      const questionDurationMs = questionTimer?.getDurationMs() ?? 0;
      const sessionRow = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
      if (!sessionRow) return;

      const elapsed = now - questionStart;
      if (elapsed > questionDurationMs + GRACE_PERIOD_MS) return;

      const participantId = Array.from(state.participants.values())
        .find((p) => state.currentQuestionAnswers.has(p.id) === false)
        ?.id;

      const questionList = db.select().from(questions)
        .where(eq(questions.quizBoxId, sessionRow.quizBoxId))
        .orderBy(questions.index)
        .all();

      if (questionIndex >= questionList.length) return;
      const question = questionList[questionIndex];
      const questionView = getSessionQuestionView(sessionId, question.id, JSON.parse(question.options), question.correctIndex);

      const existingAnswer = state.currentQuestionAnswers.size;
      if (existingAnswer >= state.participants.size) return;

      const originalSelectedIndex = questionView.optionOrder[selectedIndex];
      if (originalSelectedIndex === undefined) return;

      const isCorrect = originalSelectedIndex === question.correctIndex;
      recordAnswer(sessionId, participantId!, question.id, selectedIndex, isCorrect, now - submittedAt);

      socket.emit("answer:feedback", {
        isCorrect,
        correctIndex: questionView.correctIndex,
        explanation: question.explanation ?? "",
      });

      io.to(`session:${sessionId}:host`).emit("answer:count", {
        questionIndex,
        responseCount: state.currentQuestionAnswers.size,
      });

      if (state.currentQuestionAnswers.size >= state.participants.size) {
        const timers = sessionTimers.get(sessionId);
        if (timers) {
          timers.question.clear();
          clearTimerBroadcast(timers);
        }
        endQuestion(io, sessionId, state, sessionTimers);
      }
    });

  });
}

function buildSessionStatePayload(
  sessionId: number,
  state: NonNullable<ReturnType<typeof getLiveSession>>,
  sessionTimers: Map<number, SessionTimerBundle>
): SessionStatePayload {
  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  const questionList = session
    ? db.select().from(questions)
        .where(eq(questions.quizBoxId, session.quizBoxId))
        .orderBy(questions.index)
        .all()
    : [];

  const currentQuestionRow = state.currentQuestionIndex < questionList.length
    ? questionList[state.currentQuestionIndex]
    : null;
  const questionTimer = sessionTimers.get(sessionId)?.question;
  const currentQuestionView = currentQuestionRow
    ? getSessionQuestionView(sessionId, currentQuestionRow.id, JSON.parse(currentQuestionRow.options), currentQuestionRow.correctIndex)
    : null;
  const currentQuestion =
    state.phase === "active" && currentQuestionRow && currentQuestionView && questionTimer
        ? {
            index: state.currentQuestionIndex,
            text: currentQuestionRow.text,
            options: currentQuestionView.options,
            startedAt: questionTimer.getStartedAt(),
            durationMs: questionTimer.getDurationMs(),
            serverNow: Date.now(),
            remainingSeconds: Math.max(0, Math.ceil(questionTimer.getRemainingMs() / 1000)),
          }
        : null;

  return {
    phase: state.phase,
    currentQuestionIndex: state.currentQuestionIndex,
    participants: Array.from(state.participants.values()),
    targetParticipantCount: state.targetParticipantCount,
    currentQuestion,
    responseCount: state.currentQuestionAnswers.size,
    allQuestionStats: Array.from(state.questionStats.entries()).map(([questionIndex, stats]) => ({
      questionIndex,
      totalParticipants: state.participants.size,
      responseCount:
        questionIndex === state.currentQuestionIndex && state.phase === "active"
          ? state.currentQuestionAnswers.size
          : stats.optionDistribution.reduce((sum, count) => sum + count, 0),
      correctCount: stats.correctCount,
      optionDistribution: stats.optionDistribution,
    })),
    remainingSeconds: questionTimer?.isRunning() ? Math.max(0, Math.ceil(questionTimer.getRemainingMs() / 1000)) : 0,
  };
}

function startQuestion(
  io: TypedServer,
  sessionId: number,
  state: ReturnType<typeof getLiveSession>,
  sessionTimers: Map<number, SessionTimerBundle>
) {
  if (!state) return;

  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  if (!session) return;

  const questionList = db.select().from(questions)
    .where(eq(questions.quizBoxId, session.quizBoxId))
    .orderBy(questions.index)
    .all();

  const idx = state.currentQuestionIndex;
  if (idx >= questionList.length) {
    state.phase = "completed";
    persistPhase(sessionId, "completed", idx);
    io.to(`session:${sessionId}`).emit("session:complete", { sessionId });
    return;
  }

  const q = questionList[idx];
  const questionView = getSessionQuestionView(sessionId, q.id, JSON.parse(q.options), q.correctIndex);
  const durationMs = q.questionDurationMs ?? 30000;

  resetAnswers(sessionId);
  state.phase = "active";
  persistPhase(sessionId, "active", idx);

  const timers = sessionTimers.get(sessionId) ?? {
    question: new SessionTimer(() => endQuestion(io, sessionId, state, sessionTimers), durationMs),
    intermission: new IntermissionTimer(() => {}),
    timerBroadcast: null,
  };
  timers.question = new SessionTimer(() => endQuestion(io, sessionId, state, sessionTimers), durationMs);
  sessionTimers.set(sessionId, timers);
  timers.question.start();

  const startedAt = timers.question.getStartedAt();
  const serverNow = Date.now();

  io.to(`session:${sessionId}`).emit("question:start", {
    index: idx,
    text: q.text,
    options: questionView.options,
    startedAt,
    durationMs,
    serverNow,
    remainingSeconds: Math.max(0, Math.ceil(timers.question.getRemainingMs() / 1000)),
  });

  clearTimerBroadcast(timers);
  emitTimerUpdate(io, sessionId, timers.question);
  timers.timerBroadcast = setInterval(() => {
    emitTimerUpdate(io, sessionId, timers.question);
  }, 250);
}

function endQuestion(
  io: TypedServer,
  sessionId: number,
  state: ReturnType<typeof getLiveSession>,
  sessionTimers: Map<number, SessionTimerBundle>
) {
  if (!state) return;

  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  if (!session) return;

  const questionList = db.select().from(questions)
    .where(eq(questions.quizBoxId, session.quizBoxId))
    .orderBy(questions.index)
    .all();

  const idx = state.currentQuestionIndex;
  const q = questionList[idx];
  const questionView = getSessionQuestionView(sessionId, q.id, JSON.parse(q.options), q.correctIndex);

  const stats = state.questionStats.get(idx);
  const statsPayload = stats
    ? {
        questionIndex: idx,
        totalParticipants: state.participants.size,
        responseCount: state.currentQuestionAnswers.size,
        correctCount: stats.correctCount,
        optionDistribution: stats.optionDistribution,
      }
    : {
        questionIndex: idx,
        totalParticipants: state.participants.size,
        responseCount: state.currentQuestionAnswers.size,
        correctCount: 0,
        optionDistribution: [0, 0, 0, 0],
      };

  io.to(`session:${sessionId}`).emit("question:end", {
    questionIndex: idx,
    correctIndex: questionView.correctIndex,
    explanation: q.explanation ?? "",
  });

  io.to(`session:${sessionId}:host`).emit("question:stats", statsPayload);

  if (idx + 1 >= questionList.length) {
    state.phase = "completed";
    persistPhase(sessionId, "completed", idx);
    io.to(`session:${sessionId}`).emit("session:complete", { sessionId });
    return;
  }

  state.phase = "intermission";
  persistPhase(sessionId, "intermission", idx);

  const timers = sessionTimers.get(sessionId) ?? {
    question: new SessionTimer(() => {}, 30000),
    intermission: new IntermissionTimer(() => {}),
    timerBroadcast: null,
  };
  clearTimerBroadcast(timers);
  timers.intermission = new IntermissionTimer(() => {
    state.currentQuestionIndex++;
    startQuestion(io, sessionId, state, sessionTimers);
  });
  sessionTimers.set(sessionId, timers);
  timers.intermission.start();
}

function getSessionQuestionView(sessionId: number, questionId: number, options: string[], correctIndex: number) {
  const optionOrder = [0, 1, 2, 3].sort((a, b) => seededValue(`${sessionId}:${questionId}:${a}`) - seededValue(`${sessionId}:${questionId}:${b}`));

  return {
    options: optionOrder.map((index) => options[index]),
    optionOrder,
    correctIndex: optionOrder.indexOf(correctIndex),
  };
}

function seededValue(input: string) {
  let hash = 2166136261;

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function emitTimerUpdate(io: TypedServer, sessionId: number, timer: SessionTimer) {
  io.to(`session:${sessionId}`).emit("question:timer", {
    remainingSeconds: Math.max(0, Math.ceil(timer.getRemainingMs() / 1000)),
  });
}

function emitTimerSnapshot(socket: TypedSocket, sessionId: number, timersMap: Map<number, SessionTimerBundle>) {
  const timer = timersMap.get(sessionId)?.question;
  if (!timer?.isRunning()) return;

  socket.emit("question:timer", {
    remainingSeconds: Math.max(0, Math.ceil(timer.getRemainingMs() / 1000)),
  });
}

function clearTimerBroadcast(timers: SessionTimerBundle) {
  if (timers.timerBroadcast) {
    clearInterval(timers.timerBroadcast);
    timers.timerBroadcast = null;
  }
}
