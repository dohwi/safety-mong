import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

describe("DB Schema", () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof drizzle>;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    sqlite.pragma("journal_mode = WAL");
    db = drizzle(sqlite, { schema });

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

      CREATE TABLE questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_box_id INTEGER NOT NULL REFERENCES quiz_boxes(id) ON DELETE CASCADE,
        "index" INTEGER NOT NULL,
        text TEXT NOT NULL,
        options TEXT NOT NULL,
        correct_index INTEGER NOT NULL,
        question_duration_ms INTEGER NOT NULL DEFAULT 30000,
        explanation TEXT,
        category TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        quiz_box_id INTEGER NOT NULL REFERENCES quiz_boxes(id),
        instructor_id INTEGER NOT NULL REFERENCES users(id),
        phase TEXT NOT NULL,
        current_question_index INTEGER NOT NULL DEFAULT 0,
        target_participant_count INTEGER,
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
  });

  it("inserts and retrieves a user", () => {
    db.insert(schema.users).values({
      email: "test@example.com",
      name: "Test User",
      passwordHash: "hashed",
      createdAt: new Date().toISOString(),
    }).run();

    const user = db.select().from(schema.users).where(eq(schema.users.email, "test@example.com")).get();
    expect(user).toBeDefined();
    expect(user!.email).toBe("test@example.com");
    expect(user!.name).toBe("Test User");
  });

  it("enforces unique email on users", () => {
    const values = {
      email: "dup@example.com",
      name: "User",
      passwordHash: "hashed",
      createdAt: new Date().toISOString(),
    };
    db.insert(schema.users).values(values).run();

    expect(() => db.insert(schema.users).values(values).run()).toThrow();
  });

  it("creates quiz box with foreign key to user", () => {
    db.insert(schema.users).values({
      email: "instructor@test.com",
      name: "Instructor",
      passwordHash: "hashed",
      createdAt: new Date().toISOString(),
    }).run();

    const now = new Date().toISOString();
    db.insert(schema.quizBoxes).values({
      title: "화학실험 안전",
      instructorId: 1,
      createdAt: now,
      updatedAt: now,
    }).run();

    const box = db.select().from(schema.quizBoxes).get();
    expect(box!.title).toBe("화학실험 안전");
    expect(box!.questionDurationMs).toBe(30000);
    expect(box!.isConfirmed).toBe(false);
  });

  it("creates questions with cascade delete", () => {
    const now = new Date().toISOString();
    db.insert(schema.users).values({ email: "i@test.com", name: "I", passwordHash: "h", createdAt: now }).run();
    db.insert(schema.quizBoxes).values({ title: "Test", instructorId: 1, createdAt: now, updatedAt: now }).run();
    db.insert(schema.questions).values({
      quizBoxId: 1, index: 0, text: "Q1?", options: JSON.stringify(["A", "B", "C", "D"]),
      correctIndex: 0, questionDurationMs: 45000, explanation: "Because", category: "화학", createdAt: now,
    }).run();

    const q = db.select().from(schema.questions).get();
    expect(q!.text).toBe("Q1?");
    expect(JSON.parse(q!.options)).toEqual(["A", "B", "C", "D"]);
    expect(q!.questionDurationMs).toBe(45000);

    db.delete(schema.quizBoxes).where(eq(schema.quizBoxes.id, 1)).run();
    expect(db.select().from(schema.questions).get()).toBeUndefined();
  });

  it("enforces participant unique nickname per session", () => {
    const now = new Date().toISOString();
    db.insert(schema.users).values({ email: "i@test.com", name: "I", passwordHash: "h", createdAt: now }).run();
    db.insert(schema.quizBoxes).values({ title: "Test", instructorId: 1, createdAt: now, updatedAt: now }).run();
    db.insert(schema.sessions).values({
      code: "ABC12345", quizBoxId: 1, instructorId: 1, phase: "waiting", createdAt: now,
    }).run();

    const vals = { sessionId: 1, nickname: "student1", joinedAt: now };
    db.insert(schema.participants).values(vals).run();
    expect(() => db.insert(schema.participants).values(vals).run()).toThrow();
  });

  it("enforces answer uniqueness per session+question+participant", () => {
    const now = new Date().toISOString();
    db.insert(schema.users).values({ email: "i@test.com", name: "I", passwordHash: "h", createdAt: now }).run();
    db.insert(schema.quizBoxes).values({ title: "Test", instructorId: 1, createdAt: now, updatedAt: now }).run();
    db.insert(schema.questions).values({
      quizBoxId: 1, index: 0, text: "Q?", options: "[]", correctIndex: 0, questionDurationMs: 30000, createdAt: now,
    }).run();
    db.insert(schema.sessions).values({
      code: "XYZ12345", quizBoxId: 1, instructorId: 1, phase: "active", createdAt: now,
    }).run();
    db.insert(schema.participants).values({ sessionId: 1, nickname: "s1", joinedAt: now }).run();

    const vals = { sessionId: 1, questionId: 1, participantId: 1, selectedIndex: 0, isCorrect: true, submittedAt: now };
    db.insert(schema.answers).values(vals).run();
    expect(() => db.insert(schema.answers).values(vals).run()).toThrow();
  });

  it("creates session with unique code", () => {
    const now = new Date().toISOString();
    db.insert(schema.users).values({ email: "i@test.com", name: "I", passwordHash: "h", createdAt: now }).run();
    db.insert(schema.quizBoxes).values({ title: "Test", instructorId: 1, createdAt: now, updatedAt: now }).run();

    db.insert(schema.sessions).values({
      code: "UNIQ1234", quizBoxId: 1, instructorId: 1, phase: "waiting", createdAt: now,
    }).run();

    expect(() => db.insert(schema.sessions).values({
      code: "UNIQ1234", quizBoxId: 1, instructorId: 1, phase: "waiting", createdAt: now,
    }).run()).toThrow();
  });

  it("session defaults currentQuestionIndex to 0", () => {
    const now = new Date().toISOString();
    db.insert(schema.users).values({ email: "i@test.com", name: "I", passwordHash: "h", createdAt: now }).run();
    db.insert(schema.quizBoxes).values({ title: "Test", instructorId: 1, createdAt: now, updatedAt: now }).run();
    db.insert(schema.sessions).values({
      code: "DEF12345", quizBoxId: 1, instructorId: 1, phase: "waiting", createdAt: now,
    }).run();

    const session = db.select().from(schema.sessions).get();
    expect(session!.currentQuestionIndex).toBe(0);
  });
});
