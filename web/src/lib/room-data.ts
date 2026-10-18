import { database } from "@/db";
import * as t from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import type { Room } from "@watchsync/shared/types";
export async function roomData(
  source: typeof t.rooms.$inferSelect,
  includeContents = false,
): Promise<Room> {
  const db = database();
  const members = await db
    .select()
    .from(t.roomMembers)
    .where(eq(t.roomMembers.roomId, source.id));
  const videos = includeContents
    ? await db
        .select()
        .from(t.playlistItems)
        .where(eq(t.playlistItems.roomId, source.id))
        .orderBy(asc(t.playlistItems.position))
    : [];
  const messages = includeContents
    ? (
        await db
          .select()
          .from(t.chatMessages)
          .where(eq(t.chatMessages.roomId, source.id))
          .orderBy(desc(t.chatMessages.createdAt))
          .limit(200)
      ).reverse()
    : [];
  return {
    id: source.id,
    code: source.code,
    name: source.name,
    description: source.description ?? "",
    privacy: source.privacy,
    controlMode: source.controlMode,
    hasPassword: !!source.passwordHash,
    maxMembers: source.maxMembers,
    ownerName: members.find((m) => m.role === "owner")?.displayName ?? "Owner",
    memberCount: members.filter((m) => +m.lastSeenAt > Date.now() - 60000)
      .length,
    image: videos[0]?.thumbnailUrl ?? "/images/cinema.png",
    category: "Nonton Bareng",
    members: includeContents
      ? members.map((m) => ({
          id: m.id,
          displayName: m.displayName,
          avatarUrl: m.avatarUrl ?? "",
          role: m.role,
          isMuted: m.isMuted,
          online: +m.lastSeenAt > Date.now() - 60000,
        }))
      : [],
    videos: videos.map((v) => ({
      ...v,
      channelTitle: v.channelTitle ?? "",
      thumbnailUrl: v.thumbnailUrl ?? "",
      addedByMemberId: v.addedByMemberId ?? "",
      createdAt: v.createdAt.toISOString(),
    })),
    messages: messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
    currentVideoId:
      videos.find((v) => v.youtubeVideoId === source.currentVideoId)?.id ??
      null,
    playbackStatus: source.playbackStatus,
    playbackPosition: source.playbackPosition,
    invited: false,
  };
}
