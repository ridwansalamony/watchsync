import { database } from "../db";
import {
  users,
  rooms,
  roomMembers,
  chatMessages,
  playlistItems,
  moderationLogs,
} from "../db/schema";
import { and, eq } from "drizzle-orm";
export async function mergeGuestIdentity(userId: string, guestId: string) {
  await database().transaction(async (tx) => {
    await tx.select().from(users).where(eq(users.id, userId)).for("update");
    await tx
      .update(rooms)
      .set({ ownerUserId: userId, ownerGuestId: null })
      .where(eq(rooms.ownerGuestId, guestId));
    const members = await tx
      .select()
      .from(roomMembers)
      .where(eq(roomMembers.guestId, guestId));
    for (const member of members) {
      const [existing] = await tx
        .select()
        .from(roomMembers)
        .where(
          and(
            eq(roomMembers.roomId, member.roomId),
            eq(roomMembers.userId, userId),
          ),
        );
      if (!existing) {
        await tx
          .update(roomMembers)
          .set({ userId, guestId: null })
          .where(eq(roomMembers.id, member.id));
        continue;
      }
      const roles = { owner: 2, moderator: 1, member: 0 };
      await tx
        .update(roomMembers)
        .set({
          role:
            roles[member.role] > roles[existing.role]
              ? member.role
              : existing.role,
          isMuted: existing.isMuted || member.isMuted,
          blockedUntil:
            existing.blockedUntil && member.blockedUntil
              ? new Date(Math.max(+existing.blockedUntil, +member.blockedUntil))
              : (existing.blockedUntil ?? member.blockedUntil),
          lastSeenAt: new Date(
            Math.max(+existing.lastSeenAt, +member.lastSeenAt),
          ),
        })
        .where(eq(roomMembers.id, existing.id));
      await tx
        .update(chatMessages)
        .set({ memberId: existing.id })
        .where(eq(chatMessages.memberId, member.id));
      await tx
        .update(playlistItems)
        .set({ addedByMemberId: existing.id })
        .where(eq(playlistItems.addedByMemberId, member.id));
      await tx
        .update(moderationLogs)
        .set({ actorMemberId: existing.id })
        .where(eq(moderationLogs.actorMemberId, member.id));
      await tx
        .update(moderationLogs)
        .set({ targetMemberId: existing.id })
        .where(eq(moderationLogs.targetMemberId, member.id));
      await tx.delete(roomMembers).where(eq(roomMembers.id, member.id));
    }
  });
}
