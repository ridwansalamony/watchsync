import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { SignJWT } from "jose";
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { io } from "socket.io-client";
config({ path: ".env.local", quiet: true });
const sql = neon(process.env.DATABASE_URL),
  root = "test-results-load";
const roomIds = [],
  rooms = [],
  members = [],
  tokens = [];
const origin = process.env.LOAD_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const target = process.env.LOAD_TARGET ?? "http://localhost:4000";
const smoke = process.argv.includes("--smoke");
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(target))
  throw new Error(
    "Skrip ini dibatasi untuk layanan lokal. Gunakan konfigurasi terpisah untuk hosting.",
  );
await mkdir(root, { recursive: true });
await mkdir("reports", { recursive: true });
let monitoring,
  peakConnections = 0,
  peakRooms = 0;
try {
  for (let r = 0; r < 10; r++) {
    const id = randomUUID(),
      code =
        "L" +
        randomUUID()
          .replace(/[^a-f]/g, "")
          .slice(0, 7)
          .toUpperCase()
          .padEnd(7, "A");
    roomIds.push(id);
    rooms.push({ id, code, name: `Uji Beban ${r}` });
    for (let m = 0; m < 50; m++) {
      const memberId = randomUUID();
      members.push({
        id: memberId,
        room_id: id,
        guest_id: randomUUID(),
        display_name: `Beban ${r}-${m}`,
      });
      tokens.push(
        await new SignJWT({ code, memberId })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuer("watchsync-web")
          .setAudience("watchsync-realtime")
          .setExpirationTime("10m")
          .sign(new TextEncoder().encode(process.env.REALTIME_JWT_SECRET)),
      );
    }
  }
  await sql`insert into rooms(id,code,name) select id,code,name from json_to_recordset(${JSON.stringify(rooms)}::json) as x(id uuid,code text,name text)`;
  await sql`insert into room_members(id,room_id,guest_id,display_name) select id,room_id,guest_id,display_name from json_to_recordset(${JSON.stringify(members)}::json) as x(id uuid,room_id uuid,guest_id text,display_name text)`;
  await new Promise((resolve, reject) => {
    const s = io(target, {
      auth: { token: tokens[0] },
      extraHeaders: { Origin: origin },
      reconnection: false,
      timeout: 10000,
    });
    s.once("connect", () => {
      s.disconnect();
      console.log("Preflight JWT/fixture berhasil.");
      resolve();
    });
    s.once("connect_error", (e) => {
      s.disconnect();
      reject(e);
    });
  });
  await writeFile(`${root}/tokens.csv`, tokens.join("\n"));
  await writeFile(
    `${root}/processor.mjs`,
    `
import { io } from 'socket.io-client';
import { jwtVerify } from 'jose';
export async function exercise(context, events) {
  await jwtVerify(context.vars.token, new TextEncoder().encode(process.env.REALTIME_JWT_SECRET));
  const socket = io(${JSON.stringify(target)}, {auth:{token:context.vars.token},extraHeaders:{Origin:${JSON.stringify(origin)}},transports:['websocket'],forceNew:true,reconnection:false,timeout:30000});
  async function command(event,data) { const start=Date.now(); const r=await socket.timeout(60000).emitWithAck(event,data); if(!r.ok)throw new Error(r.error); events.emit('histogram','socketio.ack_ms',Date.now()-start); events.emit('counter','socketio.commands',1); }
  try {
    await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject)});
    events.emit('counter','socketio.connections',1);
    await command('room:join',{});
    for(let i=0;i<${smoke ? 1 : 6};i++){await new Promise(r=>setTimeout(r,${smoke ? 1000 : 10000}));await command('presence:update',{});await command('sync:ping',0);}
  } finally {socket.disconnect();}
}
`,
  );
  const scenario = {
    config: {
      target,
      processor: "processor.mjs",
      phases: [{ duration: smoke ? 1 : 20, arrivalCount: smoke ? 1 : 500 }],
      payload: {
        path: "tokens.csv",
        fields: ["token"],
        order: "sequence",
        skipHeader: false,
      },
      http: { pool: 1 },
    },
    scenarios: [{ engine: "http", flow: [{ function: "exercise" }] }],
  };
  await writeFile(`${root}/scenario.json`, JSON.stringify(scenario));
  monitoring = setInterval(() => {
    void fetch(`${target}/healthz`)
      .then((r) => r.json())
      .then((s) => {
        peakConnections = Math.max(peakConnections, s.connections ?? 0);
        peakRooms = Math.max(peakRooms, s.rooms ?? 0);
      })
      .catch(() => {});
  }, 1000);
  const code = await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        "node_modules/artillery/bin/run",
        "run",
        `${root}/scenario.json`,
        "--output",
        "reports/phase-3-load.json",
      ],
      {
        stdio: "inherit",
        env: { ...process.env, ARTILLERY_DISABLE_TELEMETRY: "true" },
      },
    );
    child.on("error", reject);
    child.on("exit", resolve);
  });
  const output = JSON.parse(
    await readFile("reports/phase-3-load.json", "utf8"),
  );
  const counters = output.aggregate?.counters ?? {};
  const result = {
    peakConnections,
    peakRooms,
    completed: counters["vusers.completed"] ?? 0,
    failed: counters["vusers.failed"] ?? 0,
    engine: "Artillery dengan processor Socket.IO",
    rooms: 10,
    membersPerRoom: 50,
    duration: "20 detik ramp + 60 detik heartbeat/ping",
  };
  await writeFile(
    "reports/phase-3-load-summary.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result));
  if (
    code ||
    result.completed !== (smoke ? 1 : 500) ||
    result.failed ||
    (!smoke && (peakConnections < 500 || peakRooms < 10))
  )
    process.exitCode = 1;
} finally {
  clearInterval(monitoring);
  if (roomIds.length)
    await sql`delete from rooms where id = any(${roomIds}::uuid[])`;
  await rm(root, { recursive: true, force: true });
}
