import { config } from "dotenv";
config({ path: "../.env.local", quiet: true });
import { createServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { jwtVerify } from "jose";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { and, eq, asc, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { Redis } from "@upstash/redis";
import { maintainData } from "./maintenance.ts";
import { moderateMedia, deleteMediaRoom } from "./media.ts";
import { durationSeconds } from "../../shared/src/video-policy.ts";
import { plainText } from "../../shared/src/validation.ts";
import * as t from "../../web/src/db/schema.ts";
import {
  canControl,
  canAddVideo,
  canModerate,
} from "../../shared/src/types.ts";

const db = drizzle(
  new Pool({ connectionString: process.env.REALTIME_DATABASE_URL }),
  { schema: t },
);
const origin = process.env.REALTIME_CORS_ORIGIN ?? "http://localhost:3000";
const http = createServer((req, res) => {
  void (async () => {
    if (req.method === "POST" && req.url === "/internal/room") {
      try {
        const { payload } = await jwtVerify(
          (req.headers.authorization ?? "").replace(/^Bearer /, ""),
          new TextEncoder().encode(process.env.REALTIME_JWT_SECRET!),
          {
            algorithms: ["HS256"],
            issuer: "watchsync-web",
            audience: "watchsync-internal",
          },
        );
        const code = z.string().parse(payload.code);
        if (payload.reset) {
          states.delete(code);
          const room = await db.query.rooms.findFirst({
            where: eq(t.rooms.code, code),
          });
          if (room) io.to(code).emit("player:state", wire(await state(room)));
        }
        io.to(code).emit(
          payload.deleted ? "room:deleted" : "room:settings-updated",
        );
        if (payload.deleted) {
          await deleteMediaRoom(code);
          states.delete(code);
          io.in(code).disconnectSockets(true);
        }
        res.writeHead(204);
        res.end();
      } catch {
        res.writeHead(401);
        res.end();
      }
      return;
    }
    res.writeHead(req.url === "/healthz" ? 200 : 404, {
      "Content-Type": "application/json",
    });
    res.end(
      JSON.stringify({
        status: req.url === "/healthz" ? "ok" : "not-found",
        ...(req.url === "/healthz"
          ? {
              uptime: Math.floor(process.uptime()),
              connections: io.sockets.sockets.size,
              rooms: new Set(
                [...io.sockets.sockets.values()]
                  .filter((s) => s.rooms.has(s.data.code))
                  .map((s) => s.data.code),
              ).size,
            }
          : {}),
      }),
    );
  })().catch(() => {
    res.writeHead(500);
    res.end();
  });
});
const io = new Server(http, {
  maxHttpBufferSize: 16384,
  cors: { origin, credentials: true },
  allowRequest: (req, cb) => cb(null, req.headers.origin === origin),
});
type Playback = {
  videoId: string | null;
  status: "playing" | "paused";
  position: number;
  updatedAt: number;
  dirty: boolean;
  ready: Set<string>;
  waiting: boolean;
};
const states = new Map<string, Playback>(),
  limits = new Map<string, number[]>(),
  queues = new Map<string, Promise<unknown>>();
function limit(key: string, count: number, window: number) {
  const now = Date.now(),
    list = (limits.get(key) ?? []).filter((v) => v > now - window);
  if (list.length >= count) throw new Error("Terlalu cepat. Tunggu sebentar.");
  list.push(now);
  limits.set(key, list);
}
async function access(socket: Socket) {
  const { memberId, code } = socket.data as { memberId: string; code: string };
  const room = await db.query.rooms.findFirst({
    where: eq(t.rooms.code, code),
  });
  const member = await db.query.roomMembers.findFirst({
    where: eq(t.roomMembers.id, memberId),
  });
  if (
    !room ||
    !member ||
    member.roomId !== room.id ||
    (member.blockedUntil && +member.blockedUntil > Date.now())
  )
    throw new Error("Akses room ditolak.");
  return { room, member };
}
async function state(room: typeof t.rooms.$inferSelect) {
  let s = states.get(room.code);
  if (!s) {
    s = {
      videoId: room.currentVideoId,
      status: room.playbackStatus,
      position: room.playbackPosition,
      updatedAt: +room.playbackUpdatedAt,
      dirty: false,
      ready: new Set(),
      waiting: false,
    };
    states.set(room.code, s);
  }
  return s;
}
function wire(s: Playback) {
  return {
    videoId: s.videoId,
    status: s.status,
    position: s.position,
    updatedAt: s.updatedAt,
    waiting: s.waiting,
  };
}
async function broadcast(code: string) {
  io.to(code).emit("room:refresh");
}
io.use(async (socket, next) => {
  try {
    const { payload } = await jwtVerify(
      String(socket.handshake.auth.token ?? ""),
      new TextEncoder().encode(process.env.REALTIME_JWT_SECRET!),
      {
        algorithms: ["HS256"],
        issuer: "watchsync-web",
        audience: "watchsync-realtime",
      },
    );
    socket.data = {
      code: z
        .string()
        .regex(/^[A-HJ-NP-Z2-9]{8}$/)
        .parse(payload.code),
      memberId: z.string().uuid().parse(payload.memberId),
    };
    await access(socket);
    next();
  } catch (error) {
    if (process.env.NODE_ENV !== "production")
      console.error(
        "Autentikasi socket ditolak:",
        error instanceof Error ? error.name : "UnknownError",
      );
    next(new Error("Sesi room tidak valid. Gabung kembali."));
  }
});
io.on("connection", (socket) => {
  function on(event: string, handler: (input: unknown) => Promise<unknown>) {
    socket.on(event, (input: unknown, ack?: (result: unknown) => void) => {
      const code = socket.data.code as string;
      const task = (queues.get(code) ?? Promise.resolve())
        .catch(() => {})
        .then(async () => {
          try {
            if (event !== "room:join" && !socket.rooms.has(code))
              throw new Error("Gabung ke room terlebih dahulu.");
            limit(`events:${socket.id}`, 60, 1000);
            const data = await handler(input);
            ack?.({ ok: true, data });
          } catch (e) {
            if (event.startsWith("player:")) {
              const current = states.get(code);
              socket.emit("sync:rejected", {
                state: current ? wire(current) : null,
              });
            }
            ack?.({
              ok: false,
              error:
                e instanceof z.ZodError
                  ? "Data tidak valid."
                  : e instanceof Error
                    ? e.message
                    : "Permintaan gagal.",
            });
          }
        });
      queues.set(code, task);
    });
  }
  on("room:join", async () => {
    const { room, member } = await access(socket);
    const alreadyPresent = (await io.in(room.code).fetchSockets()).some(
      (s) => s.data.memberId === member.id,
    );
    await db.transaction(async (tx) => {
      await tx
        .select()
        .from(t.rooms)
        .where(eq(t.rooms.id, room.id))
        .for("update");
      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(t.roomMembers)
        .where(
          and(
            eq(t.roomMembers.roomId, room.id),
            sql`${t.roomMembers.lastSeenAt}>now()-interval '60 seconds'`,
          ),
        );
      if (count >= room.maxMembers && +member.lastSeenAt < Date.now() - 60000)
        throw new Error("Room sudah penuh. Maksimal 50 orang.");
      await tx
        .update(t.roomMembers)
        .set({ lastSeenAt: new Date() })
        .where(eq(t.roomMembers.id, member.id));
      if (!alreadyPresent) {
        await tx
          .insert(t.chatMessages)
          .values({
            roomId: room.id,
            memberId: null,
            body: `${member.displayName} bergabung ke room.`,
            isSystem: true,
          });
        await tx.execute(
          sql`delete from chat_messages where room_id=${room.id} and id not in (select id from chat_messages where room_id=${room.id} order by created_at desc limit 200)`,
        );
      }
    });
    socket.data.left = false;
    await socket.join(room.code);
    socket.emit("player:state", wire(await state(room)));
    await broadcast(room.code);
    return { memberId: member.id };
  });
  on("room:leave", async () => {
    const { room, member } = await access(socket);
    await socket.leave(room.code);
    socket.data.left = true;
    const others = await io.in(room.code).fetchSockets();
    if (!others.some((s) => s.data.memberId === member.id))
      await db
        .update(t.roomMembers)
        .set({ lastSeenAt: new Date(0) })
        .where(eq(t.roomMembers.id, member.id));
    await broadcast(room.code);
  });
  socket.on("sync:ping", (input: unknown, ack?: (result: unknown) => void) => {
    try {
      if (!socket.rooms.has(socket.data.code)) throw new Error();
      limit(`ping:${socket.id}`, 10, 1000);
      ack?.({
        ok: true,
        data: {
          clientTime: z.number().finite().parse(input),
          serverTime: Date.now(),
        },
      });
    } catch {
      ack?.({ ok: false, error: "Ping tidak diizinkan." });
    }
  });
  on("chat:typing", async (input) => {
    const { room, member } = await access(socket);
    if (member.isMuted) return;
    limit(`typing:${member.id}`, 3, 1000);
    socket.to(room.code).emit("presence:typing", {
      memberId: member.id,
      typing: z.boolean().parse(input),
    });
  });
  on("presence:update", async () => {
    const { room, member } = await access(socket);
    limit(`presence:${member.id}`, 1, 10000);
    await db
      .update(t.roomMembers)
      .set({ lastSeenAt: new Date() })
      .where(eq(t.roomMembers.id, member.id));
    await db
      .update(t.rooms)
      .set({ lastActivityAt: new Date() })
      .where(eq(t.rooms.id, room.id));
    const playback = await state(room);
    if (member.userId && playback.status === "playing" && playback.videoId) {
      const video = await db.query.playlistItems.findFirst({
        where: and(
          eq(t.playlistItems.roomId, room.id),
          eq(t.playlistItems.youtubeVideoId, playback.videoId),
        ),
      });
      if (video)
        await db.transaction(async (tx) => {
          await tx
            .select()
            .from(t.users)
            .where(eq(t.users.id, member.userId!))
            .for("update");
          const [last] = await tx
            .select()
            .from(t.watchHistory)
            .where(
              and(
                eq(t.watchHistory.userId, member.userId!),
                eq(t.watchHistory.roomId, room.id),
                eq(t.watchHistory.youtubeVideoId, video.youtubeVideoId),
              ),
            )
            .orderBy(desc(t.watchHistory.watchedAt))
            .limit(1);
          if (last && Date.now() - +last.watchedAt < 60000)
            await tx
              .update(t.watchHistory)
              .set({
                watchedSeconds: last.watchedSeconds + 20,
                watchedAt: new Date(),
              })
              .where(eq(t.watchHistory.id, last.id));
          else
            await tx.insert(t.watchHistory).values({
              userId: member.userId!,
              roomId: room.id,
              youtubeVideoId: video.youtubeVideoId,
              title: video.title,
              thumbnailUrl: video.thumbnailUrl,
              watchedSeconds: 20,
            });
          await tx.execute(
            sql`delete from watch_history where user_id=${member.userId} and id not in (select id from watch_history where user_id=${member.userId} order by watched_at desc limit 500)`,
          );
        });
    }
  });
  for (const event of [
    "player:play",
    "player:pause",
    "player:seek",
    "player:change-video",
  ]) {
    on(event, async (input) => {
      const { room, member } = await access(socket);
      if (!canControl(member.role, room.controlMode))
        throw new Error("Anda tidak memiliki izin mengontrol video.");
      limit(`player:${room.code}`, 4, 1000);
      const s = await state(room);
      const now = Date.now();
      if (s.status === "playing")
        s.position += Math.max(0, now - s.updatedAt) / 1000;
      if (event === "player:change-video") {
        const id = z
          .string()
          .regex(/^[\w-]{11}$/)
          .parse(input);
        const found = await db.query.playlistItems.findFirst({
          where: and(
            eq(t.playlistItems.roomId, room.id),
            eq(t.playlistItems.youtubeVideoId, id),
          ),
        });
        if (!found) throw new Error("Video tidak ada dalam playlist.");
        s.videoId = id;
        s.position = 0;
        s.status = "paused";
        s.ready.clear();
        s.waiting = true;
      } else if (event === "player:seek") {
        const video = await db.query.playlistItems.findFirst({
          where: and(
            eq(t.playlistItems.roomId, room.id),
            eq(t.playlistItems.youtubeVideoId, s.videoId ?? ""),
          ),
        });
        if (!video) throw new Error("Pilih video terlebih dahulu.");
        s.position = z
          .number()
          .finite()
          .min(0)
          .max(video.durationSec || 21600)
          .parse(input);
      } else {
        if (!s.videoId) throw new Error("Tambahkan video terlebih dahulu.");
        if (event === "player:play" && s.waiting && member.role !== "owner")
          throw new Error(
            "Menunggu kesiapan anggota. Hanya Owner dapat memutar sekarang.",
          );
        s.status = event === "player:play" ? "playing" : "paused";
        s.waiting = false;
      }
      s.updatedAt = now;
      s.dirty = true;
      io.to(room.code).emit("player:state", wire(s));
      return wire(s);
    });
  }
  on("player:ready", async (input) => {
    const { room, member } = await access(socket);
    const s = await state(room);
    if (input !== s.videoId) return;
    s.ready.add(member.id);
    const clients = await io.in(room.code).fetchSockets();
    const ids = new Set(clients.map((c) => c.data.memberId));
    if (
      s.waiting &&
      [...ids].filter((id) => s.ready.has(id)).length >=
        Math.ceil(ids.size * 0.8)
    ) {
      s.waiting = false;
      s.status = "playing";
      s.updatedAt = Date.now();
      s.dirty = true;
      io.to(room.code).emit("player:state", wire(s));
    }
  });
  on("playlist:add", async (input) => {
    const { room, member } = await access(socket);
    if (!canAddVideo(member.role, room.controlMode))
      throw new Error("Anda tidak memiliki izin menambah video.");
    const id = z
      .string()
      .regex(/^[\w-]{11}$/)
      .parse(input);
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${id}&key=${encodeURIComponent(process.env.YOUTUBE_API_KEY!)}`,
    );
    if (!response.ok) throw new Error("YouTube belum dapat dihubungi.");
    const data = await response.json();
    const v = data.items?.[0];
    if (!v?.status?.embeddable || v.status.privacyStatus !== "public")
      throw new Error("Video tidak dapat diputar di aplikasi.");
    if (v.contentDetails.contentRating?.ytRating === "ytAgeRestricted")
      throw new Error("Video dibatasi usia dan tidak dapat ditambahkan.");
    const durationSec = durationSeconds(String(v.contentDetails.duration));
    if (durationSec < 0 || durationSec > 21600)
      throw new Error("Durasi video maksimal 6 jam.");
    await db.transaction(async (tx) => {
      await tx
        .select()
        .from(t.rooms)
        .where(eq(t.rooms.id, room.id))
        .for("update");
      const items = await tx
        .select()
        .from(t.playlistItems)
        .where(eq(t.playlistItems.roomId, room.id))
        .orderBy(asc(t.playlistItems.position));
      if (items.length >= 100) throw new Error("Maksimal 100 video.");
      if (items.at(-1)?.youtubeVideoId === id)
        throw new Error("Video berurutan tidak boleh sama.");
      await tx.insert(t.playlistItems).values({
        roomId: room.id,
        youtubeVideoId: id,
        title: String(v.snippet.title).slice(0, 200),
        channelTitle: String(v.snippet.channelTitle).slice(0, 120),
        thumbnailUrl: v.snippet.thumbnails.medium.url,
        durationSec,
        position: items.length,
        addedByMemberId: member.id,
      });
    });
    const playback = await state(room);
    if (!playback.videoId) {
      playback.videoId = id;
      playback.position = 0;
      playback.status = "paused";
      playback.updatedAt = Date.now();
      playback.ready.clear();
      playback.waiting = true;
      playback.dirty = true;
      io.to(room.code).emit("player:state", wire(playback));
    }
    await broadcast(room.code);
  });
  for (const event of ["playlist:remove", "playlist:reorder"]) {
    on(event, async (input) => {
      const { room, member } = await access(socket);
      if (member.role === "member")
        throw new Error("Hanya Owner dan Moderator dapat mengatur playlist.");
      await db.transaction(async (tx) => {
        await tx
          .select()
          .from(t.rooms)
          .where(eq(t.rooms.id, room.id))
          .for("update");
        const rows = await tx
          .select()
          .from(t.playlistItems)
          .where(eq(t.playlistItems.roomId, room.id));
        if (event === "playlist:remove") {
          const id = z.string().uuid().parse(input);
          const target = rows.find((v) => v.id === id);
          if (!target) throw new Error("Video tidak ditemukan.");
          if (
            (await state(room)).videoId === target.youtubeVideoId &&
            rows.length === 1 &&
            member.role !== "owner"
          )
            throw new Error(
              "Video yang diputar memerlukan pengganti sebelum dihapus.",
            );
          await tx.delete(t.playlistItems).where(eq(t.playlistItems.id, id));
          if ((await state(room)).videoId === target.youtubeVideoId) {
            const s = await state(room);
            s.videoId = null;
            s.status = "paused";
            s.position = 0;
            s.updatedAt = Date.now();
            s.dirty = true;
            io.to(room.code).emit("player:state", wire(s));
          }
        } else {
          const ids = z.array(z.string().uuid()).max(100).parse(input);
          if (
            ids.length !== rows.length ||
            new Set(ids).size !== ids.length ||
            ids.some((id) => !rows.some((v) => v.id === id))
          )
            throw new Error("Urutan playlist sudah berubah. Muat ulang.");
          const ordered = ids.map((id) => rows.find((v) => v.id === id)!);
          if (
            ordered.some(
              (v, i) =>
                i > 0 && v.youtubeVideoId === ordered[i - 1].youtubeVideoId,
            )
          )
            throw new Error("Video berurutan tidak boleh sama.");
          for (let i = 0; i < ids.length; i++)
            await tx
              .update(t.playlistItems)
              .set({ position: i })
              .where(eq(t.playlistItems.id, ids[i]));
        }
      });
      await broadcast(room.code);
    });
  }
  on("chat:send", async (input) => {
    const { room, member } = await access(socket);
    if (member.isMuted) throw new Error("Anda sedang dibisukan.");
    const body = plainText(z.string().trim().min(1).max(300).parse(input));
    if (!body.trim()) throw new Error("Tulis pesan terlebih dahulu.");
    limit(`chat:${member.id}`, 5, 10000);
    await db.transaction(async (tx) => {
      await tx
        .select()
        .from(t.rooms)
        .where(eq(t.rooms.id, room.id))
        .for("update");
      await tx
        .insert(t.chatMessages)
        .values({ roomId: room.id, memberId: member.id, body });
      await tx.execute(
        sql`delete from chat_messages where room_id=${room.id} and id not in (select id from chat_messages where room_id=${room.id} order by created_at desc limit 200)`,
      );
    });
    await broadcast(room.code);
  });
  on("chat:history", async () => {
    const { room } = await access(socket);
    return (
      await db
        .select()
        .from(t.chatMessages)
        .where(eq(t.chatMessages.roomId, room.id))
        .orderBy(desc(t.chatMessages.createdAt))
        .limit(200)
    ).reverse();
  });
  for (const event of [
    "member:mute",
    "member:unmute",
    "member:kick",
    "member:promote",
    "member:demote",
  ]) {
    on(event, async (input) => {
      const { room, member } = await access(socket);
      const id = z.string().uuid().parse(input);
      const target = await db.query.roomMembers.findFirst({
        where: and(eq(t.roomMembers.id, id), eq(t.roomMembers.roomId, room.id)),
      });
      if (
        !target ||
        !canModerate(member.role, target.role) ||
        ((event === "member:promote" || event === "member:demote") &&
          member.role !== "owner")
      )
        throw new Error("Anda tidak memiliki izin untuk tindakan ini.");
      const action = event.split(":")[1] as
        "mute" | "unmute" | "kick" | "promote" | "demote";
      await moderateMedia(room.code, id, action);
      await db.transaction(async (tx) => {
        await tx
          .update(t.roomMembers)
          .set(
            action === "kick"
              ? {
                  blockedUntil: new Date(Date.now() + 1800000),
                  lastSeenAt: new Date(0),
                }
              : action === "promote" || action === "demote"
                ? { role: action === "promote" ? "moderator" : "member" }
                : { isMuted: action === "mute" },
          )
          .where(eq(t.roomMembers.id, id));
        await tx.insert(t.moderationLogs).values({
          roomId: room.id,
          actorMemberId: member.id,
          targetMemberId: id,
          action,
        });
      });
      if (action === "kick") {
        const sockets = await io.in(room.code).fetchSockets();
        for (const client of sockets)
          if (client.data.memberId === id) {
            client.emit("room:kicked");
            client.disconnect(true);
          }
      }
      await broadcast(room.code);
    });
  }
  socket.on("disconnect", () => {
    void (async () => {
      const { code, memberId } = socket.data;
      const sockets = await io.in(code).fetchSockets();
      if (
        !socket.data.left &&
        !sockets.some((s) => s.data.memberId === memberId)
      )
        await db
          .update(t.roomMembers)
          .set({ lastSeenAt: new Date() })
          .where(eq(t.roomMembers.id, memberId));
      await broadcast(code);
    })().catch(() => {});
  });
});
setInterval(() => {
  void (async () => {
    for (const [code, s] of states) {
      if (!s.dirty) continue;
      s.dirty = false;
      try {
        await db
          .update(t.rooms)
          .set({
            currentVideoId: s.videoId,
            playbackStatus: s.status,
            playbackPosition: s.position,
            playbackUpdatedAt: new Date(s.updatedAt),
            lastActivityAt: new Date(),
          })
          .where(eq(t.rooms.code, code));
      } catch {
        s.dirty = true;
      }
    }
    for (const [key, times] of limits)
      if (times.at(-1)! < Date.now() - 60000) limits.delete(key);
  })().catch(() => {});
}, 5000).unref();
const redis = Redis.fromEnv();
setInterval(() => {
  void (async () => {
    const codes = new Set(
      [...io.sockets.sockets.values()]
        .filter((s) => !s.data.left)
        .map((s) => String(s.data.code)),
    );
    for (const code of codes) {
      const room = await db.query.rooms.findFirst({
        where: eq(t.rooms.code, code),
      });
      if (!room) continue;
      const members = await db
        .select({ id: t.roomMembers.id, lastSeenAt: t.roomMembers.lastSeenAt })
        .from(t.roomMembers)
        .where(eq(t.roomMembers.roomId, room.id));
      const values = members.map((m) => ({
        id: m.id,
        online: +m.lastSeenAt > Date.now() - 60000,
      }));
      io.to(code).emit("presence:update", {
        members: values,
        memberCount: values.filter((m) => m.online).length,
      });
    }
  })().catch(() => {});
}, 10000).unref();
let maintenanceRunning = false;
setInterval(() => {
  if (maintenanceRunning) return;
  maintenanceRunning = true;
  void (async () => {
    for (const code of await maintainData(db, redis)) {
      const room = await db.query.rooms.findFirst({
        where: eq(t.rooms.code, code),
      });
      io.to(code).emit(room ? "room:settings-updated" : "room:deleted");
      if (!room) {
        states.delete(code);
        io.in(code).disconnectSockets(true);
      }
    }
  })()
    .catch(() =>
      console.error("Pemeliharaan data belum berhasil; akan dicoba kembali."),
    )
    .finally(() => {
      maintenanceRunning = false;
    });
}, 60000).unref();
http.listen(
  Number(process.env.PORT ?? process.env.REALTIME_PORT ?? 4000),
  process.env.REALTIME_HOST ??
    (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1"),
  () =>
    console.log(
      "WatchSync realtime siap pada port " +
        (process.env.REALTIME_PORT ?? 4000),
    ),
);
process.on("SIGTERM", () => {
  io.close(() => http.close(() => process.exit(0)));
});
