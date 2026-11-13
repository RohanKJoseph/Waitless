import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/context/auth-context";
import { getAccessToken } from "@/lib/api";

let socket: Socket | null = null;

function getSocket(token: string | null) {
  if (!socket) {
    socket = io("/", {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: false,
      auth: token ? { token } : {},
    });
  }
  socket.auth = token ? { token } : {};
  return socket;
}

export function useSocket() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const token = getAccessToken();

  useEffect(() => {
    if (!user) return;
    const s = getSocket(token);
    if (!s.connected) s.connect();

    const onQueue = () => {
      void qc.invalidateQueries({ queryKey: ["queue"] });
      void qc.invalidateQueries({ queryKey: ["appointments"] });
      void qc.invalidateQueries({ queryKey: ["doctors"] });
    };
    const onAppt = () => {
      void qc.invalidateQueries({ queryKey: ["appointments"] });
      void qc.invalidateQueries({ queryKey: ["queue"] });
    };
    const onNotif = () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    };
    s.on("queue:updated", onQueue);
    s.on("appointment:updated", onAppt);
    s.on("notification:new", onNotif);
    return () => {
      s.off("queue:updated", onQueue);
      s.off("appointment:updated", onAppt);
      s.off("notification:new", onNotif);
    };
  }, [qc, token, user]);
}
