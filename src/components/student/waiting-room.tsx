"use client";

export function WaitingRoom({ participantCount }: { participantCount: number }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4 animate-pulse">⏳</div>
      <h2 className="text-xl font-semibold text-[#222222] mb-2">대기 중</h2>
      <p className="text-[#6a6a6a]">교강사가 퀴즈를 시작할 때까지 기다려주세요</p>
      <p className="text-sm text-[#6a6a6a] mt-4">현재 참여자: {participantCount}명</p>
    </div>
  );
}
