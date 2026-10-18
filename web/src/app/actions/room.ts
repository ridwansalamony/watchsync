"use server";
import { database } from "@/db";
import { rooms, roomMembers, savedRooms } from "@/db/schema";
import {
  roomSchema,
  displayNameSchema,
  parseRoomCode,
} from "@watchsync/shared/validation";
import { identity } from "@/lib/identity";
import { passwordLimit, createLimit } from "@/lib/redis";
import { and, eq, gt, sql } from "drizzle-orm";
import { hash, compare } from "bcryptjs";
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { ZodError } from "zod";
class RoomActionError extends Error {}
import { membership } from "@/lib/identity";
import { validInvitation } from "@/lib/invitation";
import { SignJWT } from "jose";
export async function invitationLink(code: string) {
  const { room, member } = await membership(code);
  const url = new URL(`/gabung/${code}`, process.env.NEXT_PUBLIC_APP_URL!);
  if (room.privacy === "private") {
    if (member.role === "member")
      throw new RoomActionError(
        "Hanya Owner dan Moderator dapat mengundang anggota baru.",
      );
    const token = await new SignJWT({ roomId: room.id })
      .setSubject(member.id)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("watchsync-web")
      .setAudience("watchsync-invite")
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(new TextEncoder().encode(process.env.REALTIME_JWT_SECRET!));
    url.searchParams.set("undangan", token);
  }
  return url.toString();
}
async function createRoomInternal(input: unknown) {
  const value = roomSchema.parse(input);
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!(await createLimit.limit(ip)).success) throw new RoomActionError("Maksimal 5 room per jam. Coba kembali nanti.");
  const who = await identity(true);
  const db = database();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const passwordHash = value.password ? await hash(value.password, 12) : null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = Array.from(randomBytes(8), (n) => alphabet[n % 32]).join("");
    try {
      return await db.transaction(async (tx) => {
        const [room] = await tx
          .insert(rooms)
          .values({
            code,
            name: value.name,
            description: value.description,
            privacy: value.privacy,
            controlMode: value.controlMode,
            passwordHash,
            ownerUserId: who.userId,
            ownerGuestId: who.guestId,
          })
          .returning();
        const [member] = await tx
          .insert(roomMembers)
          .values({
            roomId: room.id,
            userId: who.userId,
            guestId: who.guestId,
            displayName: value.displayName,
            avatarUrl: who.user?.image,
            role: "owner",
          })
          .returning();
        if (who.userId)
          await tx
            .insert(savedRooms)
            .values({ userId: who.userId, roomId: room.id });
        return { code, memberId: member.id };
      });
    } catch (e) {
      const failure = e as { code?: string; cause?: { code?: string } };
      if ((failure.code ?? failure.cause?.code) !== "23505") throw e;
    }
  }
  throw new RoomActionError("Kode room belum dapat dibuat. Coba kembali.");
}
async function joinRoomInternal(input: {
  code: string;
  displayName: string;
  password?: string;
  invitation?: string;
}) {
  const code = parseRoomCode(input.code),
    displayName = displayNameSchema.parse(input.displayName);
  const who = await identity(true);
  const db = database();
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return db.transaction(async (tx) => {
    const [room] = await tx
      .select()
      .from(rooms)
      .where(eq(rooms.code, code))
      .for("update");
    if (!room) throw new RoomActionError("Room tidak ditemukan.");
    const [existing] = await tx
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
    if (existing?.blockedUntil && +existing.blockedUntil > Date.now())
      throw new RoomActionError("Anda sementara diblokir dari room ini.");
    if (
      room.privacy === "private" &&
      !existing &&
      !(await validInvitation(input.invitation ?? "", room.id))
    )
      throw new RoomActionError(
        "Room privat hanya untuk anggota yang sudah diundang.",
      );
    if (room.passwordHash && existing?.role !== "owner") {
      let allowed = false;
      try {
        allowed = (await passwordLimit.limit(`${code}:${ip}`)).success;
      } catch {
        throw new RoomActionError(
          "Verifikasi password belum tersedia. Silakan coba kembali nanti.",
        );
      }
      if (!allowed)
        throw new RoomActionError(
          "Terlalu banyak percobaan. Coba lagi 10 menit mendatang.",
        );
      if (!(await compare(input.password ?? "", room.passwordHash)))
        throw new RoomActionError("Password room tidak cocok.");
    }
    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(roomMembers)
      .where(
        and(
          eq(roomMembers.roomId, room.id),
          gt(roomMembers.lastSeenAt, new Date(Date.now() - 60000)),
        ),
      );
    if (
      count >= room.maxMembers &&
      (!existing || +existing.lastSeenAt < Date.now() - 60000)
    )
      throw new RoomActionError("Room sudah penuh. Maksimal 50 orang.");
    const values = { displayName, lastSeenAt: new Date() };
    const [member] = existing
      ? await tx
          .update(roomMembers)
          .set(values)
          .where(eq(roomMembers.id, existing.id))
          .returning()
      : await tx
          .insert(roomMembers)
          .values({
            ...values,
            roomId: room.id,
            userId: who.userId,
            guestId: who.guestId,
            avatarUrl: who.user?.image,
          })
          .returning();
    return { code, memberId: member.id };
  });
}

type RoomResult =
  | { code: string; memberId: string; error?: never }
  | { error: string; code?: never; memberId?: never };
function failure(error: unknown): RoomResult {
  return {
    error:
      error instanceof ZodError
        ? error.errors[0].message
        : error instanceof RoomActionError
          ? error.message
          : "Permintaan room belum dapat diproses. Coba kembali.",
  };
}
export async function createRoom(input: unknown): Promise<RoomResult> {
  try {
    return await createRoomInternal(input);
  } catch (error) {
    return failure(error);
  }
}
export async function joinRoom(
  input: Parameters<typeof joinRoomInternal>[0],
): Promise<RoomResult> {
  try {
    return await joinRoomInternal(input);
  } catch (error) {
    return failure(error);
  }
}
