import type { Server, Socket } from "socket.io";
import { db } from "@/db";
import { sessions, participants, questions, quizBoxes } from "@/db/schema";
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
import type { ClientToServerEvents, ServerToClientEvents } from "./types";

const GRACE_PERIOD_MS = 500;
const MAX_PARTICIPANTS = 100;

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerSocketHandlers(io: TypedServer) {
  io.on("connection", (socket: TypedSocket) => {
    const sessionTimers = new Map<number, { question: SessionTimer; intermission: IntermissionTimer }>();

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

      socket.emit("session:state", {
        phase: state.phase,
        currentQuestionIndex: state.currentQuestionIndex,
        participants: Array.from(state.participants.values()),
      });
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

      io.to(`session:${sessionId}:host`).emit("participant:joined", {
        nickname: p.nickname,
        participantCount: getParticipantCount(sessionId),
      });
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
      if (timers) timers.question.clear();
      endQuestion(io, sessionId, state, sessionTimers);
    });

    socket.on("session:end", ({ sessionId }) => {
      const state = getLiveSession(sessionId);
      if (!state) return;

      const timers = sessionTimers.get(sessionId);
      if (timers) {
        timers.question.clear();
        timers.intermission.clear();
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
      const questionStart = sessionTimers.get(sessionId)?.question.getStartedAt() ?? 0;
      const sessionRow = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
      if (!sessionRow) return;

      const quizBox = db.select().from(quizBoxes).where(eq(quizBoxes.id, sessionRow.quizBoxId)).get();
      if (!quizBox) return;

      const elapsed = now - questionStart;
      if (elapsed > quizBox.questionDurationMs + GRACE_PERIOD_MS) return;

      const participantId = Array.from(state.participants.values())
        .find((p) => state.currentQuestionAnswers.has(p.id) === false)
        ?.id;

      const questionList = db.select().from(questions)
        .where(eq(questions.quizBoxId, quizBox.id))
        .all();

      if (questionIndex >= questionList.length) return;
      const question = questionList[questionIndex];

      const existingAnswer = state.currentQuestionAnswers.size;
      if (existingAnswer >= state.participants.size) return;

      const isCorrect = selectedIndex === question.correctIndex;
      recordAnswer(sessionId, participantId!, question.id, selectedIndex, isCorrect, now - submittedAt);

      socket.emit("answer:feedback", {
        isCorrect,
        correctIndex: question.correctIndex,
        explanation: question.explanation ?? "",
      });

      io.to(`session:${sessionId}:host`).emit("answer:count", {
        questionIndex,
        responseCount: state.currentQuestionAnswers.size,
      });

      if (state.currentQuestionAnswers.size >= state.participants.size) {
        const timers = sessionTimers.get(sessionId);
        if (timers) timers.question.clear();
        endQuestion(io, sessionId, state, sessionTimers);
      }
    });

    socket.on("disconnect", () => {
      for (const [sessionId] of sessionTimers) {
        sessionTimers.delete(sessionId);
      }
    });
  });
}

function startQuestion(
  io: TypedServer,
  sessionId: number,
  state: ReturnType<typeof getLiveSession>,
  sessionTimers: Map<number, { question: SessionTimer; intermission: IntermissionTimer }>
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
  const quizBox = db.select().from(quizBoxes).where(eq(quizBoxes.id, session.quizBoxId)).get();
  const durationMs = quizBox?.questionDurationMs ?? 30000;

  resetAnswers(sessionId);
  state.phase = "active";
  persistPhase(sessionId, "active", idx);

  const startedAt = Date.now();

  io.to(`session:${sessionId}`).emit("question:start", {
    index: idx,
    text: q.text,
    options: JSON.parse(q.options),
    startedAt,
    durationMs,
  });

  const timers = sessionTimers.get(sessionId) ?? {
    question: new SessionTimer(() => endQuestion(io, sessionId, state, sessionTimers), durationMs),
    intermission: new IntermissionTimer(() => {}),
  };
  timers.question = new SessionTimer(() => endQuestion(io, sessionId, state, sessionTimers), durationMs);
  sessionTimers.set(sessionId, timers);
  timers.question.start();
}

function endQuestion(
  io: TypedServer,
  sessionId: number,
  state: ReturnType<typeof getLiveSession>,
  sessionTimers: Map<number, { question: SessionTimer; intermission: IntermissionTimer }>
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
    correctIndex: q.correctIndex,
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
  };
  timers.intermission = new IntermissionTimer(() => {
    state.currentQuestionIndex++;
    startQuestion(io, sessionId, state, sessionTimers);
  });
  sessionTimers.set(sessionId, timers);
  timers.intermission.start();
}
