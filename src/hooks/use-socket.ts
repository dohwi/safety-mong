"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/lib/socket/types";
import type { Socket } from "socket.io-client";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket(sessionId?: number) {
  const socketRef = useRef<TypedSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket: TypedSocket = io({
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.disconnect();
    };
  }, []);

  return { socket: socketRef.current, connected };
}
