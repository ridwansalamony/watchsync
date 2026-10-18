# Layanan realtime WatchSync

Socket.IO 4 pada Node.js 22 LTS. Dari root proyek, jalankan npm run dev:realtime untuk development atau npm run start -w realtime untuk menjalankan sumber TypeScript dengan tsx. npm run build -w realtime memeriksa TypeScript strict.

Konfigurasi dibaca dari .env.local di root. REALTIME_DATABASE_URL harus menunjuk database yang sama dengan aplikasi web; REALTIME_JWT_SECRET harus sama pada kedua layanan. Port default 4000, Origin development http://localhost:3000.

GET /healthz menyediakan health check. POST /internal/room hanya menerima JWT internal bertanda tangan dengan audience terpisah; dipakai Server Actions untuk menyiarkan pengaturan, penggantian playlist, dan penghapusan room.

Server menyimpan state playback di memori dan mempersistensikannya setiap 5 detik ketika berubah. Hak akses dibaca dari database pada setiap event. Worker retensi dan penghapusan akun berjalan setiap menit, sehingga proses ini harus tetap aktif untuk menjalankan jadwal. Penskalaan beberapa instance dan deployment dibahas pada Fase 3.
