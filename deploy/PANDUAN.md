# Panduan deployment WatchSync: Vercel + VPS Rumahweb

Panduan ini menggunakan Vercel untuk Next.js, VPS untuk Socket.IO, Neon untuk PostgreSQL, Upstash untuk Redis, dan LiveKit Cloud untuk media. Paket S dapat dipakai sebagai titik awal; hasil uji 500 koneksi di komputer pengembangan bukan jaminan kapasitas VPS S.

Contoh alamat di bawah harus diganti dengan milik Anda:

| Nilai | Contoh |
|---|---|
| Repository GitHub | `https://github.com/USERNAME/watchsync` |
| Alamat aplikasi | `https://watchsync.example.com` atau domain bawaan Vercel |
| Alamat realtime | `https://realtime.example.com` |
| IP VPS | IP publik dari Clientzone Rumahweb |
| Username SSH | Akun dari Rumahweb, biasanya `root` pada VPS baru |

## 1. Temukan informasi VPS

Masuk Clientzone Rumahweb, buka layanan VPS aktif, lalu catat IP publik, sistem operasi, RAM, dan akses console/SSH. Gunakan Ubuntu 24.04 LTS untuk panduan ini. Jangan reinstall VPS yang sudah berisi data hanya untuk mengikuti panduan. Jika OS berbeda, gunakan petunjuk Docker untuk OS tersebut.

Di PowerShell komputer Anda, uji:

```powershell
ssh root@IP_VPS
```

Periksa fingerprint host melalui console/informasi penyedia sebelum menerima koneksi pertama. Ketik password pada prompt SSH, bukan sebagai argumen perintah. Untuk key yang sudah tersedia:

```powershell
ssh -i C:\Users\Dinute\.ssh\NAMA_KEY root@IP_VPS
```

Jangan membagikan password atau isi private key. Jika saya membantu menghubungkan server, yang diperlukan hanya IP, username, dan lokasi key lokal.

## 2. Siapkan repository GitHub

Buat repository kosong, disarankan Private, tanpa README otomatis. Dari folder proyek di PowerShell, periksa apakah sudah ada repository dengan `git status`. Jika belum ada, lakukan:

```powershell
git init
git branch -M main
git check-ignore .env.local
git add .
git status --short
git diff --cached --name-only
```

Pastikan `.env.local`, `.env.production`, `.runtime`, `node_modules`, dan keluaran pengujian tidak masuk daftar staged. File `.env.example` memang boleh masuk karena hanya template. Setelah daftar benar:

```powershell
git commit -m "Siapkan WatchSync untuk deployment"
git remote add origin https://github.com/USERNAME/watchsync.git
git push -u origin main
```

Jika repository atau remote sudah ada, gunakan yang tersedia dan jangan menjalankan `git init`/`remote add` ulang. Selesaikan autentikasi GitHub melalui Git Credential Manager/browser.

## 3. Tentukan alamat dan DNS

Untuk aplikasi, Anda bisa memakai domain bawaan `nama-proyek.vercel.app`. Untuk realtime dengan HTTPS otomatis pada panduan ini, siapkan subdomain yang DNS-nya Anda kelola, misalnya `realtime.example.com`.

Pada pengelola DNS domain, buat record **A** dengan nama `realtime` dan nilai IP publik VPS. Jangan membuat record AAAA jika VPS belum memiliki IPv6 yang dikonfigurasi. Jika menggunakan Cloudflare, gunakan **DNS only** selama penyiapan awal.

Periksa di PowerShell:

```powershell
Resolve-DnsName realtime.example.com
```

Hasilnya harus mengarah ke IP VPS. Domain aplikasi yang memakai domain sendiri akan diberi record oleh Vercel pada langkah 8; ikuti nilai yang ditampilkan Vercel, jangan menebak IP-nya.

## 4. Siapkan database dan secret produksi

Gunakan database/branch Neon khusus produksi tanpa seed contoh, dan idealnya database Redis produksi terpisah. Siapkan secret produksi yang berbeda dari development untuk `AUTH_SECRET`, `GUEST_COOKIE_SECRET`, dan `REALTIME_JWT_SECRET`.

Untuk menghasilkan satu secret di komputer sendiri, jalankan perintah berikut tiga kali dan simpan hasil masing-masing pada tempat yang sesuai:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

`REALTIME_JWT_SECRET` harus sama di Vercel dan VPS; dua secret lainnya hanya diperlukan oleh web. Database web dan realtime harus menunjuk database produksi yang sama.

Simpan konfigurasi produksi lokal pada `.env.production` di root, mengikuti `.env.example`, tanpa menimpa `.env.local`. Jalankan migrasi dari komputer dengan Node.js 22:

```powershell
cd web
node --env-file=../.env.production ../node_modules/drizzle-kit/bin.cjs migrate
cd ..
```

Pastikan `DATABASE_URL` dalam `.env.production` sudah benar sebelum menjalankan migrasi. Jangan menjalankan `db:seed` untuk produksi. Migrasi ini belum saya jalankan terhadap database produksi.

## 5. Build image server melalui GitHub Actions

Proyek sudah menyediakan `.github/workflows/realtime-image.yml`. Workflow hanya berjalan saat dipicu manual; ia membangun image tanpa memasukkan `.env` atau secret aplikasi.

Di repository GitHub, buka **Actions → Build image realtime → Run workflow**. Setelah berhasil, image tersedia di GitHub Packages:

```text
ghcr.io/username/watchsync-realtime:latest
ghcr.io/username/watchsync-realtime:SHA_COMMIT
```

Username harus huruf kecil. Untuk rilis yang bisa diulang dan rollback, gunakan tag SHA commit. Image private memerlukan personal access token classic dengan izin `read:packages` untuk diunduh VPS. Token build otomatis memakai `GITHUB_TOKEN`; Anda tidak perlu menambahkan secret Neon/LiveKit ke workflow. Detail izin mengikuti [dokumentasi Container Registry GitHub](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry).

## 6. Pasang Docker pada Ubuntu VPS

Jalankan melalui sesi SSH di VPS baru. Jika Docker sudah dipasang, periksa `docker --version` dan `docker compose version` terlebih dahulu. Langkah repository berikut mengikuti [dokumentasi Docker Ubuntu](https://docs.docker.com/engine/install/ubuntu/):

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker run --rm hello-world
```

Pada firewall VPS/Rumahweb, izinkan port SSH yang digunakan serta TCP 80 dan 443. Port 4000 tidak perlu dibuka ke internet: Compose mengikatnya ke localhost, dan Caddy melayani koneksi publik. Pertahankan akses SSH ketika mengubah firewall.

## 7. Jalankan realtime di VPS

Di VPS:

```bash
sudo mkdir -p /opt/watchsync/deploy
```

Dari PowerShell komputer Anda, kirim berkas konfigurasi yang tidak mengandung secret:

```powershell
scp deploy/compose.yml deploy/Caddyfile deploy/.env.example root@IP_VPS:/opt/watchsync/deploy/
```

Tambahkan `-i LOKASI_KEY` bila diperlukan. Kembali pada SSH VPS:

```bash
cd /opt/watchsync/deploy
sudo cp .env.example .env.production
sudo chmod 600 .env.production
sudo nano .env.production
```

Isi seluruh template: domain realtime, nama image, origin web, Neon, JWT realtime, Redis, YouTube, dan LiveKit. `REALTIME_CORS_ORIGIN` harus origin aplikasi, misalnya `https://nama-proyek.vercel.app`, tanpa slash penutup atau path. Simpan dari nano dengan Ctrl+O, Enter, lalu Ctrl+X.

Untuk image private:

```bash
sudo docker login ghcr.io -u USERNAME
```

Masukkan token `read:packages` pada prompt password, bukan pada command line. Kemudian:

```bash
sudo docker compose --env-file .env.production -f compose.yml pull
sudo docker compose --env-file .env.production -f compose.yml up -d --no-build
sudo docker compose --env-file .env.production -f compose.yml ps
curl -fsS https://realtime.example.com/healthz
```

`--no-build` penting untuk VPS S: image dibangun di GitHub, bukan memakai RAM VPS. Caddy menerbitkan HTTPS otomatis ketika DNS dan port 80/443 sudah benar. Respons health check harus menunjukkan `status: ok`. Proses realtime dibatasi RAM 600 MB dan log dirotasi; sesuaikan setelah memantau penggunaan sebenarnya.

## 8. Deploy Next.js ke Vercel

Pilih **Add New Project**, import repository, pilih framework **Next.js**, lalu set **Root Directory = web**. Aktifkan akses source di luar Root Directory agar workspace `shared/` tersedia. Pilih **Node.js 22.x**. Gunakan build `npm run build` pada workspace web dan output default Next.js; jangan menggunakan static export. Struktur workspace mengikuti [panduan monorepo Vercel](https://vercel.com/docs/monorepos/monorepo-faq).

Isi environment scope **Production**:

| Variabel | Nilai |
|---|---|
| `NEXT_PUBLIC_APP_URL` | URL HTTPS aplikasi final |
| `AUTH_URL` | Sama dengan URL aplikasi |
| `AUTH_TRUST_HOST` | `true` pada Vercel |
| `NEXT_PUBLIC_REALTIME_URL` | `https://realtime.example.com` |
| `NEXT_PUBLIC_LIVEKIT_URL` | URL `wss://` LiveKit Cloud |
| `AUTH_SECRET` | Secret autentikasi produksi |
| `GUEST_COOKIE_SECRET` | Secret cookie produksi |
| `REALTIME_JWT_SECRET` | Sama persis dengan VPS |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | OAuth client produksi |
| `DATABASE_URL` | Neon produksi yang sudah dimigrasi |
| `YOUTUBE_API_KEY` | API key YouTube |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Redis produksi |
| `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | Kredensial server LiveKit |

Jangan beri awalan `NEXT_PUBLIC_` pada secret. Deploy setelah environment lengkap. Jika baru mengetahui nama domain bawaan setelah deploy pertama, perbarui URL aplikasi, `AUTH_URL`, origin pada VPS, kemudian redeploy Vercel dan restart realtime. Perubahan `NEXT_PUBLIC_*` memerlukan rebuild/redeploy.

Jika memakai domain sendiri, tambahkan pada **Project → Settings → Domains**, lalu pasang record DNS yang ditunjukkan Vercel.

## 9. Perbarui Google OAuth

Pada OAuth client di Google Cloud Console, tambahkan:

```text
Authorized JavaScript origin:
https://watchsync.example.com

Authorized redirect URI:
https://watchsync.example.com/api/auth/callback/google
```

Gunakan domain Vercel jika itu URL final. Path callback harus persis sama dan tanpa slash tambahan. Pertahankan callback localhost bila development masih digunakan. Jika Audience masih Testing, masukkan akun penguji. Uji login secara interaktif; JWT fixture otomatis tidak menggantikan persetujuan Google.

## 10. Verifikasi dan pemeliharaan

1. Buka aplikasi lewat HTTPS, buat room, dan gabung dari perangkat lain.
2. Uji play/pause/seek, chat, playlist, simpan room, dan pengaturan.
3. Hubungkan media, izinkan perangkat, uji suara/kamera/berbagi layar dan mute/kick.
4. Uji login Google dan penggabungan kepemilikan room tamu.
5. Uji `https://realtime.example.com/healthz` dan pasang monitor HTTP eksternal pilihan Anda.

Pada VPS, gunakan:

```bash
cd /opt/watchsync/deploy
sudo docker stats --no-stream
sudo docker compose --env-file .env.production -f compose.yml logs --tail=100 realtime
sudo docker compose --env-file .env.production -f compose.yml logs --tail=100 proxy
```

Setelah pembaruan: push kode, jalankan workflow image, perbarui tag SHA pada `.env.production`, lalu `pull` dan `up -d --no-build`. Untuk rollback, kembalikan tag SHA sebelumnya. Jangan menjalankan `down -v` karena itu menghapus penyimpanan sertifikat Caddy.

| Kendala | Yang diperiksa |
|---|---|
| `502` dari Caddy | Status container, log realtime, variabel Neon/Redis |
| HTTPS belum terbit | Record A, port 80/443, domain pada `.env.production` |
| Room terus menyambungkan | URL realtime, CORS origin, JWT secret kedua layanan |
| `redirect_uri_mismatch` | `AUTH_URL` dan callback Google harus persis sama |
| Media belum tersambung | URL `wss://`, key/secret, izin browser dan jaringan |
| Image gagal ditarik | Nama image huruf kecil, tag tersedia, login `read:packages` |
| Container mati kehabisan RAM | `docker stats`, log, dan kapasitas VPS; upgrade bila perlu |

Yang boleh dikirim untuk bantuan lanjutan: URL repository, URL aplikasi, subdomain realtime, IP VPS, OS, username SSH, dan lokasi key lokal. Jangan kirim nilai environment atau password.
