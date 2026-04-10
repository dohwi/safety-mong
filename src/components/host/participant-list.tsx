"use client";

import type { LiveParticipant } from "@/lib/socket/types";

export function ParticipantList({ participants, responseCount }: { participants: LiveParticipant[]; responseCount: number }) {
  return (
    <div className="border border-[#c1c1c1] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[#222222]">참여자 ({participants.length}명)</h3>
        {responseCount > 0 && (
          <span className="text-sm text-[#6a6a6a]">{responseCount}/{participants.length} 응답</span>
        )}
      </div>
      <div className="max-h-48 overflow-y-auto space-y-1">
        {participants.length === 0 ? (
          <p className="text-sm text-[#6a6a6a] text-center py-4">아직 참여자가 없습니다</p>
        ) : (
          participants.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-gray-50">
              <span className="text-sm text-[#222222]">{p.nickname}</span>
              {p.hasAnswered && <span className="text-xs text-green-600">응답</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
