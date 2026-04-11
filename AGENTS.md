# 안전몽 (Safety-Mong)

실험실 안전수칙 실시간 퀴즈 플랫폼. 교강사가 실험 주제 입력 → AI 퀴즈 생성 → 검수 → 타이머 기반 실시간 세션 → AI 오답 분석.

## 아키텍처 주의사항

- **진입점 `server.ts`** — Next.js 커스텀 서버. esbuild로 컴파일 후 `server-entry.cjs`로 실행 (globalThis.AsyncLocalStorage 설정 필요). Vercel 배포 불가, Railway/Render 배포.
- **이중 상태 관리** — 라이브 세션은 인메모리 `Map`, 상태 전이 시 SQLite에 영속화.
- **세션 상태머신**: `waiting → active → intermission → active → ... → completed → analysis → closed`
- **서버 권위 타이머** — 클라이언트 타임스탬프 신뢰하지 않음. 답 제출에 500ms 유예.
- **Socket.IO 룸**: 학생 `session:{id}`, 교강사 `session:{id}:host`
- **DB 6개 테이블**: `users`, `quiz_boxes`, `questions`, `sessions`, `participants`, `answers` — SQLite 파일은 `data/` 디렉토리.

## 명령어

```bash
pnpm run dev          # 커스텀 서버 시작 (esbuild 컴파일 + node server-entry.cjs)
pnpm run build        # Next.js 프로덕션 빌드 + 서버 컴파일
pnpm run start        # 프로덕션 서버 실행
pnpm db:push          # 스키마를 SQLite에 직접 반영 (dev)
pnpm db:generate      # 마이그레이션 파일 생성
pnpm db:migrate       # 마이그레이션 실행
pnpm test             # 테스트 (watch)
pnpm test:run         # 테스트 (단일 실행)
```

## 컨벤션

- 커밋: `<영어접두사>: <한글 설명>` (예: `feat: 교강사 인증 구현`)
- 논리적 변경 단위로 개별 커밋; schema → API → UI 분리
- 커밋 전 `pnpm run build` 필수
- 코드에 주석 금지 (요청 시만)
- 학생 뷰는 `max-w-md mx-auto`로 모바일 최적화

## 타이머/카운트다운 구현 규칙

- **서버가 권위** — 모든 타이머의 시작/종료는 서버 `SessionTimer`로 결정. 클라이언트는 표시만 담당.
- **서버→클라이언트 시간 동기화**: 서버가 `question:start`, `session:state` 이벤트에 `startedAt`(서버 기준 시작 epoch), `durationMs`, `serverNow`(서버 현재 epoch)를 함께 보냄.
- **클라이언트 카운트다운 패턴 (핵심)**:
  1. 이벤트 수신 시 `offset = serverNow - Date.now()` 를 **한 번만** 계산하여 ref에 저장
  2. `setInterval`(250ms)마다 `estimatedServerNow = Date.now() + offset` 로 현재 서버시간 추정
  3. `remaining = startedAt + durationMs - estimatedServerNow`
  4. **절대** `serverNow`를 그대로 ref에 넣고 매 틱마다 재사용하지 말 것 — 고정된 과거 시간이라 remaining이 변하지 않음
  5. `questionMetaRef` 타입은 `{ startedAt, durationMs, offset }` 여야 함 (`serverNow` 아님)
- **초기 remaining 계산**도 동일한 공식 사용: `Math.max(0, Math.ceil((startedAt + durationMs - (Date.now() + offset)) / 1000))`
- **서버 타이머 브로드캐스트**: 서버가 250ms마다 `question:timer` 이벤트로 `remainingSeconds`를 보냄. 클라이언트 로컬 카운트다운이 없을 때만 폴백으로 사용.
- **관련 파일**:
  - 서버 타이머: `src/lib/socket/timer.ts` (`SessionTimer` 클래스)
  - 서버 이벤트 발행: `src/lib/socket/handlers.ts` (startQuestion, emitTimerUpdate)
  - 학생 훅: `src/hooks/use-quiz.ts` (startLocalCountdown)
  - 교강사 훅: `src/hooks/use-host-dashboard.ts` (startLocalCountdown)
  - 타입: `src/lib/socket/types.ts` (QuestionBroadcast.startedAt/durationMs/serverNow)

## 참조

- 디자인 시스템: `DESIGN.md` (메인 색상 Sky Blue `#3b82f6`, 텍스트 `#222222`)
- 환경변수: `.env.example` 참조 (`OPENROUTER_API_KEY`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`)
- `docs/`는 gitignore됨 — 작업 문서, 리포지토리에 추적되지 않음
