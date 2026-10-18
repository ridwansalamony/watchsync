import { NextResponse } from "next/server";
import { youtubeVideos } from "@/lib/youtube";
import { parseYoutubeId } from "@watchsync/shared/validation";
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const raw = query.get("id") ?? query.get("url") ?? "";
  const id = /^[\w-]{11}$/.test(raw) ? raw : parseYoutubeId(raw);
  if (!id)
    return NextResponse.json(
      { error: "URL YouTube tidak valid." },
      { status: 400 },
    );
  try {
    const [video] = await youtubeVideos([id]);
    if (!video)
      return NextResponse.json(
        {
          error:
            "Video tidak dapat diputar di aplikasi, dibatasi usia, atau durasinya melebihi 6 jam.",
        },
        { status: 422 },
      );
    return NextResponse.json(video);
  } catch {
    return NextResponse.json(
      { error: "Metadata video belum dapat dimuat." },
      { status: 502 },
    );
  }
}
