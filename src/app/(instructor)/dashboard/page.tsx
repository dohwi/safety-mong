import Link from "next/link";
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
  const boxes = db.select().from(quizBoxes).where(eq(quizBoxes.instructorId, session.userId)).orderBy(desc(quizBoxes.createdAt)).all();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[rgba(0,0,0,0.06)] pb-8">
        <div>
          <h1 className="text-3xl font-black text-[#222222] tracking-tight">내 퀴즈 보관함</h1>
          <p className="mt-2 text-[#6B7280] font-medium">관리 중인 실험 안전 퀴즈 {boxes.length}개를 확인하세요.</p>
        </div>
        <Link href="/quiz-boxes/new" className="inline-flex items-center justify-center px-6 py-3.5 bg-[#4F7CFF] text-white font-bold rounded-2xl hover:bg-[#6B91FF] transition-all duration-300 active:scale-[0.98] active:translate-y-0 gap-2 group">
          <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          새 퀴즈 만들기
        </Link>
      </div>
      
      {boxes.length === 0 ? <EmptyQuizBoxes /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boxes.map((box) => <QuizBoxCard key={box.id} box={box} />)}
        </div>
      )}
    </div>
  );
}
