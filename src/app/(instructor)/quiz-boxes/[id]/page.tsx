import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { quizBoxes, questions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { QuizBoxDetail } from "@/components/quiz-box-detail";

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

  return <QuizBoxDetail box={box} questions={questionList} />;
}
