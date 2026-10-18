import { NextResponse } from "next/server";
import { database } from "@/db";
import * as t from "@/db/schema";
import { identity } from "@/lib/identity";
import { roomData } from "@/lib/room-data";
import { eq, or, desc } from "drizzle-orm";
export async function GET() {
  try {
    const who = await identity(),
      db = database();
    const memberships =
      who.userId || who.guestId
        ? await db
            .select()
            .from(t.roomMembers)
            .where(
              who.userId
                ? eq(t.roomMembers.userId, who.userId)
                : eq(t.roomMembers.guestId, who.guestId!),
            )
        : [];
    const saved = who.userId
      ? await db
          .select()
          .from(t.savedRooms)
          .where(eq(t.savedRooms.userId, who.userId))
      : [];
    const ids = new Set([
      ...memberships.map((m) => m.roomId),
      ...saved.map((s) => s.roomId),
    ]);
    const sources = await db
      .select()
      .from(t.rooms)
      .where(
        or(
          eq(t.rooms.privacy, "public"),
          ...Array.from(ids, (id) => eq(t.rooms.id, id)),
        ),
      )
      .orderBy(desc(t.rooms.lastActivityAt))
      .limit(100);
    const playlists = who.userId
      ? await db
          .select()
          .from(t.userPlaylists)
          .where(eq(t.userPlaylists.userId, who.userId))
      : [];
    const history = who.userId
      ? await db
          .select()
          .from(t.watchHistory)
          .where(eq(t.watchHistory.userId, who.userId))
          .orderBy(desc(t.watchHistory.watchedAt))
          .limit(500)
      : [];
    const [profile] = who.userId
      ? await db.select().from(t.users).where(eq(t.users.id, who.userId))
      : [];
    return NextResponse.json(
      {
        user: profile
          ? {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              image: profile.image ?? "",
            }
          : null,
        rooms: await Promise.all(
          sources.map((r) =>
            roomData(
              r,
              memberships.some((m) => m.roomId === r.id),
            ),
          ),
        ),
        memberships: Object.fromEntries(
          memberships
            .filter((m) => !m.blockedUntil || +m.blockedUntil < Date.now())
            .map((m) => [sources.find((r) => r.id === m.roomId)?.code, m.id])
            .filter(([code]) => !!code),
        ),
        savedRoomIds: saved.map((s) => s.roomId),
        playlists: await Promise.all(
          playlists.map(async (p) => ({
            ...p,
            updatedAt: p.updatedAt.toISOString(),
            videos: (
              await db
                .select()
                .from(t.userPlaylistItems)
                .where(eq(t.userPlaylistItems.playlistId, p.id))
            )
              .sort((a, b) => a.position - b.position)
              .map((v) => ({
                ...v,
                thumbnailUrl: v.thumbnailUrl ?? "",
                channelTitle: "",
                durationSec: 0,
                addedByMemberId: "",
              })),
          })),
        ),
        history: history.map((h) => ({
          id: h.id,
          roomId: h.roomId ?? "",
          roomName:
            sources.find((r) => r.id === h.roomId)?.name ?? "Room sebelumnya",
          watchedSeconds: h.watchedSeconds,
          watchedAt: h.watchedAt.toISOString(),
          video: {
            id: h.id,
            youtubeVideoId: h.youtubeVideoId,
            title: h.title,
            thumbnailUrl: h.thumbnailUrl ?? "",
            channelTitle: "",
            durationSec: 0,
            position: 0,
            addedByMemberId: "",
          },
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Data belum dapat dimuat. Coba kembali." },
      { status: 503 },
    );
  }
}
