import { auth } from "@/auth";
import { guestId } from "./guest";
import { database } from "@/db";
import { roomMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { parseRoomCode } from "@watchsync/shared/validation";
export async function identity(create = false) {
  const session = await auth();
  if (
    session?.user?.id &&
    !(await database().query.users.findFirst({
      where: (t, { eq }) => eq(t.id, session.user!.id!),
    }))
  )
    throw new Error("Sesi akun sudah tidak berlaku. Silakan masuk kembali.");
  return {
    userId: session?.user?.id ?? null,
    guestId: session?.user?.id ? null : await guestId(create),
    user: session?.user,
  };
}
export async function membership(code: string) {
  code = parseRoomCode(code);
  const who = await identity();
  const db = database();
  const room = await db.query.rooms.findFirst({
    where: (t, { eq }) => eq(t.code, code),
  });
  if (!room) throw new Error("Room tidak ditemukan.");
  if (!who.userId && !who.guestId)
    throw new Error("Gabung ke room terlebih dahulu.");
  const [member] = await db
    .select()
    .from(roomMembers)
    .where(
      and(
        eq(roomMembers.roomId, room.id),
        who.userId
          ? eq(roomMembers.userId, who.userId)
          : eq(roomMembers.guestId, who.guestId!),
      ),
    );
  if (!member || (member.blockedUntil && +member.blockedUntil > Date.now()))
    throw new Error("Anda tidak memiliki akses ke room ini.");
  return { room, member, who };
}
