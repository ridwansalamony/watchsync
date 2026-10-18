# Font lokal untuk pengiriman lebih ringan

Inter dan Plus Jakarta Sans tetap dimuat melalui `next/font`, menggunakan glyph Latin yang sama dengan file Google Fonts pada build sebelumnya. Rentang axis bobot dipersempit dengan fontTools 4.67.0 (`fontTools.varLib.instancer.instantiateVariableFont`), tanpa mengubah glyph atau bobot yang digunakan UI:

- Inter: 400–700, 48.432 menjadi 36.176 byte. Rentang 600–700 dipertahankan untuk label semibold/bold yang sudah ada.
- Plus Jakarta Sans: 600–800, 27.272 menjadi 19.984 byte, sesuai heading pada PRD.

File sumber berasal dari output `next/font/google` untuk subset Latin. Font tetap variable; semua karakter pada sumber dipertahankan. Font lain/non-Latin mengikuti fallback browser. FontTools hanya dipakai untuk menyiapkan aset, bukan dependency runtime/build aplikasi.

Untuk memperbarui, ambil sumber Latin variable dari [Google Fonts Inter](https://github.com/google/fonts/tree/main/ofl/inter) dan [Plus Jakarta Sans](https://github.com/google/fonts/tree/main/ofl/plusjakartasans), pertahankan lisensi SIL OFL yang disertakan, dan gunakan `instantiateVariableFont(font, {"wght": (400, 700)})` untuk Inter atau `(600, 800)` untuk Jakarta sebelum menyimpan WOFF2. Ulangi pemeriksaan visual, glyph, dan Lighthouse saat versi sumber berubah.
