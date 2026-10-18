import { chromium, expect } from "@playwright/test";
import { config } from "dotenv";
import { RoomServiceClient, TrackSource } from "livekit-server-sdk";
import { io } from "socket.io-client";
import { mkdir, writeFile } from "node:fs/promises";
config({ path: ".env.production", quiet: true });
const base = process.env.NEXT_PUBLIC_APP_URL;
if (!base?.startsWith("https://"))
  throw new Error("URL produksi HTTPS diperlukan.");
const browser = await chromium.launch({
  channel: "chrome",
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
    "--autoplay-policy=no-user-gesture-required",
  ],
});
const owner = await browser.newContext({
  baseURL: base,
  permissions: ["camera", "microphone"],
});
const guest = await browser.newContext({
  baseURL: base,
  permissions: ["camera", "microphone"],
});
const a = await owner.newPage(),
  b = await guest.newPage();
const results = {
  app: base,
  realtime: process.env.NEXT_PUBLIC_REALTIME_URL,
  checks: [],
  startedAt: new Date().toISOString(),
};
const check = (name) => {
  results.checks.push(name);
  console.log(`OK: ${name}`);
};
const name = `Verifikasi deployment ${Date.now()}`;
let code, socket;
try {
  const health = await fetch(`${process.env.NEXT_PUBLIC_REALTIME_URL}/healthz`);
  expect(health.status).toBe(200);
  expect((await health.json()).status).toBe("ok");
  check("HTTPS dan health realtime");
  await a.goto("/buat-room");
  await a.getByLabel("Nama tampilan", { exact: true }).fill("Verifikasi Owner");
  await a.getByLabel("Nama room", { exact: true }).fill(name);
  await a.getByRole("button", { name: /Buat Room/ }).click();
  await a.waitForURL(/\/room\//, { timeout: 45000 });
  code = new URL(a.url()).pathname.split("/").at(-1);
  await expect(
    a.getByRole("status").filter({ hasText: "Terhubung" }),
  ).toBeVisible({ timeout: 45000 });
  check("Buat room dan Socket.IO melalui VPS");
  await b.goto(`/gabung/${code}`);
  await b
    .getByLabel("Nama tampilan", { exact: true })
    .fill("Verifikasi Anggota");
  await b.getByRole("button", { name: /Gabung/ }).click();
  await b.waitForURL(/\/room\//, { timeout: 45000 });
  await expect(
    b.getByRole("status").filter({ hasText: "Terhubung" }),
  ).toBeVisible({ timeout: 45000 });
  await a
    .getByLabel("Tulis pesan", { exact: true })
    .fill("Pesan verifikasi produksi");
  await a.getByRole("button", { name: "Kirim pesan" }).click();
  await expect(
    b.getByText("Pesan verifikasi produksi", { exact: true }),
  ).toBeVisible({ timeout: 30000 });
  check("Gabung dan chat lintas dua sesi");
  const data = await (await owner.request.get(`/api/room/${code}`)).json();
  socket = io(process.env.NEXT_PUBLIC_REALTIME_URL, {
    auth: { token: data.token },
    transports: ["websocket"],
    extraHeaders: { Origin: base },
  });
  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
  });
  expect((await socket.timeout(15000).emitWithAck("room:join", {})).ok).toBe(
    true,
  );
  expect(
    (await socket.timeout(20000).emitWithAck("playlist:add", "aqz-KE-bpKQ")).ok,
  ).toBe(true);
  check("Playlist dan YouTube Data API");
  await a.getByRole("button", { name: "Hubungkan Audio dan Video" }).click();
  await a
    .getByRole("button", { name: "Aktifkan mikrofon", exact: true })
    .click({ timeout: 45000 });
  await a.getByRole("button", { name: "Aktifkan kamera", exact: true }).click();
  const api = new RoomServiceClient(
    process.env.NEXT_PUBLIC_LIVEKIT_URL.replace(/^ws/, "http"),
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
  );
  await expect
    .poll(
      async () =>
        (await api.listParticipants(code))
          .find((p) => p.identity === data.memberId)
          ?.tracks.map((t) => t.source),
      { timeout: 30000 },
    )
    .toEqual(
      expect.arrayContaining([TrackSource.MICROPHONE, TrackSource.CAMERA]),
    );
  check("Token produksi dan publikasi LiveKit kamera/mikrofon sintetis");
  await b.setViewportSize({ width: 375, height: 812 });
  expect(
    await b.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await mkdir("reports/screenshots", { recursive: true });
  await b.screenshot({
    path: "reports/screenshots/phase-3-production-mobile.png",
    fullPage: true,
  });
  check("Room mobile tanpa overflow");
  const oauth = await owner.newPage();
  await oauth.route("https://accounts.google.com/**", (route) => route.abort());
  await oauth.goto("/masuk");
  const request = oauth.waitForRequest((r) =>
    r.url().startsWith("https://accounts.google.com/"),
  );
  await oauth.getByRole("button", { name: /Google/ }).click();
  const destination = new URL((await request).url());
  expect(destination.searchParams.get("redirect_uri")).toBe(
    `${base}/api/auth/callback/google`,
  );
  check(
    "Redirect OAuth memakai callback produksi (login interaktif belum diuji)",
  );
  for (const width of [1280, 375]) {
    await oauth.setViewportSize({ width, height: 900 });
    await oauth.goto("/");
    await expect(oauth.getByRole("heading", { level: 1 })).toBeVisible();
    await oauth
      .getByRole("heading", { name: "Ada yang lagi nonton." })
      .scrollIntoViewIfNeeded();
    await expect(oauth.getByText(name, { exact: true })).toBeVisible({
      timeout: 30000,
    });
    expect(
      await oauth.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await oauth.evaluate(() => window.scrollTo(0, 0));
    await oauth.screenshot({
      path: `reports/screenshots/phase-3-production-home-${width}.png`,
      fullPage: true,
    });
  }
  check("Beranda desktop/mobile dan daftar room yang dimuat saat terlihat");
  results.status = "passed";
} catch (error) {
  results.status = "failed";
  results.error = error.name;
  throw error;
} finally {
  socket?.disconnect();
  if (code) {
    await a.goto(`/room/${code}/pengaturan`);
    await a.getByRole("button", { name: "Hapus Room", exact: true }).click();
    await a.getByLabel(`Ketik “${name}”`).fill(name);
    await a
      .getByRole("dialog")
      .getByRole("button", { name: "Hapus Room", exact: true })
      .click();
    await expect
      .poll(
        async () => (await owner.request.get(`/api/room/${code}`)).status(),
        { timeout: 30000 },
      )
      .toBe(404);
    check("Fixture produksi dihapus melalui tindakan Owner");
  }
  await browser.close();
  results.finishedAt = new Date().toISOString();
  await mkdir("reports", { recursive: true });
  await writeFile(
    "reports/phase-3-production-smoke.json",
    JSON.stringify(results, null, 2),
  );
}
