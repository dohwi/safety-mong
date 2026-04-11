import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/db/schema";
import {
  createLiveSession,
  getLiveSession,
  addParticipant,
  resetAnswers,
  recordAnswer,
  getParticipantCount,
  persistPhase,
  removeLiveSession,
} from "./session-state";

describe("SessionState", () => {
  let sqlite: Database.Database;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    sqlite.pragma("journal_mode = WAL");
    const db = drizzle(sqlite, { schema });

    sqlite.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE quiz_boxes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT '🧪',
        safety_content TEXT,
        instructor_id INTEGER NOT NULL REFERENCES users(id),
        question_duration_ms INTEGER NOT NULL DEFAULT 30000,
        is_confirmed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        quiz_box_id INTEGER NOT NULL REFERENCES quiz_boxes(id),
        instructor_id INTEGER NOT NULL REFERENCES users(id),
        phase TEXT NOT NULL,
        current_question_index INTEGER NOT NULL DEFAULT 0,
        started_at TEXT,
        ended_at TEXT,
        ai_analysis TEXT,
        ai_suggestions TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        nickname TEXT NOT NULL,
        reconnect_token TEXT UNIQUE,
        joined_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX participant_session_nickname_idx ON participants(session_id, nickname);
      CREATE TABLE questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_box_id INTEGER NOT NULL REFERENCES quiz_boxes(id) ON DELETE CASCADE,
        "index" INTEGER NOT NULL,
        text TEXT NOT NULL,
        options TEXT NOT NULL,
        correct_index INTEGER NOT NULL,
        explanation TEXT,
        category TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
        selected_index INTEGER NOT NULL,
        is_correct INTEGER NOT NULL,
        response_time_ms INTEGER,
        submitted_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX answer_unique_idx ON answers(session_id, question_id, participant_id);
      CREATE INDEX answer_session_idx ON answers(session_id);
    `);

    removeLiveSession(1);
  });

  it("creates and retrieves a live session", () => {
    const state = createLiveSession(1);
    expect(state.phase).toBe("waiting");
    expect(state.currentQuestionIndex).toBe(0);
    expect(getLiveSession(1)).toBe(state);
  });

  it("adds participants and counts them", () => {
    createLiveSession(1);
    addParticipant(1, 1, "student1");
    addParticipant(1, 2, "student2");

    expect(getParticipantCount(1)).toBe(2);
  });

  it("resets answers for new question", () => {
    const state = createLiveSession(1);
    addParticipant(1, 1, "student1");
    state.participants.get(1)!.hasAnswered = true;
    state.currentQuestionAnswers.set(1, 0);

    resetAnswers(1);

    expect(state.currentQuestionAnswers.size).toBe(0);
    expect(state.participants.get(1)!.hasAnswered).toBe(false);
  });

  it("removes a live session", () => {
    createLiveSession(99);
    removeLiveSession(99);
    expect(getLiveSession(99)).toBeUndefined();
  });
});
