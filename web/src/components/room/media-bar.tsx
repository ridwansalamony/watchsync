"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useTracks,
  VideoTrack,
} from "@livekit/components-react";
import { Track, VideoPresets } from "livekit-client";
import { Camera, CameraOff, Mic, MicOff, MonitorUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRoom } from "@/hooks/use-room";
import { useAppStore } from "@/stores/app-store";

export default function MediaBar() {
  const { code } = useRoom();
  const [credentials, setCredentials] = useState<{
    token: string;
    url: string;
  }>();
  const [busy, setBusy] = useState(false);
  async function connect() {
    setBusy(true);
    try {
      const response = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setCredentials(result);
    } catch (error) {
      toast.error(
        error instanceof Error && /^(Layanan|Akses)/.test(error.message)
          ? error.message
          : "Media belum tersambung. Periksa jaringan dan coba kembali.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!credentials)
    return (
      <div className="mt-5 rounded-xl border border-white/10 p-4">
        <Button onClick={() => void connect()} disabled={busy}>
          {busy ? "Menghubungkan media…" : "Hubungkan Audio dan Video"}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Mikrofon dan kamera tetap mati sampai kamu mengaktifkannya.
        </p>
      </div>
    );
  return (
    <LiveKitRoom
      token={credentials.token}
      serverUrl={credentials.url}
      audio={false}
      video={false}
      options={{
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 854, height: 480, frameRate: 24 },
        },
      }}
      onDisconnected={() => setCredentials(undefined)}
      onError={() =>
        toast.error(
          "Koneksi media terganggu. Periksa jaringan lalu hubungkan kembali.",
        )
      }
    >
      <Controls />
      <RoomAudioRenderer />
      <StartAudio label="Izinkan Audio" />
    </LiveKitRoom>
  );
}

function Controls() {
  const { code, me, state } = useRoom();
  const {
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
  } = useLocalParticipant();
  const participants = useParticipants(),
    connection = useRoomContext();
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const [help, setHelp] = useState(false),
    [busy, setBusy] = useState(false);
  const [controlsTarget, setControlsTarget] = useState<HTMLElement | null>(
    null,
  );
  const [stage, setStage] = useState<HTMLElement | null>(null),
    [focusScreen, setFocusScreen] = useState(true);
  useEffect(() => {
    setStage(document.getElementById("screen-stage"));
    setControlsTarget(document.getElementById("media-controls"));
  }, []);
  const preferences = state.preferences;
  async function screenPermission(active: boolean) {
    const r = await fetch("/api/livekit/screen", {
      method: "POST",
      keepalive: !active,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, active }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
  }
  async function toggle(kind: "mic" | "camera" | "screen") {
    setBusy(true);
    try {
      if (kind === "mic")
        await localParticipant.setMicrophoneEnabled(
          !isMicrophoneEnabled && !me.isMuted,
        );
      if (kind === "camera")
        await localParticipant.setCameraEnabled(!isCameraEnabled, {
          resolution: (preferences.quality === "720p"
            ? VideoPresets.h720
            : { resolution: { width: 854, height: 480, frameRate: 24 } }
          ).resolution,
        });
      if (kind === "screen") {
        // Request capture inside the click gesture before the network permission round trip.
        if (isScreenShareEnabled) {
          await localParticipant.setScreenShareEnabled(false);
          await screenPermission(false);
        } else {
          const capture = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false,
          });
          try {
            await screenPermission(true);
            for (
              let attempt = 0;
              attempt < 30 &&
              !localParticipant.permissions?.canPublishSources.includes(3);
              attempt++
            )
              await new Promise((resolve) => setTimeout(resolve, 100));
            await localParticipant.publishTrack(capture.getVideoTracks()[0], {
              source: Track.Source.ScreenShare,
            });
            capture.getVideoTracks()[0].addEventListener(
              "ended",
              () => {
                void screenPermission(false).catch(() => {});
              },
              { once: true },
            );
          } catch (error) {
            capture.getTracks().forEach((t) => t.stop());
            await screenPermission(false).catch(() => {});
            throw error;
          }
        }
      }
    } catch (error) {
      setHelp(true);
      toast.error(
        error instanceof Error && /^(Anggota|Izin|Asal)/.test(error.message)
          ? error.message
          : "Perangkat belum bisa diaktifkan.",
      );
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (me.isMuted) void localParticipant.setMicrophoneEnabled(false);
  }, [me.isMuted, localParticipant]);
  useEffect(() => {
    if (!isScreenShareEnabled) return;
    const timer = setInterval(
      () =>
        void screenPermission(true).catch(() => {
          void localParticipant.setScreenShareEnabled(false);
        }),
      30000,
    );
    return () => { clearInterval(timer); void screenPermission(false).catch(() => {}); };
    // The membership and publication are stable for this lease.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScreenShareEnabled, code, localParticipant]);
  useEffect(() => {
    const update = () => {
      const speaking = new Set(
        participants.filter((p) => p.isSpeaking).map((p) => p.identity),
      );
      useAppStore.setState((s) => ({
        rooms: s.rooms.map((r) =>
          r.code === code
            ? {
                ...r,
                members: r.members.map((m) => ({
                  ...m,
                  speaking: speaking.has(m.id),
                })),
              }
            : r,
        ),
      }));
    };
    connection.on("activeSpeakersChanged", update);
    update();
    return () => {
      connection.off("activeSpeakersChanged", update);
      useAppStore.setState((s) => ({
        rooms: s.rooms.map((r) =>
          r.code === code
            ? {
                ...r,
                members: r.members.map((m) => ({ ...m, speaking: false })),
              }
            : r,
        ),
      }));
    };
  }, [participants, connection, code]);
  useEffect(() => {
    if (!preferences.pushToTalk || me.isMuted) return;
    let held = false;
    const up = () => {
      if (held) {
        held = false;
        void localParticipant.setMicrophoneEnabled(false);
      }
    };
    const down = (e: KeyboardEvent) => {
      if (
        e.code !== "Space" ||
        e.repeat ||
        (e.target instanceof HTMLElement &&
          (e.target.isContentEditable ||
            e.target.closest("input,textarea,button,select,[role=slider]")))
      )
        return;
      e.preventDefault();
      held = true;
      void localParticipant
        .setMicrophoneEnabled(true)
        .catch(() => setHelp(true));
    };
    const release = (e: KeyboardEvent) => {
      if (e.code === "Space") up();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", release);
    window.addEventListener("blur", up);
    return () => {
      up();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", release);
      window.removeEventListener("blur", up);
    };
  }, [preferences.pushToTalk, me.isMuted, localParticipant]);
  const deviceButtons = (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button
        size="icon"
        variant={isMicrophoneEnabled ? "default" : "secondary"}
        disabled={busy || me.isMuted}
        aria-label={
          isMicrophoneEnabled ? "Matikan mikrofon" : "Aktifkan mikrofon"
        }
        aria-pressed={isMicrophoneEnabled}
        onClick={() => void toggle("mic")}
      >
        {isMicrophoneEnabled ? <Mic /> : <MicOff />}
      </Button>
      <Button
        size="icon"
        variant="secondary"
        disabled={busy}
        aria-label={isCameraEnabled ? "Matikan kamera" : "Aktifkan kamera"}
        aria-pressed={isCameraEnabled}
        onClick={() => void toggle("camera")}
      >
        {isCameraEnabled ? <Camera /> : <CameraOff />}
      </Button>
      <Button
        size="icon"
        variant="secondary"
        disabled={busy}
        aria-label={
          isScreenShareEnabled ? "Hentikan berbagi layar" : "Bagikan layar"
        }
        aria-pressed={isScreenShareEnabled}
        onClick={() => void toggle("screen")}
      >
        <MonitorUp />
      </Button>
    </div>
  );
  return (
    <section aria-label="Audio dan video room" className="mt-5 space-y-3">
      {controlsTarget
        ? createPortal(deviceButtons, controlsTarget)
        : deviceButtons}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-card p-3">
        <label className="text-xs">
          Kualitas kamera{" "}
          <select
            aria-label="Kualitas kamera"
            className="rounded bg-background p-2"
            value={preferences.quality}
            onChange={(e) => {
              const quality = e.target.value as "480p" | "720p";
              state.setPreference("quality", quality);
              if (isCameraEnabled)
                void localParticipant
                  .getTrackPublication(Track.Source.Camera)
                  ?.videoTrack?.restartTrack({
                    resolution: (quality === "720p"
                      ? VideoPresets.h720
                      : {
                          resolution: {
                            width: 854,
                            height: 480,
                            frameRate: 24,
                          },
                        }
                    ).resolution,
                  })
                  .catch(() => setHelp(true));
            }}
          >
            <option>480p</option>
            <option>720p</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={preferences.pushToTalk}
            onChange={(e) => {
              state.setPreference("pushToTalk", e.target.checked);
              void localParticipant.setMicrophoneEnabled(false);
            }}
          />
          Tahan Spasi untuk Bicara
        </label>
      </div>
      {help && (
        <p
          role="status"
          className="rounded-lg border border-amber-400/30 p-3 text-xs leading-6"
        >
          Periksa ikon izin di sebelah alamat situs, izinkan Mikrofon/Kamera,
          lalu coba kembali. Untuk berbagi layar, pilih layar atau jendela pada
          dialog browser. Pastikan perangkat tidak sedang dipakai aplikasi lain.
        </p>
      )}
      {tracks.some((ref) => ref.source === Track.Source.ScreenShare) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFocusScreen(!focusScreen)}
        >
          {focusScreen ? "Perbesar Video YouTube" : "Perbesar Layar Bersama"}
        </Button>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {tracks.map((ref) => {
          const screen = ref.source === Track.Source.ScreenShare;
          const figure = (
            <figure
              key={`${ref.participant.identity}-${ref.source}`}
              data-screen-active={screen && focusScreen ? "true" : undefined}
              className={screen ? "sm:col-span-2" : ""}
            >
              <VideoTrack
                trackRef={ref}
                className="aspect-video w-full rounded-xl bg-black object-contain"
              />
              <figcaption className="py-2 text-xs">
                {ref.participant.name || "Anggota"}
                {screen ? " · Berbagi layar" : ""}
              </figcaption>
            </figure>
          );
          return screen && focusScreen && stage
            ? createPortal(figure, stage, ref.participant.identity)
            : figure;
        })}
      </div>
    </section>
  );
}
