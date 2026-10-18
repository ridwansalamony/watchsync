import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { database } from "./index";
import * as t from "./schema";
import {
  mockRooms,
  mockUser,
  mockPlaylists,
  mockHistory,
} from "../lib/mocks/data";
import { hash } from "bcryptjs";

config({ path: "../.env.local", quiet: true });
async function seed() {
  const db = database();
  const [user] = await db
    .insert(t.users)
    .values({
      name: mockUser.name,
      email: mockUser.email,
      image: mockUser.image,
    })
    .onConflictDoUpdate({ target: t.users.email, set: { name: mockUser.name } })
    .returning();
  for (const source of mockRooms) {
    const email =
      source.ownerName === mockUser.name
        ? mockUser.email
        : `${source.code.toLowerCase()}@example.com`;
    const [owner] = await db
      .insert(t.users)
      .values({ name: source.ownerName, email })
      .onConflictDoUpdate({
        target: t.users.email,
        set: { name: source.ownerName },
      })
      .returning();
    const existing = await db
      .select({ id: t.rooms.id })
      .from(t.rooms)
      .where(eq(t.rooms.code, source.code));
    if (existing.length) {
      const room = await db.query.rooms.findFirst({
        where: eq(t.rooms.id, existing[0].id),
      });
      if (room?.ownerUserId === user.id) {
        await db
          .update(t.rooms)
          .set({
            ownerUserId: owner.id,
            ...(source.hasPassword && !room.passwordHash
              ? { passwordHash: await hash("nonton", 12) }
              : {}),
          })
          .where(eq(t.rooms.id, room.id));
        const members = await db
          .select()
          .from(t.roomMembers)
          .where(eq(t.roomMembers.roomId, room.id));
        for (const member of members)
          if (member.role === "owner")
            await db
              .update(t.roomMembers)
              .set({ userId: owner.id })
              .where(eq(t.roomMembers.id, member.id));
      }
      continue;
    }
    const [room] = await db
      .insert(t.rooms)
      .values({
        code: source.code,
        name: source.name,
        description: source.description,
        privacy: source.privacy,
        controlMode: source.controlMode,
        ownerUserId: owner.id,
        passwordHash: source.hasPassword ? await hash("nonton", 12) : null,
      })
      .returning();
    const ids = new Map<string, string>();
    for (const member of source.members) {
      const [created] = await db
        .insert(t.roomMembers)
        .values({
          roomId: room.id,
          userId: member.role === "owner" ? owner.id : null,
          guestId: member.role === "owner" ? null : crypto.randomUUID(),
          displayName: member.displayName,
          avatarUrl: member.avatarUrl,
          role: member.role,
          isMuted: member.isMuted,
          lastSeenAt: new Date(0),
        })
        .returning();
      ids.set(member.id, created.id);
    }
    if (source.videos.length)
      await db.insert(t.playlistItems).values(
        source.videos.map((v) => ({
          roomId: room.id,
          youtubeVideoId: v.youtubeVideoId,
          title: v.title,
          channelTitle: v.channelTitle,
          thumbnailUrl: v.thumbnailUrl,
          durationSec: v.durationSec,
          position: v.position,
          addedByMemberId: ids.get(v.addedByMemberId),
        })),
      );
    if (source.messages.length)
      await db.insert(t.chatMessages).values(
        source.messages.map((m) => ({
          roomId: room.id,
          memberId: m.memberId ? ids.get(m.memberId) : null,
          body: m.body,
          isSystem: m.isSystem,
        })),
      );
  }
  const history = await db
    .select()
    .from(t.watchHistory)
    .where(eq(t.watchHistory.userId, user.id));
  if (!history.length)
    for (const entry of mockHistory) {
      const room = await db.query.rooms.findFirst({
        where: eq(
          t.rooms.code,
          mockRooms.find((r) => r.id === entry.roomId)?.code ?? "",
        ),
      });
      await db
        .insert(t.watchHistory)
        .values({
          userId: user.id,
          roomId: room?.id,
          youtubeVideoId: entry.video.youtubeVideoId,
          title: entry.video.title,
          thumbnailUrl: entry.video.thumbnailUrl,
          watchedSeconds: entry.watchedSeconds,
        });
    }
  for (const source of mockPlaylists) {
    const found = await db
      .select()
      .from(t.userPlaylists)
      .where(eq(t.userPlaylists.userId, user.id));
    if (found.some((p) => p.name === source.name)) continue;
    const [list] = await db
      .insert(t.userPlaylists)
      .values({ userId: user.id, name: source.name })
      .returning();
    if (source.videos.length)
      await db.insert(t.userPlaylistItems).values(
        source.videos.map((v) => ({
          playlistId: list.id,
          youtubeVideoId: v.youtubeVideoId,
          title: v.title,
          thumbnailUrl: v.thumbnailUrl,
          position: v.position,
        })),
      );
  }
  console.log("Seed development selesai; data yang sudah ada dipertahankan.");
}
seed()
  .catch(() => {
    console.error("Seed gagal. Periksa koneksi database development.");
    process.exitCode = 1;
  })
  .finally(() => database().$client.end());
