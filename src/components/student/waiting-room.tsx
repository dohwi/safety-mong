"use client";

import { memo } from "react";
import { BrandMascot } from "@/components/brand-mascot";

export const WaitingRoom = memo(function WaitingRoom({ participantCount, targetParticipantCount }: { participantCount: number; targetParticipantCount: number | null }) {
  const hasTarget = targetParticipantCount && targetParticipantCount > 0;
  const progress = hasTarget ? Math.min(100, (participantCount / targetParticipantCount!) * 100) : 0;
  const allJoined = hasTarget && participantCount >= targetParticipantCount!;

  return (
    <div className="text-center py-16">
      <div className="mb-5 flex justify-center">
        <BrandMascot variant="safety" size={164} className="h-auto w-32 animate-pulse drop-shadow-sm sm:w-36" />
      </div>
      <h2 className="text-xl font-semibold text-[#222222] mb-2">대기 중</h2>
      {hasTarget ? (
        <div className="space-y-3">
          <p className="text-[#6B7280]">모든 참여자가 입장하면 자동으로 시작됩니다</p>
          <div className="max-w-xs mx-auto">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#6B7280]">참여자</span>
              <span className="font-medium text-[#222222]">{participantCount}/{targetParticipantCount}명</span>
            </div>
            <div className="w-full bg-[#F1F3F8] rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${allJoined ? "bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.3)]" : "bg-[#4F7CFF]"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {allJoined && (
              <p className="text-sm text-[#22C55E] font-medium mt-2">전원 참여 완료!</p>
            )}
          </div>
        </div>
      ) : (
        <>
          <p className="text-[#6B7280]">교강사가 퀴즈를 시작할 때까지 기다려주세요</p>
          <p className="text-sm text-[#9CA3AF] mt-4">현재 참여자: {participantCount}명</p>
        </>
      )}
    </div>
  );
});
