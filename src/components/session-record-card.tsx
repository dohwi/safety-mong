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
      className="group block border border-[rgba(0,0,0,0.06)] rounded-2xl p-5 bg-white hover:border-[rgba(79,124,255,0.3)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(79,124,255,0.12)] hover:translate-y-[-4px] active:scale-[0.98] active:translate-y-0"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#6B7280]">
            {new Date(session.createdAt).toLocaleString("ko-KR")}
          </p>
        </div>
        <span className="text-xs px-2 py-1 bg-[#F1F3F8] text-[#6B7280] rounded-full group-hover:bg-[rgba(79,124,255,0.1)] group-hover:text-[#4F7CFF] transition-colors duration-200">
          {hasAnalysis ? "리포트 보기" : "종료"}
        </span>
      </div>
    </Link>
  );
}
