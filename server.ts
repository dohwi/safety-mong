import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server, Socket } from "socket.io";
import { db } from "@/db";
import { sessions, participants, questions, answers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@/lib/auth";
import { analyzeResults } from "@/lib/ai/analyze-results";
import type { SessionPhase, LiveParticipant as LP } from "@/lib/socket/types";
import type { QuestionStats as QStats } from "@/lib/socket/types";
import crypto from "crypto";

const dev = process.env.NODE_ENV !== "production";
const hostname = dev ? "0.0.0.0" : "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const GRACE_PERIOD_MS = 500;
const MAX_PARTICIPANTS = 100;

interface LocalQuestionStats {
  correctCount: number;
  optionDistribution: number[];
}

interface LiveSessionState {
  sessionId: number;
  phase: SessionPhase;
  currentQuestionIndex: number;
  targetParticipantCount: number | null;
  participants: Map<number, LP>;
  currentQuestionAnswers: Map<number, number>;
  questionStats: Map<number, LocalQuestionStats>;
  socketMap: Map<string, number>;
}

interface SessionStatePayload {
  phase: SessionPhase;
  currentQuestionIndex: number;
  participants: LP[];
  targetParticipantCount: number | null;
  currentQuestion: {
    index: number;
    text: string;
    options: string[];
    startedAt: number;
    durationMs: number;
    serverNow: number;
    remainingSeconds: number;
  } | null;
  responseCount: number;
  allQuestionStats: QStats[];
  remainingSeconds: number;
}

const liveSessions = new Map<number, LiveSessionState>();

function getLiveSession(id: number) { return liveSessions.get(id); }
function createLiveSession(id: number): LiveSessionState {
  const dbSession = db.select().from(sessions).where(eq(sessions.id, id)).get();
  const target = dbSession?.targetParticipantCount ?? null;
  const state: LiveSessionState = { sessionId: id, phase: "waiting", currentQuestionIndex: 0, targetParticipantCount: target, participants: new Map(), currentQuestionAnswers: new Map(), questionStats: new Map(), socketMap: new Map() };
  liveSessions.set(id, state);
  return state;
}
function persistPhase(sessionId: number, phase: SessionPhase, idx: number) {
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { phase, currentQuestionIndex: idx };
  if (phase === "active" && idx === 0) updates.startedAt = now;
  if (phase === "completed" || phase === "closed") updates.endedAt = now;
  db.update(sessions).set(updates).where(eq(sessions.id, sessionId)).run();
}

function runAnalysis(io: Server, sessionId: number, state: LiveSessionState) {
  analyzeResults(sessionId)
    .then((result) => {
      state.phase = "analysis";
      io.to(`session:${sessionId}:host`).emit("session:analysis-ready", {
        sessionId,
        analysis: JSON.stringify(result),
      });
    })
    .catch((err) => console.error("[AI] 자동 분석 실패:", err));
}

function buildSessionStatePayload(
  sessionId: number,
  state: LiveSessionState,
  sessionTimers: Map<number, { question?: ReturnType<typeof setTimeout>; intermission?: ReturnType<typeof setTimeout>; startedAt?: number; durationMs?: number; timerBroadcast?: ReturnType<typeof setInterval> }>
): SessionStatePayload {
  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
  const questionList = session
    ? db.select().from(questions).where(eq(questions.quizBoxId, session.quizBoxId)).orderBy(questions.index).all()
    : [];
  const currentQuestionRow = state.currentQuestionIndex < questionList.length ? questionList[state.currentQuestionIndex] : null;
  const currentQuestion =
    state.phase === "active" && currentQuestionRow && sessionTimers.get(sessionId)?.startedAt
      ? {
          index: state.currentQuestionIndex,
          text: currentQuestionRow.text,
          options: JSON.parse(currentQuestionRow.options),
          startedAt: sessionTimers.get(sessionId)!.startedAt!,
          durationMs: currentQuestionRow.questionDurationMs || 30000,
          serverNow: Date.now(),
          remainingSeconds: getRemainingSeconds(sessionTimers.get(sessionId)?.startedAt, sessionTimers.get(sessionId)?.durationMs),
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
    remainingSeconds: state.phase === "active"
      ? getRemainingSeconds(sessionTimers.get(sessionId)?.startedAt, sessionTimers.get(sessionId)?.durationMs)
      : 0,
  };
}

function getRemainingSeconds(startedAt?: number, durationMs?: number) {
  if (!startedAt || !durationMs) return 0;
  const remaining = startedAt + durationMs - Date.now();
  return Math.max(0, Math.ceil(remaining / 1000));
}

function emitTimerUpdate(
  io: Server,
  sessionId: number,
  sessionTimers: Map<number, { question?: ReturnType<typeof setTimeout>; intermission?: ReturnType<typeof setTimeout>; startedAt?: number; durationMs?: number; timerBroadcast?: ReturnType<typeof setInterval> }>
) {
  const timers = sessionTimers.get(sessionId);
  io.to(`session:${sessionId}`).emit("question:timer", {
    remainingSeconds: getRemainingSeconds(timers?.startedAt, timers?.durationMs),
  });
}

function emitTimerSnapshot(
  socket: Socket,
  sessionId: number,
  sessionTimers: Map<number, { question?: ReturnType<typeof setTimeout>; intermission?: ReturnType<typeof setTimeout>; startedAt?: number; durationMs?: number; timerBroadcast?: ReturnType<typeof setInterval> }>
) {
  const timers = sessionTimers.get(sessionId);
  if (!timers?.question || !timers.startedAt || !timers.durationMs) return;

  socket.emit("question:timer", {
    remainingSeconds: getRemainingSeconds(timers.startedAt, timers.durationMs),
  });
}

function clearTimerBroadcast(timers?: { timerBroadcast?: ReturnType<typeof setInterval> }) {
  if (timers?.timerBroadcast) {
    clearInterval(timers.timerBroadcast);
    timers.timerBroadcast = undefined;
  }
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || (dev ? ["http://localhost:3000", `http://localhost:${port}`] : `http://localhost:${port}`),
      methods: ["GET", "POST"],
    },
  });

  const sessionTimers = new Map<number, { question?: ReturnType<typeof setTimeout>; intermission?: ReturnType<typeof setTimeout>; startedAt?: number; durationMs?: number; timerBroadcast?: ReturnType<typeof setInterval> }>();

  function startQuestion(sessionId: number, state: ReturnType<typeof createLiveSession>) {
    const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) return;
    const questionList = db.select().from(questions).where(eq(questions.quizBoxId, session.quizBoxId)).orderBy(questions.index).all();
    const idx = state.currentQuestionIndex;
    if (idx >= questionList.length) {
      state.phase = "completed";
      persistPhase(sessionId, "completed", idx);
      io.to(`session:${sessionId}`).emit("session:complete", { sessionId });
      
      runAnalysis(io, sessionId, state);

      return;
    }
    const q = questionList[idx];
    const durationMs = q.questionDurationMs || 30000;
    state.currentQuestionAnswers.clear();
    for (const p of state.participants.values()) p.hasAnswered = false;
    state.phase = "active";
    persistPhase(sessionId, "active", idx);
    const startedAt = Date.now();
    const timers = sessionTimers.get(sessionId) || {};
    timers.startedAt = startedAt;
    timers.durationMs = durationMs;
    if (timers.question) clearTimeout(timers.question);
    clearTimerBroadcast(timers);
    timers.question = setTimeout(() => endQuestion(sessionId, state), durationMs);
    sessionTimers.set(sessionId, timers);
    io.to(`session:${sessionId}`).emit("question:start", {
      index: idx,
      text: q.text,
      options: JSON.parse(q.options),
      startedAt,
      durationMs,
      serverNow: Date.now(),
      remainingSeconds: getRemainingSeconds(startedAt, durationMs),
    });
    emitTimerUpdate(io, sessionId, sessionTimers);
    timers.timerBroadcast = setInterval(() => {
      emitTimerUpdate(io, sessionId, sessionTimers);
    }, 250);
    io.to(`session:${sessionId}`).emit("session:state", buildSessionStatePayload(sessionId, state, sessionTimers));
  }

  function endQuestion(sessionId: number, state: ReturnType<typeof createLiveSession>) {
    const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) return;
    const questionList = db.select().from(questions).where(eq(questions.quizBoxId, session.quizBoxId)).orderBy(questions.index).all();
    const idx = state.currentQuestionIndex;
    const q = questionList[idx];
    const stats = state.questionStats.get(idx);
    const timers = sessionTimers.get(sessionId) || {};
    clearTimerBroadcast(timers);
    if (timers.question) clearTimeout(timers.question);
    timers.question = undefined;
    timers.startedAt = undefined;
    timers.durationMs = undefined;
    io.to(`session:${sessionId}`).emit("question:end", { questionIndex: idx, correctIndex: q.correctIndex, explanation: q.explanation ?? "" });
    io.to(`session:${sessionId}:host`).emit("question:stats", stats ? { questionIndex: idx, totalParticipants: state.participants.size, responseCount: state.currentQuestionAnswers.size, correctCount: stats.correctCount, optionDistribution: stats.optionDistribution } : { questionIndex: idx, totalParticipants: state.participants.size, responseCount: state.currentQuestionAnswers.size, correctCount: 0, optionDistribution: [0, 0, 0, 0] });
    if (idx + 1 >= questionList.length) {
      state.phase = "completed";
      persistPhase(sessionId, "completed", idx);
      io.to(`session:${sessionId}`).emit("session:complete", { sessionId });
      
      runAnalysis(io, sessionId, state);

      return;
    }
    state.phase = "intermission";
    persistPhase(sessionId, "intermission", idx);
    if (timers.intermission) clearTimeout(timers.intermission);
    timers.intermission = setTimeout(() => {
      state.currentQuestionIndex++;
      startQuestion(sessionId, state);
    }, 5000);
    sessionTimers.set(sessionId, timers);
  }

  io.on("connection", (socket) => {
    socket.on("session:host", async ({ sessionId }: { sessionId: number }) => {
      const token = socket.handshake.auth.token;
      if (!token) { socket.emit("session:error", { message: "인증이 필요합니다" }); return; }
      const s = await decrypt(token);
      if (!s) { socket.emit("session:error", { message: "인증 만료" }); return; }
      const dbSession = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
      if (!dbSession || dbSession.instructorId !== s.userId) { socket.emit("session:error", { message: "권한 없음" }); return; }
      let state = getLiveSession(sessionId);
      if (!state) state = createLiveSession(sessionId);
      socket.join(`session:${sessionId}`);
      socket.join(`session:${sessionId}:host`);
      socket.emit("session:state", buildSessionStatePayload(sessionId, state, sessionTimers));
      emitTimerSnapshot(socket, sessionId, sessionTimers);
    });

    socket.on("session:join", ({ sessionId, nickname, reconnectToken }: { sessionId: number; nickname: string; reconnectToken?: string }) => {
      if (!nickname || typeof nickname !== "string" || nickname.trim().length === 0 || nickname.length > 20) {
        socket.emit("session:error", { message: "유효한 닉네임을 입력하세요" });
        return;
      }
      const cleanNickname = nickname.trim().slice(0, 20);
      let state = getLiveSession(sessionId);
      if (!state) {
        const dbSession = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
        if (!dbSession || dbSession.phase === "closed") { socket.emit("session:error", { message: "세션을 찾을 수 없습니다" }); return; }
        state = createLiveSession(sessionId);
      }
      if (state.phase === "closed") { socket.emit("session:error", { message: "종료된 세션" }); return; }
      if (reconnectToken) {
        const existing = db.select().from(participants).where(eq(participants.reconnectToken, reconnectToken)).get();
        if (existing && existing.sessionId === sessionId) {
          socket.join(`session:${sessionId}`);
          state.participants.set(existing.id, { id: existing.id, nickname: existing.nickname, hasAnswered: false });
          state.socketMap.set(socket.id, existing.id);
          socket.emit("session:joined", { participantId: existing.id, nickname: existing.nickname, reconnectToken: existing.reconnectToken });
          socket.emit("session:state", buildSessionStatePayload(sessionId, state, sessionTimers));
          emitTimerSnapshot(socket, sessionId, sessionTimers);
          return;
        }
      }
      if (state.participants.size >= MAX_PARTICIPANTS) { socket.emit("session:error", { message: "세션이 가득 찼습니다" }); return; }
      const dup = db.select().from(participants).where(and(eq(participants.sessionId, sessionId), eq(participants.nickname, cleanNickname))).get();
      if (dup) { socket.emit("session:error", { message: "이미 사용 중인 닉네임" }); return; }
      const rt = crypto.randomUUID();
      const p = db.insert(participants).values({ sessionId, nickname: cleanNickname, reconnectToken: rt, joinedAt: new Date().toISOString() }).returning().get();
      socket.join(`session:${sessionId}`);
      state.participants.set(p.id, { id: p.id, nickname: p.nickname, hasAnswered: false });
      state.socketMap.set(socket.id, p.id);
      socket.emit("session:joined", { participantId: p.id, nickname: p.nickname, reconnectToken: rt });
      io.to(`session:${sessionId}:host`).emit("participant:joined", { nickname: p.nickname, participantCount: state.participants.size, targetParticipantCount: state.targetParticipantCount });
      io.to(`session:${sessionId}`).emit("participant:joined", { nickname: p.nickname, participantCount: state.participants.size, targetParticipantCount: state.targetParticipantCount });
      if (state.targetParticipantCount && state.participants.size >= state.targetParticipantCount && state.phase === "waiting") {
        startQuestion(sessionId, state);
      }
      socket.emit("session:state", buildSessionStatePayload(sessionId, state, sessionTimers));
      emitTimerSnapshot(socket, sessionId, sessionTimers);
    });

    socket.on("session:start", ({ sessionId }: { sessionId: number }) => {
      if (!socket.rooms.has(`session:${sessionId}:host`)) return;
      const state = getLiveSession(sessionId);
      if (!state || state.phase !== "waiting") return;
      startQuestion(sessionId, state);
    });

    socket.on("session:skip", ({ sessionId }: { sessionId: number }) => {
      if (!socket.rooms.has(`session:${sessionId}:host`)) return;
      const state = getLiveSession(sessionId);
      if (!state || state.phase !== "active") return;
      const timers = sessionTimers.get(sessionId);
      if (timers?.question) clearTimeout(timers.question);
      clearTimerBroadcast(timers);
      endQuestion(sessionId, state);
    });

    socket.on("session:end", ({ sessionId }: { sessionId: number }) => {
      if (!socket.rooms.has(`session:${sessionId}:host`)) return;
      const state = getLiveSession(sessionId);
      if (!state) return;
      const timers = sessionTimers.get(sessionId);
      if (timers) { if (timers.question) clearTimeout(timers.question); if (timers.intermission) clearTimeout(timers.intermission); clearTimerBroadcast(timers); }
      state.phase = "completed";
      persistPhase(sessionId, "completed", state.currentQuestionIndex);
      io.to(`session:${sessionId}`).emit("session:complete", { sessionId });

      runAnalysis(io, sessionId, state);
    });

    socket.on("answer:submit", ({ sessionId, questionIndex, selectedIndex, submittedAt }: { sessionId: number; questionIndex: number; selectedIndex: number; submittedAt: number }) => {
      const state = getLiveSession(sessionId);
      if (!state || state.phase !== "active" || questionIndex !== state.currentQuestionIndex) return;
      const participantId = state.socketMap.get(socket.id);
      if (!participantId) return;
      const participant = state.participants.get(participantId);
      if (!participant || participant.hasAnswered) return;
      const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
      if (!session) return;
      const questionList = db.select().from(questions).where(eq(questions.quizBoxId, session.quizBoxId)).orderBy(questions.index).all();
      if (questionIndex >= questionList.length) return;
      const q = questionList[questionIndex];
      const now = Date.now();
      const timers = sessionTimers.get(sessionId);
      if (!timers?.startedAt) return;
      if (now - timers.startedAt > (q.questionDurationMs || 30000) + GRACE_PERIOD_MS) return;
      const isCorrect = selectedIndex === q.correctIndex;
      state.currentQuestionAnswers.set(participant.id, selectedIndex);
      participant.hasAnswered = true;
      let stats = state.questionStats.get(questionIndex);
      if (!stats) {
        stats = { correctCount: 0, optionDistribution: [0, 0, 0, 0] };
        state.questionStats.set(questionIndex, stats);
      }
      if (isCorrect) stats.correctCount++;
      if (selectedIndex >= 0 && selectedIndex < 4) {
        stats.optionDistribution[selectedIndex] = (stats.optionDistribution[selectedIndex] || 0) + 1;
      }
      
      db.insert(answers).values({
        sessionId,
        questionId: q.id,
        participantId: participant.id,
        selectedIndex,
        isCorrect,
        responseTimeMs: now - submittedAt,
        submittedAt: new Date().toISOString()
      }).run();
      
      socket.emit("answer:feedback", { isCorrect, correctIndex: q.correctIndex, explanation: q.explanation ?? "" });
      
      const participantList = Array.from(state.participants.values()).map((p) => ({
        id: p.id,
        nickname: p.nickname,
        hasAnswered: p.hasAnswered,
      }));
      io.to(`session:${sessionId}:host`).emit("answer:count", { 
        questionIndex, 
        responseCount: state.currentQuestionAnswers.size,
        participants: participantList,
      });

      if (state.participants.size > 0 && state.currentQuestionAnswers.size >= state.participants.size) {
        if (timers?.question) {
          clearTimeout(timers.question);
          timers.question = undefined;
        }
        clearTimerBroadcast(timers);
        endQuestion(sessionId, state);
      }
    });

    socket.on("disconnect", () => {
      for (const [sessionId, state] of liveSessions.entries()) {
        const pid = state.socketMap.get(socket.id);
        if (pid) {
          state.socketMap.delete(socket.id);
          state.participants.delete(pid);
          state.currentQuestionAnswers.delete(pid);
          if (state.phase === "closed" || state.phase === "completed") {
            const anySocketLeft = Array.from(state.socketMap.values()).length === 0;
            if (anySocketLeft) {
              liveSessions.delete(sessionId);
              const timers = sessionTimers.get(sessionId);
              if (timers) {
                if (timers.question) clearTimeout(timers.question);
                if (timers.intermission) clearTimeout(timers.intermission);
                clearTimerBroadcast(timers);
                sessionTimers.delete(sessionId);
              }
            }
          }
          break;
        }
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
