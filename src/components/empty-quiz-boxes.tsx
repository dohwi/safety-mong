import Link from "next/link";

export function EmptyQuizBoxes() {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">📋</div>
      <h2 className="text-xl font-semibold text-[#222222] mb-2">아직 퀴즈함이 없습니다</h2>
      <p className="text-[#6B7280] mb-6">실험 주제를 입력하면 AI가 안전수칙과 퀴즈를 자동으로 생성합니다</p>
      <Link href="/quiz-boxes/new" className="inline-block px-6 py-3 bg-[#4F7CFF] text-white font-medium rounded-xl hover:bg-[#6B91FF] transition-all duration-200 hover:shadow-[0_4px_16px_rgba(79,124,255,0.25)] active:scale-[0.98]">
        첫 퀴즈 만들기
      </Link>
    </div>
  );
}
