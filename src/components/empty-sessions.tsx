import Link from "next/link";

export function EmptySessions({ quizBoxId }: { quizBoxId: number }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">📊</div>
      <h2 className="text-xl font-semibold text-[#222222] mb-2">아직 세션 기록이 없습니다</h2>
      <p className="text-[#6B7280] mb-6">첫 세션을 시작하세요</p>
      <Link href={`/quiz-boxes/${quizBoxId}`} className="inline-block px-6 py-3 bg-[#4F7CFF] text-white font-medium rounded-xl hover:bg-[#6B91FF] transition-all duration-200 hover:shadow-[0_4px_16px_rgba(79,124,255,0.25)] active:scale-[0.98]">
        세션 시작하기
      </Link>
    </div>
  );
}
