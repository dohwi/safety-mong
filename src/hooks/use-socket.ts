"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import type { TypedSocket } from "@/lib/socket/types";

export function useSocket(authToken?: string) {
  const socketRef = useRef<TypedSocket | null>(null);
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s: TypedSocket = io({
      autoConnect: true,
      auth: authToken ? { token: authToken } : undefined,
    });

    socketRef.current = s;

    s.on("connect", () => {
      setSocket(s);
      setConnected(true);
    });
    s.on("disconnect", () => setConnected(false));

    return () => {
      s.disconnect();
    };
  }, [authToken]);

  return { socket, connected };
}
