import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull(),
});

export const quizBoxes = sqliteTable("quiz_boxes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  safetyContent: text("safety_content"),
  instructorId: integer("instructor_id").notNull().references(() => users.id),
  questionDurationMs: integer("question_duration_ms").notNull().default(30000),
  isConfirmed: integer("is_confirmed", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quizBoxId: integer("quiz_box_id").notNull().references(() => quizBoxes.id, { onDelete: "cascade" }),
  index: integer("index").notNull(),
  text: text("text").notNull(),
  options: text("options").notNull(),
  correctIndex: integer("correct_index").notNull(),
  explanation: text("explanation"),
  category: text("category"),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  quizBoxId: integer("quiz_box_id").notNull().references(() => quizBoxes.id),
  instructorId: integer("instructor_id").notNull().references(() => users.id),
  phase: text("phase").notNull(),
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  startedAt: text("started_at"),
  endedAt: text("ended_at"),
  aiAnalysis: text("ai_analysis"),
  aiSuggestions: text("ai_suggestions"),
  createdAt: text("created_at").notNull(),
});

export const participants = sqliteTable("participants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  nickname: text("nickname").notNull(),
  reconnectToken: text("reconnect_token").unique(),
  joinedAt: text("joined_at").notNull(),
}, (table) => [
  uniqueIndex("participant_session_nickname_idx").on(table.sessionId, table.nickname),
]);

export const answers = sqliteTable("answers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  participantId: integer("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  selectedIndex: integer("selected_index").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
  responseTimeMs: integer("response_time_ms"),
  submittedAt: text("submitted_at").notNull(),
}, (table) => [
  uniqueIndex("answer_unique_idx").on(table.sessionId, table.questionId, table.participantId),
  index("answer_session_idx").on(table.sessionId),
]);
