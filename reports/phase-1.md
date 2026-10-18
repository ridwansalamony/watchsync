# Laporan Fase 1

Lingkup: Task 1.1 sampai Task 1.6 Bab 11 PRD. Semua fitur pada fase ini adalah prototipe lokal. Fase 2 belum dimulai.

## Task yang selesai

| Task | Hasil                                                                                                                                                                                                                                                                                              |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1  | npm workspaces `web/`, `realtime/`, `shared/`; Next.js 15, React 19, TypeScript strict; Tailwind v4; token warna Bab 4; Plus Jakarta Sans, Inter, dan JetBrains Mono melalui next/font; komponen shadcn/Radix yang dikustomisasi; Lucide, Framer Motion, Sonner, Zustand, TanStack Query, dan Zod. |
| 1.2  | Root layout dan providers; navbar mengambang serta footer publik; sidebar persisten dashboard dan Sheet mobile; header room serta panel Chat/Playlist/Anggota dengan sidebar desktop 360px.                                                                                                        |
| 1.3  | Sembilan halaman publik lengkap, termasuk form buat/gabung, landing undangan, login demo, tentang, bantuan berkelompok, privasi, dan syarat. Validasi visual serta kondisi tidak ditemukan, privat, password salah, dan kapasitas tersedia.                                                        |
| 1.4  | Enam rute dashboard lengkap; ringkasan, room tersimpan, playlist, detail playlist drag-and-drop, riwayat, dan profil. Simulasi buat/ubah/hapus playlist, muat playlist ke room, hapus riwayat, preferensi, keluar, hapus akun, dan reset demo.                                                     |
| 1.5  | Ruang nonton dengan thumbnail dan kontrol tiruan; simulasi media; chat aman sebagai teks dengan emoji; pencarian/URL metadata lokal; playlist dan nama pengusul; anggota online, peran, dan moderasi berkonfirmasi; halaman pengaturan dan kelola anggota dengan pembatasan peran.                 |
| 1.6  | Tampilan desktop/tablet/mobile, kontrol media mobile di atas navigasi bawah, transisi halaman 300ms, Sheet 250ms, reduced motion, loading/empty/error states, fokus keyboard, contrast check, dan pengujian browser.                                                                               |

## Seluruh rute Bab 3

| Publik               | Dashboard                   | Room                      |
| -------------------- | --------------------------- | ------------------------- |
| `/`                  | `/dashboard`                | `/room/[kode]`            |
| `/buat-room`         | `/dashboard/room-tersimpan` | `/room/[kode]/pengaturan` |
| `/gabung`            | `/dashboard/playlist`       | `/room/[kode]/anggota`    |
| `/gabung/[kode]`     | `/dashboard/playlist/[id]`  |                           |
| `/masuk`             | `/dashboard/riwayat`        |                           |
| `/tentang`           | `/dashboard/profil`         |                           |
| `/bantuan`           |                             |                           |
| `/kebijakan-privasi` |                             |                           |
| `/syarat-layanan`    |                             |                           |

Route group `(public)` tidak menambah segmen URL. Halaman pengaturan menggunakan opsi halaman yang diperbolehkan PRD, dengan Dialog untuk konfirmasi dan pengelolaan peran.

## Cara verifikasi manual

1. Jalankan `npm install`, lalu `npm run dev` dari root. Buka http://127.0.0.1:3000.
2. Coba beranda, menu publik, FAQ, dan layout pada desktop, tablet, serta ponsel.
3. Buat room sebagai tamu. Coba form kosong, nama terlalu pendek, pilihan privasi, dan password opsional.
4. Pada room kosong, tambahkan video dari pencarian demo dan URL contoh di README. Coba play/pause, seek, video berikutnya, dan urutan playlist dengan pointer atau keyboard.
5. Kirim chat berisi teks, emoji, dan tautan. Refresh untuk memastikan perubahan lokal tetap tersimpan.
6. Masuk melalui tombol Google demo, lalu gabung `NG7KQ2XR` sebagai Rizky. Buka alat verifikasi peran dan coba Member, Budi yang dibisukan, Ayu sebagai Moderator, serta Rizky sebagai Owner.
7. Pastikan Member tidak dapat mengubah pengaturan atau urutan playlist. Moderator hanya bisa memoderasi Member, dan Owner tidak bisa dikeluarkan.
8. Coba simpan room/playlist, kelola playlist pribadi, muat playlist ke room, hapus riwayat, simpan profil, serta ubah preferensi.
9. Coba pengaturan room dan password; penghapusan room meminta pengetikan ulang nama. Hapus akun meminta kata `HAPUS`.
10. Coba navigasi keyboard, fokus dialog, dan reduced motion dari pengaturan sistem/browser. Reset data demo melalui Profil bila ingin mulai ulang.

## Batas implementasi

- Login Google adalah akun demo lokal, bukan OAuth. Dashboard memiliki gate sesi demo, bukan middleware otorisasi produksi.
- Tidak ada database, migrasi, server Socket.IO, Redis, koneksi LiveKit, akses perangkat, atau pemanggilan YouTube API.
- Password memakai digest lokal hanya untuk simulasi UI. Hash bcrypt dan rate limiting yang otoritatif tetap menjadi tugas backend.
- Kontrol video tidak memutar video YouTube nyata dan tidak menyinkronkan browser lain.
- Owner dan Moderator dapat menambah/mengelola antrean. Member menambah video saat mode everyone. Penggantian seluruh antrean melalui muat playlist dibatasi pada Owner/Moderator agar Member tidak memperoleh kemampuan hapus/ubah antrean yang dilarang Bab 5. Kontrol play/pause/seek tetap mengikuti mode Bab 6.I.
- Notifikasi serta kualitas kamera tersimpan sebagai preferensi; pengiriman notifikasi/media nyata belum dilakukan.
- Salinan halaman hukum adalah rancangan produk dalam PRD yang perlu ditinjau sebelum peluncuran publik.
- Metadata dasar disediakan. SEO lengkap, OG dinamis, robots/sitemap, keamanan server, pengujian beban, dan deployment tetap mengikuti fase PRD berikutnya.
- Lingkungan verifikasi menyediakan Node 24.21.0; workspace realtime mendeklarasikan Node 22 LTS sesuai PRD dan belum dijalankan. README mengarahkan penggunaan Node 22 LTS.

Lihat [daftar-file.md](daftar-file.md), [preflight.md](preflight.md), [verification.md](verification.md), dan [assets.md](assets.md) untuk rincian tambahan.
