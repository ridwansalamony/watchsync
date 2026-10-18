import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "node:crypto";

function key() {
  const value = process.env.GUEST_COOKIE_SECRET;
  if (!value || value.length < 32)
    throw new Error("GUEST_COOKIE_SECRET minimal 32 karakter.");
  return new TextEncoder().encode(value);
}
export async function guestId(create = false): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get("wsr_guest")?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, key(), {
        algorithms: ["HS256"],
        issuer: "watchsync-guest",
      });
      if (payload.sub && /^[0-9a-f-]{36}$/.test(payload.sub))
        return payload.sub;
    } catch {
      /* Cookie kedaluwarsa atau tanda tangan tidak valid. */
    }
  }
  if (!create) return null;
  const id = randomUUID();
  const signed = await new SignJWT({})
    .setSubject(id)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("watchsync-guest")
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key());
  jar.set("wsr_guest", signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 86400,
  });
  return id;
}
