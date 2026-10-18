import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  Users,
  ShieldCheck,
  Search,
  Plus,
  Link2,
  Headphones,
  Play,
  Settings,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { photos } from "@/lib/mocks/data";
export function About() {
  return (
    <div className="page-width py-16">
      <Reveal className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <h1 className="text-4xl leading-tight md:text-5xl">
            Cerita yang baik
            <br />
            lebih dekat saat dibagi.
          </h1>
          <p className="mt-6 max-w-lg leading-8 text-muted-foreground">
            WatchSync Room lahir dari kebiasaan sederhana: mengajak teman
            menonton, lalu sibuk menghitung mundur agar video mulai bersamaan.
            Kami ingin waktu itu dipakai untuk tertawa dan mengobrol.
          </p>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          <Image
            src={photos.cinema}
            alt="Kebersamaan teman-teman di bioskop atap"
            fill
            sizes="600px"
            className="object-cover"
            priority
          />
        </div>
      </Reveal>
      <section className="section-space max-w-3xl">
        <h2 className="text-3xl">Jarak tidak harus mengurangi kebersamaan.</h2>
        <p className="mt-6 leading-8 text-muted-foreground">
          Misi kami adalah membuat momen menonton terasa dekat, meskipun Anda
          berada di kota yang berbeda. Satu tautan mempertemukan teman,
          keluarga, dan komunitas dalam ruang yang sederhana dan nyaman.
        </p>
        <p className="mt-4 leading-8 text-muted-foreground">
          Kami membangun WatchSync Room dengan fokus pada video, percakapan, dan
          kendali yang jelas bagi pemilik room. Anda dapat mencoba sebagai tamu
          sebelum memutuskan untuk menyimpan cerita dalam akun.
        </p>
      </section>
      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            icon: Heart,
            title: "Kebersamaan dulu",
            body: "Fitur hadir untuk membantu Anda menikmati waktu bersama, tanpa langkah yang berlebihan.",
          },
          {
            icon: Users,
            title: "Terbuka untuk semua",
            body: "Teman Anda dapat bergabung tanpa membuat akun. Cukup nama tampilan dan undangan.",
          },
          {
            icon: ShieldCheck,
            title: "Kendali yang jelas",
            body: "Privasi dan peran anggota membantu setiap room tetap nyaman untuk semua.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <Reveal key={title} className="border-t border-white/15 pt-7">
            <Icon className="text-primary" size={25} />
            <h3 className="mt-5 text-lg">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {body}
            </p>
          </Reveal>
        ))}
      </section>
      <section className="section-space">
        <h2 className="text-3xl">Dibangun untuk momen sederhana.</h2>
        <p className="mt-5 max-w-2xl leading-8 text-muted-foreground">
          Tim WatchSync Room menyatukan pengembangan produk, desain, dan
          teknologi untuk menghadirkan ruang nonton yang mudah digunakan. Kami
          percaya pengalaman yang baik dimulai dari mendengarkan kebutuhan orang
          yang memakainya.
        </p>
        <Button asChild className="mt-7">
          <Link href="/buat-room">
            Buat Room Baru
            <ArrowRight />
          </Link>
        </Button>
      </section>
    </div>
  );
}
const faqs = [
  {
    icon: Plus,
    title: "Membuat room",
    items: [
      [
        "Apakah saya harus membuat akun?",
        "Tidak. Anda dapat membuat atau bergabung ke room sebagai tamu dengan nama tampilan. Akun Google diperlukan untuk menyimpan room, playlist pribadi, dan riwayat.",
      ],
      [
        "Bagaimana cara membuat room?",
        "Pilih “Buat Room Baru”, isi nama tampilan dan nama room, lalu pilih privasi serta mode kontrol video. Setelah menekan tombol buat, Anda langsung menjadi Owner room.",
      ],
      [
        "Apa perbedaan Publik, Tautan saja, dan Privat?",
        "Room Publik dapat ditemukan di Beranda. Room Tautan saja dapat diakses dengan kode atau tautan. Room Privat hanya menerima anggota yang telah diundang oleh Owner atau Moderator.",
      ],
    ],
  },
  {
    icon: Link2,
    title: "Bergabung & undangan",
    items: [
      [
        "Bagaimana cara mengundang teman?",
        "Tekan “Salin Tautan” pada header atau bilah kontrol room, lalu bagikan tautan itu kepada teman. Mereka juga bisa memasukkan kode 8 karakter di halaman Gabung.",
      ],
      [
        "Mengapa saya tidak bisa bergabung?",
        "Pastikan kode benar. Room mungkin sudah penuh, bersifat privat, dilindungi password, atau akses Anda sedang diblokir setelah dikeluarkan. Hubungi Owner room jika perlu.",
      ],
      [
        "Berapa banyak orang yang bisa bergabung?",
        "Satu room dapat menampung hingga 50 anggota aktif. Jika penuh, tunggu hingga ada anggota yang keluar atau coba room lain.",
      ],
    ],
  },
  {
    icon: Play,
    title: "Video & playlist",
    items: [
      [
        "Video apa yang didukung?",
        "WatchSync Room mendukung video YouTube. Anda dapat mencari judul atau menempelkan tautan youtube.com/watch, youtu.be, Shorts, dan embed. Video yang membatasi penyematan tidak dapat diputar.",
      ],
      [
        "Siapa yang bisa mengontrol video?",
        "Owner memilih mode Hanya Owner, Owner dan Moderator, atau Semua anggota. Menghapus dan mengubah urutan playlist hanya tersedia untuk Owner dan Moderator.",
      ],
      [
        "Bagaimana cara menyimpan playlist?",
        "Masuk ke akun, lalu gunakan “Simpan Playlist” di panel Playlist room. Anda dapat mengelolanya melalui Dasbor > Playlist dan memuatnya ke room yang diizinkan.",
      ],
    ],
  },
  {
    icon: Headphones,
    title: "Chat, media & moderasi",
    items: [
      [
        "Bagaimana cara mengaktifkan mikrofon atau kamera?",
        "Hubungkan audio dan video di room, lalu aktifkan mikrofon, kamera, atau berbagi layar. Berikan izin perangkat pada browser saat diminta.",
      ],
      [
        "Apa yang terjadi saat saya dibisukan?",
        "Anda tetap dapat menonton dan mendengarkan, tetapi tidak dapat mengirim chat atau menggunakan mikrofon sampai Owner atau Moderator membatalkan status bisu.",
      ],
      [
        "Apakah video atau percakapan direkam?",
        "WatchSync Room tidak menyediakan fitur perekaman. Riwayat chat dibatasi hingga 200 pesan terakhir per room. Jangan membagikan informasi pribadi sensitif di percakapan.",
      ],
    ],
  },
  {
    icon: Settings,
    title: "Akun & data",
    items: [
      [
        "Bagaimana cara menghapus akun?",
        "Buka Dasbor > Profil & Pengaturan, pilih Hapus Akun, lalu konfirmasi. Pada layanan terintegrasi, penghapusan data dijadwalkan dalam 30 hari. Demo hanya menghapus data lokal akun.",
      ],
      [
        "Di mana data saya disimpan?",
        "Room, chat, playlist, dan profil disimpan di database Neon. Preferensi perangkat disimpan di browser. Login menggunakan Google dan identitas tamu menggunakan cookie bertanda tangan.",
      ],
    ],
  },
];
export function Help() {
  return (
    <div className="page-width py-16">
      <Reveal className="max-w-2xl">
        <Search size={30} className="mb-5 text-primary" />
        <h1 className="text-4xl">Ada yang bisa kami bantu?</h1>
        <p className="mt-5 leading-7 text-muted-foreground">
          Temukan jawaban untuk memulai, mengundang teman, dan menjaga room
          tetap nyaman.
        </p>
      </Reveal>
      <nav className="my-10 flex flex-wrap gap-2" aria-label="Topik bantuan">
        {faqs.map((group, i) => (
          <a
            key={group.title}
            href={`#topik-${i}`}
            className="rounded-lg border border-white/10 bg-card px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground"
          >
            {group.title}
          </a>
        ))}
      </nav>
      <div className="grid items-start gap-8 md:grid-cols-2">
        {faqs.map(({ title, icon: Icon, items }, i) => (
          <section
            key={title}
            id={`topik-${i}`}
            className="scroll-mt-28 rounded-xl border border-white/10 bg-card p-6"
          >
            <h2 className="mb-4 flex items-center gap-3 text-xl">
              <Icon size={21} className="text-indigo-300" />
              {title}
            </h2>
            {items.map(([q, a]) => (
              <details key={q} className="group border-t border-white/10 py-4">
                <summary className="cursor-pointer text-sm font-medium leading-6 focus-visible:rounded-lg">
                  {q}
                </summary>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {a}
                </p>
              </details>
            ))}
          </section>
        ))}
      </div>
      <div className="mt-12 rounded-xl bg-secondary/50 p-7">
        <MessageCircle size={25} className="mb-4 text-indigo-300" />
        <h2 className="text-xl">Siap mencoba bersama teman?</h2>
        <p className="mb-6 mt-3 text-sm text-muted-foreground">
          Mulai dari room Anda sendiri dan jelajahi semua kontrolnya.
        </p>
        <Button asChild variant="outline">
          <Link href="/buat-room">
            Buat Room Baru
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
export function Legal({ kind }: { kind: "privacy" | "terms" }) {
  const privacy = kind === "privacy";
  return (
    <article className="legal page-width py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs text-muted-foreground">
          Terakhir diperbarui: 16 Oktober 2026
        </p>
        <h1 className="mt-4 text-3xl md:text-4xl">
          {privacy ? "Kebijakan Privasi" : "Syarat & Ketentuan"}
        </h1>
        <p className="mt-6">
          {privacy
            ? "Privasi Anda penting bagi WatchSync Room. Halaman ini menjelaskan data yang digunakan, tujuannya, dan pilihan yang tersedia bagi Anda."
            : "Dengan menggunakan WatchSync Room, Anda menyetujui aturan penggunaan berikut. Tujuan kami adalah menjaga pengalaman menonton yang aman dan nyaman bagi setiap anggota."}
        </p>
        <div className="my-7 rounded-lg border border-primary/25 bg-primary/5 p-4 text-sm leading-7 text-indigo-200">
          Aplikasi ini sedang diuji dalam lingkungan development. Kebijakan
          layanan perlu ditinjau sebelum rilis publik. Fitur media akan
          digunakan setelah kamu menghubungkan audio dan video di room.
        </div>
        {privacy ? (
          <>
            <h2>1. Data yang kami gunakan</h2>
            <p>
              Untuk akun Google, layanan menggunakan nama, alamat email, dan
              foto profil yang Anda izinkan. Kami tidak meminta password akun
              Google Anda. Sebagai tamu, Anda memilih nama tampilan dan menerima
              identitas tamu melalui cookie.
            </p>
            <h2>2. Cookie dan penyimpanan lokal</h2>
            <p>
              Cookie identitas tamu wsr_guest berlaku 30 hari untuk mengenali
              keanggotaan room. Preferensi perangkat disimpan di localStorage
              browser. Data akun, room, chat, dan playlist disimpan di database.
            </p>
            <h2>3. Tujuan penggunaan data</h2>
            <ul>
              <li>Mengelola akses akun, peran, dan keanggotaan room.</li>
              <li>
                Menampilkan nama, avatar, pesan chat, serta status anggota
                kepada peserta room.
              </li>
              <li>
                Menyimpan room, playlist, preferensi, dan riwayat sesuai pilihan
                Anda.
              </li>
              <li>
                Menjaga keamanan, mencegah spam, dan menangani penyalahgunaan.
              </li>
            </ul>
            <h2>4. Video, suara, kamera, dan berbagi layar</h2>
            <p>
              Pemutaran video menggunakan YouTube. Layanan media dirancang
              menggunakan LiveKit untuk mengirim audio, kamera, atau layar
              kepada peserta room setelah Anda memberikan izin perangkat.
              WatchSync Room tidak menyediakan perekaman sesi. Mikrofon, kamera, dan layar hanya dikirim setelah Anda mengaktifkannya.
            </p>
            <h2>5. Penyedia layanan</h2>
            <p>
              Arsitektur layanan melibatkan Google untuk login, YouTube untuk
              video, Neon untuk penyimpanan data, Upstash untuk pembatasan akses
              dan cache, serta LiveKit untuk media. Penggunaan layanan pihak
              ketiga tunduk pada kebijakan mereka.
            </p>
            <h2>6. Penyimpanan dan penghapusan</h2>
            <p>
              Rancangan layanan menyimpan 200 pesan chat terakhir per room dan
              500 entri riwayat terakhir per pengguna. Room tamu tanpa aktivitas
              selama 14 hari dapat dihapus otomatis. Permintaan hapus akun
              dijadwalkan menghapus data pribadi dalam 30 hari. Saat penghapusan
              dijalankan, room dipindahkan kepada Moderator tertua atau dihapus
              jika tidak ada Moderator.
            </p>
            <h2>7. Pilihan dan kendali Anda</h2>
            <p>
              Anda dapat mengubah nama tampilan, menghapus riwayat, mengelola
              playlist, dan menghapus akun melalui Profil & Pengaturan. Izin
              mikrofon, kamera, dan berbagi layar dapat dicabut melalui
              pengaturan browser. Jangan membagikan password room atau data
              sensitif di chat.
            </p>
            <h2>8. Pembaruan kebijakan</h2>
            <p>
              Kebijakan ini dapat disesuaikan sebelum peluncuran layanan.
              Tanggal pembaruan ditampilkan di halaman ini agar Anda dapat
              meninjau perubahan yang berlaku.
            </p>
          </>
        ) : (
          <>
            <h2>1. Penggunaan layanan</h2>
            <p>
              WatchSync Room membantu Anda menonton video YouTube bersama. Anda
              bertanggung jawab atas nama tampilan, pesan, undangan, dan media
              yang Anda bagikan. Jaga kesopanan dan hormati peserta lain.
            </p>
            <h2>2. Konten YouTube dan hak cipta</h2>
            <p>
              Gunakan layanan sesuai kebijakan serta persyaratan YouTube.
              WatchSync Room tidak memberikan hak untuk menyalin, mengunduh,
              mendistribusikan, atau menampilkan konten di luar izin pemiliknya.
              Video yang tidak mengizinkan penyematan atau memiliki pembatasan
              mungkin tidak tersedia.
            </p>
            <p className="mt-3">
              Silakan baca{" "}
              <a
                className="text-indigo-300 underline"
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noopener noreferrer"
              >
                Persyaratan Layanan YouTube
              </a>{" "}
              dan{" "}
              <a
                className="text-indigo-300 underline"
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Kebijakan Privasi Google
              </a>
              .
            </p>
            <h2>3. Perilaku yang dilarang</h2>
            <ul>
              <li>Perundungan, ancaman, ujaran kebencian, atau pelecehan.</li>
              <li>Membagikan informasi pribadi orang lain tanpa izin.</li>
              <li>
                Mengirim spam, tautan berbahaya, atau konten yang melanggar
                hukum.
              </li>
              <li>
                Mencoba melewati pembatasan akses, kapasitas, atau blokir
                moderasi.
              </li>
              <li>
                Menggunakan kamera atau berbagi layar untuk melanggar privasi
                dan hak pihak lain.
              </li>
            </ul>
            <h2>4. Peran dan moderasi room</h2>
            <p>
              Owner mengatur privasi dan kendali pemutaran. Owner dan Moderator
              dapat membisukan atau mengeluarkan anggota sesuai peran. Anggota
              yang dikeluarkan diblokir selama 30 menit. Moderator tidak dapat
              memoderasi Owner atau sesama Moderator.
            </p>
            <h2>5. Akun dan undangan</h2>
            <p>
              Login layanan menggunakan Google sebagai satu-satunya penyedia.
              Jaga keamanan akun dan bagikan undangan hanya kepada orang yang
              Anda percaya. Room Publik dapat ditemukan oleh pengunjung lain.
              Room Privat membatasi anggota baru berdasarkan undangan.
            </p>
            <h2>6. Batas layanan</h2>
            <p>
              Satu room menampung maksimal 50 anggota aktif dan 100 video dalam
              playlist. Akun dapat menyimpan maksimal 50 room serta 20 playlist
              pribadi. Ketersediaan video dan kualitas media juga bergantung
              pada jaringan serta penyedia layanan terkait.
            </p>
            <h2>7. Penghapusan room dan akun</h2>
            <p>
              Owner dapat menghapus room dengan konfirmasi nama room.
              Penghapusan room bersifat permanen pada layanan terintegrasi. Saat
              akun dihapus, kepemilikan room direncanakan berpindah kepada
              Moderator tertua, atau room dihapus bila tidak ada Moderator.
            </p>
            <h2>8. Perubahan layanan</h2>
            <p>
              Fitur dan ketentuan layanan dapat diperbarui. Perubahan yang memengaruhi penggunaan atau data pribadi akan diinformasikan melalui aplikasi.
            </p>
          </>
        )}
        <div className="mt-10 border-t border-white/10 pt-6">
          <Link className="text-sm text-indigo-300" href="/bantuan">
            Kunjungi Pusat Bantuan
            <ArrowRight className="ml-2 inline" size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}
