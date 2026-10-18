# Fase 2 — catatan implementasi dan verifikasi

Status: implementasi Task 2.1–2.10 selesai. Token Upstash telah diperbarui oleh pemilik proyek dan pemeriksaan baca/tulis berhasil. Fase 3 belum dimulai. Login Google interaktif serta alur penggabungan melalui callback OAuth perlu diverifikasi oleh pemilik akun; pengujian otomatis memeriksa JWT fixture dan pembentukan redirect OAuth, tanpa melakukan login ke akun Google pengguna.

## Task

| Task | Implementasi | Verifikasi saat ini |
|---|---|---|
| 2.1 | Skema 11 tabel Bab 10, konfigurasi Drizzle, migrasi SQL, seed development | Migrasi dan seed berhasil ke Neon |
| 2.2 | Auth.js Google, JWT, Drizzle Adapter, cookie tamu, penggabungan identitas, middleware dashboard Node.js | JWT fixture, proteksi tamu, dan helper penggabungan identitas lulus; login Google/callback interaktif belum diuji |
| 2.3 | Server Actions create/join, kode unik, bcrypt cost 12, lock kapasitas, blokir kick, rate limit password | Create/join tanpa password lulus; password dan undangan privat lulus |
| 2.4 | Dashboard dari Neon, simpan room, CRUD playlist, profil, riwayat, antrean hapus akun | Buat playlist, reload, dan ubah profil lulus; jadwal 30 hari dan worker retensi/transfer kepemilikan lulus |
| 2.5 | Socket.IO, JWT audience/issuer, pemeriksaan peran database, state player, 4 event/detik, persistensi 5 detik | Dua sesi tersambung; penolakan kontrol Member lulus |
| 2.6 | YouTube IFrame, lima ping dengan rata-rata tiga sampel RTT terendah, koreksi drift, readiness 80% | Kode dan typecheck; drift nyata empat browser dijadwalkan Task 3.4 |
| 2.7 | Pencarian/metadata YouTube, validasi embeddable, playlist realtime, batas 100 video/6 jam, filter usia, reorder dan duplikasi | Metadata dan playlist:add lulus; cache pencarian 10 menit lulus |
| 2.8 | Chat persisten 200 pesan, rate 5/10 detik, heartbeat presence, grace 60 detik, indikator mengetik, mute/kick/promosi, log moderasi | Chat lintas sesi, persistensi reload, proteksi Owner, dan penolakan chat saat mute lulus |
| 2.9 | Pengaturan/delete dengan otorisasi server, notifikasi internal bertanda tangan, undangan privat | Pengaturan tersimpan dan link undangan dibuat; join berpassword dan penghapusan room lulus |
| 2.10 | Zustand diisi data/event nyata, bootstrap dashboard, daftar room publik cache 30 detik, player tiruan diganti | Alur tamu dan dashboard diuji; 18 rute desktop/mobile diperiksa |

## Pemeriksaan layanan

npm run check:services memeriksa kedua koneksi Neon, YouTube metadata, panjang/keunikan tiga secret, dan perintah Redis PING/SET/GET/DEL tanpa mencetak nilai kredensial. Pemeriksaan HTTP 200 saja tidak cukup untuk Upstash; respons perintah Redis harus berhasil.

Hasil akhir: Neon web/realtime berhasil, YouTube berhasil, tiga secret memenuhi pemeriksaan awal, Upstash PING/SET/GET/DEL berhasil. Kredensial tidak dicetak oleh skrip.

## Batas teknis

YouTube dapat mengabaikan playback rate yang tidak didukung. Klien memeriksa getAvailablePlaybackRates sebelum memakai 0,97 atau 1,03 dan memakai seek bila perlu. Ini batas API, bukan jaminan setiap video mendukung semua rate. Referensi: https://developers.google.com/youtube/iframe_api_reference.

Middleware memakai runtime Node.js yang stabil pada Next.js 15.5 agar dependensi JWT tidak memakai API kompresi yang tidak tersedia di Edge. Referensi: https://nextjs.org/blog/next-15-5#nodejs-middleware-stable.

Build awal memakai Node.js 24.21.0. Verifikasi runtime akhir memakai Node.js 22.23.3 untuk web, Socket.IO, Playwright, dan kedua skrip pengujian database. Runtime portabel diunduh dari nodejs.org dan checksum SHA-256 dicocokkan dengan SHASUMS256.txt resmi. Folder .runtime diabaikan Git; instalasi Node.js global pengguna tidak diubah.

## Checklist pemilik proyek

1. Jalankan npm run check:services untuk memeriksa konfigurasi lokal.
2. Login Google melalui /masuk dengan akun penguji dan periksa callback.
3. Buat room sebagai tamu, kemudian login Google dan pastikan kepemilikan berpindah ke akun.
4. Uji dua browser: chat, ganti video, play/pause/seek, playlist, dan moderasi.
5. Uji simpan room, CRUD playlist, profil, riwayat, dan tampilan mobile.

Jalankan aplikasi dan kedua layanan sesuai README. Belum ada deployment atau koneksi LiveKit.

## Hasil verifikasi

- npm run build: web Next.js 15.5.28 dan pemeriksaan build realtime berhasil, tanpa peringatan Edge Runtime setelah middleware memakai Node.js.
- npm run typecheck: kedua workspace berhasil.
- npm run lint: berhasil tanpa peringatan.
- npm audit --omit=dev: 0 kerentanan.
- npm test: 6 tes lulus (5 alur browser dan 1 pemeriksaan kebijakan durasi); audit 18 rute pada lebar 1280 dan 375 piksel tidak menemukan overflow horizontal atau pageerror.
- npx tsx scripts/test-maintenance.ts: penghapusan akun, transfer ke Moderator, penghapusan room tanpa penerus, dan retensi room tamu berhasil. Data fixture worker dibersihkan.
- Screenshot dashboard dan room desktop/mobile diperiksa secara visual dan disimpan di reports/screenshots/phase-2-*.png.

Tes penambahan video memanggil YouTube Data API nyata. Tes redirect Google mencegat tujuan accounts.google.com untuk memeriksa parameter callback/client ID; tidak menyelesaikan persetujuan Google. Tidak ada klaim bahwa drift empat player nyata atau beban 500 koneksi sudah diuji; itu tetap Task 3.4.

Daftar file dibuat/diubah/diganti tersedia di [phase-2-files.md](phase-2-files.md).

## Perbaikan pada verifikasi akhir

Respons bootstrap yang terlambat tidak lagi menimpa snapshot room yang lebih baru. Tes undangan sengaja menunda respons bootstrap untuk memeriksa kasus ini. Pemeriksaan room menampilkan skeleton selama pemuatan, bukan status tidak ditemukan sebelum request selesai. Batas 50 anggota juga diperiksa saat koneksi realtime bergabung. Video pertama dipilih otomatis, Owner dapat memakai Putar Sekarang saat menunggu readiness, dan penolakan kontrol menerbitkan sync:rejected.

Uji npx tsx scripts/test-identity.ts berhasil memeriksa transfer kepemilikan tamu, penggabungan anggota yang sudah ada, pemindahan referensi chat/video, dan idempotensi. Penggabungan dijalankan dalam satu transaksi database. Fixture pengujian dibersihkan.

Verifikasi akhir setelah seluruh perbaikan: npm test lulus 6/6 dalam 43,5 detik pada Node.js 22.23.3, npm run lint tanpa peringatan, dan build kedua workspace berhasil. Pengujian undangan dengan respons bootstrap tertunda juga lulus.
