# Fase 3 — implementasi, pengujian, dan kesiapan deployment

Status: implementasi dan deployment produksi aktif. Web: https://watchsync-ruby.vercel.app; realtime: https://202-155-16-40.sslip.io. Database produksi terpisah telah dimigrasikan tanpa seed. Callback Google telah dikonfirmasi disimpan oleh pemilik; login/persetujuan Google secara interaktif tetap perlu diperiksa. Target LCP masih dievaluasi, sehingga kelulusan seluruh Core Web Vitals belum diklaim.

## Task

| Task | Hasil |
|---|---|
| 3.1 | Token LiveKit satu jam berdasarkan keanggotaan/mute; publikasi kamera/mikrofon; kamera 480p/720p; push-to-talk Space; izin browser; indikator bicara; satu layar melalui lease Redis atomik dan izin server; fokus layar bersama dengan YouTube kecil; mute/kick melalui Server API. Diuji melalui LiveKit Cloud nyata, perangkat sintetis Chrome. |
| 3.2 | Origin/JWT Socket.IO, pembatasan payload/event, pemeriksaan join, CSP dan header keamanan, sanitasi chat/deskripsi, create 5/jam/IP, password 5/10 menit, search 30/menit/IP, validasi kode room pada helper otorisasi. Server Actions tetap memakai proteksi Origin/CSRF Next.js. |
| 3.3 | Metadata dinamis seluruh halaman publik; OG undangan dari Neon tanpa membuka nama room privat; OG image; robots, sitemap room publik, structured data; noindex room dipertahankan; AVIF/WebP, lazy media/motion, ISR. Hasil Lighthouse dicatat di JSON tersendiri. |
| 3.4 | Suite 13 tes browser lulus; empat player YouTube nyata; Artillery 10 room × 50 klien; pemeriksaan desktop/mobile. Login Google diuji sampai pembentukan redirect dan melalui fixture sesi; persetujuan/callback interaktif belum dijalankan. |
| 3.5 | Docker Node.js 22, Compose+Caddy, health check, bind produksi, rotasi log, batas RAM awal, Railway config, workflow image manual, template env dan panduan Vercel/VPS selesai disiapkan. Image berhasil dibangun di GitHub Actions dan dipasang pada VPS Ubuntu 24.04. Caddy memperoleh sertifikat HTTPS publik; realtime healthy. Vercel Node.js 22 aktif di region sin1 dan terhubung ke GitHub. Database watchsync_production telah dimigrasikan tanpa seed; namespace Redis produksi terpisah; tiga secret produksi berbeda dari development. |

## Bukti verifikasi

- Build web produksi berhasil pada Node.js 22.23.3; pemeriksaan build realtime berhasil.
- Typecheck kedua workspace dan ESLint lulus.
- Neon web/realtime, Redis baca/tulis, YouTube metadata, secret, dan autentikasi LiveKit Server API berhasil melalui `npm run check:services`.
- Suite Playwright regresi terakhir: 12/13 lulus dalam satu run; satu tes OAuth gagal karena server lokal memakai AUTH_URL port 3000 sementara tes mengharapkan 3001. Setelah AUTH_URL proses server diselaraskan, tes OAuth yang sama lulus saat diulang. Run awal sebelum optimasi juga 13/13 lulus. Browser media menggunakan kamera/mikrofon/layar sintetis dengan koneksi LiveKit Cloud nyata; bukan pengujian perangkat fisik atau 50 peserta video.
- Lima sampel empat player YouTube pada run tersebut: drift maksimum sekitar 0.180 detik, di bawah 1,5 detik. Data mentah: [phase-3-drift.json](phase-3-drift.json). Ini bukan bukti statistik 95% seluruh sesi produksi.
- Artillery setelah penggabungan transaksi join: puncak 500 koneksi, 10 room, 500 VU selesai, nol gagal, 6.500 perintah berhasil. Ramp 20 detik, dilanjutkan enam heartbeat/ping tiap 10 detik. Ack gabungan termasuk antrean join memiliki p95 sekitar 2.019 ms dan maksimum 9.782 ms; periode setelah ramp memiliki p95 sekitar 120–150 ms. Jangan menyamakan hasil komputer pengembangan ini dengan kapasitas VPS S.
- Penguji beban memakai processor Artillery yang mengendalikan socket.io-client dengan JWT tiap fixture. Data fixture/token sementara dibersihkan. Hasil: [phase-3-load-summary.json](phase-3-load-summary.json) dan [phase-3-load.json](phase-3-load.json).
- Audit dependensi runtime: `npm audit --omit=dev` nol kerentanan. Audit lengkap masih melaporkan dependensi transitif tooling development (Artillery/Drizzle Kit); tidak dipaksa downgrade atau upgrade major.
- Lighthouse mobile produksi awal: performance 92, accessibility 100, LCP simulasi sekitar 3,03 detik, TBT 123 ms, CLS 0. Target LCP PRD <2,5 detik belum tercapai pada pengukuran ini. INP lapangan belum tersedia. Hasil ini tidak diberi label lulus Core Web Vitals; optimasi/pengukuran pada hosting final masih diperlukan.
- Screenshot media desktop/mobile diperiksa; tidak ada overflow horizontal. Suite regresi juga memeriksa 18 rute pada 1280 dan 375 piksel.

## Perbaikan yang terverifikasi

- Pemutar YouTube tidak dimuat pada room kosong sehingga request iframe yang tidak diperlukan dan error jaringan saat berpindah halaman dihindari.
- Chat HTML dibersihkan menjadi teks sebelum disimpan; tes regresi memeriksa hasil sanitasi.
- Transaksi join digabung, penulisan lastSeen duplikat dihapus, dan ping waktu tidak menunggu antrean query per room.
- Lease screen share diperoleh/diperpanjang secara atomik; sumber screen tidak ada pada token biasa. Izin lama untuk screen dicabut sebelum diberikan kepada pemegang lease berikutnya.
- Status bicara dipertahankan saat snapshot room diperbarui, dan copy kegagalan perangkat menggunakan Bahasa Indonesia.

## Menjalankan dan memeriksa

Ikuti README untuk development. Pada sesi verifikasi ini port 3000 dipakai proyek lain, sehingga build WatchSync diuji pada `http://localhost:3001` dan realtime pada 4000. Untuk menjalankan development di 3001 secara konsisten, ubah hanya URL nonrahasia `.env.local`: `NEXT_PUBLIC_APP_URL` dan `AUTH_URL` menjadi `http://localhost:3001`, serta `REALTIME_CORS_ORIGIN` menjadi origin yang sama. Kemudian jalankan:

```powershell
npm run dev -w web -- --port 3001
npm run dev:realtime
```

Gunakan dua terminal. Callback Google untuk pengujian interaktif harus memakai port yang sama. Jangan menimpa secret dengan contoh dari template.

```powershell
npm run typecheck
npm run lint
npm run build
npm test
npm run test:load
```

Tes memakai database development dan membuat/menghapus fixture. Port alternatif untuk pengujian diatur dengan `PLAYWRIGHT_BASE_URL`, `LOAD_TARGET`, dan `LOAD_ORIGIN`. Cek kapasitas/kuota sebelum mengulang uji beban pada layanan nyata; skrip beban saat ini membatasi target localhost.

## Checklist pemilik proyek

1. Buka https://watchsync-ruby.vercel.app dan uji dari dua perangkat. Deployment, HTTPS, migrasi produksi, dan callback sudah dikonfigurasi; panduan pemeliharaan ada di [panduan deployment](../deploy/PANDUAN.md).
2. Uji mikrofon/kamera fisik dan berbagi layar pada dua perangkat, termasuk izin ditolak, kualitas 720p, push-to-talk, mute/kick, dan reconnect.
3. Uji login Google interaktif serta perpindahan kepemilikan tamu ke akun.
4. Verifikasi HTTPS aplikasi, `/healthz`, CORS/JWT, monitoring, dan log pada VPS.
5. Migrasi produksi sudah berhasil tanpa seed. Untuk perubahan schema berikutnya, gunakan database produksi terpisah sesuai panduan.
6. Verifikasi performa dan kapasitas kembali pada hosting final. Pengukuran laboratorium bukan INP lapangan atau jaminan kapasitas layanan.

Daftar berkas lengkap: [phase-3-files.md](phase-3-files.md). Tidak ada fase berikutnya yang dimulai.

## Deployment terverifikasi 18 Oktober 2026

- Repository: https://github.com/ridwansalamony/watchsync (main). Secret dipindai sebelum push; file env dan SSH key tidak ikut commit.
- Image realtime: d8c885a, build Actions 39108754168 berhasil. VPS menjalankan image prebuilt, tanpa build pada RAM 1 GB.
- Smoke test produksi: HTTPS, buat/join room, Socket.IO lintas dua sesi, chat, playlist/YouTube metadata, kamera/mikrofon sintetis LiveKit, mobile tanpa overflow, callback OAuth yang benar, dan penghapusan fixture melalui Owner berhasil. Hasil: [phase-3-production-smoke.json](phase-3-production-smoke.json).
- Penggunaan awal teramati: realtime sekitar 142 MiB dan Caddy 14 MiB; ini bukan bukti kapasitas puncak 500 koneksi pada VPS.
- Konfigurasi env VPS hanya memuat kebutuhan realtime, mode 600; secret web tetap di Vercel. Health check Docker, restart unless-stopped, batas RAM, dan rotasi log aktif. Monitor HTTP eksternal belum dikonfigurasi.
- Alias awal yang mengandung nama pemilik dihapus atas permintaan pemilik. URL publik final tidak mengandung nama.
