export function EmptyQuizBoxes() {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">📋</div>
      <h2 className="text-xl font-semibold text-[#222222] mb-2">
        아직 퀴즈함이 없습니다
      </h2>
      <p className="text-[#6a6a6a] mb-6">
        실험 주제를 입력하면 AI가 안전수칙과 퀴즈를 자동으로 생성합니다
      </p>
      <a
        href="/quiz-boxes/new"
        className="inline-block px-6 py-3 bg-[#3b82f6] text-white font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors"
      >
        첫 퀴즈 만들기
      </a>
    </div>
  );
}
