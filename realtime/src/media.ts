import { redisKey } from "@watchsync/shared/redis-key";
import { RoomServiceClient, TrackSource } from "livekit-server-sdk";
import { Redis } from "@upstash/redis";

function service() {
  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET)
    return null;
  return new RoomServiceClient(
    process.env.NEXT_PUBLIC_LIVEKIT_URL!.replace(/^ws/, "http"),
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
  );
}
export async function moderateMedia(code: string, id: string, action: string) {
  const api = service();
  if (!api) return;
  const participants = await api
    .listParticipants(code)
    .catch((error: { status?: number }) => {
      if (error.status === 404) return [];
      throw error;
    });
  const target = participants.find((p) => p.identity === id);
  if (action === "kick") {
    await api.removeParticipant(code, id);
    await Redis.fromEnv().eval(
      "if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end",
      [redisKey(`screen:${code}`)],
      [id],
    );
    return;
  }
  if (!target || !["mute", "unmute"].includes(action)) return;
  const screen = target.permission?.canPublishSources.includes(
    TrackSource.SCREEN_SHARE,
  );
  await api.updateParticipant(code, id, {
    permission: {
      canSubscribe: true,
      canPublish: true,
      canPublishData: false,
      canPublishSources: [
        TrackSource.CAMERA,
        ...(action === "unmute" ? [TrackSource.MICROPHONE] : []),
        ...(screen
          ? [
              TrackSource.SCREEN_SHARE,
              ...(action === "unmute" ? [TrackSource.SCREEN_SHARE_AUDIO] : []),
            ]
          : []),
      ],
    },
  });
}
export async function deleteMediaRoom(code: string) {
  const api = service();
  if (api)
    await api.deleteRoom(code).catch((error: { status?: number }) => {
      if (error.status !== 404) throw error;
    });
  await Redis.fromEnv().del(redisKey(`screen:${code}`));
}
