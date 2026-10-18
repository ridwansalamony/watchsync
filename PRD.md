# WatchSync Room

---

## 1. Ringkasan & Tujuan Aplikasi

_Bagian ini menjelaskan gambaran umum proyek agar dipahami bersama oleh pemilik ide/klien dan tim pengembang._

- **Nama Aplikasi**: WatchSync Room
- **Penjelasan Singkat**: Platform web untuk menonton video YouTube bersama teman secara real-time dalam satu ruangan (room). Pemutaran, jeda, lompatan waktu, dan pergantian video tersinkronisasi otomatis, dilengkapi chat, voice chat, webcam, dan screen sharing dalam satu tampilan bergaya sinematik gelap.
- **Masalah yang Diselesaikan**:
  - Sulit menonton video bersama teman yang berada di lokasi berbeda karena setiap orang memutar video sendiri dan selalu tidak sinkron.
  - Banyak platform nonton bersama memaksa pengguna mendaftar terlebih dahulu sebelum bisa mencoba, sehingga menghambat pengguna baru.
  - Mengobrol sambil menonton biasanya memerlukan beberapa aplikasi berbeda (video call, chat, pemutar video), sehingga pengalaman terasa terpecah.
  - Pengaturan siapa yang boleh mengontrol video sering tidak tersedia, sehingga ruang nonton mudah kacau.
- **Pengguna Aplikasi**:
  - **Tamu (Guest)**: Membuat atau bergabung ke room tanpa login, cukup dengan nama tampilan. Cocok untuk mencoba cepat dan menonton bersama teman.
  - **Pengguna Terdaftar**: Masuk dengan Google dan dapat menyimpan room, menyimpan playlist, serta melihat riwayat menonton.
  - **Owner (Pemilik Room)**: Mengatur seluruh pengaturan room, termasuk nama, privasi, password, dan izin kontrol video.
  - **Moderator**: Membantu owner mengelola playlist serta mengeluarkan atau membisukan anggota yang mengganggu.
  - **Member (Anggota)**: Menonton, chat, dan ikut voice chat, webcam, atau screen sharing sesuai izin yang diberikan.
- **Target Keberhasilan**:
  - Selisih waktu pemutaran antar anggota dalam satu room kurang dari 1,5 detik pada 95% sesi.
  - Waktu dari klik "Buat Room" hingga video siap diputar kurang dari 10 detik.
  - Minimal 40% pengguna yang bergabung melalui link undangan kembali membuat room baru dalam 30 hari.
  - Room dapat menampung hingga 50 anggota aktif tanpa penurunan kualitas sinkronisasi yang berarti.

---

## 2. Batasan Pembuatan Sistem (Versi Awal MVP)

_Menegaskan fitur apa yang dikerjakan di versi awal dan apa yang sengaja ditunda agar aplikasi cepat selesai dan tidak membengkak (mencegah scope creep)._

### ✅ Yang Dikerjakan:

- Pembuatan room dan bergabung ke room tanpa wajib login (identitas tamu berbasis cookie dan nama tampilan).
- Undangan melalui tautan room (`/gabung/[kode]`) dan salin tautan dengan satu klik.
- Sinkronisasi pemutaran YouTube real-time: play, pause, seek, dan pergantian video, dengan koreksi otomatis saat terjadi selisih waktu.
- Pencarian video YouTube melalui YouTube Data API dan penambahan video melalui URL YouTube.
- Playlist bersama: tambah, hapus, dan ubah urutan video secara real-time.
- Live chat dengan dukungan emoji dan riwayat pesan 200 pesan terakhir.
- Daftar anggota room dengan status online dan badge peran.
- Peran Owner, Moderator, dan Member dengan pengaturan hak akses.
- Pengaturan room: nama, deskripsi, privasi (publik, tautan saja, privat), password, dan mode kontrol video.
- Batas maksimal 50 anggota per room.
- Voice chat, webcam, dan screen sharing berbasis LiveKit.
- Login satu klik menggunakan Google OAuth.
- Dashboard member: Daftar Room Tersimpan, Playlist Tersimpan, Riwayat Menonton, serta Profil & Pengaturan Akun.
- Dark mode sebagai tema utama dan responsif untuk desktop, tablet, dan mobile.

### ⛔ Yang Tidak Dikerjakan di Versi Awal:

- Pembayaran, langganan, atau fitur berbayar (tidak ada payment gateway pada MVP).
- Login menggunakan email/password, Facebook, Apple, GitHub, atau penyedia lain selain Google.
- Panel admin platform (pengelolaan pengguna dan room secara global oleh tim internal).
- Dukungan platform video selain YouTube (Vimeo, Twitch, Netflix, file lokal, atau direct URL MP4).
- Aplikasi native Android dan iOS (versi awal berupa Progressive Web App yang dapat dipasang di layar utama).
- Perekaman layar atau perekaman video room.
- Pesan pribadi (direct message) antaranggota.
- Terjemahan subtitle otomatis dan fitur subtitle kustom.
- Room dengan lebih dari 50 anggota.
- Reaksi video real-time (floating emoji di atas video) dan mode bioskop kolaboratif dengan avatar 3D.
- Notifikasi push dan notifikasi email.

---

## 3. Daftar Halaman & Struktur Menu (Pages & Routing)

_Daftar lengkap halaman yang harus dibuat, dikelompokkan berdasarkan area atau peran pengguna (Role)._

### A. Public Area (Tanpa Login)

- `/` (Beranda): Hero section sinematik dengan tombol "Buat Room" dan "Gabung dengan Kode", kartu fitur utama, cara kerja tiga langkah, dan daftar room publik yang sedang aktif.
- `/buat-room` (Buat Room): Formulir pembuatan room dengan nama tampilan, nama room, privasi, password opsional, dan mode kontrol video. Setelah dibuat, pengguna langsung diarahkan ke `/room/[kode]`.
- `/gabung` (Gabung dengan Kode): Input kode room 8 karakter atau tautan lengkap, lalu meminta nama tampilan dan password jika room dilindungi.
- `/gabung/[kode]` (Undangan Room): Halaman landing dari tautan undangan. Menampilkan nama room, jumlah anggota aktif, pemilik room, dan tombol "Gabung Sekarang".
- `/room/[kode]` (Ruang Nonton): Halaman utama pemutaran bersama. Jika room bersifat privat dan pengguna belum diizinkan, akan muncul layar meminta password atau pesan akses ditolak.
- `/masuk` (Masuk): Halaman login dengan tombol "Lanjutkan dengan Google" sebagai satu-satunya metode autentikasi.
- `/tentang` (Tentang Kami): Cerita singkat produk, tim, dan misi WatchSync Room.
- `/bantuan` (Pusat Bantuan): Tanya jawab umum mengenai cara membuat room, mengundang teman, dan mengatur izin.
- `/kebijakan-privasi` (Kebijakan Privasi): Penjelasan data yang dikumpulkan, termasuk data Google dan cookie tamu.
- `/syarat-layanan` (Syarat & Ketentuan): Aturan penggunaan, termasuk kewajiban mematuhi kebijakan YouTube.

### B. Member/User Area (Setelah Login)

- `/dashboard` (Dasbor Utama): Ringkasan room terakhir, jumlah playlist tersimpan, dan tombol cepat "Buat Room Baru".
- `/dashboard/room-tersimpan` (Room Tersimpan): Daftar room yang disimpan atau dibuat pengguna, dengan status aktif, peran pengguna di room tersebut, dan tombol masuk atau hapus dari daftar.
- `/dashboard/playlist` (Playlist Tersimpan): Daftar playlist pribadi, lengkap dengan kartu playlist dan tombol "Muat ke Room".
- `/dashboard/playlist/[id]` (Detail Playlist): Daftar video dalam playlist dengan kemampuan ubah urutan, tambah, dan hapus.
- `/dashboard/riwayat` (Riwayat Menonton): Daftar video yang pernah diputar bersama, lengkap dengan tanggal, durasi tonton, dan nama room.
- `/dashboard/profil` (Profil & Pengaturan): Foto, nama tampilan default, preferensi notifikasi di dalam room, bahasa antarmuka, dan tombol "Keluar" serta "Hapus Akun".

### C. Room Area (Peran dalam Room)

- `/room/[kode]/pengaturan` (Pengaturan Room): Modal atau halaman untuk Owner dengan pengaturan nama, deskripsi, privasi, password, mode kontrol video, dan penetapan role Moderator.
- `/room/[kode]/anggota` (Kelola Anggota): Tabel anggota dengan aksi promosi, penurunan, bisukan, dan keluarkan. Dapat diakses Owner dan Moderator.

---

## 4. Pedoman UI/UX & Design System

_Panduan visual konkret agar AI coding assistant tidak membuat UI yang kaku atau default._

- **Skema Warna**:
  - Primary: HSL(239, 84%, 67%) untuk tombol utama, tautan aktif, dan indikator fokus.
  - Primary Hover: HSL(239, 84%, 60%).
  - Secondary: HSL(240, 20%, 16%) untuk latar kartu dan panel sekunder.
  - Background (Dark, tema utama): HSL(230, 25%, 6%).
  - Surface / Kartu: HSL(229, 22%, 10%) dengan border HSL(229, 18%, 18%).
  - Teks utama: HSL(220, 30%, 96%). Teks sekunder: HSL(220, 14%, 65%).
  - Aksen sukses (status online): HSL(152, 72%, 50%).
  - Aksen peringatan (mute, kick): HSL(0, 84%, 64%).
  - Aksen Owner: HSL(43, 96%, 58%). Aksen Moderator: HSL(199, 89%, 58%).
  - Tema terang (opsional, sekunder): Background HSL(0, 0%, 100%) dengan Primary yang sama.
- **Tipografi**:
  - Heading menggunakan font 'Plus Jakarta Sans' (bobot 600 hingga 800).
  - Body dan UI menggunakan font 'Inter' (bobot 400 dan 500).
  - Kode room dan timestamp menggunakan 'JetBrains Mono' agar mudah dibaca.
  - Skala ukuran: heading hero 56px desktop, 36px mobile; body 16px; caption 13px.
- **Aturan Komponen**:
  - Sudut membulat: `rounded-xl` untuk kartu dan panel, `rounded-lg` untuk tombol dan input, `rounded-full` untuk avatar dan badge.
  - Shadow: `shadow-sm` untuk kartu biasa, `shadow-xl` dengan glow Primary tipis saat hover pada kartu room.
  - Video player memiliki `ring-1` tipis berwarna Primary dengan opacity 20% dan sudut `rounded-2xl`.
  - Border menggunakan `border-white/10` agar kontras lembut pada latar gelap.
  - Glassmorphism ringan (`backdrop-blur-md` dan `bg-white/5`) hanya untuk navbar mengambang dan bilah kontrol room.
  - Komponen wajib dari shadcn/ui: Button, Card, Input, Dialog, Sheet, Tabs, Tooltip, Avatar, Badge, Dropdown Menu, Switch, Slider, Toast (Sonner), Scroll Area, dan Command (untuk pencarian).
  - Ikon menggunakan Lucide React. Emoji picker menggunakan komponen ringan berbasis data emoji standar.
  - Status online ditandai titik hijau berdenyut kecil (pulse animation) pada avatar anggota.
- **Nuansa & Vibe**:
  - Cinematic dark, minimalis, dan fokus pada video sebagai pusat perhatian.
  - Banyak ruang kosong (whitespace) di halaman publik, sedangkan halaman room dibuat padat namun rapi.
  - Animasi halus menggunakan Framer Motion: transisi masuk halaman 300ms ease-out, sidebar slide 250ms, dan efek fade-in saat pesan chat baru muncul.
  - Micro-interaction: tombol memiliki efek skala 0,98 saat ditekan, dan tombol "Salin Tautan" berubah menjadi centang sebentar setelah berhasil.
  - Mode mobile menggunakan bilah navigasi bawah dengan ikon Chat, Playlist, dan Anggota.
  - Hindari gaya default yang kaku. Gunakan gradien halus pada hero (dari Primary ke indigo gelap) dan tekstur noise tipis pada latar belakang.

---

## 5. Pembagian Hak Akses Pengguna

_Tabel hak akses yang menentukan siapa saja yang boleh melihat, mengedit, atau mengelola data._

WatchSync Room bersifat berbasis room. Hak akses di tingkat platform dibagi menjadi tamu dan pengguna terdaftar, sedangkan hak akses di dalam room dibagi menjadi Owner, Moderator, dan Member.

| Menu / Halaman                              | Tamu (Tanpa Login) | Pengguna Terdaftar (Login) | Owner Room | Moderator Room |        Member Room        |
| :------------------------------------------ | :----------------: | :------------------------: | :--------: | :------------: | :-----------------------: |
| Beranda & Halaman Publik                    |         ✅         |             ✅             |     ✅     |       ✅       |            ✅             |
| Buat Room                                   |         ✅         |             ✅             |     ✅     |       ✅       |            ✅             |
| Gabung Room (Kode / Tautan)                 |         ✅         |             ✅             |     ✅     |       ✅       |            ✅             |
| Menonton & Sinkronisasi Video               |         ✅         |             ✅             |     ✅     |       ✅       |            ✅             |
| Kontrol Pemutaran (Play, Pause, Seek)       |   ✅ sesuai mode   |       ✅ sesuai mode       |     ✅     |       ✅       |      ✅ sesuai mode       |
| Chat & Emoji                                |         ✅         |             ✅             |     ✅     |       ✅       | ✅ (tidak jika dibisukan) |
| Voice Chat, Webcam, Screen Sharing          |         ✅         |             ✅             |     ✅     |       ✅       |            ✅             |
| Tambah Video ke Playlist                    |   ✅ sesuai mode   |       ✅ sesuai mode       |     ✅     |       ✅       |      ✅ sesuai mode       |
| Ubah Urutan & Hapus Playlist                |         ❌         |             ❌             |     ✅     |       ✅       |            ❌             |
| Kick & Mute Anggota                         |         ❌         |             ❌             |     ✅     |       ✅       |            ❌             |
| Promosi Moderator                           |         ❌         |             ❌             |     ✅     |       ❌       |            ❌             |
| Ubah Pengaturan Room                        |         ❌         |             ❌             |     ✅     |       ❌       |            ❌             |
| Hapus Room                                  |         ❌         |             ❌             |     ✅     |       ❌       |            ❌             |
| Simpan Room ke Dashboard                    |         ❌         |             ✅             |     ✅     |       ✅       |            ✅             |
| Dashboard (Room, Playlist, Riwayat, Profil) |         ❌         |             ✅             |     ✅     |       ✅       |            ✅             |
| Simpan Playlist Pribadi                     |         ❌         |             ✅             |     ✅     |       ✅       |            ✅             |

_Catatan: "sesuai mode" mengacu pada pengaturan mode kontrol video room: `owner_only`, `moderators`, atau `everyone`._

---

## 6. Alur Kerja dan Fitur Utama

_Menjelaskan cara kerja setiap fitur utama dalam bahasa yang mudah dipahami serta aturan logikanya._

### A. Membuat Room (Tanpa Login)

1. **Cara Kerja**: Pengguna membuka `/buat-room`, mengisi nama tampilan dan nama room, memilih privasi, lalu menekan "Buat Room". Sistem membuat kode room unik, menetapkan pengguna sebagai Owner, dan langsung membuka `/room/[kode]`. Jika pengguna sudah login, room otomatis dapat disimpan ke dashboard.
2. **Aturan Sistem**:
   - Nama tampilan wajib 2 hingga 24 karakter dan tidak boleh hanya berisi spasi.
   - Nama room wajib 3 hingga 60 karakter. Deskripsi opsional maksimal 280 karakter.
   - Kode room terdiri dari 8 karakter huruf besar dan angka, tanpa karakter membingungkan seperti 0, O, 1, dan I.
   - Password room opsional, minimal 4 karakter dan maksimal 32 karakter. Password disimpan dalam bentuk hash bcrypt, tidak pernah disimpan dalam teks biasa.
   - Mode kontrol default adalah `owner_only`.
   - Pembuat tamu menerima cookie identitas tamu (`wsr_guest`) berumur 30 hari.
   - Room tanpa aktivitas selama 14 hari dan bukan milik pengguna terdaftar akan dihapus otomatis.

### B. Bergabung ke Room & Undangan

1. **Cara Kerja**: Pengguna dapat memasukkan kode di `/gabung`, membuka tautan `/gabung/[kode]`, atau langsung membuka `/room/[kode]`. Jika room dilindungi password, sistem meminta password terlebih dahulu. Setelah berhasil, pengguna memasuki ruang nonton sebagai Member.
2. **Aturan Sistem**:
   - Kapasitas maksimal room adalah 50 anggota aktif. Jika penuh, pengguna melihat pesan "Room sudah penuh" dan tidak dapat masuk.
   - Room privasi `public` tampil di daftar Beranda. Room `unlisted` hanya dapat diakses melalui kode atau tautan. Room `private` hanya dapat dimasuki oleh anggota yang sudah pernah diundang oleh Owner atau Moderator.
   - Anggota yang dikeluarkan (kick) diblokir selama 30 menit, kecuali Owner menghapus blokir secara manual.
   - Percobaan password salah lebih dari 5 kali dalam 10 menit akan memblokir percobaan selama 10 menit.
   - Tombol "Salin Tautan" menyalin `https://[domain]/gabung/[kode]` ke papan klip.

### C. Sinkronisasi Pemutaran Video Real-Time

1. **Cara Kerja**: Server realtime menyimpan status resmi room, yaitu video yang sedang diputar, status (sedang diputar atau dijeda), posisi waktu, dan waktu terakhir pembaruan. Saat seorang pengguna yang berwenang menekan play, pause, atau seek, perubahan dikirim ke server lalu disiarkan ke seluruh anggota. Setiap klien menghitung posisi yang seharusnya berdasarkan selisih waktu, lalu melakukan koreksi jika selisihnya terlalu besar.
2. **Aturan Sistem**:
   - Setiap klien melakukan sinkronisasi jam dengan server menggunakan minimal 5 kali ping saat bergabung, lalu mengambil nilai rata-rata terkecil untuk menghitung selisih waktu (clock offset).
   - Jika selisih posisi lebih dari 1,5 detik, klien melakukan seek otomatis ke posisi yang benar. Jika selisih kurang dari 1,5 detik, klien hanya menyesuaikan kecepatan pemutaran sementara (playback rate 0,97 hingga 1,03) agar transisi tidak terasa patah.
   - Perubahan yang dilakukan oleh pengguna tanpa izin ditolak server dan klien menerima event `sync:rejected` beserta status terbaru.
   - Event pemutaran dibatasi maksimal 4 kali per detik per room untuk mencegah spam saat pengguna menggeser progres bar berulang kali.
   - Saat video berganti, seluruh anggota dipaksa memuat video baru dan menunggu kesiapan player (event `ready`) dari minimal 80% anggota aktif sebelum memulai pemutaran bersama. Tombol "Putar Sekarang" tetap tersedia untuk Owner sebagai pengecualian.
   - Anggota yang baru bergabung otomatis disinkronkan ke posisi aktual room saat itu.

### D. Mencari dan Menambah Video

1. **Cara Kerja**: Pengguna membuka panel Playlist, lalu memilih "Cari Video" untuk mencari di YouTube atau "Tambah dari URL" untuk menempelkan tautan YouTube. Video yang dipilih masuk ke antrean playlist. Jika belum ada video yang diputar, video langsung dimainkan.
2. **Aturan Sistem**:
   - Pencarian menggunakan YouTube Data API v3 dan dibatasi 10 hasil per halaman. Hasil disimpan sementara (cache) selama 10 menit untuk menghemat kuota.
   - URL yang diterima dapat berbentuk `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`, atau `youtube.com/embed/`. Format lain ditolak dengan pesan "Tautan YouTube tidak valid".
   - Video harus dapat ditanamkan (embeddable). Video yang tidak dapat ditanamkan atau berusia terbatas ditolak dengan pesan yang jelas.
   - Maksimal 100 video dalam satu playlist room.
   - Video yang sama tidak boleh ditambahkan lebih dari sekali secara berurutan.
   - Durasi video maksimal 6 jam.

### E. Playlist Bersama

1. **Cara Kerja**: Seluruh anggota yang diizinkan dapat melihat playlist room. Owner dan Moderator dapat menghapus video dan mengubah urutan dengan drag and drop. Perubahan langsung tampil di layar semua anggota tanpa perlu memuat ulang halaman.
2. **Aturan Sistem**:
   - Urutan disimpan dengan kolom `position` berupa bilangan bulat yang diperbarui secara batch saat drag and drop selesai.
   - Video yang sedang diputar tidak dapat dihapus ketika belum ada video pengganti, kecuali oleh Owner.
   - Setiap item menampilkan nama pengusul dan waktu penambahannya.
   - Pengguna dapat menyimpan seluruh playlist room ke playlist pribadi (`user_playlists`) dengan satu klik.
   - Pengguna terdaftar dapat memuat playlist pribadi ke dalam room sebagai antrean baru.

### F. Live Chat & Emoji

1. **Cara Kerja**: Pengguna mengetik pesan pada kolom chat di sidebar, dapat menambahkan emoji melalui pemilih emoji, lalu menekan Enter untuk mengirim. Pesan muncul seketika di layar semua anggota.
2. **Aturan Sistem**:
   - Panjang pesan maksimal 300 karakter. Tautan di dalam pesan otomatis dikenali dan ditampilkan sebagai tautan aman dengan `rel="noopener noreferrer nofollow"`.
   - Pesan dibatasi 5 pesan per 10 detik per anggota untuk mencegah spam.
   - Anggota yang dibisukan (mute) tidak dapat mengirim pesan dan melihat status "Anda sedang dibisukan oleh moderator".
   - Sistem menyimpan 200 pesan terakhir per room. Pesan lama dihapus otomatis.
   - Konten pesan disanitasi untuk mencegah XSS. HTML tidak pernah dirender dari input pengguna.
   - Pesan sistem (contoh: "Budi bergabung ke room") ditampilkan dengan gaya berbeda dan tidak dapat dibalas.

### G. Daftar Anggota & Status Online

1. **Cara Kerja**: Panel Anggota menampilkan seluruh anggota aktif dengan avatar, nama, badge peran, dan status online. Anggota yang terputus koneksinya tetap tampil selama 60 detik sebelum dihitung offline.
2. **Aturan Sistem**:
   - Urutan tampilan: Owner, Moderator, lalu Member, dengan urutan alfabetis di dalam setiap kelompok.
   - Status "Sedang Berbicara" ditandai dengan cincin hijau di sekeliling avatar ketika voice chat aktif.
   - Jumlah anggota ditampilkan sebagai "24 / 50" di header room.
   - Pengguna yang sedang mengetik ditampilkan dengan indikator kecil di bagian bawah panel chat.

### H. Moderasi: Kick & Mute

1. **Cara Kerja**: Owner atau Moderator membuka menu titik tiga di samping nama anggota, lalu memilih "Bisukan", "Batalkan Bisu", "Keluarkan", atau "Jadikan Moderator" (khusus Owner). Setiap tindakan memerlukan konfirmasi dialog.
2. **Aturan Sistem**:
   - Moderator tidak dapat mengeluarkan atau membisukan Owner maupun sesama Moderator.
   - Owner tidak dapat dikeluarkan dari room miliknya sendiri.
   - Tindakan moderasi tercatat dalam tabel `moderation_logs` dengan pelaku, target, jenis tindakan, dan waktu.
   - Anggota yang dibisukan tetap dapat menonton dan mendengarkan voice chat, tetapi tidak dapat mengirim chat dan dimatikan mikrofonnya secara paksa.

### I. Pengaturan Room

1. **Cara Kerja**: Owner membuka menu Pengaturan Room untuk mengubah nama, deskripsi, privasi, password, dan mode kontrol video. Setiap perubahan langsung diberlakukan dan disiarkan kepada anggota yang sedang aktif.
2. **Aturan Sistem**:
   - Mode kontrol video memiliki tiga pilihan. `owner_only`: hanya Owner yang dapat mengontrol pemutaran. `moderators`: Owner dan Moderator dapat mengontrol pemutaran. `everyone`: seluruh anggota dapat mengontrol pemutaran.
   - Mengubah privasi menjadi `private` tidak mengeluarkan anggota yang sedang aktif, tetapi mencegah pengguna baru bergabung tanpa undangan.
   - Menghapus password tidak mengeluarkan anggota yang sudah berada di dalam room.
   - Owner dapat mencabut hak Moderator kapan saja.
   - Hanya Owner yang dapat menghapus room. Penghapusan bersifat permanen dan memerlukan pengetikan ulang nama room sebagai konfirmasi.

### J. Voice Chat, Webcam, & Screen Sharing

1. **Cara Kerja**: Pengguna menekan tombol mikrofon, kamera, atau bagikan layar di bilah kontrol bawah room. Media dikirim melalui LiveKit (SFU) sehingga kualitas tetap stabil meskipun jumlah peserta mencapai 50 orang. Ketika screen sharing aktif, area video utama dapat diganti menjadi layar yang dibagikan, sementara video YouTube tetap berada dalam panel kecil yang dapat diperbesar kembali.
2. **Aturan Sistem**:
   - Token akses LiveKit dibuat oleh server Next.js dengan masa berlaku 1 jam dan izin yang sesuai peran. Member biasa dapat publish audio dan video. Anggota yang dibisukan tidak dapat mempublikasikan audio.
   - Hanya satu screen sharing aktif per room pada waktu yang sama untuk menjaga performa.
   - Pengguna harus memberikan izin perangkat melalui browser. Jika ditolak, aplikasi menampilkan panduan singkat cara mengizinkan kembali.
   - Kualitas video webcam default 480p dan dapat dinaikkan menjadi 720p melalui pengaturan.
   - Voice chat menggunakan fitur push-to-talk opsional melalui tombol spasi di desktop.

### K. Akun Pengguna & Dashboard

1. **Cara Kerja**: Pengguna menekan "Masuk dengan Google", menyetujui izin dasar (nama, email, dan foto profil), lalu diarahkan ke Dashboard. Dari Dashboard, pengguna dapat melihat dan mengelola room tersimpan, playlist, riwayat menonton, dan profil.
2. **Aturan Sistem**:
   - Login hanya menggunakan Google OAuth 2.0 melalui Auth.js. Tidak ada registrasi manual dengan email dan password.
   - Pengguna yang login dapat menyimpan maksimal 50 room ke daftar tersimpan dan maksimal 20 playlist pribadi, masing-masing dengan maksimal 100 video.
   - Riwayat menonton menyimpan 500 entri terakhir. Pengguna dapat menghapus riwayat satu per satu atau sekaligus.
   - Saat tamu login, identitas tamu dari cookie digabungkan ke akun Google, sehingga room yang dibuat sebagai tamu ikut tersimpan.
   - Hapus akun akan menghapus seluruh data pribadi, playlist, dan riwayat dalam waktu 30 hari, sesuai kebijakan privasi. Room yang dimiliki akan dipindahtangankan otomatis kepada Moderator tertua, atau dihapus jika tidak ada Moderator.
   - Nama tampilan dalam room dapat berbeda dari nama akun Google dan dapat diubah kapan saja.

---

## 7. Alur Navigasi & Arsitektur Layout

_Peta navigasi alur halaman dan struktur tata letak (layout)._

### Arsitektur Layout (Persisten)

- **Public Layout**: Menggunakan Navbar mengambang dengan efek blur (logo WatchSync Room di kiri, tautan Bantuan dan Tentang, serta tombol "Masuk" di kanan) dan Footer minimalis berisi tautan kebijakan dan syarat layanan.
- **Dashboard Layout**: Menggunakan Sidebar tetap di kiri (berisi Dasbor, Room Tersimpan, Playlist, Riwayat, dan Profil) serta Header kecil di atas berisi tombol "Buat Room Baru" dan menu avatar. Pada mobile, sidebar berubah menjadi Sheet dari bawah.
- **Room Layout (Ruang Nonton)**:
  - Area utama (kiri atau atas di mobile) berisi video player YouTube berukuran besar dengan rasio 16:9, dapat diperbesar ke mode layar penuh.
  - Di bawah video terdapat bilah kontrol room berisi tombol mikrofon, kamera, bagikan layar, emoji reaksi, salin tautan, dan keluar.
  - Sidebar kanan berisi tiga tab: Chat, Playlist, dan Anggota. Lebarnya 360px di desktop.
  - Header room menampilkan nama room, kode room, jumlah anggota "24 / 50", dan ikon pengaturan (khusus Owner dan Moderator).
  - Panel media (webcam dan screen sharing) muncul sebagai grid kecil di atas sidebar atau area video, dapat disembunyikan.
- **Mobile Room Layout**: Video di bagian atas dengan rasio 16:9, panel konten di bawahnya dengan bilah navigasi bawah berisi tiga ikon (Chat, Playlist, Anggota). Bilah kontrol media berada di atas bilah navigasi bawah.

### Bagan Alur (Flowchart)

```mermaid
flowchart TD
    A[Pengunjung] --> B[Beranda /]
    B --> C{Pilih Aksi}
    C -- Buat Room --> D[/buat-room/]
    C -- Gabung Kode --> E[/gabung/]
    C -- Masuk Google --> F[/masuk/]
    C -- Lihat Room Publik --> G[Daftar Room Publik]

    D --> H{Isi Form Valid?}
    H -- Tidak --> D
    H -- Ya --> I[Buat Kode Room]
    I --> J[Set Peran Owner]
    J --> K[/room/kode/]

    E --> L[Input Kode atau Tautan]
    L --> M{Kode Ditemukan?}
    M -- Tidak --> E
    M -- Ya --> N{Room Dilindungi Password?}
    N -- Ya --> O[Input Password]
    O --> P{Password Benar?}
    P -- Tidak --> O
    P -- Ya --> Q{Kapasitas Kurang dari 50?}
    N -- Tidak --> Q
    Q -- Tidak --> R[Pesan Room Penuh]
    Q -- Ya --> S{Diblokir Kick?}
    S -- Ya --> R
    S -- Tidak --> T[Input Nama Tampilan]
    T --> K

    G --> E

    F --> U[Login Google OAuth]
    U --> V{Berhasil?}
    V -- Tidak --> F
    V -- Ya --> W[Gabung Identitas Tamu]
    W --> X[/dashboard/]
    X --> Y[Room Tersimpan]
    X --> Z[Playlist Tersimpan]
    X --> AA[Riwayat Menonton]
    X --> AB[Profil & Pengaturan]
    Y --> K
    Z --> AC[Muat Playlist ke Room]
    AC --> K

    K --> AD[Sinkronisasi Real-Time]
    AD --> AE{Peran Pengguna}
    AE -- Owner --> AF[Pengaturan Room]
    AE -- Owner / Moderator --> AG[Kelola Playlist & Anggota]
    AE -- Member --> AH[Menonton, Chat, Media]
    AF --> AI[Simpan Perubahan Broadcast]
    AG --> AJ{Aksi Moderasi}
    AJ -- Mute --> AK[Anggota Dibisukan]
    AJ -- Kick --> AL[Anggota Keluar & Diblokir 30 Menit]
    AH --> AM{Mode Kontrol Video}
    AM -- owner_only --> AN[Hanya Owner]
    AM -- moderators --> AO[Owner dan Moderator]
    AM -- everyone --> AP[Seluruh Anggota]
```

---

## 8. Kebutuhan Non-Fungsional (SEO, Keamanan, & Performa)

_Syarat wajib agar website siap rilis ke publik (production-ready)._

- **SEO**:
  - Wajib menggunakan tag `<title>` dinamis, meta description, dan Open Graph (OG) tags di setiap halaman publik (`/`, `/buat-room`, `/gabung`, `/gabung/[kode]`, `/tentang`, `/bantuan`, `/kebijakan-privasi`, `/syarat-layanan`).
  - Halaman `/room/[kode]` menggunakan `robots: noindex, nofollow` karena bersifat privat dan sementara. Halaman `/gabung/[kode]` untuk room publik boleh diindeks.
  - Setiap halaman menyediakan `sitemap.xml` dinamis yang hanya memuat halaman publik statis dan room publik yang aktif.
  - Menyediakan `robots.txt` yang memblokir `/dashboard`, `/room/`, dan `/api/`.
  - Structured data `WebApplication` pada halaman Beranda.
  - Gambar Open Graph dibuat secara dinamis menggunakan `next/og` dengan nama room untuk tautan undangan.
- **Keamanan**:
  - Wajib implementasi proteksi CSRF untuk seluruh mutasi data melalui Server Actions dan validasi header `Origin` pada server realtime.
  - Wajib sanitasi input untuk mencegah XSS pada chat, nama room, deskripsi, dan nama tampilan. Seluruh input dirender sebagai teks, bukan HTML.
  - Wajib validasi sisi server menggunakan Zod pada seluruh Server Actions, Route Handlers, dan event Socket.IO.
  - Password room di-hash menggunakan bcrypt dengan salt rounds 12. Password tidak pernah dikirim balik ke klien.
  - Cookie tamu (`wsr_guest`) menggunakan flag `HttpOnly`, `Secure`, dan `SameSite=Lax`, serta ditandatangani menggunakan `GUEST_COOKIE_SECRET`.
  - Rate limiting menggunakan Upstash Ratelimit untuk pembuatan room (5 per jam per IP), percobaan password (5 per 10 menit), chat (5 per 10 detik per anggota), dan pencarian YouTube (30 per menit per IP).
  - Token LiveKit dibuat hanya di server dengan masa berlaku 1 jam dan hak akses sesuai peran.
  - Koneksi Socket.IO wajib menggunakan token JWT pendek yang diterbitkan Next.js. Token ini berisi identitas, room, dan peran, serta berlaku 15 menit.
  - Header keamanan: Content-Security-Policy yang mengizinkan domain YouTube, Google, dan LiveKit, `X-Frame-Options` dan `frame-src` sesuai kebutuhan IFrame YouTube, `Strict-Transport-Security`, dan `Referrer-Policy: strict-origin-when-cross-origin`.
  - Kunci YouTube Data API hanya digunakan di server dan tidak pernah dikirim ke klien.
- **Performa**:
  - Wajib optimasi gambar (`<Image>`) untuk avatar dan thumbnail video dengan format WebP atau AVIF.
  - Wajib lazy loading komponen berat seperti Emoji Picker, Modal Pengaturan, Panel Webcam, dan Screen Sharing menggunakan `next/dynamic`.
  - Wajib caching untuk data publik: daftar room publik (revalidate 30 detik), hasil pencarian YouTube (10 menit), dan metadata halaman publik (static generation atau ISR).
  - Target Core Web Vitals: LCP di bawah 2,5 detik, INP di bawah 200 milidetik, dan CLS di bawah 0,1.
  - Event sinkronisasi dikirim menggunakan payload minimal (hanya tipe event, posisi, dan timestamp) untuk menjaga latensi rendah.
  - Server realtime mampu menangani minimal 500 koneksi bersamaan pada satu instance dengan latensi broadcast di bawah 150 milidetik.
  - Query database untuk daftar anggota dan chat menggunakan indeks pada `room_id` dan `created_at`.
- **Ketersediaan & Aksesibilitas**:
  - Seluruh kontrol dapat diakses menggunakan keyboard dan memiliki label `aria` yang jelas.
  - Kontras teks memenuhi standar WCAG AA pada tema gelap.
  - Animasi menghormati preferensi `prefers-reduced-motion`.

---

## 9. Panduan Bahasa, Copywriting, & Data Dummy

_Panduan nada bicara (Tone of Voice) dan contoh data agar prototipe terasa nyata._

- **Gaya Bahasa**: Ringan, hangat, dan percaya diri, seperti teman yang mengajak menonton bersama. Gunakan kata "Anda" pada halaman informasi dan "kamu" pada pesan singkat di dalam room agar terasa dekat. Hindari istilah teknis seperti "socket", "latency", atau "payload" pada teks yang dilihat pengguna.
- **Contoh Copywriting**:
  - Hero Beranda: "Nonton Bareng, Serasa Sebelahan." Sub-judul: "Putar video YouTube bersama teman di mana pun mereka berada. Pemutaran tersinkron, chat langsung, dan suara jernih dalam satu ruangan."
  - Tombol utama: "Buat Room Baru" dan "Gabung dengan Kode".
  - Pesan room penuh: "Maaf, room ini sudah penuh (50/50). Minta Owner untuk membuka slot atau coba room lain."
  - Pesan dibisukan: "Kamu sedang dibisukan oleh moderator. Kamu tetap bisa menonton dan mendengarkan."
  - Pesan sinkronisasi: "Menyelaraskan dengan room..."
- **Instruksi Data Dummy**: JANGAN PERNAH MENGGUNAKAN "Lorem Ipsum". Selalu gunakan data dummy berbahasa Indonesia yang relevan dengan konteks aplikasi.

  Contoh data dummy untuk entitas utama:
  - **Room (`rooms`)**:
    - "Malam Minggu Nonton Film Indonesia" (kode `NG7KQ2XR`, privasi `unlisted`, 18 anggota, Owner: Rizky Pratama)
    - "Maraton Anime Musim Panas" (kode `AN4BT9LM`, privasi `public`, 42 anggota, Owner: Sari Wulandari)
    - "Belajar Bareng Review Podcast Teknologi" (kode `PD8WZ3HF`, privasi `private`, 6 anggota, Owner: Dimas Kurniawan)
  - **Anggota (`room_members`)**: Rizky Pratama (Owner), Ayu Lestari (Moderator), Budi Santoso (Member, dibisukan), Nadia Putri (Member, sedang berbicara), Fajar Hidayat (Member, offline 2 menit lalu).
  - **Playlist Item (`playlist_items`)**:
    - "Trailer Resmi Film Pendek Jakarta Malam" (channel: Kanal Film Nusantara, durasi 04:32)
    - "Tutorial Membuat Website dengan Next.js untuk Pemula" (channel: Kode Bareng, durasi 18:45)
    - "Vlog Jalan-Jalan Yogyakarta 3 Hari" (channel: Jejak Kaki Vlog, durasi 26:10)
  - **Pesan Chat (`chat_messages`)**:
    - Nadia Putri: "Adegan tadi bikin merinding 😱"
    - Ayu Lestari: "Sabar ya, aku mau pindah ke video berikutnya dulu 🙏"
    - Rizky Pratama: "Oke, kita lanjut 5 menit lagi ya!"
  - **Playlist Pribadi (`user_playlists`)**: "Film Akhir Pekan", "Anime Favorit Keluarga", "Materi Belajar Coding".
  - **Riwayat Menonton (`watch_history`)**: "Review Film Horor Indonesia Terbaru" ditonton 45 menit yang lalu di room "Malam Minggu Nonton Film Indonesia".

---

## 10. Fondasi Teknis (Untuk Tim Pengembang / Programmer & AI)

_Petunjuk arsitektur teknis spesifik._

- **Bahasa & Framework**:
  - Bahasa: TypeScript (strict mode) di seluruh layanan.
  - Web App: Next.js 15 dengan App Router, React 19, dan Server Actions.
  - Layanan Realtime: Node.js 22 LTS dengan Socket.IO 4.x (layanan terpisah di folder `realtime/`), karena WebSocket persisten tidak cocok dijalankan di serverless.
  - Monorepo ringan dengan dua aplikasi: `web/` (Next.js) dan `realtime/` (Socket.IO), serta paket bersama `shared/` berisi skema event dan validasi Zod.
  - Alasan pemisahan layanan realtime: Vercel serverless tidak mendukung koneksi WebSocket berumur panjang dengan stabil, sehingga server Socket.IO dijalankan di Railway atau VPS.
- **Tampilan Antarmuka (UI)**:
  - Tailwind CSS v4 dengan variabel CSS untuk token warna.
  - shadcn/ui sebagai komponen dasar.
  - Lucide React untuk ikon.
  - Framer Motion untuk animasi.
  - Sonner untuk notifikasi toast.
  - `emoji-mart` atau paket emoji ringan sejenis yang dimuat secara lazy.
  - Zustand untuk state klien room (status player, daftar anggota, dan chat lokal).
  - TanStack Query untuk data dashboard dan pencarian YouTube.
- **Autentikasi**:
  - Auth.js v5 (NextAuth) dengan satu provider: Google OAuth.
  - Strategi sesi JWT dengan adapter Drizzle untuk penyimpanan tabel `users` dan `accounts`.
  - Identitas tamu menggunakan cookie bertanda tangan (`wsr_guest`) berisi UUID tamu. Cookie ini digabungkan ke akun saat login.
- **Basis Data (Database)**:
  - Neon PostgreSQL (serverless, dengan connection pooling) menggunakan Drizzle ORM dan Drizzle Kit untuk migrasi.
  - Realtime state room disimpan di memori server Socket.IO untuk latensi rendah dan dipersistensikan secara berkala ke tabel `rooms` (setiap 5 detik saat ada perubahan, serta saat room kosong).
  - Upstash Redis untuk rate limiting dan cache hasil pencarian YouTube.
- **Layanan Pihak Ketiga**:
  - YouTube IFrame Player API untuk pemutaran video di klien.
  - YouTube Data API v3 untuk pencarian dan metadata video di server.
  - LiveKit (Cloud atau self-hosted) untuk voice chat, webcam, dan screen sharing dengan arsitektur SFU.
  - Google OAuth 2.0 untuk autentikasi.
- **Deployment**:
  - Web App: Vercel.
  - Realtime Server: Railway (container Docker) atau VPS dengan Docker Compose.
  - Database: Neon.
  - Media: LiveKit Cloud.

### Struktur Skema Database Nyata

_(Skema Drizzle ORM untuk Neon PostgreSQL, disimpan di `web/src/db/schema.ts`)_

```typescript
import { pgTable, pgEnum, uuid, varchar, text, integer, real, boolean, timestamp, primaryKey, index, uniqueIndex } from "drizzle-orm/pg-core";

// ==================== ENUM ====================
export const memberRoleEnum = pgEnum("member_role", ["owner", "moderator", "member"]);
export const roomPrivacyEnum = pgEnum("room_privacy", ["public", "unlisted", "private"]);
export const controlModeEnum = pgEnum("control_mode", ["owner_only", "moderators", "everyone"]);
export const playbackStatusEnum = pgEnum("playback_status", ["playing", "paused"]);
export const moderationActionEnum = pgEnum("moderation_action", ["mute", "unmute", "kick", "promote", "demote"]);

// ==================== AUTH (Auth.js Adapter) ====================
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 80 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  image: text("image"),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(),
    provider: varchar("provider", { length: 50 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 50 }),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

// ==================== ROOM ====================
export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 8 }).notNull().unique(),
    name: varchar("name", { length: 60 }).notNull(),
    description: varchar("description", { length: 280 }),
    privacy: roomPrivacyEnum("privacy").default("unlisted").notNull(),
    passwordHash: text("password_hash"),
    controlMode: controlModeEnum("control_mode").default("owner_only").notNull(),
    maxMembers: integer("max_members").default(50).notNull(),
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    ownerGuestId: varchar("owner_guest_id", { length: 64 }),
    currentVideoId: varchar("current_video_id", { length: 20 }),
    playbackStatus: playbackStatusEnum("playback_status").default("paused").notNull(),
    playbackPosition: real("playback_position").default(0).notNull(),
    playbackUpdatedAt: timestamp("playback_updated_at", { withTimezone: true }).defaultNow().notNull(),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("rooms_privacy_activity_idx").on(t.privacy, t.lastActivityAt), index("rooms_owner_user_idx").on(t.ownerUserId)],
);

// ==================== ANGGOTA ROOM ====================
export const roomMembers = pgTable(
  "room_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    guestId: varchar("guest_id", { length: 64 }),
    displayName: varchar("display_name", { length: 24 }).notNull(),
    avatarUrl: text("avatar_url"),
    role: memberRoleEnum("role").default("member").notNull(),
    isMuted: boolean("is_muted").default(false).notNull(),
    blockedUntil: timestamp("blocked_until", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("room_members_room_guest_uidx").on(t.roomId, t.guestId), uniqueIndex("room_members_room_user_uidx").on(t.roomId, t.userId), index("room_members_room_idx").on(t.roomId)],
);

// ==================== PLAYLIST ROOM ====================
export const playlistItems = pgTable(
  "playlist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    youtubeVideoId: varchar("youtube_video_id", { length: 20 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    channelTitle: varchar("channel_title", { length: 120 }),
    thumbnailUrl: text("thumbnail_url"),
    durationSec: integer("duration_sec").default(0).notNull(),
    position: integer("position").notNull(),
    addedByMemberId: uuid("added_by_member_id").references(() => roomMembers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("playlist_room_position_idx").on(t.roomId, t.position)],
);

// ==================== CHAT ====================
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").references(() => roomMembers.id, { onDelete: "set null" }),
    body: varchar("body", { length: 300 }).notNull(),
    isSystem: boolean("is_system").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("chat_room_created_idx").on(t.roomId, t.createdAt)],
);

// ==================== LOG MODERASI ====================
export const moderationLogs = pgTable(
  "moderation_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    actorMemberId: uuid("actor_member_id").references(() => roomMembers.id, {
      onDelete: "set null",
    }),
    targetMemberId: uuid("target_member_id").references(() => roomMembers.id, {
      onDelete: "set null",
    }),
    action: moderationActionEnum("action").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("moderation_room_idx").on(t.roomId)],
);

// ==================== DASHBOARD MEMBER ====================
export const savedRooms = pgTable(
  "saved_rooms",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    savedAt: timestamp("saved_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roomId] })],
);

export const userPlaylists = pgTable(
  "user_playlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("user_playlists_user_idx").on(t.userId)],
);

export const userPlaylistItems = pgTable(
  "user_playlist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playlistId: uuid("playlist_id")
      .notNull()
      .references(() => userPlaylists.id, { onDelete: "cascade" }),
    youtubeVideoId: varchar("youtube_video_id", { length: 20 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    thumbnailUrl: text("thumbnail_url"),
    position: integer("position").notNull(),
  },
  (t) => [index("user_playlist_items_playlist_idx").on(t.playlistId, t.position)],
);

export const watchHistory = pgTable(
  "watch_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
    youtubeVideoId: varchar("youtube_video_id", { length: 20 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    thumbnailUrl: text("thumbnail_url"),
    watchedSeconds: integer("watched_seconds").default(0).notNull(),
    watchedAt: timestamp("watched_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("watch_history_user_idx").on(t.userId, t.watchedAt)],
);
```

_Catatan: Tabel `users` dan `accounts` mengikuti konvensi Auth.js Drizzle Adapter. Tabel `sessions` tidak dibuat karena menggunakan strategi JWT._

### Variabel Lingkungan (`.env.example`)

```env
# ==================== APLIKASI WEB ====================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_REALTIME_URL=http://localhost:4000
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# ==================== AUTENTIKASI (AUTH.JS + GOOGLE) ====================
AUTH_SECRET=isi_dengan_hasil_openssl_rand_base64_32
AUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=xxxxxxxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=xxxxxxxxxxxxxxxx

# ==================== KEAMANAN TAMU & TOKEN ====================
GUEST_COOKIE_SECRET=isi_dengan_string_acak_minimal_32_karakter
REALTIME_JWT_SECRET=isi_dengan_string_acak_berbeda_minimal_32_karakter

# ==================== DATABASE (NEON POSTGRESQL) ====================
DATABASE_URL=postgresql://user:password@ep-xxxx.ap-southeast-1.aws.neon.tech/watchsync?sslmode=require

# ==================== YOUTUBE DATA API ====================
YOUTUBE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# ==================== LAYANAN REALTIME (SOCKET.IO) ====================
REALTIME_PORT=4000
REALTIME_CORS_ORIGIN=http://localhost:3000
REALTIME_DATABASE_URL=postgresql://user:password@ep-xxxx.ap-southeast-1.aws.neon.tech/watchsync?sslmode=require

# ==================== MEDIA (LIVEKIT) ====================
LIVEKIT_API_KEY=APIxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# ==================== RATE LIMIT & CACHE (UPSTASH REDIS) ====================
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 11. Tahapan Pengerjaan & Task Breakdown (Actionable Work Breakdown Structure)

_Daftar tugas terstruktur dan terurut (Atomic Tasks) dengan format checklist markdown `- [ ] **Task X.Y**`. Dirancang khusus agar pengguna dapat menginstruksikan AI Coding Assistant (Antigravity, Cursor, Claude Code, Roo Code, dll.) untuk mengeksekusi proyek langkah demi langkah secara terukur, modular, dan bebas dari kehabisan context window._

### Tahap 1: Fondasi Proyek, UI/UX, & Semua Halaman (Dummy Data)

_Tujuan: Membangun seluruh antarmuka visual secara 100% lengkap dan responsif menggunakan data dummy sebelum menyentuh database. Store Zustand berisi data dummy untuk room, anggota, playlist, dan chat._

- [ ] **Task 1.1 (Foundations & Design System)**: Inisialisasi monorepo (`web/`, `realtime/`, `shared/`). Setup Tailwind CSS v4 dengan token warna dark mode (Primary HSL(239, 84%, 67%), Background HSL(230, 25%, 6%)), font Plus Jakarta Sans dan Inter melalui `next/font`, Lucide React, Framer Motion, dan install komponen shadcn/ui (Button, Card, Input, Dialog, Sheet, Tabs, Tooltip, Avatar, Badge, Dropdown Menu, Switch, Slider, Sonner, Scroll Area, Command).
- [ ] **Task 1.2 (Layouts & Persistent Navigation)**: Buat Root Layout (`web/src/app/layout.tsx`), Public Layout dengan Navbar mengambang dan Footer, Dashboard Layout dengan Sidebar tetap di `web/src/app/dashboard/layout.tsx` (responsif menjadi Sheet di mobile), dan Room Layout di `web/src/app/room/[kode]/layout.tsx` dengan area video, bilah kontrol bawah, dan sidebar tiga tab (Chat, Playlist, Anggota).
- [ ] **Task 1.3 (Halaman Publik)**: Buat halaman `/` (Hero sinematik, kartu fitur, cara kerja tiga langkah, daftar room publik dummy), `/buat-room` (form dengan nama tampilan, nama room, privasi, password opsional, mode kontrol), `/gabung` (input kode atau tautan), `/gabung/[kode]` (landing undangan dengan jumlah anggota dummy), `/masuk` (tombol Google), `/tentang`, `/bantuan`, `/kebijakan-privasi`, dan `/syarat-layanan`, lengkap dengan validasi form visual menggunakan Zod.
- [ ] **Task 1.4 (Halaman Dashboard Member)**: Buat halaman `/dashboard` (ringkasan), `/dashboard/room-tersimpan` (kartu room dummy dengan status aktif dan peran), `/dashboard/playlist` (grid playlist dummy), `/dashboard/playlist/[id]` (daftar video dengan drag handle), `/dashboard/riwayat` (daftar riwayat dengan tombol hapus), dan `/dashboard/profil` (form nama tampilan, switch notifikasi, dan tombol hapus akun dengan dialog konfirmasi).
- [ ] **Task 1.5 (Halaman Ruang Nonton / Room)**: Buat halaman `/room/[kode]` lengkap dengan YouTube player placeholder berbasis data dummy (menampilkan thumbnail dan kontrol tiruan), bilah kontrol media (mikrofon, kamera, bagikan layar, emoji, salin tautan, keluar), tab Chat dengan emoji picker dan daftar pesan dummy, tab Playlist dengan drag and drop dan modal "Cari Video" dan "Tambah dari URL", tab Anggota dengan badge peran, indikator online, dan menu moderasi. Buat juga modal `/room/[kode]/pengaturan` dan halaman `/room/[kode]/anggota` dengan data dummy. Seluruh halaman menggunakan data dummy dari Bab 9.
- [ ] **Task 1.6 (Responsive & Motion Polish)**: Pastikan seluruh halaman responsif (desktop, tablet, mobile), mobile room menggunakan bilah navigasi bawah tiga ikon, animasi transisi halaman Framer Motion, dukungan `prefers-reduced-motion`, dan kontras WCAG AA pada seluruh komponen.

### Tahap 2: Database, Autentikasi, Realtime, & Integrasi Data Dinamis

_Tujuan: Menghidupkan aplikasi dengan database Neon, login Google, identitas tamu, layanan realtime Socket.IO, dan pencarian YouTube._

- [ ] **Task 2.1 (Database Schema & Migrations)**: Buat file `web/src/db/schema.ts` sesuai Bab 10 dengan tabel `users`, `accounts`, `rooms`, `room_members`, `playlist_items`, `chat_messages`, `moderation_logs`, `saved_rooms`, `user_playlists`, `user_playlist_items`, dan `watch_history`. Konfigurasi `drizzle.config.ts`, jalankan `drizzle-kit generate` dan `drizzle-kit migrate` ke Neon, lalu buat script `web/src/db/seed.ts` berisi data dummy Bab 9.
- [ ] **Task 2.2 (Authentication Google & Identitas Tamu)**: Pasang Auth.js v5 dengan Google provider di `web/src/auth.ts` dan Route Handler `web/src/app/api/auth/[...nextauth]/route.ts`. Implementasikan strategi JWT dan Drizzle Adapter. Buat utilitas cookie tamu bertanda tangan `wsr_guest` di `web/src/lib/guest.ts`, serta logika penggabungan identitas tamu ke akun saat login (memperbarui `rooms.owner_guest_id` menjadi `owner_user_id`). Lindungi `/dashboard/*` menggunakan `middleware.ts`.
- [ ] **Task 2.3 (Room Create & Join Server Actions)**: Buat Server Actions `createRoom` dan `joinRoom` di `web/src/app/actions/room.ts`. Logika mencakup pembuatan kode 8 karakter unik tanpa karakter membingungkan, hashing password dengan bcrypt (salt 12), validasi Zod, pembuatan `room_members` dengan peran Owner, pengecekan kapasitas 50 orang, pengecekan blokir kick, dan rate limit percobaan password via Upstash. Tampilkan data dari tabel `rooms` ke halaman `/buat-room` dan `/gabung`.
- [ ] **Task 2.4 (Dashboard Data Binding)**: Hubungkan halaman `/dashboard`, `/dashboard/room-tersimpan`, `/dashboard/playlist`, `/dashboard/playlist/[id]`, `/dashboard/riwayat`, dan `/dashboard/profil` dengan tabel `saved_rooms`, `user_playlists`, `user_playlist_items`, `watch_history`, dan `users`. Implementasikan Server Actions untuk simpan room, buat/ubah/hapus playlist pribadi, hapus riwayat, serta ubah profil dan hapus akun (dengan jadwal penghapusan 30 hari).
- [ ] **Task 2.5 (Layanan Realtime Socket.IO - Sinkronisasi)**: Buat server di `realtime/src/index.ts` dengan Socket.IO. Implementasikan event `room:join`, `room:leave`, `player:play`, `player:pause`, `player:seek`, `player:change-video`, `player:ready`, dan `sync:ping`. Simpan state room di memori dengan struktur `{ videoId, status, position, updatedAt }`, validasi token JWT pendek dari `REALTIME_JWT_SECRET`, cek peran terhadap `control_mode`, dan batasi event 4 per detik per room. Persistensikan state ke tabel `rooms` setiap 5 detik saat ada perubahan.
- [ ] **Task 2.6 (Klien Sinkronisasi YouTube)**: Buat hook `web/src/hooks/use-room-sync.ts` dan komponen `web/src/components/room/youtube-player.tsx` menggunakan YouTube IFrame Player API. Implementasikan clock offset dari 5 ping, koreksi drift di atas 1,5 detik (seek), koreksi halus dengan playback rate 0,97 hingga 1,03 untuk selisih kecil, serta logika tunggu kesiapan 80% anggota saat ganti video.
- [ ] **Task 2.7 (Playlist Realtime & Pencarian YouTube)**: Buat Route Handler `web/src/app/api/youtube/search/route.ts` (cache Upstash 10 menit) dan `web/src/app/api/youtube/video/route.ts` untuk metadata dan validasi URL. Implementasikan event `playlist:add`, `playlist:remove`, dan `playlist:reorder` di server realtime, serta sinkronisasi tabel `playlist_items` dengan validasi batas 100 video, larangan duplikasi berurutan, dan pengecekan `embeddable`.
- [ ] **Task 2.8 (Chat, Presence, & Moderasi)**: Implementasikan event `chat:send`, `chat:history`, `presence:update`, `member:mute`, `member:unmute`, `member:kick`, dan `member:promote`. Simpan pesan ke tabel `chat_messages` (maksimal 200 pesan per room), catat aksi ke `moderation_logs`, sanitasi input chat, batasi 5 pesan per 10 detik per anggota, dan tampilkan status online berdasarkan `last_seen_at`.
- [ ] **Task 2.9 (Pengaturan Room & Kelola Anggota)**: Buat Server Action `updateRoomSettings` dan `deleteRoom` di `web/src/app/actions/room-settings.ts` untuk nama, deskripsi, privasi, password, dan `control_mode`, lalu siarkan perubahan melalui event `room:settings-updated`. Hubungkan halaman `/room/[kode]/pengaturan` dan `/room/[kode]/anggota` dengan data nyata beserta pengecekan peran di server.
- [ ] **Task 2.10 (Frontend Data Binding Room)**: Hubungkan seluruh komponen room (chat, playlist, anggota, header, dan kontrol) dengan Zustand store yang diisi event dari Socket.IO, serta hilangkan seluruh data dummy dari halaman room dan beranda (daftar room publik dari tabel `rooms` dengan cache 30 detik).

### Tahap 3: Media, Keamanan, SEO, Pengujian, & Deployment

_Tujuan: Menghadirkan voice chat, webcam, dan screen sharing, memperkuat keamanan dan SEO, menguji sinkronisasi, lalu merilis aplikasi ke production._

- [ ] **Task 3.1 (LiveKit Voice, Webcam, & Screen Sharing)**: Buat Route Handler `web/src/app/api/livekit/token/route.ts` yang menerbitkan token LiveKit (masa berlaku 1 jam) berdasarkan peran dan status mute dari tabel `room_members`. Implementasikan komponen `web/src/components/room/media-bar.tsx` untuk mikrofon, kamera (480p default, 720p opsional), dan screen sharing (satu aktif per room), serta indikator "Sedang Berbicara" pada panel anggota. Tambahkan push-to-talk dengan tombol spasi di desktop dan panduan izin perangkat jika ditolak.
- [ ] **Task 3.2 (Keamanan & Rate Limiting)**: Pasang validasi header `Origin` dan autentikasi token pada koneksi Socket.IO di `realtime/`, konfigurasi Content-Security-Policy dan header keamanan di `web/next.config.ts`, sanitasi input chat dan deskripsi room, rate limit Upstash untuk pembuatan room (5 per jam per IP), percobaan password (5 per 10 menit), dan pencarian YouTube (30 per menit per IP). Pastikan seluruh Server Actions menggunakan Zod dan perlindungan CSRF bawaan.
- [ ] **Task 3.3 (SEO & Performa)**: Pasang metadata dinamis (`generateMetadata`) dan Open Graph di seluruh halaman publik, OG image dinamis berbasis `next/og` untuk tautan undangan, `robots.txt` (blokir `/dashboard`, `/room/`, `/api/`), `sitemap.xml` dinamis untuk room publik, structured data `WebApplication` di Beranda, `noindex` untuk `/room/[kode]`, optimasi `<Image>` dengan WebP atau AVIF, lazy loading komponen berat dengan `next/dynamic`, dan ISR untuk halaman publik.
- [ ] **Task 3.4 (Pengujian End-to-End & Beban)**: Uji alur pengguna utama (buat room tamu, undang teman, login Google, gabung tamu, simpan room, moderasi, pengaturan room, screen sharing) menggunakan Playwright. Uji sinkronisasi dengan minimal 4 browser bersamaan untuk memverifikasi selisih waktu di bawah 1,5 detik. Lakukan uji beban Socket.IO dengan 50 klien per room dan 10 room bersamaan menggunakan k6 atau Artillery. Perbaiki bug, glitch responsif, dan optimasi query indeks.
- [ ] **Task 3.5 (Production Build & Deployment)**: Konfigurasi environment production (`.env.production`) pada Vercel untuk `web/` dan Railway atau VPS dengan Docker untuk `realtime/`. Verifikasi kelulusan `npm run build` pada `web/` dan `realtime/`, jalankan migrasi produksi ke Neon, daftarkan domain dan URL callback Google OAuth, konfigurasi CORS dan `REALTIME_CORS_ORIGIN`, serta aktifkan monitoring dasar (log error dan health check `/healthz` pada layanan realtime).

---

## 12. Master Starter Prompt (Siap Coding untuk AI Agent)

_Salin prompt di bawah ini ke AI Coding Assistant (Google Antigravity / Cursor / Claude Code / GitHub Copilot / Roo Code / dll.) untuk memulai pengerjaan:_

```markdown
Halo! Kamu berperan sebagai Senior Fullstack Architect dan Lead Developer.
Saya ingin membangun aplikasi WatchSync Room berdasarkan dokumen PRD ini.

Silakan baca file @PRD.md

ATURAN EKSEKUSI (WAJIB DIPATUHI):

1. Eksekusi dilakukan per FASE. Selesaikan SATU FASE secara penuh dan mandiri dalam satu putaran kerja (misalnya Fase 1: UI/Frontend dengan data dummy), termasuk seluruh halaman yang tertulis di Bab 3 dengan UI lengkap dan data dummy. Dilarang membuat halaman placeholder atau tulisan "sedang dalam pengembangan".
2. Setelah SATU FASE selesai, BERHENTI. Laporkan daftar file yang dibuat atau diubah, ringkasan setiap task yang telah selesai (Task X.Y), cara menjalankan aplikasi untuk verifikasi, dan daftar hal yang perlu saya cek. Lalu TUNGGU instruksi konfirmasi dari saya sebelum memulai fase berikutnya.
3. Jangan pernah melompat ke Fase 2 sebelum saya memberikan izin tertulis. Jika saat mengerjakan Fase 1 ada keputusan teknis yang bertentangan dengan PRD, tanyakan dulu kepada saya.
4. Mulai dari Fase 1 (Tahap 1 di Bab 11): Task 1.1 hingga Task 1.6. Kerjakan urut sesuai nomor task.
5. Patuhi secara ketat Tech Stack (Next.js 15 App Router, TypeScript strict, Tailwind CSS v4, shadcn/ui, Lucide React, Framer Motion, Zustand, TanStack Query, Auth.js v5, Neon PostgreSQL, Drizzle ORM, Socket.IO di folder realtime/, LiveKit, YouTube IFrame Player API & Data API v3, Upstash Redis), skema database di Bab 10, nama rute di Bab 3, hak akses di Bab 5, dan Design System di Bab 4.
6. Jangan membuat koneksi database nyata, Google OAuth, atau LiveKit pada Fase 1. Gunakan data dummy dari Bab 9 yang disimpan di store Zustand atau file mock TypeScript.
7. Seluruh teks antarmuka menggunakan Bahasa Indonesia sesuai panduan copywriting di Bab 9.

Jika kamu sudah membaca dan memahami PRD, silakan berikan ringkasan singkat pemahamanmu, rencana file yang akan dibuat untuk Fase 1, dan tanyakan kesiapan saya untuk memulai Fase 1!
```
