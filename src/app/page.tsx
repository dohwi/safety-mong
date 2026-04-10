import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="flex max-w-md flex-col items-center gap-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500 text-3xl text-white font-bold">
          SM
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-[#222222]">
            안전몽
          </h1>
          <p className="text-lg text-[#6a6a6a]">
            실험실 안전수칙 실시간 퀴즈 플랫폼
          </p>
        </div>
        <div className="flex w-full flex-col gap-3">
          <Link
            href="/login"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#3b82f6] text-base font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
          >
            교강사 로그인
          </Link>
          <Link
            href="/signup"
            className="flex h-12 w-full items-center justify-center rounded-xl border border-[#c1c1c1] text-base font-semibold text-[#222222] transition-colors hover:border-[#222222]"
          >
            회원가입
          </Link>
        </div>
        <p className="text-sm text-[#6a6a6a]">
          학생은 교강사가 제공하는 QR코드로 접속하세요
        </p>
      </div>
    </div>
  );
}
