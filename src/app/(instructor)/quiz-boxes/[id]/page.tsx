import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { quizBoxes, questions, sessions } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { QuizBoxDetail } from "@/components/quiz-box-detail";
import { ACTIVE_PHASES } from "@/lib/socket/types";

export const metadata = { title: "퀴즈함 상세 - 안전몽" };

export default async function QuizBoxPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const boxId = parseInt(id, 10);
  if (isNaN(boxId)) notFound();

  const box = db.select().from(quizBoxes).where(
    and(eq(quizBoxes.id, boxId), eq(quizBoxes.instructorId, session.userId))
  ).get();

  if (!box) notFound();

  const questionList = db.select().from(questions)
    .where(eq(questions.quizBoxId, boxId))
    .orderBy(questions.index)
    .all();

  const activePhases = ACTIVE_PHASES as readonly string[];
  const activeSessions = db.select().from(sessions).where(
    and(eq(sessions.quizBoxId, boxId), inArray(sessions.phase, activePhases))
  ).all();
  const isEditable = activeSessions.length === 0;
  const activeSessionId = activeSessions.length > 0 ? activeSessions[0].id : null;
  const activeSessionCode = activeSessions.length > 0 ? activeSessions[0].code : null;

  return <QuizBoxDetail box={box} questions={questionList} isEditable={isEditable} activeSessionId={activeSessionId} activeSessionCode={activeSessionCode} />;
}
