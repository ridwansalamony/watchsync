import { ImageResponse } from "next/og";
import { publicRoom } from "@/lib/seo";
export const runtime = "nodejs";
export const alt = "Undangan WatchSync Room";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image({
  params,
}: {
  params: Promise<{ kode: string }>;
}) {
  const { kode } = await params;
  const room = await publicRoom(kode);
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: "#0b0d14",
        color: "white",
        padding: 80,
      }}
    >
      <div style={{ fontSize: 32, color: "#8b8bfa" }}>
        Undangan WatchSync Room
      </div>
      <div style={{ fontSize: 64, marginTop: 35 }}>
        {room?.name ?? "Ada tempat untuk kamu."}
      </div>
      <div style={{ fontSize: 28, marginTop: 35 }}>
        Buka tautan undangan untuk bergabung dan nonton bersama.
      </div>
    </div>,
    size,
  );
}
