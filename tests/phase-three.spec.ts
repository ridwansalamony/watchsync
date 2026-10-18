import { test, expect, chromium } from "@playwright/test";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { SignJWT, decodeJwt } from "jose";
import { io } from "socket.io-client";
import {
  AccessToken,
  RoomServiceClient,
  TrackSource,
} from "livekit-server-sdk";
import { mediaSources } from "../web/src/lib/livekit";
import { plainText } from "../shared/src/validation";
import { Redis } from "@upstash/redis";
import { writeFile, mkdir } from "node:fs/promises";
config({ path: ".env.local", quiet: true });
const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
test.use({ baseURL: base });

test("token media satu jam membatasi sumber publikasi dan sanitasi teks", async () => {
  for (const muted of [false, true]) {
    const t = new AccessToken(
      "test-key",
      "test-secret-at-least-thirty-two-characters",
      { identity: "member", ttl: "1h" },
    );
    t.addGrant({
      roomJoin: true,
      room: "ABCDEFGH",
      canSubscribe: true,
      canPublish: true,
      canPublishSources: mediaSources(muted),
    });
    const jwt = decodeJwt(await t.toJwt());
    expect(jwt.exp! - jwt.nbf!).toBe(3600);
    const video = jwt.video as { canPublishSources: string[] };
    expect(video.canPublishSources).toContain("camera");
    expect(video.canPublishSources.includes("microphone")).toBe(!muted);
    expect(video.canPublishSources).not.toContain("screen_share");
  }
  expect(plainText("<img src=x onerror=alert(1)>Halo\u0000")).toBe("Halo");
});

test("header keamanan, robots, sitemap, OG, dan penolakan media tanpa sesi", async ({
  request,
}) => {
  const home = await request.get(base);
  expect(home.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(home.headers()["x-content-type-options"]).toBe("nosniff");
  expect(await home.text()).toContain('"@type":"WebApplication"');
  const robots = await request.get(`${base}/robots.txt`);
  expect(await robots.text()).toContain("Disallow: /room/");
  expect((await request.get(`${base}/sitemap.xml`)).status()).toBe(200);
  const og = await request.get(`${base}/opengraph-image`);
  expect(og.headers()["content-type"]).toContain("image/png");
  const denied = await request.post(`${base}/api/livekit/token`, {
    headers: { Origin: base },
    data: { code: "ABCDEFGH" },
  });
  expect(denied.status()).toBe(403);
  expect(
    (
      await request.post(`${base}/api/livekit/token`, {
        headers: { Origin: "https://evil.example" },
        data: { code: "ABCDEFGH" },
      })
    ).status(),
  ).toBe(403);
});

test("Socket.IO menolak origin dan JWT tidak sah", async () => {
  for (const origin of ["https://evil.example", base]) {
    const socket = io("http://localhost:4000", {
      forceNew: true,
      reconnection: false,
      transports: ["websocket"],
      auth: { token: "invalid" },
      extraHeaders: { Origin: origin },
      timeout: 5000,
    });
    try {
      await new Promise<void>((resolve, reject) => {
        socket.on("connect", () =>
          reject(new Error("Koneksi seharusnya ditolak")),
        );
        socket.on("connect_error", () => resolve());
      });
    } finally {
      socket.disconnect();
    }
  }
});

test("pencarian dibatasi 30 permintaan per menit meskipun cache tersedia", async ({
  request,
}) => {
  const redis = Redis.fromEnv(),
    q = `uji-limit-${crypto.randomUUID()}`,
    key = `wsr:youtube:${q}`;
  await redis.set(key, [], { ex: 120 });
  try {
    const ip = `198.19.${Math.floor(Math.random() * 250)}.42`;
    for (let i = 0; i < 30; i++)
      expect(
        (
          await request.get(`${base}/api/youtube/search?q=${q}`, {
            headers: { "x-forwarded-for": ip },
          })
        ).status(),
      ).toBe(200);
    const last = await request.get(`${base}/api/youtube/search?q=${q}`, {
      headers: { "x-forwarded-for": ip },
    });
    expect(last.status()).toBe(429);
    expect(Number(last.headers()["retry-after"])).toBeGreaterThan(0);
  } finally {
    await redis.del(key);
  }
});

test("LiveKit nyata: kamera, mikrofon, satu layar bersama, mute, dan kick", async () => {
  test.setTimeout(180000);
  test.skip(
    !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET,
    "Kredensial LiveKit diperlukan.",
  );
  const sql = neon(process.env.DATABASE_URL!),
    roomId = crypto.randomUUID();
  const code =
    "M" +
    crypto
      .randomUUID()
      .replace(/[^a-f]/g, "")
      .slice(0, 7)
      .toUpperCase()
      .padEnd(7, "A");
  const api = new RoomServiceClient(
    process.env.NEXT_PUBLIC_LIVEKIT_URL!.replace(/^ws/, "http"),
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
  );
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
      "--auto-select-desktop-capture-source=Entire screen",
      "--auto-select-tab-capture-source-by-title=WatchSync Media Test",
      "--enable-usermedia-screen-capturing",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });
  const contexts = [],
    ids: string[] = [];
  let controller: ReturnType<typeof io> | undefined;
  await sql`insert into rooms(id,code,name,privacy) values(${roomId},${code},'Uji Media Nyata','unlisted')`;
  try {
    for (let i = 0; i < 2; i++) {
      const guest = crypto.randomUUID(),
        id = crypto.randomUUID();
      ids.push(id);
      await sql`insert into room_members(id,room_id,guest_id,display_name,role) values(${id},${roomId},${guest},${"Media " + i},${i === 0 ? "owner" : "member"})`;
      const cookie = await new SignJWT({})
        .setSubject(guest)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuer("watchsync-guest")
        .setExpirationTime("1h")
        .sign(new TextEncoder().encode(process.env.GUEST_COOKIE_SECRET!));
      const context = await browser.newContext({
        permissions: ["camera", "microphone"],
      });
      contexts.push(context);
      await context.addCookies([
        {
          name: "wsr_guest",
          value: cookie,
          domain: "localhost",
          path: "/",
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);
      const page = await context.newPage();
      await page.goto(`${base}/room/${code}`);
      await page.evaluate(() => {
        document.title = "WatchSync Media Test";
      });
      await page
        .getByRole("button", { name: "Hubungkan Audio dan Video" })
        .click();
      await expect(
        page.getByRole("button", { name: "Aktifkan mikrofon", exact: true }),
      ).toBeVisible({ timeout: 45000 });
      await page
        .getByRole("button", { name: "Aktifkan mikrofon", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Aktifkan kamera", exact: true })
        .click();
      await expect
        .poll(
          async () => {
            const p = (await api.listParticipants(code)).find(
              (p) => p.identity === id,
            );
            return p?.tracks.map((t) => t.source) ?? [];
          },
          { timeout: 30000 },
        )
        .toEqual(
          expect.arrayContaining([TrackSource.CAMERA, TrackSource.MICROPHONE]),
        );
    }
    const owner = contexts[0].pages()[0],
      member = contexts[1].pages()[0];
    await expect(member.locator("video")).toHaveCount(2);
    await owner.getByLabel("Tahan Spasi untuk Bicara").check();
    await owner.getByRole("heading", { name: "Uji Media Nyata", exact: true }).click();
    await owner.keyboard.down("Space");
    await expect.poll(async()=>(await api.listParticipants(code)).find(p=>p.identity===ids[0])?.tracks.find(t=>t.source===TrackSource.MICROPHONE)?.muted).toBe(false);
    await owner.keyboard.up("Space");
    await expect.poll(async()=>(await api.listParticipants(code)).find(p=>p.identity===ids[0])?.tracks.find(t=>t.source===TrackSource.MICROPHONE)?.muted).toBe(true);
    await owner.getByLabel("Tahan Spasi untuk Bicara").uncheck();
    await owner
      .getByRole("button", { name: "Bagikan layar", exact: true })
      .click();
    await expect
      .poll(
        async () =>
          (await api.listParticipants(code))
            .flatMap((p) => p.tracks)
            .filter((t) => t.source === TrackSource.SCREEN_SHARE).length,
        { timeout: 45000 },
      )
      .toBe(1);
    const denied = await contexts[1].request.post(
      `${base}/api/livekit/screen`,
      { headers: { Origin: base }, data: { code, active: true } },
    );
    expect(denied.status()).toBe(409);
    await owner.screenshot({
      path: "reports/screenshots/phase-3-media-desktop.png",
      fullPage: true,
    });
    await owner.setViewportSize({ width: 375, height: 900 });
    expect(
      await owner.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await owner.screenshot({
      path: "reports/screenshots/phase-3-media-mobile.png",
      fullPage: true,
    });
    const data = await (
      await contexts[0].request.get(`${base}/api/room/${code}`)
    ).json();
    controller = io("http://localhost:4000", {
      auth: { token: data.token },
      extraHeaders: { Origin: base },
      reconnection: false,
    });
    await new Promise<void>((resolve, reject) => {
      controller!.once("connect", () => resolve());
      controller!.once("connect_error", reject);
    });
    expect(
      (await controller.timeout(30000).emitWithAck("room:join", {})).ok,
    ).toBe(true);
    expect(
      (await controller.timeout(30000).emitWithAck("member:mute", ids[1])).ok,
    ).toBe(true);
    await expect
      .poll(async () =>
        (await api.listParticipants(code))
          .find((p) => p.identity === ids[1])
          ?.permission?.canPublishSources.includes(TrackSource.MICROPHONE),
      )
      .toBe(false);
    await expect(
      member.getByRole("button", { name: "Aktifkan mikrofon", exact: true }),
    ).toBeDisabled();
    expect(
      (await controller.timeout(30000).emitWithAck("member:kick", ids[1])).ok,
    ).toBe(true);
    await expect
      .poll(async () =>
        (await api.listParticipants(code)).some((p) => p.identity === ids[1]),
      )
      .toBe(false);
  } finally {
    controller?.disconnect();
    for (const context of contexts) await context.close();
    await browser.close();
    await api.deleteRoom(code).catch(() => {});
    await Redis.fromEnv().del(`wsr:screen:${code}`);
    await sql`delete from rooms where id=${roomId}`;
  }
});

test("pembuatan room dibatasi lima per jam per IP", async ({ browser }) => {
  const sql = neon(process.env.DATABASE_URL!), codes: string[] = [];
  const context = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": `2001:db8::${crypto.randomUUID().slice(0,4)}` } });
  try {
    const page = await context.newPage();
    for(let i=0;i<6;i++) {
      await page.goto(`${base}/buat-room`);
      await page.getByLabel("Nama tampilan", {exact:true}).fill("Penguji Batas");
      await page.getByLabel("Nama room", {exact:true}).fill(`Room Batas ${i}`);
      await page.getByRole("button", {name:/Buat Room/}).click();
      if(i<5) { await page.waitForURL(/\/room\//); codes.push(new URL(page.url()).pathname.split("/").at(-1)!); }
      else await expect(page.getByText("Maksimal 5 room per jam. Coba kembali nanti.", {exact:true})).toBeVisible();
    }
  } finally { await context.close(); if(codes.length) await sql`delete from rooms where code=any(${codes}::text[])`; }
});

test("empat browser memutar YouTube nyata dengan selisih di bawah 1,5 detik", async ({
  browser,
}) => {
  test.setTimeout(180000);
  const sql = neon(process.env.DATABASE_URL!);
  const roomId = crypto.randomUUID(),
    code =
      "Z" +
      crypto
        .randomUUID()
        .replace(/[^a-f]/g, "")
        .slice(0, 7)
        .toUpperCase()
        .padEnd(7, "A");
  const contexts = [];
  await sql`insert into rooms(id,code,name,privacy,current_video_id) values(${roomId},${code},'Uji Empat Player','unlisted','aqz-KE-bpKQ')`;
  try {
    for (let i = 0; i < 4; i++) {
      const guestId = crypto.randomUUID(),
        memberId = crypto.randomUUID();
      await sql`insert into room_members(id,room_id,guest_id,display_name,role) values(${memberId},${roomId},${guestId},${"Player " + i},${i === 0 ? "owner" : "member"})`;
      const signed = await new SignJWT({})
        .setSubject(guestId)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuer("watchsync-guest")
        .setExpirationTime("1h")
        .sign(new TextEncoder().encode(process.env.GUEST_COOKIE_SECRET!));
      const context = await browser.newContext();
      contexts.push(context);
      await context.addCookies([
        {
          name: "wsr_guest",
          value: signed,
          domain: "localhost",
          path: "/",
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);
      const page = await context.newPage();
      await page.goto(`${base}/room/${code}`);
      await page
        .locator('iframe[src*="youtube.com/embed"]')
        .waitFor({ timeout: 45000 });
      await page.waitForFunction(
        () => {
          const w = window as unknown as {
            YT?: { get(id: string): { mute?: unknown } };
          };
          const frame = document.querySelector(
            'iframe[src*="youtube.com/embed"]',
          );
          return frame && typeof w.YT?.get(frame.id)?.mute === "function";
        },
        undefined,
        { timeout: 45000 },
      );
      await page.evaluate(() => {
        const w = window as unknown as {
          YT: { get(id: string): { mute(): void } };
        };
        const frame = document.querySelector(
          'iframe[src*="youtube.com/embed"]',
        ) as HTMLIFrameElement;
        w.YT.get(frame.id).mute();
      });
    }
    // Fixtures use the same real playlist schema as production; no player mock.
    await sql`insert into playlist_items(room_id,youtube_video_id,title,duration_sec,position) values(${roomId},'aqz-KE-bpKQ','Big Buck Bunny',634,0)`;
    const first = contexts[0].pages()[0];
    await first
      .getByRole("button", { name: /^(Putar|Putar Sekarang)$/ })
      .click();
    const samples: number[][] = [];
    for (let sample = 0; sample < 5; sample++) {
      await expect
        .poll(
          async () => {
            const times = await Promise.all(
              contexts.map((context) =>
                context.pages()[0].evaluate(() => {
                  const w = window as unknown as {
                    YT: {
                      get(id: string): {
                        getCurrentTime(): number;
                        getPlayerState(): number;
                      };
                    };
                  };
                  const p = w.YT.get(
                    document.querySelector('iframe[src*="youtube.com/embed"]')!
                      .id,
                  );
                  return p.getPlayerState() === 1 ? p.getCurrentTime() : -1;
                }),
              ),
            );
            if (times.some((t) => t <= 0)) return 999;
            samples.push(times);
            return Math.max(...times) - Math.min(...times);
          },
          { timeout: 45000 },
        )
        .toBeLessThan(1.5);
      await first.waitForTimeout(2000);
    }
    await test
      .info()
      .attach("drift-empat-player", {
        body: JSON.stringify(samples),
        contentType: "application/json",
      });
    await mkdir("reports", { recursive: true });
    await writeFile(
      "reports/phase-3-drift.json",
      JSON.stringify(
        {
          source: "YouTube IFrame Player API nyata, empat konteks Chrome",
          samples,
        },
        null,
        2,
      ),
    );
  } finally {
    for (const context of contexts) await context.close();
    await sql`delete from rooms where id=${roomId}`;
  }
});
