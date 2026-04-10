import Link from "next/link";

export function EmptySessions({ quizBoxId }: { quizBoxId: number }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">📊</div>
      <h2 className="text-xl font-semibold text-[#222222] mb-2">
        아직 세션 기록이 없습니다
      </h2>
      <p className="text-[#6a6a6a] mb-6">첫 세션을 시작하세요</p>
      <Link
        href={`/quiz-boxes/${quizBoxId}`}
        className="inline-block px-6 py-3 bg-[#3b82f6] text-white font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors"
      >
        세션 시작하기
      </Link>
    </div>
  );
}
