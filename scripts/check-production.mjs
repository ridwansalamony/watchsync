import { readFile } from "node:fs/promises";
import { parse } from "dotenv";

const path = process.argv[2] ?? ".env.production";
let env;
try {
  env = parse(await readFile(path));
} catch {
  console.error(
    "Konfigurasi produksi belum tersedia. Isi .env.production mengikuti .env.example; lihat deploy/PANDUAN.md.",
  );
  process.exit(1);
}
let failures = 0;
function check(name, valid) {
  console.log(`${name}: ${valid ? "berhasil" : "perlu diperbaiki"}`);
  if (!valid) failures++;
}
function address(name, protocol) {
  try {
    const value = new URL(env[name]);
    return (
      value.protocol === protocol &&
      !["localhost", "127.0.0.1"].includes(value.hostname) &&
      !value.hostname.endsWith(".example.com") &&
      value.hostname !== "example.com" &&
      !value.username &&
      !value.password &&
      !value.search &&
      !value.hash &&
      value.pathname === "/"
    );
  } catch {
    return false;
  }
}
check("URL aplikasi HTTPS", address("NEXT_PUBLIC_APP_URL", "https:"));
check("URL realtime HTTPS", address("NEXT_PUBLIC_REALTIME_URL", "https:"));
check(
  "URL LiveKit WSS",
  address("NEXT_PUBLIC_LIVEKIT_URL", "wss:") &&
    !env.NEXT_PUBLIC_LIVEKIT_URL?.includes("your-project"),
);
check(
  "AUTH_URL sesuai aplikasi",
  Boolean(env.AUTH_URL) &&
    env.AUTH_URL?.replace(/\/$/, "") ===
      env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, ""),
);
check(
  "Origin realtime sesuai aplikasi",
  Boolean(env.REALTIME_CORS_ORIGIN) &&
    env.REALTIME_CORS_ORIGIN === env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, ""),
);
const secrets = [
  "AUTH_SECRET",
  "GUEST_COOKIE_SECRET",
  "REALTIME_JWT_SECRET",
].map((key) => env[key]);
check(
  "Tiga secret minimal 32 karakter dan berbeda",
  secrets.every((value) => value?.length >= 32) && new Set(secrets).size === 3,
);
for (const key of [
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "YOUTUBE_API_KEY",
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
  "UPSTASH_REDIS_REST_TOKEN",
])
  check(key, Boolean(env[key]?.trim()));
check("URL Redis HTTPS", address("UPSTASH_REDIS_REST_URL", "https:"));
function databaseUrl(key) {
  try {
    const url = new URL(env[key]);
    return (
      ["postgres:", "postgresql:"].includes(url.protocol) &&
      Boolean(url.username && url.password && url.pathname !== "/") &&
      ["require", "verify-full", "verify-ca"].includes(
        url.searchParams.get("sslmode"),
      )
    );
  } catch {
    return false;
  }
}
check("DATABASE_URL memakai TLS", databaseUrl("DATABASE_URL"));
check(
  "REALTIME_DATABASE_URL memakai TLS",
  databaseUrl("REALTIME_DATABASE_URL"),
);
try {
  const web = new URL(env.DATABASE_URL),
    realtime = new URL(env.REALTIME_DATABASE_URL);
  check(
    "Web dan realtime memakai database yang sama",
    web.hostname.replace("-pooler", "") ===
      realtime.hostname.replace("-pooler", "") &&
      web.pathname === realtime.pathname,
  );
} catch {
  check("Web dan realtime memakai database yang sama", false);
}
try {
  const vps = parse(await readFile("deploy/.env.production"));
  check(
    "JWT Vercel dan VPS sama",
    Boolean(vps.REALTIME_JWT_SECRET) &&
      vps.REALTIME_JWT_SECRET === env.REALTIME_JWT_SECRET,
  );
  check(
    "Origin VPS sesuai aplikasi",
    vps.REALTIME_CORS_ORIGIN === env.REALTIME_CORS_ORIGIN,
  );
  check(
    "Domain Caddy sesuai realtime",
    vps.REALTIME_DOMAIN === new URL(env.NEXT_PUBLIC_REALTIME_URL).hostname,
  );
} catch {
  console.log(
    "Berkas VPS terpisah: belum diperiksa (deploy/.env.production tidak tersedia atau URL belum valid).",
  );
}
console.log(
  "Pemeriksaan ini memvalidasi format dan kesesuaian konfigurasi; tidak menguji kredensial layanan, DNS, atau login Google. Nilai secret tidak dicetak.",
);
check(
  "Namespace Redis produksi terpisah dari development",
  /^[a-zA-Z0-9:_-]{1,64}$/.test(env.REDIS_NAMESPACE ?? "") &&
    env.REDIS_NAMESPACE !== "wsr",
);
process.exitCode = failures ? 1 : 0;
