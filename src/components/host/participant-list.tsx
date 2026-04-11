"use client";

import type { LiveParticipant } from "@/lib/socket/types";

export function ParticipantList({ participants, responseCount }: { participants: LiveParticipant[]; responseCount: number }) {
  return (
    <div className="border border-[rgba(0,0,0,0.08)] rounded-[2rem] p-6 bg-white shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <h3 className="font-bold text-[#222222]">참여자 ({participants.length}명)</h3>
        </div>
        {responseCount > 0 && (
          <span className="text-xs font-bold px-2 py-1 bg-[#F1F3F8] text-[#4F7CFF] rounded-lg">{responseCount}/{participants.length} 제출됨</span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto min-h-[120px] max-h-[300px] pr-2 custom-scrollbar">
        {participants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center opacity-40">
            <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm">대기 중...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {participants.map((p) => (
              <div key={p.id} className={`flex items-center justify-between py-2.5 px-3 rounded-2xl transition-all duration-300 ${
                p.hasAnswered ? "bg-[#4F7CFF]/5 text-[#4F7CFF] border border-[#4F7CFF]/10" : "bg-[#F8F9FB] text-[#6B7280] border border-transparent"
              }`}>
                <span className="text-sm font-semibold truncate">{p.nickname}</span>
                {p.hasAnswered && (
                  <svg className="w-4 h-4 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
