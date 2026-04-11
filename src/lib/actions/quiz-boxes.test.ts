import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const addQuestionSchema = z.object({
  text: z.string().min(1),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  questionDurationMs: z.number().int().min(5000).max(120000),
  explanation: z.string().min(1),
  category: z.string().min(1),
});

describe("Quiz Box Actions - DB Logic", () => {
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
    `);
  });

  function seedData() {
    const now = new Date().toISOString();
    db.insert(schema.users).values({ email: "inst@test.com", name: "Instructor", passwordHash: "h", createdAt: now }).run();
    db.insert(schema.quizBoxes).values({
      title: "화학실험", safetyContent: "## 안전수칙\n- 장갑 착용", instructorId: 1, createdAt: now, updatedAt: now,
    }).run();
    return now;
  }

  function seedQuestions(now: string) {
    for (let i = 0; i < 3; i++) {
      db.insert(schema.questions).values({
        quizBoxId: 1, index: i, text: `Q${i + 1}`, options: JSON.stringify(["A", "B", "C", "D"]),
        correctIndex: 0, questionDurationMs: 30000, explanation: `Exp ${i + 1}`, category: "화학", createdAt: now,
      }).run();
    }
  }

  describe("updateSafetyContent", () => {
    it("updates safety content", () => {
      seedData();
      db.update(schema.quizBoxes).set({ safetyContent: "새 내용", updatedAt: new Date().toISOString() }).where(eq(schema.quizBoxes.id, 1)).run();

      const box = db.select().from(schema.quizBoxes).where(eq(schema.quizBoxes.id, 1)).get();
      expect(box!.safetyContent).toBe("새 내용");
    });
  });

  describe("addQuestion - index assignment", () => {
    it("appends question with correct index", () => {
      const now = seedData();
      seedQuestions(now);

      const existing = db.select().from(schema.questions).where(eq(schema.questions.quizBoxId, 1)).all();
      const maxIndex = existing.reduce((max, q) => Math.max(max, q.index), -1);

      db.insert(schema.questions).values({
        quizBoxId: 1, index: maxIndex + 1, text: "Q4", options: JSON.stringify(["A", "B", "C", "D"]),
        correctIndex: 1, questionDurationMs: 45000, explanation: "Exp 4", category: "전기", createdAt: now,
      }).run();

      const all = db.select().from(schema.questions).where(eq(schema.questions.quizBoxId, 1)).all();
      expect(all).toHaveLength(4);
      expect(all[3]!.text).toBe("Q4");
      expect(all[3]!.index).toBe(3);
    });

    it("appends to empty quiz box with index 0", () => {
      const now = seedData();
      const existing = db.select().from(schema.questions).where(eq(schema.questions.quizBoxId, 1)).all();
      const maxIndex = existing.reduce((max, q) => Math.max(max, q.index), -1);

      db.insert(schema.questions).values({
        quizBoxId: 1, index: maxIndex + 1, text: "First", options: JSON.stringify(["A", "B", "C", "D"]),
        correctIndex: 0, questionDurationMs: 30000, explanation: "E", category: "화학", createdAt: now,
      }).run();

      const q = db.select().from(schema.questions).where(eq(schema.questions.quizBoxId, 1)).get();
      expect(q!.index).toBe(0);
    });
  });

  describe("deleteQuestion - index reordering", () => {
    it("deletes middle question and reindexes remaining", () => {
      const now = seedData();
      seedQuestions(now);

      db.delete(schema.questions).where(eq(schema.questions.id, 2)).run();

      const remaining = db.select().from(schema.questions)
        .where(eq(schema.questions.quizBoxId, 1))
        .orderBy(schema.questions.index)
        .all();

      expect(remaining).toHaveLength(2);
      expect(remaining[0]!.text).toBe("Q1");
      expect(remaining[1]!.text).toBe("Q3");

      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i]!.index !== i) {
          db.update(schema.questions).set({ index: i }).where(eq(schema.questions.id, remaining[i]!.id)).run();
        }
      }

      const reindexed = db.select().from(schema.questions)
        .where(eq(schema.questions.quizBoxId, 1))
        .orderBy(schema.questions.index)
        .all();

      expect(reindexed[0]!.index).toBe(0);
      expect(reindexed[1]!.index).toBe(1);
    });
  });

  describe("active session check", () => {
    it("detects active session", () => {
      const now = seedData();
      db.insert(schema.sessions).values({
        code: "ACT12345", quizBoxId: 1, instructorId: 1, phase: "active", createdAt: now,
      }).run();

      const activePhases = ["waiting", "active", "intermission"];
      const active = db.select().from(schema.sessions).where(
        eq(schema.sessions.quizBoxId, 1)
      ).all().filter(s => activePhases.includes(s.phase));

      expect(active.length).toBe(1);
    });

    it("ignores completed session", () => {
      const now = seedData();
      db.insert(schema.sessions).values({
        code: "COMP1234", quizBoxId: 1, instructorId: 1, phase: "completed", createdAt: now,
      }).run();

      const activePhases = ["waiting", "active", "intermission"];
      const active = db.select().from(schema.sessions).where(
        eq(schema.sessions.quizBoxId, 1)
      ).all().filter(s => activePhases.includes(s.phase));

      expect(active.length).toBe(0);
    });
  });

  describe("addQuestionSchema validation", () => {
    it("rejects options with wrong length", () => {
      const result = addQuestionSchema.safeParse({
        text: "Q?", options: ["A", "B"], correctIndex: 0, explanation: "E", category: "C",
        questionDurationMs: 30000,
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty text", () => {
      const result = addQuestionSchema.safeParse({
        text: "", options: ["A", "B", "C", "D"], correctIndex: 0, explanation: "E", category: "C",
        questionDurationMs: 30000,
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid question", () => {
      const result = addQuestionSchema.safeParse({
        text: "Q?", options: ["A", "B", "C", "D"], correctIndex: 0, explanation: "E", category: "C",
        questionDurationMs: 30000,
      });
      expect(result.success).toBe(true);
    });

    it("rejects correctIndex out of range", () => {
      const result = addQuestionSchema.safeParse({
        text: "Q?", options: ["A", "B", "C", "D"], correctIndex: 4, explanation: "E", category: "C",
        questionDurationMs: 30000,
      });
      expect(result.success).toBe(false);
    });
  });
});
