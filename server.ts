import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import { db } from "@/db";
import { sessions, participants, questions, quizBoxes, answers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@/lib/auth";
import crypto from "crypto";

const dev = process.env.NODE_ENV !== "production";
const hostname = dev ? "0.0.0.0" : "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const GRACE_PERIOD_MS = 500;
const MAX_PARTICIPANTS = 100;

interface LiveParticipant {
  id: number;
  nickname: string;
  hasAnswered: boolean;
}

interface QuestionStats {
  correctCount: number;
  optionDistribution: number[];
}

interface LiveSessionState {
  sessionId: number;
  phase: string;
  currentQuestionIndex: number;
  participants: Map<number, LiveParticipant>;
  currentQuestionAnswers: Map<number, number>;
  questionStats: Map<number, QuestionStats>;
  socketMap: Map<string, number>;
}

const liveSessions = new Map<number, LiveSessionState>();

function getLiveSession(id: number) { return liveSessions.get(id); }
function createLiveSession(id: number): LiveSessionState {
  const state: LiveSessionState = { sessionId: id, phase: "waiting", currentQuestionIndex: 0, participants: new Map(), currentQuestionAnswers: new Map(), questionStats: new Map(), socketMap: new Map() };
  liveSessions.set(id, state);
  return state;
}
function persistPhase(sessionId: number, phase: string, idx: number) {
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { phase, currentQuestionIndex: idx };
  if (phase === "active" && idx === 0) updates.startedAt = now;
  if (phase === "completed" || phase === "closed") updates.endedAt = now;
  db.update(sessions).set(updates).where(eq(sessions.id, sessionId)).run();
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
      origin: process.env.NEXT_PUBLIC_APP_URL || (dev ? true : `http://localhost:${port}`),
      methods: ["GET", "POST"],
    },
  });

  const sessionTimers = new Map<number, { question?: ReturnType<typeof setTimeout>; intermission?: ReturnType<typeof setTimeout>; startedAt?: number }>();

  function startQuestion(sessionId: number, state: ReturnType<typeof createLiveSession>) {
    const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) return;
    const questionList = db.select().from(questions).where(eq(questions.quizBoxId, session.quizBoxId)).orderBy(questions.index).all();
    const idx = state.currentQuestionIndex;
    if (idx >= questionList.length) {
      state.phase = "completed";
      persistPhase(sessionId, "completed", idx);
      io.to(`session:${sessionId}`).emit("session:complete", { sessionId });
      return;
    }
    const q = questionList[idx];
    const box = db.select().from(quizBoxes).where(eq(quizBoxes.id, session.quizBoxId)).get();
    const durationMs = box?.questionDurationMs ?? 30000;
    state.currentQuestionAnswers.clear();
    for (const p of state.participants.values()) p.hasAnswered = false;
    state.phase = "active";
    persistPhase(sessionId, "active", idx);
    const startedAt = Date.now();
    const timers = sessionTimers.get(sessionId) || {};
    timers.startedAt = startedAt;
    if (timers.question) clearTimeout(timers.question);
    timers.question = setTimeout(() => endQuestion(sessionId, state), durationMs);
    sessionTimers.set(sessionId, timers);
    io.to(`session:${sessionId}`).emit("question:start", { index: idx, text: q.text, options: JSON.parse(q.options), startedAt, durationMs });
  }

  function endQuestion(sessionId: number, state: ReturnType<typeof createLiveSession>) {
    const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();
    if (!session) return;
    const questionList = db.select().from(questions).where(eq(questions.quizBoxId, session.quizBoxId)).orderBy(questions.index).all();
    const idx = state.currentQuestionIndex;
    const q = questionList[idx];
    const stats = state.questionStats.get(idx);
    io.to(`session:${sessionId}`).emit("question:end", { questionIndex: idx, correctIndex: q.correctIndex, explanation: q.explanation ?? "" });
    io.to(`session:${sessionId}:host`).emit("question:stats", stats ? { questionIndex: idx, totalParticipants: state.participants.size, responseCount: state.currentQuestionAnswers.size, correctCount: stats.correctCount, optionDistribution: stats.optionDistribution } : { questionIndex: idx, totalParticipants: state.participants.size, responseCount: state.currentQuestionAnswers.size, correctCount: 0, optionDistribution: [0, 0, 0, 0] });
    if (idx + 1 >= questionList.length) {
      state.phase = "completed";
      persistPhase(sessionId, "completed", idx);
      io.to(`session:${sessionId}`).emit("session:complete", { sessionId });
      return;
    }
    state.phase = "intermission";
    persistPhase(sessionId, "intermission", idx);
    const timers = sessionTimers.get(sessionId) || {};
    if (timers.intermission) clearTimeout(timers.intermission);
    timers.intermission = setTimeout(() => { state.currentQuestionIndex++; startQuestion(sessionId, state); }, 5000);
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
      socket.emit("session:state", { phase: state.phase, currentQuestionIndex: state.currentQuestionIndex, participants: Array.from(state.participants.values()) });
    });

    socket.on("session:join", ({ sessionId, nickname, reconnectToken }: { sessionId: number; nickname: string; reconnectToken?: string }) => {
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
          return;
        }
      }
      if (state.participants.size >= MAX_PARTICIPANTS) { socket.emit("session:error", { message: "세션이 가득 찼습니다" }); return; }
      const dup = db.select().from(participants).where(and(eq(participants.sessionId, sessionId), eq(participants.nickname, nickname))).get();
      if (dup) { socket.emit("session:error", { message: "이미 사용 중인 닉네임" }); return; }
      const rt = crypto.randomUUID();
      const p = db.insert(participants).values({ sessionId, nickname, reconnectToken: rt, joinedAt: new Date().toISOString() }).returning().get();
      socket.join(`session:${sessionId}`);
      state.participants.set(p.id, { id: p.id, nickname: p.nickname, hasAnswered: false });
      state.socketMap.set(socket.id, p.id);
      socket.emit("session:joined", { participantId: p.id, nickname: p.nickname, reconnectToken: rt });
      io.to(`session:${sessionId}:host`).emit("participant:joined", { nickname: p.nickname, participantCount: state.participants.size });
    });

    socket.on("session:start", ({ sessionId }: { sessionId: number }) => {
      const state = getLiveSession(sessionId);
      if (!state || state.phase !== "waiting") return;
      startQuestion(sessionId, state);
    });

    socket.on("session:skip", ({ sessionId }: { sessionId: number }) => {
      const state = getLiveSession(sessionId);
      if (!state || state.phase !== "active") return;
      const timers = sessionTimers.get(sessionId);
      if (timers?.question) clearTimeout(timers.question);
      endQuestion(sessionId, state);
    });

    socket.on("session:end", ({ sessionId }: { sessionId: number }) => {
      const state = getLiveSession(sessionId);
      if (!state) return;
      const timers = sessionTimers.get(sessionId);
      if (timers) { if (timers.question) clearTimeout(timers.question); if (timers.intermission) clearTimeout(timers.intermission); }
      state.phase = "completed";
      persistPhase(sessionId, "completed", state.currentQuestionIndex);
      io.to(`session:${sessionId}`).emit("session:complete", { sessionId });
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
      const box = db.select().from(quizBoxes).where(eq(quizBoxes.id, session.quizBoxId)).get();
      if (!box) return;
      const questionList = db.select().from(questions).where(eq(questions.quizBoxId, box.id)).orderBy(questions.index).all();
      if (questionIndex >= questionList.length) return;
      const q = questionList[questionIndex];
      const now = Date.now();
      const timers = sessionTimers.get(sessionId);
      if (!timers?.startedAt) return;
      if (now - timers.startedAt > box.questionDurationMs + GRACE_PERIOD_MS) return;
      const isCorrect = selectedIndex === q.correctIndex;
      state.currentQuestionAnswers.set(participant.id, selectedIndex);
      participant.hasAnswered = true;
      let stats = state.questionStats.get(questionIndex);
      if (!stats) { stats = { correctCount: 0, optionDistribution: [0, 0, 0, 0] }; state.questionStats.set(questionIndex, stats); }
      if (isCorrect) stats.correctCount++;
      if (selectedIndex >= 0 && selectedIndex < 4) stats.optionDistribution[selectedIndex]++;
      db.insert(answers).values({ sessionId, questionId: q.id, participantId: participant.id, selectedIndex, isCorrect, responseTimeMs: now - submittedAt, submittedAt: new Date().toISOString() }).run();
      socket.emit("answer:feedback", { isCorrect, correctIndex: q.correctIndex, explanation: q.explanation ?? "" });
      io.to(`session:${sessionId}:host`).emit("answer:count", { questionIndex, responseCount: state.currentQuestionAnswers.size });
      if (state.currentQuestionAnswers.size >= state.participants.size) {
        if (timers?.question) clearTimeout(timers.question);
        endQuestion(sessionId, state);
      }
    });

    socket.on("disconnect", () => {
      for (const state of liveSessions.values()) {
        const pid = state.socketMap.get(socket.id);
        if (pid) {
          state.socketMap.delete(socket.id);
          break;
        }
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
