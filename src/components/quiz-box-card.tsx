import Link from "next/link";
import type { InferSelectModel } from "drizzle-orm";
import type { quizBoxes } from "@/db/schema";

type QuizBox = InferSelectModel<typeof quizBoxes>;

export function QuizBoxCard({ box }: { box: QuizBox }) {
  return (
    <Link
      href={`/quiz-boxes/${box.id}`}
      className="group relative block p-7 border-2 border-[#4F7CFF]/10 rounded-[24px] bg-white transition-all duration-150 hover:border-[#4F7CFF] overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity">
        <svg className="w-16 h-16 text-[#4F7CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      </div>
      
      <div className="relative space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#F8F9FB] group-hover:bg-[#4F7CFF]/10 transition-colors">
          <span className="text-xl">{box.icon || "🧪"}</span>
        </div>
        
        <div>
          <h3 className="font-black text-[#222222] text-xl group-hover:text-[#4F7CFF] transition-colors duration-300 tracking-tight leading-snug">
            {box.title}
          </h3>
          <p className="mt-2 text-sm text-[#6B7280] font-medium flex items-center gap-1.5">
            <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            문제당 {box.questionDurationMs / 1000}초 제한
          </p>
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-[rgba(0,0,0,0.04)]">
          <span className="text-xs font-bold text-[#9CA3AF] tracking-widest uppercase">
            {new Date(box.createdAt).toLocaleDateString("ko-KR")}
          </span>
          <div className="w-8 h-8 rounded-full bg-[#F1F3F8] flex items-center justify-center text-[#4F7CFF] group-hover:bg-[#4F7CFF] group-hover:text-white transition-all duration-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
