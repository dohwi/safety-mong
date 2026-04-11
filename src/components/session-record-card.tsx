import type { InferSelectModel } from "drizzle-orm";
import type { sessions } from "@/db/schema";
import Link from "next/link";

type Session = InferSelectModel<typeof sessions>;

export function SessionRecordCard({ session, quizBoxId }: { session: Session; quizBoxId: number }) {
  const hasAnalysis = !!session.aiAnalysis;
  const href = hasAnalysis
    ? `/quiz-boxes/${quizBoxId}/sessions/${session.id}/analysis`
    : `/quiz-boxes/${quizBoxId}/sessions/${session.id}`;

  return (
    <Link
      href={href}
      className="group block border border-[rgba(0,0,0,0.06)] rounded-[24px] p-5 bg-white hover:border-[#4F7CFF] transition-all duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Completed Session</p>
          <p className="text-sm font-bold text-[#222222]">
            {new Date(session.createdAt).toLocaleString("ko-KR")}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#F1F3F8] flex items-center justify-center text-[#9CA3AF] group-hover:bg-[#4F7CFF] group-hover:text-white transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
