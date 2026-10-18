import { redisKey } from "@watchsync/shared/redis-key";
import { NextResponse } from "next/server";
import { z } from "zod";
import { TrackSource } from "livekit-server-sdk";
import { membership } from "@/lib/identity";
import { livekitService, mediaSources } from "@/lib/livekit";
import { redis } from "@/lib/redis";

export async function POST(request: Request) {
  if (
    request.headers.get("origin") !==
    new URL(process.env.NEXT_PUBLIC_APP_URL ?? request.url).origin
  )
    return NextResponse.json(
      { error: "Asal permintaan ditolak." },
      { status: 403 },
    );
  try {
    const { code, active } = z
      .object({
        code: z.string().regex(/^[A-HJ-NP-Z2-9]{8}$/),
        active: z.boolean(),
      })
      .parse(await request.json());
    const { member } = await membership(code);
    const service = livekitService(),
      key = redisKey(`screen:${code}`);
    const participants = await service.listParticipants(code);
    if (active && !participants.some((p) => p.identity === member.id))
      return NextResponse.json(
        { error: "Hubungkan audio dan video terlebih dahulu." },
        { status: 409 },
      );
    if (
      active &&
      participants.some(
        (p) =>
          p.identity !== member.id &&
          p.tracks.some((t) => t.source === TrackSource.SCREEN_SHARE),
      )
    )
      return NextResponse.json(
        { error: "Anggota lain sedang berbagi layar." },
        { status: 409 },
      );
    if (active) {
      const acquired = await redis.eval<string[], number>(
        "local holder=redis.call('get',KEYS[1]); if not holder or holder == ARGV[1] then redis.call('set',KEYS[1],ARGV[1],'EX',90); return 1 else return 0 end",
        [key],
        [member.id],
      );
      if (!acquired)
        return NextResponse.json(
          { error: "Anggota lain sedang menyiapkan berbagi layar." },
          { status: 409 },
        );
      // Expired leases must not leave another participant able to publish later.
      for (const other of participants.filter(
        (p) =>
          p.identity !== member.id &&
          p.permission?.canPublishSources.includes(TrackSource.SCREEN_SHARE),
      )) {
        await service.updateParticipant(code, other.identity, {
          permission: {
            canSubscribe: true,
            canPublish: true,
            canPublishData: false,
            canPublishSources: other.permission!.canPublishSources.filter(
              (source) =>
                source !== TrackSource.SCREEN_SHARE &&
                source !== TrackSource.SCREEN_SHARE_AUDIO,
            ),
          },
        });
      }
    }
    if (participants.some((p) => p.identity === member.id))
      await service.updateParticipant(code, member.id, {
        permission: {
          canSubscribe: true,
          canPublish: true,
          canPublishData: false,
          canPublishSources: mediaSources(member.isMuted, active),
        },
      });
    if (!active)
      await redis.eval(
        "if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end",
        [key],
        [member.id],
      );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Izin berbagi layar belum diperbarui. Coba kembali." },
      { status: 403 },
    );
  }
}
