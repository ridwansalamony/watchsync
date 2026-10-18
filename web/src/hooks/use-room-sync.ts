"use client";
import { create } from "zustand";
import { useEffect } from "react";
import { io } from "socket.io-client";
import { refreshRoom } from "@/lib/client-data";
import { registerSocket, reportError } from "@/lib/realtime-client";
import { useAppStore } from "@/stores/app-store";
export interface Playback {
  videoId: string | null;
  status: "playing" | "paused";
  position: number;
  updatedAt: number;
  waiting: boolean;
}
const sync = create<{
  connected: boolean;
  playback: Playback | null;
  offset: { current: number };
}>(() => ({ connected: false, playback: null, offset: { current: 0 } }));
export function useRoomSync(code: string, manage = true) {
  const memberId = useAppStore((s) => s.memberships[code]);
  const { connected, playback, offset } = sync();
  const setConnected = (connected: boolean) => sync.setState({ connected });
  const setPlayback = (playback: Playback) => sync.setState({ playback });
  useEffect(() => {
    if (!manage) return;
    sync.setState({ connected: false, playback: null });
    let disposed = false;
    let cleanup = () => {};
    void (async () => {
      const data = await refreshRoom(code);
      if (disposed || !data.token) return;
      const socket = io(
        process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:4000",
        { auth: { token: data.token }, withCredentials: true },
      );
      registerSocket(code, socket);
      socket.on("connect", () => {
        setConnected(true);
        socket.emit(
          "room:join",
          {},
          (result: { ok: boolean; error?: string }) => {
            if (!result.ok) {
              reportError(new Error(result.error ?? "Gabung room gagal."));
              socket.disconnect();
            }
          },
        );
        void (async () => {
          const samples: { offset: number; rtt: number }[] = [];
          for (let i = 0; i < 5; i++) {
            const start = Date.now();
            const r = await socket
              .timeout(5000)
              .emitWithAck("sync:ping", start);
            if (r.ok)
              samples.push({
                offset: r.data.serverTime - (start + Date.now()) / 2,
                rtt: Date.now() - start,
              });
          }
          samples.sort((a, b) => a.rtt - b.rtt);
          const best = samples.slice(0, 3);
          offset.current = best.length
            ? best.reduce((sum, s) => sum + s.offset, 0) / best.length
            : 0;
        })().catch(reportError);
      });
      socket.on("disconnect", () => setConnected(false));
      socket.on("sync:rejected", ({ state }: { state: Playback | null }) => {
        if (state) setPlayback(state);
      });
      socket.on(
        "presence:update",
        (snapshot: {
          members: { id: string; online: boolean }[];
          memberCount: number;
        }) =>
          useAppStore.setState((s) => ({
            rooms: s.rooms.map((r) =>
              r.code === code
                ? {
                    ...r,
                    memberCount: snapshot.memberCount,
                    members: r.members.map((m) => ({
                      ...m,
                      online:
                        snapshot.members.find((n) => n.id === m.id)?.online ??
                        false,
                    })),
                  }
                : r,
            ),
          })),
      );
      const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
      socket.on(
        "presence:typing",
        ({ memberId, typing }: { memberId: string; typing: boolean }) => {
          clearTimeout(typingTimers.get(memberId));
          useAppStore.setState((s) => ({
            typing: {
              ...s.typing,
              [code]: {
                ...s.typing[code],
                [memberId]: typing ? Date.now() + 5000 : 0,
              },
            },
          }));
          if (typing)
            typingTimers.set(
              memberId,
              setTimeout(
                () =>
                  useAppStore.setState((s) => ({
                    typing: {
                      ...s.typing,
                      [code]: { ...s.typing[code], [memberId]: 0 },
                    },
                  })),
                5000,
              ),
            );
        },
      );
      socket.on("player:state", (value: Playback) => {
        setPlayback(value);
        useAppStore.setState((s) => ({
          rooms: s.rooms.map((r) =>
            r.code === code
              ? {
                  ...r,
                  currentVideoId:
                    r.videos.find((v) => v.youtubeVideoId === value.videoId)
                      ?.id ?? null,
                  playbackStatus: value.status,
                  playbackPosition: value.position,
                }
              : r,
          ),
        }));
      });
      const refresh = () => void refreshRoom(code).catch(reportError);
      socket.on("room:refresh", refresh);
      socket.on("room:settings-updated", refresh);
      socket.on("room:kicked", () => {
        window.location.href = "/gabung";
      });
      socket.on("room:deleted", () => {
        window.location.href = "/gabung";
      });
      socket.on("connect_error", () => {
        setConnected(false);
        void refreshRoom(code)
          .then((data) => {
            if (data.token) socket.auth = { token: data.token };
          })
          .catch(() => {});
      });
      const heartbeat = setInterval(
        () => socket.emit("presence:update", {}, () => {}),
        20000,
      );
      const renew = setInterval(() => {
        void refreshRoom(code)
          .then((data) => {
            if (data.token) socket.auth = { token: data.token };
          })
          .catch(() => {});
      }, 240000);
      cleanup = () => {
        for (const timer of typingTimers.values()) clearTimeout(timer);
        clearInterval(heartbeat);
        clearInterval(renew);
        socket.emit("room:leave", {}, () => {});
        socket.disconnect();
        registerSocket(code, null);
      };
      if (disposed) cleanup();
    })().catch(reportError);
    return () => {
      disposed = true;
      cleanup();
    };
  }, [code, manage, memberId, offset]);
  return { connected, playback, offset };
}
