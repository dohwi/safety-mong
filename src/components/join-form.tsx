"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/use-socket";

export function JoinForm({ sessionId }: { sessionId: number }) {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim() || !socket) return;

    setLoading(true);
    setError(null);

    const reconnectToken = getCookie(`reconnect_${sessionId}`);

    socket.emit("session:join", {
      sessionId,
      nickname: nickname.trim(),
      reconnectToken: reconnectToken || undefined,
    });

    socket.once("session:joined", (data) => {
      document.cookie = `reconnect_${sessionId}=${data.reconnectToken}; path=/; max-age=${60 * 60 * 24}; sameSite=lax`;
      router.push(`/play/${sessionId}?nickname=${encodeURIComponent(data.nickname)}`);
    });

    socket.once("session:error", (data) => {
      setError(data.message);
      setLoading(false);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="닉네임을 입력하세요"
        maxLength={20}
        className="w-full px-4 py-3 border border-[#c1c1c1] rounded-xl text-[#222222] text-center focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
        disabled={loading}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !nickname.trim()}
        className="w-full py-3 bg-[#3b82f6] text-white font-medium rounded-xl hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
      >
        {loading ? "참여 중..." : "참여하기"}
      </button>
    </form>
  );
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}
