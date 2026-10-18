import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { Redis } from "@upstash/redis";
import { database } from "../web/src/db/index";
import { maintainData } from "../realtime/src/maintenance";
import assert from "node:assert/strict";
config({ path: ".env.local", quiet: true });
async function main() {
  const sql = neon(process.env.DATABASE_URL!),
    redis = Redis.fromEnv(),
    db = database();
  const a = crypto.randomUUID(),
    b = crypto.randomUUID(),
    room1 = crypto.randomUUID(),
    room2 = crypto.randomUUID(),
    room3 = crypto.randomUUID();
  try {
    await sql`insert into users(id,name,email) values(${a},'Uji Hapus',${a + "@example.com"}),(${b},'Uji Penerus',${b + "@example.com"})`;
    await sql`insert into rooms(id,code,name,owner_user_id) values(${room1},${"T" + a.replaceAll("-", "").slice(0, 7).toUpperCase()},'Uji Transfer',${a}),(${room2},${"T" + b.replaceAll("-", "").slice(0, 7).toUpperCase()},'Uji Hapus Room',${a})`;
    await sql`insert into rooms(id,code,name,owner_guest_id,last_activity_at) values(${room3},${"T" + room3.replaceAll("-", "").slice(0, 7).toUpperCase()},'Uji Kedaluwarsa',${crypto.randomUUID()},now()-interval '15 days')`;
    await sql`insert into room_members(room_id,user_id,display_name,role) values(${room1},${a},'Uji Hapus','owner'),(${room1},${b},'Uji Penerus','moderator')`;
    await redis.zadd("wsr:account-deletions", {
      score: Date.now() - 1,
      member: a,
    });
    await maintainData(db, redis);
    const [owner] =
      await sql`select owner_user_id from rooms where id=${room1}`;
    assert.equal(owner.owner_user_id, b, "Moderator menerima kepemilikan");
    const removed =
      await sql`select id from rooms where id in (${room2},${room3})`;
    assert.equal(
      removed.length,
      0,
      "Room tanpa penerus dan tamu kedaluwarsa dihapus",
    );
    const user = await sql`select id from users where id=${a}`;
    assert.equal(user.length, 0, "Akun jatuh tempo dihapus");
    console.log(
      "Pemeliharaan: transfer Moderator, hapus akun/room, dan retensi tamu berhasil.",
    );
  } finally {
    await redis.zrem("wsr:account-deletions", a);
    await sql`delete from rooms where id in (${room1},${room2},${room3})`;
    await sql`delete from users where id in (${a},${b})`;
    await db.$client.end();
  }
}
main().catch(() => {
  console.error(
    "Uji pemeliharaan gagal. Periksa database dan Redis development.",
  );
  process.exitCode = 1;
});
