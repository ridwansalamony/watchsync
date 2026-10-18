import type { MetadataRoute } from "next";
import { database } from "@/db";
import { rooms } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
export const revalidate = 300;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const published = await database()
    .select({ code: rooms.code, updatedAt: rooms.updatedAt })
    .from(rooms)
    .where(eq(rooms.privacy, "public"))
    .orderBy(desc(rooms.updatedAt))
    .limit(49000);
  return [
    ...[
      "",
      "/buat-room",
      "/gabung",
      "/masuk",
      "/tentang",
      "/bantuan",
      "/kebijakan-privasi",
      "/syarat-layanan",
    ].map((path) => ({ url: `${base}${path}` })),
    ...published.map((room) => ({
      url: `${base}/gabung/${room.code}`,
      lastModified: room.updatedAt,
    })),
  ];
}
