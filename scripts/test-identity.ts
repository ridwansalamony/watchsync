import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { database } from "../web/src/db/index";
import { mergeGuestIdentity } from "../web/src/lib/merge-guest";
import assert from "node:assert/strict";
config({ path: ".env.local", quiet: true });
async function main() {
  const sql = neon(process.env.DATABASE_URL!),
    uid = crypto.randomUUID(),
    guest = crypto.randomUUID(),
    a = crypto.randomUUID(),
    b = crypto.randomUUID(),
    guestMember = crypto.randomUUID(),
    userMember = crypto.randomUUID();
  try {
    await sql`insert into users(id,name,email) values(${uid},'Uji Gabung Akun',${uid + "@example.com"})`;
    await sql`insert into rooms(id,code,name,owner_guest_id) values(${a},${("T" + a.replaceAll("-", "").slice(0, 7)).replace(/[01]/g, "Z").toUpperCase()},'Uji Gabung Identitas',${guest}),(${b},${("T" + b.replaceAll("-", "").slice(0, 7)).replace(/[01]/g, "Z").toUpperCase()},'Uji Transfer Identitas',${guest})`;
    await sql`insert into room_members(id,room_id,guest_id,display_name,role) values(${guestMember},${a},${guest},'Tamu Owner','owner')`;
    await sql`insert into room_members(id,room_id,user_id,display_name,role) values(${userMember},${a},${uid},'Anggota Akun','member')`;
    await sql`insert into room_members(room_id,guest_id,display_name,role) values(${b},${guest},'Tamu Owner','owner')`;
    await sql`insert into chat_messages(room_id,member_id,body) values(${a},${guestMember},'Pesan pengujian gabung akun')`;
    await sql`insert into playlist_items(room_id,youtube_video_id,title,position,added_by_member_id) values(${a},'aqz-KE-bpKQ','Video pengujian',0,${guestMember})`;
    await mergeGuestIdentity(uid, guest);
    await mergeGuestIdentity(uid, guest);
    const owners =
      await sql`select owner_user_id,owner_guest_id from rooms where id in (${a},${b})`;
    assert(
      owners.every((r) => r.owner_user_id === uid && r.owner_guest_id === null),
    );
    const members =
      await sql`select id,user_id,guest_id,role from room_members where room_id in (${a},${b})`;
    assert.equal(members.length, 2);
    assert(
      members.every(
        (r) => r.user_id === uid && r.guest_id === null && r.role === "owner",
      ),
    );
    const [message] =
      await sql`select member_id from chat_messages where room_id=${a}`;
    assert.equal(message.member_id, userMember);
    const [video] =
      await sql`select added_by_member_id from playlist_items where room_id=${a}`;
    assert.equal(video.added_by_member_id, userMember);
    console.log(
      "Identitas: transfer kepemilikan, gabung keanggotaan, referensi chat/video, dan idempotensi berhasil.",
    );
  } finally {
    await sql`delete from rooms where id in (${a},${b})`;
    await sql`delete from users where id=${uid}`;
    await database().$client.end();
  }
}
main().catch(() => {
  console.error(
    "Uji penggabungan identitas gagal. Periksa database development.",
  );
  process.exitCode = 1;
});
