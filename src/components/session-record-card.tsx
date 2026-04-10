import type { InferSelectModel } from "drizzle-orm";
import type { sessions } from "@/db/schema";
import Link from "next/link";

type Session = InferSelectModel<typeof sessions>;

export function SessionRecordCard({ session, quizBoxId }: { session: Session; quizBoxId: number }) {
  return (
    <Link
      href={`/quiz-boxes/${quizBoxId}/sessions/${session.id}`}
      className="block border border-[#c1c1c1] rounded-2xl p-5 hover:shadow-[rgba(0,0,0,0.08)_0px_4px_12px] transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#6a6a6a]">
            {new Date(session.createdAt).toLocaleDateString("ko-KR")}
            {session.endedAt && ` ~ ${new Date(session.endedAt).toLocaleDateString("ko-KR")}`}
          </p>
        </div>
        <span className="text-xs px-2 py-1 bg-gray-100 text-[#6a6a6a] rounded-full">종료</span>
      </div>
    </Link>
  );
}
