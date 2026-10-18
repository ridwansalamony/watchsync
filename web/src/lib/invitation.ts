import { jwtVerify } from "jose";
import { database } from "@/db";
import { roomMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
export async function validInvitation(token: string, roomId: string) {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.REALTIME_JWT_SECRET!),
      {
        algorithms: ["HS256"],
        audience: "watchsync-invite",
        issuer: "watchsync-web",
      },
    );
    if (payload.roomId !== roomId || !payload.sub) return false;
    const member = await database().query.roomMembers.findFirst({
      where: eq(roomMembers.id, payload.sub),
    });
    return (
      !!member &&
      member.roomId === roomId &&
      member.role !== "member" &&
      (!member.blockedUntil || +member.blockedUntil < Date.now())
    );
  } catch {
    return false;
  }
}
