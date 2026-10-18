import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { database } from "@/db";
import { rooms } from "@/db/schema";
import { roomData } from "@/lib/room-data";
import { eq, desc } from "drizzle-orm";
const list = unstable_cache(
  async () => {
    const rows = await database()
      .select()
      .from(rooms)
      .where(eq(rooms.privacy, "public"))
      .orderBy(desc(rooms.lastActivityAt))
      .limit(30);
    return Promise.all(rows.map((r) => roomData(r)));
  },
  ["public-rooms"],
  { revalidate: 30, tags: ["public-rooms"] },
);
export async function GET() {
  return NextResponse.json(await list(), {
    headers: { "Cache-Control": "public, max-age=30" },
  });
}
