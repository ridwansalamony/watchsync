import { test, expect } from "@playwright/test";
import { io, type Socket } from "socket.io-client";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { encode } from "next-auth/jwt";
import { Redis } from "@upstash/redis";
import { mkdir } from "node:fs/promises";
import { durationSeconds } from "../shared/src/video-policy";
config({ path: ".env.local", quiet: true });
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
test.use({ baseURL });
const testHeaders = () => ({
  "x-forwarded-for": `2001:db8::${crypto.randomUUID().slice(0, 4)}`,
});
test("durasi video membedakan batas enam jam dan durasi harian", () => {
  expect(durationSeconds("PT6H")).toBe(21600);
  expect(durationSeconds("PT6H1S")).toBe(21601);
  expect(durationSeconds("P1D")).toBe(86400);
  expect(durationSeconds("PT1H2M3S")).toBe(3723);
  expect(durationSeconds("tidak-valid")).toBe(-1);
});
test("18 rute dengan data nyata dan tampilan desktop/mobile", async ({
  browser,
}) => {
  test.setTimeout(180000);
  const sql = neon(process.env.DATABASE_URL!),
    uid = crypto.randomUUID(),
    playlist = crypto.randomUUID();
  let code = "";
  await sql`insert into users(id,name,email) values(${uid},'Penguji Tampilan',${uid + "@example.com"})`;
  await sql`insert into user_playlists(id,user_id,name) values(${playlist},${uid},'Playlist Tampilan')`;
  const context = await browser.newContext({ extraHTTPHeaders: testHeaders() });
  try {
    const token = await encode({
      token: {
        sub: uid,
        name: "Penguji Tampilan",
        email: uid + "@example.com",
      },
      secret: process.env.AUTH_SECRET!,
      salt: "authjs.session-token",
    });
    await context.addCookies([
      {
        name: "authjs.session-token",
        value: token,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    const p = await context.newPage();
    const errors: string[] = [];
    p.on("pageerror", (error) =>
      errors.push(`${p.url()}: ${error.stack ?? error.message}`),
    );
    await p.goto("/buat-room");
    await p
      .getByLabel("Nama tampilan", { exact: true })
      .fill("Penguji Tampilan");
    await p
      .getByLabel("Nama room", { exact: true })
      .fill("Room Verifikasi Tampilan");
    await p.getByRole("button", { name: /Buat Room/ }).click();
    await p.waitForURL(/\/room\//);
    code = new URL(p.url()).pathname.split("/").at(-1)!;
    const paths = [
      "/",
      "/buat-room",
      "/gabung",
      `/gabung/${code}`,
      "/masuk",
      "/tentang",
      "/bantuan",
      "/kebijakan-privasi",
      "/syarat-layanan",
      "/dashboard",
      "/dashboard/room-tersimpan",
      "/dashboard/playlist",
      `/dashboard/playlist/${playlist}`,
      "/dashboard/riwayat",
      "/dashboard/profil",
      `/room/${code}`,
      `/room/${code}/pengaturan`,
      `/room/${code}/anggota`,
    ];
    await mkdir("reports/screenshots", { recursive: true });
    for (const width of [1280, 375]) {
      await p.setViewportSize({ width, height: 900 });
      for (const path of paths) {
        const response = await p.goto(path);
        expect(response?.status()).toBe(200);
        if (path.startsWith("/room/"))
          await p
            .getByRole("heading", {
              name: "Room Verifikasi Tampilan",
              exact: true,
            })
            .first()
            .waitFor();
        if (path.startsWith("/dashboard"))
          await p.locator("main").getByRole("heading").first().waitFor();
        await expect
          .poll(() =>
            p.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
          )
          .toBe(true);
        expect(await p.locator("body").innerText()).not.toMatch(
          /sedang dalam pengembangan/i,
        );
        if (path === `/room/${code}`)
          await p
            .getByRole("status")
            .filter({ hasText: "Terhubung" })
            .waitFor({ timeout: 30000 });
        if (path === `/room/${code}` || path === "/dashboard")
          await p.screenshot({
            path: `reports/screenshots/phase-2-${path === "/dashboard" ? "dashboard" : "room"}-${width}.png`,
            fullPage: true,
          });
      }
    }
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    if (code) await sql`delete from rooms where code=${code}`;
    await sql`delete from users where id=${uid}`;
  }
});
test("password, undangan privat bertanda tangan, pengaturan, dan hapus room", async ({
  browser,
}) => {
  const owner = await browser.newContext({
      extraHTTPHeaders: testHeaders(),
      permissions: ["clipboard-read", "clipboard-write"],
    }),
    guest = await browser.newContext({ extraHTTPHeaders: testHeaders() });
  const a = await owner.newPage(),
    b = await guest.newPage();
  let code = "";
  try {
    await a.goto("/buat-room");
    await a.getByLabel("Nama tampilan", { exact: true }).fill("Penguji Privat");
    await a
      .getByLabel("Nama room", { exact: true })
      .fill("Room Privat Integrasi");
    await a
      .getByLabel("Password room (opsional)", { exact: true })
      .fill("nonton-uji");
    await a.getByRole("button", { name: /Buat Room/ }).click();
    await a.waitForURL(/\/room\//);
    code = new URL(a.url()).pathname.split("/").at(-1)!;
    await a.goto(`/room/${code}/pengaturan`);
    await a.getByLabel("Privasi room", { exact: true }).selectOption("private");
    await a.getByRole("button", { name: "Simpan Perubahan" }).click();
    await expect(
      a.getByText("Pengaturan room disimpan.", { exact: true }),
    ).toBeVisible();
    await b.route("**/api/bootstrap", async (route) => {
      const response = await route.fetch();
      const status = response.status(),
        headers = response.headers(),
        body = await response.body();
      await new Promise((resolve) => setTimeout(resolve, 700));
      await route.fulfill({ status, headers, body });
    });
    await b.goto(`/gabung/${code}`);
    await expect(
      b.getByText("Undangan diperlukan", { exact: true }),
    ).toBeVisible({ timeout: 20000 });
    await a
      .getByRole("button", { name: "Salin tautan undangan", exact: true })
      .click();
    await expect(
      a.getByText("Tautan undangan disalin.", { exact: true }),
    ).toBeVisible();
    const link = await a.evaluate(() => navigator.clipboard.readText());
    expect(new URL(link).searchParams.has("undangan")).toBe(true);
    await b.goto(link);
    await b.getByLabel("Nama tampilan", { exact: true }).fill("Tamu Diundang");
    await b.getByLabel("Password room", { exact: true }).fill("salah");
    await b.getByRole("button", { name: /Gabung/ }).click();
    await expect(
      b.getByText("Password room tidak cocok.", { exact: true }),
    ).toBeVisible();
    await b.getByLabel("Password room", { exact: true }).fill("nonton-uji");
    await b.getByRole("button", { name: /Gabung/ }).click();
    await b.waitForURL(/\/room\//);
    await a.getByRole("button", { name: "Hapus Room", exact: true }).click();
    await a
      .getByLabel(/Ketik “Room Privat Integrasi”/)
      .fill("Room Privat Integrasi");
    await a
      .getByRole("dialog")
      .getByRole("button", { name: "Hapus Room", exact: true })
      .click();
    await expect
      .poll(async () => (await owner.request.get(`/api/room/${code}`)).status())
      .toBe(404);
  } finally {
    await b.unrouteAll({ behavior: "wait" });
    await owner.close();
    await guest.close();
    if (code) {
      const sql = neon(process.env.DATABASE_URL!);
      await sql`delete from rooms where code=${code}`;
    }
  }
});
test("dashboard nyata: sesi JWT, playlist, profil, dan proteksi tamu", async ({
  browser,
}) => {
  const sql = neon(process.env.DATABASE_URL!);
  const id = crypto.randomUUID();
  await sql`insert into users(id,name,email) values(${id},'Penguji Dashboard',${`uji-${id}@example.com`})`;
  const context = await browser.newContext({ extraHTTPHeaders: testHeaders() });
  try {
    const token = await encode({
      token: {
        sub: id,
        name: "Penguji Dashboard",
        email: `uji-${id}@example.com`,
      },
      secret: process.env.AUTH_SECRET!,
      salt: "authjs.session-token",
    });
    await context.addCookies([
      {
        name: "authjs.session-token",
        value: token,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    const p = await context.newPage();
    await p.goto("/dashboard");
    await expect(p.getByText(/Mau nonton apa/)).toBeVisible({ timeout: 30000 });
    await p.goto("/dashboard/playlist");
    await p
      .getByRole("button", { name: /Buat Playlist/ })
      .first()
      .click();
    await p
      .getByLabel("Nama playlist", { exact: true })
      .fill("Playlist Pengujian");
    await p
      .getByRole("button", { name: "Buat Playlist", exact: true })
      .last()
      .click();
    await expect(
      p.getByText("Playlist Pengujian", { exact: true }),
    ).toBeVisible({ timeout: 20000 });
    await p.reload();
    await expect(
      p.getByText("Playlist Pengujian", { exact: true }),
    ).toBeVisible();
    await p.goto("/dashboard/profil");
    await p
      .getByLabel("Nama tampilan default", { exact: true })
      .fill("Nama Baru Penguji");
    await p.getByRole("button", { name: /Simpan/ }).click();
    await expect
      .poll(async () => {
        const [row] = await sql`select name from users where id=${id}`;
        return row.name;
      })
      .toBe("Nama Baru Penguji");
    await p.getByRole("button", { name: "Hapus Akun", exact: true }).click();
    await p.getByLabel(/Ketik “HAPUS”/).fill("HAPUS");
    await p
      .getByRole("dialog")
      .getByRole("button", { name: "Hapus Akun", exact: true })
      .click();
    await expect
      .poll(async () =>
        Number(await Redis.fromEnv().zscore("wsr:account-deletions", id)),
      )
      .toBeGreaterThan(Date.now() + 29 * 86400000);
  } finally {
    await context.close();
    await Redis.fromEnv().zrem("wsr:account-deletions", id);
    await sql`delete from users where id=${id}`;
  }
});
test("room tamu, chat lintas sesi, izin server, playlist, moderasi, dan persistensi", async ({
  browser,
}) => {
  const owner = await browser.newContext({ extraHTTPHeaders: testHeaders() }),
    member = await browser.newContext({ extraHTTPHeaders: testHeaders() });
  const a = await owner.newPage(),
    b = await member.newPage();
  const sockets: Socket[] = [];
  let code = "";
  try {
    await a.goto("/buat-room");
    await a.getByLabel("Nama tampilan", { exact: true }).fill("Penguji Owner");
    await a
      .getByLabel("Nama room", { exact: true })
      .fill("Room Pengujian Integrasi");
    await a.getByRole("button", { name: /Buat Room/ }).click();
    await a.waitForURL(/\/room\//);
    code = new URL(a.url()).pathname.split("/").at(-1)!;
    await expect(
      a.getByRole("status").filter({ hasText: "Terhubung" }),
    ).toBeVisible({ timeout: 30000 });
    await b.goto(`/gabung/${code}`);
    await b
      .getByLabel("Nama tampilan", { exact: true })
      .fill("Penguji Anggota");
    await b.getByRole("button", { name: /Gabung/ }).click();
    await b.waitForURL(/\/room\//);
    await expect(
      b.getByRole("status").filter({ hasText: "Terhubung" }),
    ).toBeVisible({ timeout: 30000 });
    await a
      .getByLabel("Tulis pesan", { exact: true })
      .fill("Pesan integrasi <script>aman</script>");
    await expect(
      b.getByText("Penguji Owner sedang mengetik…", { exact: true }),
    ).toBeVisible({ timeout: 20000 });
    await a.getByRole("button", { name: "Kirim pesan" }).click();
    await expect(
      b.getByText("Pesan integrasi aman", { exact: true }),
    ).toBeVisible({ timeout: 20000 });
    const ownerData = await (
        await owner.request.get(`/api/room/${code}`)
      ).json(),
      memberData = await (await member.request.get(`/api/room/${code}`)).json();
    async function connect(token: string) {
      const socket = io("http://localhost:4000", {
        auth: { token },
        extraHeaders: { Origin: baseURL },
        transports: ["websocket"],
      });
      sockets.push(socket);
      await new Promise<void>((resolve, reject) => {
        socket.once("connect", () => resolve());
        socket.once("connect_error", reject);
      });
      await socket.timeout(15000).emitWithAck("room:join", {});
      return socket;
    }
    const os = await connect(ownerData.token),
      ms = await connect(memberData.token);
    expect((await ms.timeout(15000).emitWithAck("player:play", {})).ok).toBe(
      false,
    );
    expect(
      (await ms.timeout(15000).emitWithAck("member:mute", ownerData.memberId))
        .ok,
    ).toBe(false);
    const firstVideoState = new Promise<{ videoId: string | null }>((resolve) =>
      os.once("player:state", resolve),
    );
    expect(
      (await os.timeout(15000).emitWithAck("playlist:add", "aqz-KE-bpKQ")).ok,
    ).toBe(true);
    expect((await firstVideoState).videoId).toBe("aqz-KE-bpKQ");
    expect(
      (await os.timeout(15000).emitWithAck("playlist:add", "aqz-KE-bpKQ")).ok,
    ).toBe(false);
    expect(
      (
        await os
          .timeout(15000)
          .emitWithAck("player:change-video", "aqz-KE-bpKQ")
      ).ok,
    ).toBe(true);
    expect(
      (await os.timeout(15000).emitWithAck("member:mute", memberData.memberId))
        .ok,
    ).toBe(true);
    expect(
      (await ms.timeout(15000).emitWithAck("chat:send", "Pesan ditolak")).ok,
    ).toBe(false);
    await expect
      .poll(async () => {
        const data = await (
          await owner.request.get(`/api/room/${code}`)
        ).json();
        return data.room.videos.length;
      })
      .toBe(1);
    await a.reload();
    await expect(
      a.getByText("Pesan integrasi aman", { exact: true }),
    ).toBeVisible({ timeout: 20000 });
    expect(
      (await member.request.get("/dashboard", { maxRedirects: 0 })).status(),
    ).toBe(307);
  } finally {
    for (const s of sockets) s.disconnect();
    await owner.close();
    await member.close();
    if (code) {
      const sql = neon(process.env.DATABASE_URL!);
      await sql`delete from rooms where code=${code}`;
    }
  }
});

test("metadata, cache pencarian, dan redirect OAuth Google", async ({
  browser,
  request,
}) => {
  const metadata = await request.get(
    `${baseURL}/api/youtube/video?id=aqz-KE-bpKQ`,
  );
  expect(metadata.ok()).toBe(true);
  expect((await metadata.json()).youtubeVideoId).toBe("aqz-KE-bpKQ");
  const search = await request.get(
    `${baseURL}/api/youtube/search?q=Big%20Buck%20Bunny`,
  );
  expect(search.ok()).toBe(true);
  const results = await search.json();
  expect(Array.isArray(results)).toBe(true);
  expect(results.length).toBeLessThanOrEqual(10);
  const ttl = await Redis.fromEnv().ttl("wsr:youtube:big buck bunny");
  expect(ttl).toBeGreaterThan(0);
  expect(ttl).toBeLessThanOrEqual(600);
  const context = await browser.newContext({ extraHTTPHeaders: testHeaders() });
  try {
    const p = await context.newPage();
    await p.route("https://accounts.google.com/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<p>Tujuan OAuth terverifikasi.</p>",
      }),
    );
    await p.goto(`${baseURL}/masuk`);
    await p.getByRole("button", { name: /Lanjutkan dengan Google/ }).click();
    await p.waitForURL((url) => url.hostname === "accounts.google.com");
    const destination = new URL(p.url());
    expect(destination.searchParams.get("redirect_uri")).toBe(
      `${process.env.AUTH_URL ?? baseURL}/api/auth/callback/google`,
    );
    expect(destination.searchParams.get("client_id")).toBe(
      process.env.AUTH_GOOGLE_ID,
    );
  } finally {
    await context.close();
  }
});
