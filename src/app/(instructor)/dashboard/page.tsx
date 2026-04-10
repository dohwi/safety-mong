import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { quizBoxes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { QuizBoxCard } from "@/components/quiz-box-card";
import { EmptyQuizBoxes } from "@/components/empty-quiz-boxes";

export const metadata = { title: "대시보드 - 안전몽" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const boxes = db.select().from(quizBoxes)
    .where(eq(quizBoxes.instructorId, session.userId))
    .orderBy(desc(quizBoxes.createdAt))
    .all();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#222222]">내 퀴즈함</h1>
        <a
          href="/quiz-boxes/new"
          className="px-4 py-2 bg-[#3b82f6] text-white font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors"
        >
          새 퀴즈 만들기
        </a>
      </div>

      {boxes.length === 0 ? (
        <EmptyQuizBoxes />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boxes.map((box) => (
            <QuizBoxCard key={box.id} box={box} />
          ))}
        </div>
      )}
    </div>
  );
}
