"use client";
import { useEffect, useRef, useState } from "react";
import { useRoom } from "@/hooks/use-room";
import { useRoomSync } from "@/hooks/use-room-sync";
import { roomCommand, reportError } from "@/lib/realtime-client";
import { canControl } from "@watchsync/shared/types";
import { Button } from "@/components/ui/button";
interface Player {
  destroy(): void;
  cueVideoById(id: string): void;
  loadVideoById(id: string): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(time: number, allow: boolean): void;
  getCurrentTime(): number;
  getPlayerState(): number;
  getAvailablePlaybackRates(): number[];
  setPlaybackRate(rate: number): void;
}
declare global {
  interface Window {
    YT?: { Player: new (node: HTMLElement, options: unknown) => Player };
    onYouTubeIframeAPIReady?: () => void;
  }
}
let api: Promise<void> | undefined;
function loadApi() {
  return (api ??= new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  }));
}
export function YouTubePlayer() {
  const { room, me, code } = useRoom();
  const { connected, playback, offset } = useRoomSync(code, false);
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<Player | null>(null);
  const applying = useRef(0);
  const loaded = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const latest = useRef({
    playback,
    allowed: canControl(me.role, room.controlMode),
  });
  latest.current = { playback, allowed: canControl(me.role, room.controlMode) };
  const hasVideo = Boolean(playback?.videoId);
  useEffect(() => {
    if (!hasVideo) return;
    let cancelled = false;
    void loadApi().then(() => {
      if (cancelled || !host.current) return;
      const node = document.createElement("div");
      host.current.appendChild(node);
      player.current = new window.YT!.Player(node, {
        height: "100%",
        width: "100%",
        playerVars: {
          origin: window.location.origin,
          playsinline: 1,
          rel: 0,
          hl: "id",
        },
        events: {
          onReady: () => setReady(true),
          onError: () =>
            setError(
              "Video tidak dapat diputar. Pilih video lain dari playlist.",
            ),
          onStateChange: (event: { data: number }) => {
            if (event.data === 5 && loaded.current) {
              void roomCommand(code, "player:ready", loaded.current).catch(
                reportError,
              );
            }
            if (event.data === 1) setError("");
            if (Date.now() < applying.current) return;
            const v = latest.current;
            if (!v.allowed || !v.playback?.videoId) return;
            if (event.data === 1 && v.playback.status !== "playing")
              void roomCommand(code, "player:play").catch(reportError);
            if (event.data === 2 && v.playback.status !== "paused")
              void roomCommand(code, "player:pause").catch(reportError);
          },
        },
      });
    });
    return () => {
      cancelled = true;
      player.current?.destroy();
      player.current = null;
    };
  }, [code, hasVideo]);
  useEffect(() => {
    const p = player.current;
    if (!p || !ready) return;
    if (!playback?.videoId) {
      applying.current = Date.now() + 700;
      p.pauseVideo();
      loaded.current = null;
      return;
    }
    if (loaded.current !== playback.videoId) {
      loaded.current = playback.videoId;
      applying.current = Date.now() + 1500;
      p.cueVideoById(playback.videoId);
    } else if (playback.waiting) {
      void roomCommand(code, "player:ready", playback.videoId).catch(
        reportError,
      );
    }
    const apply = () => {
      const value = latest.current.playback;
      if (!value) return;
      const target =
        value.position +
        (value.status === "playing"
          ? Math.max(0, Date.now() + offset.current - value.updatedAt) / 1000
          : 0);
      const drift = target - p.getCurrentTime();
      applying.current = Date.now() + 700;
      if (Math.abs(drift) > 1.5) p.seekTo(target, true);
      else if (value.status === "playing" && Math.abs(drift) > 0.15) {
        const rate = drift > 0 ? 1.03 : 0.97;
        if (p.getAvailablePlaybackRates().includes(rate))
          p.setPlaybackRate(rate);
        else if (Math.abs(drift) > 0.75) p.seekTo(target, true);
      } else p.setPlaybackRate(1);
      if (value.status === "playing" && p.getPlayerState() !== 1) p.playVideo();
      if (value.status === "paused" && p.getPlayerState() === 1) p.pauseVideo();
    };
    apply();
    const timer = setInterval(apply, 2000);
    let previous = p.getCurrentTime(),
      previousAt = Date.now();
    const seekMonitor = setInterval(() => {
      const now = Date.now(),
        current = p.getCurrentTime();
      const expected =
        previous + (p.getPlayerState() === 1 ? (now - previousAt) / 1000 : 0);
      if (
        now > applying.current &&
        latest.current.allowed &&
        Math.abs(current - expected) > 1.5
      ) {
        applying.current = now + 1000;
        void roomCommand(code, "player:seek", current).catch(reportError);
      }
      previous = current;
      previousAt = now;
    }, 500);
    return () => {
      clearInterval(timer);
      clearInterval(seekMonitor);
    };
  }, [playback, ready, code, offset]);
  return (
    <section>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
        <div
          ref={host}
          className="absolute inset-0 size-full [&_iframe]:size-full"
        />
        {!playback?.videoId && (
          <div className="absolute inset-0 z-10 grid place-content-center bg-black p-6 text-center text-muted-foreground">
            Pilih video dari playlist untuk mulai menonton.
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span role="status">
          {connected
            ? playback?.waiting
              ? "Menunggu kesiapan anggota…"
              : "Terhubung · Sinkronisasi aktif"
            : "Menyambungkan room…"}
        </span>
        <Button
          size="sm"
          variant="secondary"
          disabled={
            !connected ||
            (playback?.waiting && me.role !== "owner") ||
            !canControl(me.role, room.controlMode) ||
            !playback?.videoId
          }
          onClick={() =>
            void roomCommand(
              code,
              playback?.status === "playing" ? "player:pause" : "player:play",
            ).catch(reportError)
          }
        >
          {playback?.waiting && me.role === "owner"
            ? "Putar Sekarang"
            : playback?.status === "playing"
              ? "Jeda"
              : "Putar"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </section>
  );
}
