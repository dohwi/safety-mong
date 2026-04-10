import type { InferSelectModel } from "drizzle-orm";
import type { quizBoxes } from "@/db/schema";

type QuizBox = InferSelectModel<typeof quizBoxes>;

export function QuizBoxCard({ box }: { box: QuizBox }) {
  return (
    <a
      href={`/quiz-boxes/${box.id}`}
      className="block p-5 border border-[#c1c1c1] rounded-2xl hover:shadow-[rgba(0,0,0,0.08)_0px_4px_12px] transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-[#222222] text-lg">{box.title}</h3>
        {box.isConfirmed ? (
          <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
            확정
          </span>
        ) : (
          <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded-full">
            검수중
          </span>
        )}
      </div>
      <p className="text-sm text-[#6a6a6a]">
        {box.questionDurationMs / 1000}초/문제
      </p>
      <p className="text-xs text-[#6a6a6a] mt-2">
        {new Date(box.createdAt).toLocaleDateString("ko-KR")}
      </p>
    </a>
  );
}
