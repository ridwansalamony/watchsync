# Fase 3 — implementasi, pengujian, dan deployment produksi

Status: Task 3.1–3.5 telah diimplementasikan, diuji, dan dipublikasikan. Fase 3 berhenti di sini untuk pemeriksaan pemilik. Web: https://watchsync-ruby.vercel.app; realtime: https://202-155-16-40.sslip.io. Database produksi terpisah telah dimigrasikan tanpa seed. Pemilik mengonfirmasi uji login Google interaktif berhasil; akun tersimpan pada database produksi. Audit CI final mencatat median LCP 2,46 detik dan CLS 0. INP lapangan belum tersedia, sehingga kelulusan seluruh Core Web Vitals pengguna nyata belum diklaim.

## Task

| Task | Hasil |
|---|---|
| 3.1 | Token LiveKit satu jam berdasarkan keanggotaan/mute; publikasi kamera/mikrofon; kamera 480p/720p; push-to-talk Space; izin browser; indikator bicara; satu layar melalui lease Redis atomik dan izin server; fokus layar bersama dengan YouTube kecil; mute/kick melalui Server API. Diuji melalui LiveKit Cloud nyata, perangkat sintetis Chrome. |
| 3.2 | Origin/JWT Socket.IO, pembatasan payload/event, pemeriksaan join, CSP dan header keamanan, sanitasi chat/deskripsi, create 5/jam/IP, password 5/10 menit, search 30/menit/IP, validasi kode room pada helper otorisasi. Server Actions tetap memakai proteksi Origin/CSRF Next.js. |
| 3.3 | Metadata dinamis seluruh halaman publik; OG undangan dari Neon tanpa membuka nama room privat; OG image; robots, sitemap room publik, structured data; noindex room dipertahankan; AVIF/WebP, lazy media/motion, ISR. Hasil Lighthouse dicatat di JSON tersendiri. |
| 3.4 | Suite 13 tes browser lulus; empat player YouTube nyata; Artillery 10 room × 50 klien; pemeriksaan desktop/mobile. Login Google diuji sampai pembentukan redirect dan melalui fixture sesi; login Google interaktif produksi dikonfirmasi berhasil oleh pemilik. |
| 3.5 | Docker Node.js 22, Compose+Caddy, health check, bind produksi, rotasi log, batas RAM awal, Railway config, workflow image manual, template env dan panduan Vercel/VPS selesai disiapkan. Image berhasil dibangun di GitHub Actions dan dipasang pada VPS Ubuntu 24.04. Caddy memperoleh sertifikat HTTPS publik; realtime healthy. Vercel Node.js 22 aktif di region sin1 dan terhubung ke GitHub. Database watchsync_production telah dimigrasikan tanpa seed; namespace Redis produksi terpisah; tiga secret produksi berbeda dari development. |

## Bukti verifikasi

- Build web produksi berhasil pada Node.js 22.23.3; pemeriksaan build realtime berhasil.
- Typecheck kedua workspace dan ESLint lulus.
- Neon web/realtime, Redis baca/tulis, YouTube metadata, secret, dan autentikasi LiveKit Server API berhasil melalui `npm run check:services`.
- Suite Playwright final: 13/13 lulus dalam satu run sekitar 1,3 menit pada build produksi lokal setelah penyelarasan AUTH_URL port 3001. Browser media menggunakan kamera/mikrofon/layar sintetis dengan koneksi LiveKit Cloud nyata; bukan pengujian perangkat fisik atau 50 peserta video.
- Lima sampel empat player YouTube pada run tersebut: drift maksimum sekitar 0.134 detik, di bawah 1,5 detik. Data mentah: [phase-3-drift.json](phase-3-drift.json). Ini bukan bukti statistik 95% seluruh sesi produksi.
- Artillery setelah penggabungan transaksi join: puncak 500 koneksi, 10 room, 500 VU selesai, nol gagal, 6.500 perintah berhasil. Ramp 20 detik, dilanjutkan enam heartbeat/ping tiap 10 detik. Ack gabungan termasuk antrean join memiliki p95 sekitar 2.019 ms dan maksimum 9.782 ms; periode setelah ramp memiliki p95 sekitar 120–150 ms. Jangan menyamakan hasil komputer pengembangan ini dengan kapasitas VPS S.
- Penguji beban memakai processor Artillery yang mengendalikan socket.io-client dengan JWT tiap fixture. Data fixture/token sementara dibersihkan. Hasil: [phase-3-load-summary.json](phase-3-load-summary.json) dan [phase-3-load.json](phase-3-load.json).
- Audit dependensi runtime: `npm audit --omit=dev` nol kerentanan. Audit lengkap masih melaporkan dependensi transitif tooling development (Artillery/Drizzle Kit); tidak dipaksa downgrade atau upgrade major.
- Lighthouse mobile produksi, mesin lokal (snapshot b561922 sebelum perbaikan overflow glow): median LCP 2,69 detik (tiga run 2,58–2,78 detik), performance pada run median 91, accessibility 100, TBT 276 ms, CLS 0. Lingkungan lokal masih menunjukkan variasi CPU/JavaScript. Audit CI final terpisah: median LCP 2,46 detik, performance 97, accessibility 100, TBT 108 ms, CLS 0. Tiga run CI mencatat LCP sekitar 2,55 / 2,46 / 2,28 detik; dua dari tiga run di bawah 2,5 detik. File terpisah mencatat kedua lingkungan, tanpa menyamakan TBT dengan INP atau mengklaim semua kondisi pengguna lulus. [Ringkasan lokal](phase-3-lighthouse-production-summary.json), [ringkasan CI](phase-3-lighthouse-ci-summary.json), [detail CI](phase-3-lighthouse-ci.json). INP lapangan belum tersedia.
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
3. Login Google interaktif sudah dikonfirmasi berhasil oleh pemilik; cek juga perpindahan kepemilikan room tamu ke akun.
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

- Regresi final setelah pemisahan QueryProvider: 13/13 tes lulus dalam satu run. Smoke produksi final juga lulus, termasuk room publik yang terlihat pada desktop/mobile; fixture menggunakan radio Publik karena privasi bawaan adalah Tautan saja. Fixture sudah dihapus.
- Cache room publik dan metadata diinvalidasi setelah create, update, dan delete melalui Server Actions. Bagian beranda di bawah viewport memakai content-visibility; untuk screenshot full-page, paint offscreen dipaksa visible hanya pada proses capture Chromium.

- Pemeriksaan HTML publik dan seluruh script awal beranda tidak menemukan nilai secret produksi. Koneksi Socket.IO produksi dengan JWT tidak sah ditolak, termasuk ketika Origin sesuai aplikasi.

- Pemilik mengonfirmasi berhasil menguji login Google pada URL produksi. Pemeriksaan agregat database memverifikasi persistensi akun/provider tanpa membaca atau menampilkan data profil maupun token.

- Optimasi font tetap menggunakan Inter dan Plus Jakarta Sans melalui next/font/local. Rentang variable dipersempit menjadi Inter 400–700 dan Jakarta 600–800; peta seluruh karakter Latin sumber identik. Pemeriksaan advance/sidebearing pada bobot UI menunjukkan perbedaan pembulatan maksimum sekitar 0,032 piksel pada ukuran 32px. Lisensi OFL dan catatan sumber disertakan.

- Build final dengan font lokal dan perbaikan glow hero berhasil pada Node.js 22. Regresi final 13/13 lulus; beranda produksi diperiksa pada 1280 dan 375 piksel, tanpa overflow horizontal. Screenshot final memperlihatkan seluruh bagian halaman setelah paint offscreen untuk capture.

- Audit CI final: https://github.com/ridwansalamony/watchsync/actions/runs/39111019289 (berhasil), menguji rilis kode 0f5c1b5. Semua run dan median dipertahankan dalam ringkasan, termasuk run pertama yang melewati target LCP.
- Fase 3 selesai pada implementasi/deployment dan pengujian yang didokumentasikan. Pemeriksaan mikrofon/kamera fisik dua perangkat serta pengamatan INP lapangan tetap menjadi checklist pemilik. Tidak ada fase berikutnya yang dimulai.
