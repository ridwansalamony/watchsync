import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Play,
  Link2,
  MessageCircle,
  AudioLines,
  SlidersHorizontal,
  Plus,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { DeferredPublicRooms } from "./deferred-public-rooms";
import { photos } from "@/lib/mocks/data";
export function Home() {
  return (
    <>
      <section className="page-width grid items-center gap-10 pb-16 pt-16 lg:grid-cols-[.95fr_1.05fr] lg:gap-12 lg:pb-24 lg:pt-20">
        <div>
          <div className="mb-6 flex items-center gap-2 text-xs font-medium text-indigo-200">
            <span className="h-px w-7 bg-primary" />
            CERITA YANG MENDEKATKAN
          </div>
          <h1 className="max-w-xl text-[36px] leading-[1.16] sm:text-[48px] lg:text-[56px]">
            Nonton Bareng,
            <br className="hidden sm:block" /> Serasa Sebelahan.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
            Putar YouTube bersama teman di mana saja. Video selaras, chat
            langsung, dan suara jernih dalam satu ruangan.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/buat-room" prefetch={false}>
                <Plus />
                Buat Room Baru
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/gabung" prefetch={false}>
                Gabung dengan Kode
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative aspect-video overflow-hidden rounded-[24px] border border-white/10 lg:aspect-[1.12]">
            <Image
              src={photos.cinema}
              alt="Teman-teman menikmati bioskop atap di Jakarta saat senja"
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 1024px) 100vw, 650px"
              className="object-cover"
            />
          </div>
        </div>
      </section>
      <section className="border-y border-white/8 bg-card/40">
        <div className="page-width grid grid-cols-2 gap-6 py-7 sm:grid-cols-4">
          {[
            ["Tanpa ribet", "Langsung masuk sebagai tamu"],
            ["Satu irama", "Pemutaran tersinkron"],
            ["Hingga 50 orang", "Lebih ramai, lebih seru"],
            ["Semua dalam room", "Video, chat, dan suara"],
          ].map(([title, body]) => (
            <div key={title}>
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="page-width section-space">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl">Bukan sekadar menonton.</h2>
          <p className="mt-4 max-w-lg leading-7 text-muted-foreground">
            Ada obrolan, tawa, dan momen kecil yang lebih seru kalau dibagi
            bersama.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
          <Reveal className="overflow-hidden rounded-xl border border-white/10 bg-card lg:row-span-2">
            <div className="relative h-48">
              <Image
                src={photos.city}
                alt="Pemandangan kota sebagai latar film bersama"
                fill
                sizes="500px"
                className="object-cover"
              />
            </div>
            <div className="p-7">
              <Play size={23} className="text-indigo-300" />
              <h3 className="mt-4 text-xl">
                Adegan yang sama. Detik yang sama.
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Putar, jeda, atau pindah video bersama. Tidak perlu lagi
                menghitung mundur di aplikasi lain.
              </p>
            </div>
          </Reveal>
          {[
            {
              icon: MessageCircle,
              title: "Obrolan tetap mengalir",
              body: "Bagikan komentar dan emoji tanpa meninggalkan video.",
              bg: "bg-primary/8",
            },
            {
              icon: AudioLines,
              title: "Dengar tawanya langsung",
              body: "Suara, kamera, dan berbagi layar dalam satu tempat.",
              bg: "bg-secondary",
            },
            {
              icon: Link2,
              title: "Satu tautan, langsung dekat",
              body: "Undang teman. Cukup nama tampilan untuk mulai.",
              bg: "bg-card",
            },
            {
              icon: SlidersHorizontal,
              title: "Room, aturan Anda",
              body: "Atur privasi dan pilih siapa yang mengontrol video.",
              bg: "bg-indigo-950/35",
            },
          ].map(({ icon: Icon, title, body, bg }, i) => (
            <Reveal
              key={title}
              delay={i * 0.04}
              className={`rounded-xl border border-white/10 p-7 ${bg}`}
            >
              <Icon size={23} className="text-indigo-300" />
              <h3 className="mt-5 text-base">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {body}
              </p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="bg-card/40">
        <div className="page-width section-space grid gap-10 md:grid-cols-[.8fr_1.2fr]">
          <Reveal>
            <h2 className="max-w-sm text-3xl leading-tight sm:text-4xl">
              Dari “nonton yuk”
              <br />
              jadi nonton beneran.
            </h2>
            <p className="mt-5 max-w-sm leading-7 text-muted-foreground">
              Tidak perlu instal aplikasi tambahan. Buka browser, lalu mulai
              cerita Anda.
            </p>
          </Reveal>
          <div className="grid gap-7">
            {[
              {
                icon: Plus,
                title: "Buat room Anda",
                body: "Beri nama, pilih privasi, dan tentukan siapa yang memegang kendali.",
              },
              {
                icon: Link2,
                title: "Ajak teman bergabung",
                body: "Bagikan tautan atau kode room. Teman bisa masuk tanpa daftar.",
              },
              {
                icon: Play,
                title: "Pilih video, nikmati bersama",
                body: "Tambahkan video YouTube, siapkan camilan, dan mulai menonton.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <Reveal key={title} className="flex gap-5">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-indigo-300">
                  <Icon size={21} />
                </div>
                <div>
                  <h3 className="text-lg">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="page-width section-space">
        <Reveal>
          <div className="flex items-center gap-3">
            <Radio size={24} className="text-primary" />
            <h2 className="text-3xl sm:text-4xl">Ada yang lagi nonton.</h2>
          </div>
          <p className="mt-4 text-muted-foreground">
            Temukan teman satu selera di room publik yang tersedia.
          </p>
        </Reveal>
        <DeferredPublicRooms />
      </section>
    </>
  );
}
