# Hasil verifikasi Fase 1

Tanggal: 16 Oktober 2026. Lingkungan lokal Windows, Node.js 24.21.0, npm 12.1.0, Chrome headless 155. Workspace realtime mendeklarasikan Node.js 22 LTS dan tidak dijalankan pada Fase 1.

## Pemeriksaan kode dan build

| Pemeriksaan               | Hasil                                                       |
| ------------------------- | ----------------------------------------------------------- |
| `npm run typecheck`       | Lulus, TypeScript strict tanpa error                        |
| `npm run lint`            | Lulus, tanpa error atau warning                             |
| `npm run build`           | Lulus, Next.js 15.5.28, seluruh 18 rute Bab 3 terdaftar     |
| `npm test`                | 8 skenario lulus, 37,8 detik pada run penyerahan            |
| Audit dependency produksi | `npm audit --omit=dev`: 0 advisory pada dependency produksi |

Skenario Playwright mencakup:

1. Respons HTTP 200 dan tidak ada error runtime JavaScript pada seluruh 18 rute; tidak ada Lorem Ipsum atau halaman pengembangan.
2. Pembuatan room tamu, validasi nama, penambahan video mock, play/pause tiruan, chat sebagai teks aman, dan persistensi setelah refresh.
3. Pembatasan Member dan anggota dibisukan; Moderator tetap dapat menambah video tetapi tidak mengontrol pemutaran pada mode owner_only; moderasi dan perlindungan Owner.
4. Pengurutan playlist dengan keyboard, penyimpanan profil, persistensi nama, dan penghapusan seluruh riwayat.
5. Kode tidak valid, room privat yang memerlukan undangan, dan room tidak ditemukan.
6. Tampilan pada lebar 375px, 768px, dan 1280px untuk delapan rute yang mewakili seluruh keluarga layout; tidak ada overflow halaman. Posisi kontrol media di atas navigasi bawah juga diperiksa.
7. Axe pada seluruh 18 rute, dengan tag WCAG 2 A, WCAG 2 AA, dan WCAG 2.1 AA: tidak ada pelanggaran otomatis yang terdeteksi.
8. Pengaturan password dan mode kontrol, penolakan password salah, akses Member pada mode everyone, serta penghapusan room yang memerlukan pengetikan ulang nama.

Penekanan keyboard pada pengujian drag-and-drop memakai durasi 100ms agar meniru input manusia dan memberi sensor keyboard dnd-kit waktu untuk memasang listener-nya. Pengujian menunggu status aksesibilitas dan perubahan urutan yang sebenarnya.

## Lighthouse beranda

Build produksi di `http://127.0.0.1:3000`, mode mobile dengan simulasi throttling Lighthouse:

| Ukuran                                 | Hasil                                    |
| -------------------------------------- | ---------------------------------------- |
| Performa                               | 91 / 100                                 |
| Aksesibilitas                          | 100 / 100                                |
| Largest Contentful Paint               | 3,2 detik                                |
| Cumulative Layout Shift                | 0,002                                    |
| Total Blocking Time                    | 180ms                                    |
| First Load JS beranda, laporan Next.js | 143kB, turun dari 171kB sebelum optimasi |

File pengukuran lengkap: [lighthouse-home.json](lighthouse-home.json).

**Target LCP PRD di bawah 2,5 detik belum tercapai pada simulasi mobile ini.** Catatan ini tetap terbuka untuk optimasi produksi Task 3.3. Fase 1 menyelesaikan UI/dummy, responsivitas, motion, dan kontras; hasil ini tidak diklaim sebagai kelulusan seluruh target performa produksi. INP pengguna nyata belum diukur; TBT bukan pengganti pengukuran INP. Pengujian beban serta sinkronisasi lintas browser belum dilakukan karena termasuk Fase 3 dan memerlukan integrasi Fase 2.

Hero kini dirender melalui Server Component tanpa menunggu animasi awal, preload font nonkritis ditunda, dan Framer Motion memakai LazyMotion/domAnimation. Perbaikan menjaga fitur UI dan stack PRD.

## Catatan dependency

Next.js diperbarui dalam major 15 ke 15.5.28. PostCSS 8.5.30 dan sharp 0.35.5 ditetapkan melalui overrides kompatibel untuk menutup advisory dependency produksi.

Audit lengkap terakhir masih melaporkan lima temuan high pada satu rantai tooling lint: eslint-config-next / plugin Next → fast-glob → micromatch → braces. Registry saat diperiksa menyediakan braces 3.0.3, yang masih tercakup advisory. Tidak dilakukan downgrade ESLint Next ke major yang berbeda atau `audit fix --force`. Temuan tooling ini perlu ditinjau kembali sebelum rilis; audit dependency produksi terpisah tetap 0.

## Pratinjau visual

- [Beranda desktop](screenshots/home-desktop.png)
- [Beranda mobile](screenshots/home-mobile.png)
- [Dashboard desktop](screenshots/dashboard-desktop.png)
- [Room desktop](screenshots/room-desktop.png)
- [Room mobile](screenshots/room-mobile.png)

Pratinjau diperiksa untuk susunan konten, pemotongan teks, ruang antar elemen, navigasi, dan penempatan panel. Otomasi tidak menggantikan seluruh evaluasi keyboard/screen reader atau pengujian perangkat fisik. Silakan gunakan checklist manual pada laporan Fase 1 untuk tinjauan pemilik produk.
