import { SignJWT } from "jose";
export async function notifyRoom(code: string, deleted = false, reset = false) {
  const token = await new SignJWT({ code, deleted, reset })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("watchsync-web")
    .setAudience("watchsync-internal")
    .setExpirationTime("30s")
    .sign(new TextEncoder().encode(process.env.REALTIME_JWT_SECRET!));
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_REALTIME_URL}/internal/room`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(3000),
      },
    );
    if (!response.ok)
      console.error("Notifikasi room ditolak oleh layanan realtime.");
  } catch {
    console.error(
      "Notifikasi realtime tertunda; database tetap menyimpan perubahan.",
    );
  }
}
