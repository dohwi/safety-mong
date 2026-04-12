"use client";

import { useEffect, useState } from "react";
import { FloatingLabShapes } from "@/components/floating-lab-shapes";

interface NextQuestionOverlayProps {
  correctCount: number;
  totalParticipants: number;
  customTitle?: string;
  customSubtitle?: string;
}

export function NextQuestionOverlay({
  correctCount,
  totalParticipants,
  customTitle,
  customSubtitle,
}: NextQuestionOverlayProps) {
  const [phase, setPhase] = useState<"entering" | "staying" | "leaving">("entering");

  useEffect(() => {
    // 800ms(slide-in) + 2.2s(stay) = 3s total before leave
    const leaveTimer = setTimeout(() => {
      setPhase("leaving");
    }, 3000);

    return () => clearTimeout(leaveTimer);
  }, []);

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden pointer-events-none`}>
      {/* Cloud-like Background Layers */}
      <div 
        className={`absolute inset-0 bg-white transition-transform duration-800 ${
          phase === "leaving" ? "animate-cloud-out" : "animate-cloud-in"
        }`}
      >
        {/* Floating Bubbles (Mongle-Mongle) */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-[#4F7CFF]/10 rounded-full blur-xl animate-bubble"
              style={{
                left: `${(i * 15) % 100}%`,
                width: `${40 + (i * 20) % 80}px`,
                height: `${40 + (i * 20) % 80}px`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${3 + (i % 3)}s`
              }}
            />
          ))}
        </div>

        {/* Sky Blue Accent Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#4F7CFF]/5 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className={`relative z-10 flex flex-col items-center justify-center space-y-8 px-6 text-center ${
        phase === "leaving" ? "opacity-0 translate-y-[20px] transition-all duration-500" : "animate-content-float"
      }`}>
        <div className="relative">
          <FloatingLabShapes count={5} />
        </div>

        <div className="space-y-3">
          <h2 className="text-4xl font-black text-[#222222] tracking-tight">
            {customTitle || "다음 문제 준비중"}
          </h2>
          {customSubtitle ? (
            <p className="text-lg text-[#6B7280] font-semibold">{customSubtitle}</p>
          ) : (
            <div className="flex items-center justify-center gap-4 text-lg text-[#6B7280] font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-[#4F7CFF]">최종 정답</span>
                <span className="text-2xl text-[#222222]">{correctCount}명</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB]" />
              <div className="flex items-center gap-2">
                <span className="text-[#6B7280]">참여</span>
                <span className="text-2xl text-[#222222]">{totalParticipants}명</span>
              </div>
            </div>
          )}
        </div>

        <div className="w-64 h-2 bg-[#F1F3F8] rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full w-1/3 bg-gradient-to-r from-[#4F7CFF] via-[#7C5CFF] to-[#4F7CFF] rounded-full animate-loading-bar"
          />
        </div>
        
        <p className="text-sm font-bold text-[#9CA3AF] animate-pulse">다음 문제를 준비하고 있습니다</p>
      </div>
    </div>
  );
}
