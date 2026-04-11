import Link from "next/link";
import { BrandMascot } from "@/components/brand-mascot";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8F9FB] selection:bg-[#4F7CFF]/30 selection:text-[#4F7CFF]">
      {/* Background Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[5%] opacity-20 lab-float-1">
          <BrandMascot variant="safety" size={120} />
        </div>
        <div className="absolute top-[60%] right-[10%] opacity-15 lab-float-2 scale-75">
          <BrandMascot variant="experiment" size={100} />
        </div>
        <div className="absolute bottom-[10%] left-[15%] opacity-10 lab-float-3 scale-110">
          <BrandMascot variant="safety" size={80} />
        </div>
        <div className="absolute top-[20%] right-[25%] opacity-5 lab-float-4">
          <BrandMascot variant="surprisedExperiment" size={140} />
        </div>
      </div>

      {/* Header / Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-md bg-white/60 border-b border-[rgba(0,0,0,0.04)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <BrandMascot variant="safety" size={32} className="group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-brand text-xl font-black text-[#222222] tracking-tight">안전몽</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="px-4 py-2 text-sm font-bold text-[#6B7280] hover:text-[#222222] transition-colors"
            >
              로그인
            </Link>
            <Link 
              href="/signup" 
              className="px-5 py-2.5 bg-[#4F7CFF] text-white text-sm font-bold rounded-xl hover:bg-[#6B91FF]/20 transition-all active:scale-95"
            >
              시작하기
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[rgba(0,0,0,0.06)] shadow-sm animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-[#4F7CFF] animate-pulse" />
            <span className="text-xs font-bold text-[#4F7CFF] tracking-widest uppercase">AI-Powered Safety Education</span>
          </div>

          <div className="space-y-4 animate-fade-in-up [animation-delay:100ms]">
            <h1 className="text-5xl md:text-7xl font-black text-[#222222] tracking-tight leading-[1.1] font-brand">
              실험실 안전의<br />
              <span className="text-[#4F7CFF]">새로운 기준,</span> 안전몽
            </h1>
            <p className="max-w-xl mx-auto text-lg md:text-xl text-[#6B7280] leading-relaxed">
              교강사의 주제 입력 한 번으로 AI가 맞춤형 퀴즈를 생성하고,<br className="hidden md:block" />
              실시간 데이터 분석으로 학생들의 오개념까지 완벽하게 잡아냅니다.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up [animation-delay:200ms]">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto px-8 py-4 bg-[#222222] text-white text-lg font-bold rounded-2xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              지금 무료로 시작하기
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <div className="text-sm font-medium text-[#9CA3AF]">
              학생은 교강사가 공유한 QR 코드로 바로 접속하세요
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group p-8 bg-white rounded-[2.5rem] border border-[rgba(0,0,0,0.04)] shadow-sm transition-all duration-300 animate-fade-in-up [animation-delay:300ms]">
            <div className="w-14 h-14 bg-[#4F7CFF]/10 rounded-2xl flex items-center justify-center text-[#4F7CFF] mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#222222] mb-3">AI 퀴즈 생성</h3>
            <p className="text-[#6B7280] leading-relaxed">
              실험 주제만 입력하세요. AI가 대학 실험실 환경에 최적화된 고품질 안전 퀴즈와 해설을 즉시 생성합니다.
            </p>
          </div>

          <div className="group p-8 bg-white rounded-[2.5rem] border border-[rgba(0,0,0,0.04)] shadow-sm transition-all duration-300 animate-fade-in-up [animation-delay:400ms]">
            <div className="w-14 h-14 bg-[#7C5CFF]/10 rounded-2xl flex items-center justify-center text-[#7C5CFF] mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#222222] mb-3">실시간 참여 세션</h3>
            <p className="text-[#6B7280] leading-relaxed">
              별도의 앱 설치 없이 QR 코드 하나로 즉시 입장. 긴장감 넘치는 실시간 타이머 기반 퀴즈로 몰입도를 극대화합니다.
            </p>
          </div>

          <div className="group p-8 bg-white rounded-[2.5rem] border border-[rgba(0,0,0,0.04)] shadow-sm transition-all duration-300 animate-fade-in-up [animation-delay:500ms]">
            <div className="w-14 h-14 bg-[#5EE6D6]/10 rounded-2xl flex items-center justify-center text-[#0D9488] mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#222222] mb-3">정밀 오답 분석</h3>
            <p className="text-[#6B7280] leading-relaxed">
              단순 통계를 넘어, AI가 학생들이 왜 특정 오답을 선택했는지 분석하고 다음 수업을 위한 지도 팁까지 제안합니다.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-[rgba(0,0,0,0.04)] text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <BrandMascot variant="safety" size={24} />
          <span className="font-brand font-black text-[#222222]">안전몽</span>
        </div>
        <p className="text-sm text-[#9CA3AF]">© 2026 Safety-Mong. All rights reserved.</p>
      </footer>
    </div>
  );
}
