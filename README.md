# WatchSync Room

Aplikasi Next.js 15 dengan PostgreSQL Neon, Auth.js v5, dan server Socket.IO terpisah. Fase 3 menambahkan LiveKit, penguatan keamanan, SEO, pengujian browser dan beban, serta berkas deployment. Deployment publik menunggu konfigurasi hosting pemilik proyek. Lihat [panduan deployment lengkap](deploy/PANDUAN.md) dan [laporan Fase 3](reports/phase-3.md).

## Menjalankan development

Gunakan Node.js 22 LTS. Isi kredensial pada file .env.local di root mengikuti .env.example. Web, CLI migrasi, dan realtime membaca file root tersebut; jangan menyalin secret ke variabel NEXT_PUBLIC_.

Jalankan dari root:

~~~powershell
npm install
npm run check:services
npm run db:migrate
~~~

Terminal pertama:

~~~powershell
npm run dev
~~~

Terminal kedua:

~~~powershell
npm run dev:realtime
~~~

Buka http://localhost:3000. Gunakan localhost secara konsisten karena callback OAuth dan Origin Socket.IO dikonfigurasi untuk host tersebut. Realtime memakai port 4000 dan health check http://localhost:4000/healthz.

Google OAuth: JavaScript origin http://localhost:3000; redirect URI http://localhost:3000/api/auth/callback/google. Akun penguji harus sesuai konfigurasi Audience Google Cloud.

## Database development

~~~powershell
npm run db:generate
npm run db:migrate
npm run db:seed
~~~

Migrasi awal membuat 11 tabel sesuai Bab 10. Seed bersifat khusus development, berisi contoh Bab 9 dengan email example.com, anggota offline, dan metadata contoh. Data tersebut tidak memberikan sesi login atau hak akses kepada pengguna nyata. Password contoh room berpassword adalah nonton. Jangan menjalankan seed pada database produksi.

## Verifikasi

~~~powershell
npm run typecheck
npm run lint
npm run build
npm test
~~~

Tes Fase 2 memerlukan kedua server aktif serta kredensial database development. Tes membuat data pengujian dan menggunakan JWT fixture untuk memeriksa dashboard; fixture tidak menggantikan verifikasi login Google interaktif. Tes prototipe Fase 1 tetap disimpan sebagai referensi dan dikecualikan dari suite aktif karena login/data lokal sudah diganti.

Build produksi lokal dijalankan dengan npm run start -w web dan npm run start -w realtime pada dua terminal. Hentikan server development sebelum memakai port yang sama.

## Batas fase

- Login Google, identitas tamu, room, playlist, chat, presence, dan moderasi menggunakan server/database.
- Cookie tamu bertanda tangan berlaku 30 hari; JWT realtime 5 menit; undangan privat 24 jam.
- Upstash diperlukan untuk rate limit password, cache pencarian 10 menit, dan antrean hapus akun 30 hari. Token harus memiliki akses baca/tulis.
- Worker pemeliharaan berjalan setiap menit selama layanan realtime aktif. Room akun yang dihapus dipindahkan ke Moderator tertua atau dihapus jika tidak ada Moderator. Room tamu tidak aktif 14 hari dibersihkan.
- YouTube hanya mendukung playback rate yang dilaporkan player. Koreksi memakai 0,97/1,03 jika tersedia, dengan fallback seek. Autoplay mengikuti kebijakan browser.
- LiveKit memakai token satu jam, kamera 480p/720p, push-to-talk, dan satu screen sharing per room. Kamera/mikrofon baru diakses setelah pengguna mengaktifkannya.
- Rate limit: pembuatan room 5/jam/IP, password 5/10 menit, pencarian 30/menit/IP.
- SEO: metadata/OG, sitemap room publik, robots, ISR, dan noindex room. Motion features, Socket.IO client, Auth.js client, dan daftar room publik dimuat sesuai kebutuhan.
- Docker, Compose+Caddy, dan workflow image tersedia. Aplikasi aktif di https://watchsync-ruby.vercel.app dan realtime VPS di https://202-155-16-40.sslip.io. Migrasi database produksi terpisah berhasil tanpa seed; Redis memakai namespace produksi.

## Referensi

- [PRD](PRD.md), [instruksi proyek](AGENTS.md), [panduan desain](SKILL.md).
- [Laporan Fase 1](reports/phase-1.md), [verifikasi Fase 1](reports/verification.md).
- [Laporan Fase 2](reports/phase-2.md).

## Runtime Node.js pada mesin ini

Runtime Node.js 22.23.3 portabel tersedia di .runtime/node-v22.23.3-win-x64/node.exe dan dipakai untuk verifikasi akhir. Folder tersebut diabaikan Git. Node.js global tidak diganti. Untuk memilih runtime portabel di satu sesi PowerShell, jalankan dari root:

~~~powershell
$env:Path = "$((Resolve-Path .runtime/node-v22.23.3-win-x64).Path);$env:Path"
node --version
~~~

Setelah itu jalankan perintah npm di atas pada terminal yang sama. Pada mesin lain, pasang Node.js 22 LTS terlebih dahulu.

## Verifikasi Fase 3

Gunakan database development untuk tes. Browser media memakai perangkat sintetis Chrome tetapi koneksi LiveKit Cloud nyata. Tes drift memakai YouTube IFrame nyata. Login/persetujuan Google tetap memerlukan verifikasi interaktif pemilik akun.

```powershell
npm run test:phase3
npm run test:load
```

Skrip beban memakai Artillery dengan processor Socket.IO, 10 room dan 50 identitas unik per room. Target dibatasi localhost agar tidak membebani hosting tanpa konfigurasi khusus. `LOAD_TARGET` dan `LOAD_ORIGIN` dapat disesuaikan dengan port lokal. Data fixture dan token sementara dibersihkan.

Untuk deployment Vercel + VPS Rumahweb, ikuti [deploy/PANDUAN.md](deploy/PANDUAN.md), mulai dari informasi VPS dan repository. Build image melalui Actions sehingga VPS S hanya menarik dan menjalankan image.
