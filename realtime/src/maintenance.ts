import { redisKey } from "@watchsync/shared/redis-key";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import type { Redis } from "@upstash/redis";
import { and, asc, eq, sql } from "drizzle-orm";
import * as t from "../../web/src/db/schema.ts";
export async function maintainData(db: NeonDatabase<typeof t>, redis: Redis) {
  const due = await redis.zrange<string[]>(
    redisKey("account-deletions"),
    0,
    Date.now(),
    { byScore: true, offset: 0, count: 20 },
  );
  const changed: string[] = [];
  for (const id of due) {
    await db.transaction(async (tx) => {
      const owned = await tx
        .select()
        .from(t.rooms)
        .where(eq(t.rooms.ownerUserId, id))
        .for("update");
      for (const room of owned) {
        const [next] = await tx
          .select()
          .from(t.roomMembers)
          .where(
            and(
              eq(t.roomMembers.roomId, room.id),
              eq(t.roomMembers.role, "moderator"),
            ),
          )
          .orderBy(asc(t.roomMembers.joinedAt))
          .limit(1);
        if (next && (next.userId || next.guestId)) {
          await tx
            .update(t.rooms)
            .set({
              ownerUserId: next.userId,
              ownerGuestId: next.guestId,
              updatedAt: new Date(),
            })
            .where(eq(t.rooms.id, room.id));
          await tx
            .update(t.roomMembers)
            .set({ role: "owner" })
            .where(eq(t.roomMembers.id, next.id));
        } else await tx.delete(t.rooms).where(eq(t.rooms.id, room.id));
        changed.push(room.code);
      }
      const members = await tx
        .select()
        .from(t.roomMembers)
        .where(eq(t.roomMembers.userId, id));
      for (const member of members) {
        await tx
          .delete(t.chatMessages)
          .where(eq(t.chatMessages.memberId, member.id));
        await tx.delete(t.roomMembers).where(eq(t.roomMembers.id, member.id));
      }
      await tx.delete(t.users).where(eq(t.users.id, id));
    });
    await redis.zrem(redisKey("account-deletions"), id);
  }
  await db.execute(
    sql`delete from rooms where owner_user_id is null and last_activity_at < now() - interval '14 days'`,
  );
  return changed;
}
