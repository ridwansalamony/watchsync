"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu } from "lucide-react";
import { Brand } from "./brand";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { useAppStore } from "@/stores/app-store";
export function PublicShell({ children }: { children: React.ReactNode }) {
  const user = useAppStore((s) => s.user);
  const path = usePathname();
  return (
    <div className="min-h-[100dvh]">
      <header className="page-width sticky top-4 z-20 pt-4">
        <nav
          aria-label="Navigasi utama"
          className="glass flex h-16 items-center justify-between rounded-2xl border border-white/10 bg-card/80 px-4 backdrop-blur-md sm:px-6"
        >
          <Brand />
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/bantuan"
              className={`text-sm ${path === "/bantuan" ? "text-foreground" : "text-muted-foreground"} hover:text-foreground`}
            >
              Bantuan
            </Link>
            <Link
              href="/tentang"
              className={`text-sm ${path === "/tentang" ? "text-foreground" : "text-muted-foreground"} hover:text-foreground`}
            >
              Tentang
            </Link>
            <span className="h-5 w-px bg-white/10" />
            <Button asChild size="sm" variant="secondary">
              <Link href={user ? "/dashboard" : "/masuk"}>
                {user ? "Dasbor" : "Masuk"}
                <ArrowUpRight size={14} />
              </Link>
            </Button>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                className="md:hidden"
                variant="ghost"
                size="icon"
                aria-label="Buka menu"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle className="font-heading text-xl">
                Jelajahi WatchSync
              </SheetTitle>
              <SheetDescription className="mt-2 text-sm text-muted-foreground">
                Temukan bantuan dan akun Anda.
              </SheetDescription>
              <div className="mt-6 grid gap-3">
                {[
                  ["Bantuan", "/bantuan"],
                  ["Tentang", "/tentang"],
                  [user ? "Dasbor" : "Masuk", user ? "/dashboard" : "/masuk"],
                ].map(([title, href]) => (
                  <SheetClose asChild key={href}>
                    <Link href={href} className="rounded-lg bg-white/5 p-4">
                      {title}
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </header>
      <main id="konten">{children}</main>
      <footer className="mt-12 border-t border-white/10">
        <div className="page-width flex flex-col gap-8 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <Brand />
            <p className="mt-3 text-xs text-muted-foreground">
              Jarak boleh jauh. Cerita tetap bersama.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
            <Link href="/kebijakan-privasi">Kebijakan Privasi</Link>
            <Link href="/syarat-layanan">Syarat & Ketentuan</Link>
            <Link href="/bantuan">Pusat Bantuan</Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 WatchSync Room</p>
        </div>
      </footer>
    </div>
  );
}
