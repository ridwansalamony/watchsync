import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { database } from "@/db";
import { and, eq } from "drizzle-orm";
import { rooms } from "@/db/schema";

export function publicMetadata(
  path: string,
  title: string,
  description: string,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      locale: "id_ID",
      type: "website",
      siteName: "WatchSync Room",
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}
export const publicRoom = unstable_cache(
  async (code: string) =>
    database().query.rooms.findFirst({
      where: and(eq(rooms.code, code), eq(rooms.privacy, "public")),
    }),
  ["seo-public-room"],
  { revalidate: 60, tags: ["public-rooms"] },
);
