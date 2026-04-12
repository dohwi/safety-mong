<p align="center">
  <img src="public/mascots/safety-mong.png" alt="안전몽 마스코트" width="180" />
</p>

<h1 align="center">안전몽 (Safety-Mong)</h1>

<p align="center">
  <strong>실험실 안전수칙 실시간 AI 퀴즈 플랫폼</strong><br/>
  교강사의 주제 입력 한 번으로 AI가 맞춤형 퀴즈를 생성하고,<br/>
  실시간 데이터 분석으로 학생들의 오개념까지 완벽하게 잡아냅니다.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-000000?style=flat-square&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-Realtime-010101?style=flat-square&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-DrizzleORM-003B57?style=flat-square&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/AI-Gemini_2.0_Flash-4285F4?style=flat-square&logo=google&logoColor=white" />
</p>

---

## 배경 및 문제 의식

대학 실험실에서는 매년 안전사고가 발생합니다. 화학약품 취급 오류, 전기기기 부주의, 보호구 미착용 등 사고 원인의 상당수는 **기본 안전수칙에 대한 이해 부족**에서 비롯됩니다.

그러나 기존의 안전교육은 다음과 같은 한계가 있습니다:

| 기존 방식 | 한계점 |
|-----------|--------|
| 종이 기반 퀴즈 | 즉각적인 피드백 불가, 채점 부담 |
| 일방향 강의 | 학생 참여도 저조, 집중력 급감 |
| 획일화된 문제 | 각 실험 특성을 반영하지 못함 |
| 결과 분석 부재 | 어떤 개념을 헷갈려 했는지 파악 불가 |

**안전몽은 이 문제를 "AI 기반 실시간 인터랙티브 퀴즈"로 해결합니다.**

---

## 핵심 기능

### 1. AI 맞춤형 퀴즈 자동 생성

교강사가 **실험 주제만 입력**하면, AI가 대학 실험실 환경에 최적화된 안전 퀴즈를 즉시 생성합니다.

- 실험 절차 기반의 실용적인 문제 출제
- 오답 유도 선택지와 상세 해설 자동 작성
- 문항별 난이도 및 제한시간 자동 설정
- 생성 후 교강사가 자유롭게 수정·추가 가능

### 2. 실시간 참여 세션

별도 앱 설치 없이 **QR 코드 하나로 즉시 입장**. 긴장감 넘치는 타이머 기반 실시간 퀴즈로 몰입도를 극대화합니다.

- Socket.IO 기반 양방향 실시간 통신
- 서버 권위 타이머 (클라이언트 시간 조작 불가)
- 문항별 자동 진행 및 참여자 응답 실시간 집계
- 목표 인원 도달 시 자동 시작 옵션

### 3. AI 정밀 오답 분석

단순 통계를 넘어, AI가 **학생들이 왜 특정 오답을 선택했는지**를 분석합니다.

- 문항별 오답 선택 패턴 및 원인 분석
- 학생 공통 오개념( Misconception ) 자동 탐지
- 다음 수업을 위한 구체적인 지도 팁 제안
- 우선순위 기반 추가 교육 권장사항

---

> **📸 [실제 화면 스크린샷 보러가기](./assets/screenshots/README.md)**

## 기술 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                    Client                            │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐ │
│  │ 교강사    │  │  학생      │  │  실시간 대시보드  │ │
│  │ Dashboard │  │  Quiz View│  │  (Host Live)     │ │
│  └─────┬────┘  └─────┬─────┘  └────────┬─────────┘ │
│        │              │                  │           │
│        └──────────────┼──────────────────┘           │
│                       │ Socket.IO                    │
├───────────────────────┼─────────────────────────────┤
│                    Server                            │
│  ┌──────────┐  ┌─────┴─────┐  ┌──────────────────┐ │
│  │ Next.js   │  │ Socket.IO │  │  Session Timer   │ │
│  │ (Custom)  │  │  Server   │  │  (Authority)     │ │
│  └─────┬────┘  └───────────┘  └──────────────────┘ │
│        │                                             │
│  ┌─────┴──────────────────────────────────────────┐ │
│  │              Business Logic                      │ │
│  │  ┌─────────┐  ┌──────────┐  ┌───────────────┐  │ │
│  │  │ AI Quiz │  │ AI Anal. │  │ Session State │  │ │
│  │  │ Gen.    │  │ Engine   │  │ Machine       │  │ │
│  │  └─────────┘  └──────────┘  └───────────────┘  │ │
│  └───────────────────────┬────────────────────────┘ │
│                          │                           │
│  ┌───────────────────────┴────────────────────────┐ │
│  │           SQLite (Drizzle ORM)                  │ │
│  │  users · quiz_boxes · questions · sessions      │ │
│  │  participants · answers                         │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 기술 스택

| 영역 | 기술 | 선정 이유 |
|------|------|-----------|
| 프레임워크 | Next.js 16 (Custom Server) | SSR + API Routes + 파일 기반 라우팅 |
| 실시간 통신 | Socket.IO | 안정적인 양방향 통신, 자동 재연결 |
| AI | Google Gemini 2.0 Flash (via OpenRouter) | 빠른 응답속도, 한국어 이해도 우수 |
| DB | SQLite + Drizzle ORM | 경량 배포, 타입 안전한 쿼리 |
| 인증 | JWT (jose) + bcrypt | 세션리스 인증, 보안 해시 |
| 언어 | TypeScript (Strict) | 타입 안정성, 개발 생산성 |
| 스타일 | Tailwind CSS v4 | 빠른 UI 구현, 일관된 디자인 |

### 세션 상태머신

```
waiting → active → intermission → active → ... → completed → analysis → closed
```

모든 상태 전이는 서버에서 관리하며, 인메모리 Map과 SQLite에 이중 영속화하여 안정성을 보장합니다.

### 서버 권위 타이머

클라이언트 타임스탬프를 신뢰하지 않고 서버에서 타이머를 제어합니다. 답 제출에는 500ms 유예 시간을 적용하여 네트워크 지연으로 인한 불이익을 방지합니다.

---

## 프로젝트 구조

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 로그인 / 회원가입
│   ├── (instructor)/             # 교강사 전용 페이지
│   │   ├── dashboard/            # 메인 대시보드
│   │   └── quiz-boxes/[id]/      # 퀴즈함 관리
│   ├── api/                      # API Routes
│   │   ├── generate/             # AI 퀴즈 생성
│   │   └── analyze/              # AI 오답 분석
│   ├── join/[code]/              # 학생 세션 입장
│   └── play/[sessionId]/         # 학생 실시간 퀴즈
├── components/
│   ├── host/                     # 교강사 실시간 대시보드
│   ├── student/                  # 학생 퀴즈 인터페이스
│   ├── analysis/                 # 분석 리포트 컴포넌트
│   └── quiz/                     # 퀴즈 생성/편집
├── hooks/                        # React Hooks
│   ├── use-quiz.ts               # 학생 퀴즈 상태 관리
│   └── use-host-dashboard.ts     # 교강사 대시보드 상태
├── lib/
│   ├── ai/                       # AI 엔진
│   │   ├── generate-quiz.ts      # 퀴즈 생성
│   │   ├── analyze-results.ts    # 결과 분석
│   │   ├── prompts.ts            # 시스템 프롬프트
│   │   └── schemas.ts            # Zod 스키마
│   ├── socket/                   # 실시간 통신
│   │   ├── handlers.ts           # 이벤트 핸들러
│   │   ├── timer.ts              # 서버 타이머
│   │   └── session-state.ts      # 세션 상태 관리
│   ├── auth.ts                   # JWT 인증
│   └── actions/                  # Server Actions
└── db/
    └── schema.ts                 # DB 스키마 (6개 테이블)
```

---

## 화면 소개

### 교강사 화면
| 랜딩 페이지 | 대시보드 |
|:---:|:---:|
| 히어로 섹션과 기능 소개 | 퀴즈함 목록 관리 |

| 퀴즈 생성 | 실시간 대시보드 |
|:---:|:---:|
| AI 자동 생성 + 편집 | 타이머, 참여자, 응답 현황 |

| 분석 리포트 |
|:---:|
| 오답 분석, 오개념 탐지, 지도 팁 |

### 학생 화면
| 세션 입장 | 실시간 퀴즈 | 결과 확인 |
|:---:|:---:|:---:|
| QR/코드로 입장 | 타이머 기반 문제 풀이 | 정답 여부 및 해설 |
