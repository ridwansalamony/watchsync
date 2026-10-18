import { redisKey } from "@watchsync/shared/redis-key";
import { NextResponse } from "next/server";
import { redis, searchLimit } from "@/lib/redis";
import { youtubeVideos } from "@/lib/youtube";
import type { Video } from "@watchsync/shared/types";
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 100) return NextResponse.json([]);
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const limit = await searchLimit.limit(ip);
    if (!limit.success)
      return NextResponse.json(
        { error: "Maksimal 30 pencarian per menit. Tunggu sebentar." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000)),
            ),
          },
        },
      );
    const key = redisKey(`youtube:${q.toLowerCase()}`);
    const cached = await redis.get<Video[]>(key);
    if (cached) return NextResponse.json(cached.slice(0, 10));
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=10&q=${encodeURIComponent(q)}&key=${encodeURIComponent(process.env.YOUTUBE_API_KEY!)}`,
      { cache: "no-store" },
    );
    if (!response.ok) throw new Error();
    const results = (await response.json()) as {
      items: { id: { videoId: string } }[];
    };
    const videos = await youtubeVideos(results.items.map((v) => v.id.videoId));
    await redis.set(key, videos, { ex: 600 });
    return NextResponse.json(videos);
  } catch {
    return NextResponse.json(
      {
        error:
          "Pencarian belum tersedia. Coba kembali atau tambahkan URL video.",
      },
      { status: 502 },
    );
  }
}
