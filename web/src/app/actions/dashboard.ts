"use server";
import { redisKey } from "@watchsync/shared/redis-key";

import { auth } from "@/auth";
import { database } from "@/db";
import {
  users,
  savedRooms,
  userPlaylists,
  userPlaylistItems,
  watchHistory,
} from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { displayNameSchema } from "@watchsync/shared/validation";
import { redis } from "@/lib/redis";
import { membership } from "@/lib/identity";
import { playlistItems, rooms } from "@/db/schema";
import { youtubeVideos } from "@/lib/youtube";
import { notifyRoom } from "@/lib/notify-room";
export async function loadPersonalPlaylist(code: string, playlistId: string) {
  const uid = await userId();
  z.string().uuid().parse(playlistId);
  const { room, member } = await membership(code);
  if (member.role === "member")
    throw new Error("Hanya Owner dan Moderator dapat mengganti playlist room.");
  const db = database(),
    list = await db.query.userPlaylists.findFirst({
      where: and(
        eq(userPlaylists.id, playlistId),
        eq(userPlaylists.userId, uid),
      ),
    });
  if (!list) throw new Error("Playlist tidak ditemukan.");
  const items = (
    await db
      .select()
      .from(userPlaylistItems)
      .where(eq(userPlaylistItems.playlistId, list.id))
  ).sort((a, b) => a.position - b.position);
  if (!items.length || items.length > 100)
    throw new Error("Playlist harus berisi 1 sampai 100 video.");
  const metadata = await youtubeVideos([
    ...new Set(items.map((v) => v.youtubeVideoId)),
  ]);
  if (
    items.some(
      (v) => !metadata.some((m) => m.youtubeVideoId === v.youtubeVideoId),
    )
  )
    throw new Error(
      "Salah satu video tidak mengizinkan pemutaran di aplikasi.",
    );
  await db.transaction(async (tx) => {
    await tx.select().from(rooms).where(eq(rooms.id, room.id)).for("update");
    await tx.delete(playlistItems).where(eq(playlistItems.roomId, room.id));
    await tx.insert(playlistItems).values(
      items.map((v, i) => {
        const m = metadata.find((m) => m.youtubeVideoId === v.youtubeVideoId)!;
        return {
          roomId: room.id,
          youtubeVideoId: m.youtubeVideoId,
          title: m.title,
          channelTitle: m.channelTitle,
          thumbnailUrl: m.thumbnailUrl,
          durationSec: m.durationSec,
          position: i,
          addedByMemberId: member.id,
        };
      }),
    );
    await tx
      .update(rooms)
      .set({
        currentVideoId: null,
        playbackStatus: "paused",
        playbackPosition: 0,
        playbackUpdatedAt: new Date(),
      })
      .where(eq(rooms.id, room.id));
  });
  await notifyRoom(code, false, true);
}
async function userId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Silakan masuk terlebih dahulu.");
  if (
    !(await database().query.users.findFirst({
      where: eq(users.id, session.user.id),
    }))
  )
    throw new Error("Akun sudah tidak tersedia.");
  return session.user.id;
}
export async function toggleSavedRoom(id: string) {
  const uid = await userId();
  z.string().uuid().parse(id);
  const db = database();
  return db.transaction(async (tx) => {
    await tx.select().from(users).where(eq(users.id, uid)).for("update");
    const rows = await tx
      .select()
      .from(savedRooms)
      .where(eq(savedRooms.userId, uid));
    if (rows.some((r) => r.roomId === id))
      await tx
        .delete(savedRooms)
        .where(and(eq(savedRooms.userId, uid), eq(savedRooms.roomId, id)));
    else {
      if (rows.length >= 50) throw new Error("Maksimal 50 room tersimpan.");
      await tx.insert(savedRooms).values({ userId: uid, roomId: id });
    }
  });
}
const video = z.object({
  id: z.string().uuid(),
  youtubeVideoId: z.string().regex(/^[\w-]{11}$/),
  title: z.string().min(1).max(200),
  thumbnailUrl: z.string().url().or(z.literal("")),
  position: z.number().int().nonnegative(),
});
const lists = z
  .array(
    z.object({
      id: z.string().uuid(),
      name: z.string().trim().min(1).max(80),
      videos: z.array(video).max(100),
    }),
  )
  .max(20);
export async function savePersonalPlaylists(input: unknown) {
  const uid = await userId();
  const values = lists.parse(input);
  const db = database();
  await db.transaction(async (tx) => {
    await tx.select().from(users).where(eq(users.id, uid)).for("update");
    const existing = await tx
      .select()
      .from(userPlaylists)
      .where(eq(userPlaylists.userId, uid));
    for (const list of existing)
      if (!values.some((v) => v.id === list.id))
        await tx.delete(userPlaylists).where(eq(userPlaylists.id, list.id));
    for (const list of values) {
      if (
        list.videos.some(
          (v, i) =>
            i > 0 && v.youtubeVideoId === list.videos[i - 1].youtubeVideoId,
        )
      )
        throw new Error("Video berurutan tidak boleh sama.");
      const [occupied] = await tx
        .select()
        .from(userPlaylists)
        .where(eq(userPlaylists.id, list.id));
      if (occupied && occupied.userId !== uid)
        throw new Error("Playlist bukan milik Anda.");
      await tx
        .insert(userPlaylists)
        .values({ id: list.id, userId: uid, name: list.name })
        .onConflictDoUpdate({
          target: userPlaylists.id,
          set: { name: list.name, updatedAt: new Date() },
        });
      await tx
        .delete(userPlaylistItems)
        .where(eq(userPlaylistItems.playlistId, list.id));
      if (list.videos.length)
        await tx.insert(userPlaylistItems).values(
          list.videos.map((v, i) => ({
            playlistId: list.id,
            youtubeVideoId: v.youtubeVideoId,
            title: v.title,
            thumbnailUrl: v.thumbnailUrl,
            position: i,
          })),
        );
    }
  });
}
export async function clearHistory(id?: string) {
  const uid = await userId();
  if (id) z.string().uuid().parse(id);
  await database()
    .delete(watchHistory)
    .where(
      and(
        eq(watchHistory.userId, uid),
        id ? eq(watchHistory.id, id) : sql`true`,
      ),
    );
}
export async function updateProfile(name: string) {
  const uid = await userId();
  await database()
    .update(users)
    .set({ name: displayNameSchema.parse(name), updatedAt: new Date() })
    .where(eq(users.id, uid));
}
export async function scheduleAccountDeletion() {
  const uid = await userId();
  const at = Date.now() + 30 * 86400000;
  await redis.zadd(redisKey("account-deletions"), { score: at, member: uid });
  return at;
}
