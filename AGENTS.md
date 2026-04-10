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

## 참조

- 디자인 시스템: `DESIGN.md` (메인 색상 Sky Blue `#3b82f6`, 텍스트 `#222222`)
- 환경변수: `.env.example` 참조 (`OPENROUTER_API_KEY`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`)
- `docs/`는 gitignore됨 — 작업 문서, 리포지토리에 추적되지 않음
