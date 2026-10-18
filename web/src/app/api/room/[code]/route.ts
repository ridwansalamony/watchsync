import { NextResponse } from "next/server";
import { database } from "@/db";
import { roomData } from "@/lib/room-data";
import { membership } from "@/lib/identity";
import { SignJWT } from "jose";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const room = await database().query.rooms.findFirst({
    where: (t, { eq }) => eq(t.code, code),
  });
  if (!room)
    return NextResponse.json(
      { error: "Room tidak ditemukan." },
      { status: 404 },
    );
  let memberId: string | null = null;
  try {
    memberId = (await membership(code)).member.id;
  } catch {}
  const data = await roomData(room, !!memberId);
  const token = memberId
    ? await new SignJWT({ code, memberId })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(memberId)
        .setAudience("watchsync-realtime")
        .setIssuer("watchsync-web")
        .setIssuedAt()
        .setExpirationTime("5m")
        .sign(new TextEncoder().encode(process.env.REALTIME_JWT_SECRET!))
    : null;
  return NextResponse.json(
    { room: data, memberId, token },
    { headers: { "Cache-Control": "no-store" } },
  );
}
