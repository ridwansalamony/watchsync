import { ImageResponse } from "next/og";
export const runtime = "nodejs";
export const alt = "WatchSync Room — Nonton Bareng, Serasa Sebelahan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: "#0b0d14",
        color: "white",
        width: "100%",
        height: "100%",
        padding: 80,
      }}
    >
      <div style={{ fontSize: 32, color: "#8b8bfa" }}>WatchSync Room</div>
      <div style={{ fontSize: 72, marginTop: 30 }}>
        Nonton Bareng, Serasa Sebelahan.
      </div>
      <div style={{ fontSize: 28, marginTop: 30 }}>
        Video, obrolan, dan cerita dalam satu room.
      </div>
    </div>,
    size,
  );
}
