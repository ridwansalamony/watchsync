# Aset visual

- File: [cinema.png](D:/Project/DEVELOPMENT/JAVASCRIPT/watchsync/web/public/images/cinema.png).
- Sumber: built-in imagegen, bukan CLI/API berkunci pribadi.
- Instruksi penyimpanan pada prompt: “Save image for project use.” Hasil disalin ke workspace; berkas asli hasil generator tetap dipertahankan.
- Prompt: “Use case: photorealistic-natural. Asset type: wide cinematic website hero photograph for Indonesian social watch party app. A quiet rooftop cinema in Jakarta at blue hour, three young adult friends seen from behind sitting on low lounge seats facing a large outdoor movie screen showing a hazy Indonesian mountain landscape. Warm small practical lights, deep midnight blue and restrained indigo tones, beautiful cinematic film grain, candid realistic photography, high quality, landscape 16:9 composition. No text, no logos, no interface, no watermarks.”
- Foto pendukung menggunakan URL gambar Unsplash; avatar dummy menggunakan Pravatar. Gambar dan avatar memakai Next Image; Radix Avatar menyediakan wadah dan fallback inisial jika gambar gagal dimuat.

Visual publik mengikuti cinematic dark, satu sistem radius dan palet PRD. Panduan pemasaran SKILL.md tidak diterapkan sebagai pola layout dashboard, formulir, atau room kolaboratif.

## Font produksi Fase 3

Inter dan Plus Jakarta Sans menggunakan file Latin variable yang dipadatkan rentang bobotnya melalui fontTools, tetap dimuat lewat next/font/local. File, lisensi SIL OFL, sumber upstream dan catatan pemrosesan tersedia pada `web/src/app/fonts/`. Hero yang sama dikirim melalui Next Image AVIF kualitas 60; aset sumber dan komposisi tidak diganti.
