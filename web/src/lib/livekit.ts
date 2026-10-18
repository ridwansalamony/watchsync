import { RoomServiceClient, TrackSource } from "livekit-server-sdk";

export function mediaSources(muted: boolean, screen = false) {
  return [
    TrackSource.CAMERA,
    ...(!muted ? [TrackSource.MICROPHONE] : []),
    ...(screen
      ? [
          TrackSource.SCREEN_SHARE,
          ...(!muted ? [TrackSource.SCREEN_SHARE_AUDIO] : []),
        ]
      : []),
  ];
}
export function livekitService() {
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (
    !url ||
    !process.env.LIVEKIT_API_KEY ||
    !process.env.LIVEKIT_API_SECRET ||
    url.includes("your-project")
  )
    throw new Error("Konfigurasi LiveKit belum lengkap.");
  return new RoomServiceClient(
    url.replace(/^ws/, "http"),
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
  );
}
