"use server";
import { membership } from "@/lib/identity";
import { database } from "@/db";
import { rooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { hash } from "bcryptjs";
import { notifyRoom as notify } from "@/lib/notify-room";
import { plainText, parseRoomCode } from "@watchsync/shared/validation";
const settings = z
  .object({
    name: z.string().trim().min(3).max(60).optional(),
    description: z.string().transform(plainText).pipe(z.string().max(280)).optional(),
    privacy: z.enum(["public", "unlisted", "private"]).optional(),
    controlMode: z.enum(["owner_only", "moderators", "everyone"]).optional(),
    password: z.string().min(4).max(32).or(z.literal("")).optional(),
  })
  .strict();
export async function updateRoomSettings(code: string, input: unknown) {
  code = parseRoomCode(code);
  const { room, member } = await membership(code);
  if (member.role !== "owner")
    throw new Error("Hanya Owner dapat mengubah pengaturan.");
  const { password, ...value } = settings.parse(input);
  await database()
    .update(rooms)
    .set({
      ...value,
      ...(password !== undefined
        ? { passwordHash: password ? await hash(password, 12) : null }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(rooms.id, room.id));
  await notify(code);
}
export async function deleteRoom(code: string) {
  code = parseRoomCode(code);
  const { room, member } = await membership(code);
  if (member.role !== "owner")
    throw new Error("Hanya Owner dapat menghapus room.");
  await database().delete(rooms).where(eq(rooms.id, room.id));
  await notify(code, true);
}
