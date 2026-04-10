export const SYSTEM_PROMPT = `당신은 한국 대학 실험실 안전 교육 전문가입니다. 실험 주제가 주어지면 관련 안전수칙을 작성하고, 그에 기반한 객관식 퀴즈를 생성합니다.

규칙:
- 안전수칙은 실험과 직접 관련된 실용적인 내용이어야 합니다
- 문제는 안전수칙에 기반하여 출제하세요
- 각 문제는 4개의 선택지(보기)를 가져야 합니다
- 정답은 1개뿐이어야 합니다
- 해설은 왜 정답인지, 왜 다른 보기는 틀렸는지 설명해야 합니다
- category는 안전 항목 분류입니다 (예: 화학취급, 전기안전, 개인보호구, 비상대응, 폐기물처리)
- commonMisconception은 학생들이 흔히 갖는 오개념을 설명합니다
- 난이도는 대학생 수준에 맞추세요
- 한국어로 작성하세요`;

export function buildQuizPrompt(topic: string): string {
  return `실험 주제: ${topic}

이 실험과 관련된 안전수칙을 작성하고, 각 안전수칙에 대해 퀴즈 문제를 5개 생성해주세요.

다음 형식으로 출력하세요:
1. safetyContent: 실험 안전수칙 전체 내용 (마크다운 형식)
2. questions: 퀴즈 문제 배열 (각 문제는 text, options, correctIndex, explanation, category, commonMisconception 포함)`;
}

export function buildAnalysisPrompt(data: {
  topic: string;
  totalParticipants: number;
  questions: Array<{
    index: number;
    text: string;
    category: string;
    correctRate: number;
    optionDistribution: number[];
  }>;
}): string {
  const questionStats = data.questions
    .map(
      (q) =>
        `문제 ${q.index + 1} [${q.category}]: "${q.text}" - 정답률 ${(q.correctRate * 100).toFixed(1)}%, 선택지 분포: [${q.optionDistribution.join(", ")}]`
    )
    .join("\n");

  return `실험 주제: ${data.topic}
참여 인원: ${data.totalParticipants}명

문항별 통계:
${questionStats}

위 데이터를 분석하여:
1. summary: 전체적인 그룹 이해도 요약
2. weakAreas: 정답률이 낮은 안전 항목 분류 (correctRate는 0~1 사이 비율)
3. topMisconceptions: 가장 두드러진 오개념 패턴
4. recommendations: 우선순위별 추가 교육 제안`;
}

export const FEW_SHOT_EXAMPLES = `
예시 1 (기초 - 화학취급):
문제: "희석 황산을 제조할 때 올바른 방법은?"
선택지: ["물에 황산을 조금씩 붓는다", "황산에 물을 붓는다", "동시에 섞는다", "뜨거운 물에 붓는다"]
정답: 0 (물에 산을 붓는 것이 원칙)
해설: 산을 물에 붓으면 발열 반응으로 인해 산이 튀을 수 있습니다. 반드시 물에 산을 조금씩 천천히 부어야 합니다.

예시 2 (중급 - 개인보호구):
문제: "농축 염산을 취급할 때 필요한 개인보호구로 가장 적절한 것은?"
선택지: ["안전고글만", "보호장갑만", "안전고글 + 보호장갑 + 실험복", "실험복만"]
정답: 2
 해설: 농축 염산은 강한 부식성과 휘발성이 있으므로 눈, 피부, 의복 보호가 모두 필요합니다.
 `;
