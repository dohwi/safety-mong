export const SYSTEM_PROMPT = `당신은 한국 대학 실험실 안전 교육 전문가입니다. 실험 주제가 주어지면 관련 안전수칙을 작성하고, 그에 기반한 객관식 퀴즈를 생성합니다.

규칙:
- 안전수칙은 실험과 직접 관련된 실용적인 내용이어야 합니다
- 문제는 안전수칙에 기반하여 출제하세요
- 각 문제는 4개의 선택지(보기)를 가져야 합니다
- 정답은 1개뿐이어야 합니다
- 해설은 왜 정답인지, 왜 다른 보기는 틀렸는지 설명해야 합니다. 핵심 키워드나 주의사항은 **굵게** 표시하세요.
- questionDurationMs는 문제 난이도와 읽기 분량에 맞는 제한시간(밀리초)입니다. 5000~120000 사이 값만 사용하세요
- category는 안전 항목 분류입니다 (예: 화학취급, 전기안전, 개인보호구, 비상대응, 폐기물처리)
- commonMisconception은 학생들이 흔히 갖는 오개념을 설명합니다. 핵심 단어는 **굵게** 표시하세요.
- 난이도는 대학생 수준에 맞추세요
- 모든 텍스트는 반드시 한국어로만 작성하세요. 영어, 중국어, 러시아어 등 다른 언어를 섞어 쓰지 마세요. 전문 용어도 한국어로 표기하세요.`;

export function buildQuizPrompt(topic: string): string {
  return `실험 주제: ${topic}

이 실험과 관련된 안전수칙을 작성하고, 각 안전수칙에 대해 퀴즈 문제를 5개 생성해주세요.

**반드시 모든 텍스트를 한국어로만 작성하세요. 영어, 중국어, 러시아어, 일본어 등 다른 언어를 절대 섞어 쓰지 마세요.**

다음 형식으로 출력하세요:
1. icon: 실험 주제를 가장 잘 나타내는 이모지 하나 (예: 🧪 화학, 🔬 분석, ⚡ 전기, 🔥 화재, 🛡️ 보호구, ☢️ 방사선, 🧬 생물, 🦠 미생물, 💊 약품, 🧫 배양, ⚗️ 증류, 🌡️ 온도, 🧯 소화, 💡 광학)
2. safetyContent: 실험 안전수칙 전체 내용 (마크다운 형식, 한국어만 사용)
3. questions: 퀴즈 문제 배열 (각 문제는 text, options, correctIndex, questionDurationMs, explanation, category, commonMisconception 포함, 모두 한국어로만 작성)
   - **중요**: explanation 및 commonMisconception 내의 핵심 키워드는 반드시 **굵게** 표시하세요.`;
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
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}): string {
  const questionStats = data.questions
    .map((q) => {
      const totalAnswers = q.optionDistribution.reduce((a, b) => a + b, 0);
      const optionsDetail = q.options
        .map((opt, i) => {
          const count = q.optionDistribution[i];
          const pct = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
          const marker = i === q.correctIndex ? "★정답" : "";
          return `  ${i + 1}. "${opt}" — ${count}명 선택(${pct}%) ${marker}`;
        })
        .join("\n");

      return `【문제 ${q.index + 1}】 [${q.category}]
질문: "${q.text}"
정답률: ${(q.correctRate * 100).toFixed(1)}%
선택지별 응답:
${optionsDetail}
해설: ${q.explanation}`;
    })
    .join("\n\n");

  return `실험 주제: ${data.topic}
총 참여 인원: ${data.totalParticipants}명

${questionStats}

이 서비스는 학생들이 실험 시작 전에 안전수칙 퀴즈를 풀며 안전 의식을 되새기는 것이 목적입니다. 오답 분석 결과는 교강사가 실험 시작 전에 한 번 더 강조할 부분을 파악하는 용도입니다.

위 데이터를 분석하여 다음을 작성하세요:

1. summary: 전체 그룹의 안전 지식 이해도를 한두 문장으로 요약. 실험 시작 전에 특별히 주의해야 할 점을 포함.
2. overallCorrectRate: 전체 평균 정답률 (0~1 사이 소수)
3. questionBreakdowns: 각 문항별 분석. 반드시 모든 문항을 포함할 것.
   - questionIndex: 문제 번호 (0부터 시작)
   - questionText: 문제 텍스트
   - category: 안전 분류
   - correctRate: 정답률 (0~1)
   - correctOptionText: 정답 선택지 텍스트
   - topWrongOptionIndex: 가장 많이 선택된 오답의 인덱스 (0~3), 정답률 100%면 null
   - topWrongOptionText: 가장 많이 선택된 오답의 텍스트, 정답률 100%면 null
   - topWrongSelectionRate: 오답 최다 선택 비율 (0~1), 정답률 100%면 null
   - whyStudentsConfused: 학생들이 왜 이 오답을 헷갈렸는지 구체적으로 설명 (예: "A와 B의 차이를 헷갈려서...", "~이라는 잘못된 상식 때문에..."). 핵심 단어는 **굵게** 표시. 정답률 100%면 null.
   - teachingTip: 실험 시작 전 교강사가 학생들에게 강조해야 할 핵심 포인트. 실험 전체 안전과 직결되는 내용을 구체적으로 제시. 강조할 부분은 **굵게** 표시. 정답률 100%면 null.
4. topMisconceptions: 2~3개의 가장 두드러진 오개념 패턴. 각각 affectedQuestions(0부터 시작하는 문항 인덱스 배열), misconception(오개념 요약), explanation(왜 이 오해가 생겼는지) 포함.
 5. recommendations: 2~3개의 우선순위별 실험 전 강조 제안 배열. 각 항목은 다음 3개 필드를 반드시 포함:
    - priority: "high" 또는 "medium" 또는 "low"
    - title: 제안 제목 (예: "실험 전 개인보호구 착용 순서 강조")
    - description: 실험 시작 전 교강사가 학생들에게 구체적으로 당부할 내용 (예: "실험 시작 전 장갑과 고글 착용 순서를 직접 시연하며 설명하세요")`;
}

export const FEW_SHOT_EXAMPLES = `
예시 1 (기초 - 화학취급):
문제: "희석 황산을 제조할 때 올바른 방법은?"
선택지: ["물에 황산을 조금씩 붓는다", "황산에 물을 붓는다", "동시에 섞는다", "뜨거운 물에 붓는다"]
정답: 0 (물에 산을 붓는 것이 원칙)
해설: 산을 물에 붓으면 발열 반응으로 인해 산이 튀을 수 있습니다. 반드시 **물에 산을 조금씩 천천히** 부어야 합니다.

예시 2 (중급 - 개인보호구):
문제: "농축 염산을 취급할 때 필요한 개인보호구로 가장 적절한 것은?"
선택지: ["안전고글만", "보호장갑만", "안전고글 + 보호장갑 + 실험복", "실험복만"]
정답: 2
 해설: 농축 염산은 강한 부식성과 휘발성이 있으므로 **눈, 피부, 의복 보호**가 모두 필요합니다.
 `;
