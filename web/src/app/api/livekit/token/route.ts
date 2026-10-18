import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { z } from "zod";
import { membership } from "@/lib/identity";
import { livekitService, mediaSources } from "@/lib/livekit";

export async function POST(request: Request) {
  if (
    request.headers.get("origin") !==
    new URL(process.env.NEXT_PUBLIC_APP_URL ?? request.url).origin
  )
    return NextResponse.json(
      { error: "Asal permintaan tidak diizinkan." },
      { status: 403 },
    );
  try {
    const { code } = z
      .object({ code: z.string().regex(/^[A-HJ-NP-Z2-9]{8}$/) })
      .parse(await request.json());
    const { room, member } = await membership(code);
    await livekitService().createRoom({
      name: room.code,
      maxParticipants: room.maxMembers,
      emptyTimeout: 300,
    });
    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: member.id,
        name: member.displayName,
        ttl: "1h",
        metadata: JSON.stringify({ role: member.role }),
      },
    );
    token.addGrant({
      roomJoin: true,
      room: room.code,
      canSubscribe: true,
      canPublish: true,
      canPublishData: false,
      canUpdateOwnMetadata: false,
      canPublishSources: mediaSources(member.isMuted),
    });
    return NextResponse.json(
      { token: await token.toJwt(), url: process.env.NEXT_PUBLIC_LIVEKIT_URL },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const configuration =
      error instanceof Error && error.message.includes("Konfigurasi LiveKit");
    return NextResponse.json(
      {
        error: configuration
          ? "Layanan media belum dikonfigurasi."
          : "Akses media ditolak. Gabung kembali ke room.",
      },
      { status: configuration ? 503 : 403 },
    );
  }
}
