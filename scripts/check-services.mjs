import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { Redis } from "@upstash/redis";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { RoomServiceClient } from "livekit-server-sdk";
config({
  path: fileURLToPath(new URL("../.env.local", import.meta.url)),
  quiet: true,
});
const tasks = [
  [
    "LiveKit Server API",
    async () => {
      const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
      if (
        !url ||
        !process.env.LIVEKIT_API_KEY ||
        !process.env.LIVEKIT_API_SECRET
      )
        throw new Error();
      await new RoomServiceClient(
        url.replace(/^ws/, "http"),
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET,
      ).listRooms();
    },
  ],
  [
    "Neon web",
    async () => {
      await neon(process.env.DATABASE_URL)`select 1`;
    },
  ],
  [
    "Neon realtime",
    async () => {
      await neon(process.env.REALTIME_DATABASE_URL)`select 1`;
    },
  ],
  [
    "Upstash baca/tulis",
    async () => {
      const redis = Redis.fromEnv();
      if ((await redis.ping()) !== "PONG") throw new Error();
      const key = `wsr:connection-check:${randomUUID()}`;
      await redis.set(key, "ok", { ex: 30 });
      if ((await redis.get(key)) !== "ok") throw new Error();
      await redis.del(key);
    },
  ],
  [
    "YouTube metadata",
    async () => {
      const r = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=status&id=aqz-KE-bpKQ&key=${encodeURIComponent(process.env.YOUTUBE_API_KEY ?? "")}`,
      );
      const data = await r.json();
      if (!r.ok || data.error || !data.items?.length) throw new Error();
    },
  ],
  [
    "Secret aplikasi",
    async () => {
      const keys = [
          "AUTH_SECRET",
          "GUEST_COOKIE_SECRET",
          "REALTIME_JWT_SECRET",
        ],
        values = keys.map((k) => process.env[k]);
      if (values.some((v) => !v || v.length < 32) || new Set(values).size !== 3)
        throw new Error();
    },
  ],
];
const results = await Promise.allSettled(
  tasks.map(async ([name, run]) => {
    try {
      await run();
      console.log(`${name}: berhasil`);
    } catch (error) {
      const category = /WRONGPASS/.test(String(error?.message))
        ? "token ditolak (WRONGPASS)"
        : "gagal; periksa konfigurasi lokal";
      console.error(`${name}: ${category}`);
      throw new Error(name);
    }
  }),
);
if (results.some((r) => r.status === "rejected")) process.exitCode = 1;
console.log(
  "Login Google harus diverifikasi secara interaktif melalui /masuk.",
);
