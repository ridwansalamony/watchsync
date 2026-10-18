"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bookmark,
  ListVideo,
  History,
  UserRound,
  Plus,
  Menu,
  LogOut,
  ArrowUpRight,
} from "lucide-react";
import { Brand } from "./brand";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/stores/app-store";
const links = [
  { href: "/dashboard", label: "Dasbor", icon: LayoutDashboard },
  {
    href: "/dashboard/room-tersimpan",
    label: "Room Tersimpan",
    icon: Bookmark,
  },
  { href: "/dashboard/playlist", label: "Playlist", icon: ListVideo },
  { href: "/dashboard/riwayat", label: "Riwayat", icon: History },
  { href: "/dashboard/profil", label: "Profil & Pengaturan", icon: UserRound },
];
function Navigation({ mobile = false }: { mobile?: boolean }) {
  const path = usePathname();
  return (
    <nav aria-label="Navigasi dasbor" className="grid gap-2">
      {links.map(({ href, label, icon: Icon }) => {
        const item = (
          <Link
            href={href}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm ${path === href || (href !== "/dashboard" && path.startsWith(href)) ? "bg-primary/15 text-indigo-200" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
          >
            <Icon size={19} />
            {label}
          </Link>
        );
        return mobile ? (
          <SheetClose asChild key={href}>
            {item}
          </SheetClose>
        ) : (
          <div key={href}>{item}</div>
        );
      })}
    </nav>
  );
}
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const user = useAppStore((s) => s.user);
  const hydrated = useAppStore((s) => s.hydrated);
  const logout = useAppStore((s) => s.logout);
  if (!hydrated)
    return (
      <div className="page-width py-20">
        <div className="skeleton h-12 w-64 rounded-lg" />
        <div className="skeleton mt-8 h-80 rounded-xl" />
      </div>
    );
  if (!user)
    return (
      <main
        id="konten"
        className="page-width flex min-h-[100dvh] flex-col items-center justify-center gap-6 text-center"
      >
        <Brand />
        <h1 className="mt-6 text-3xl">Ruang pribadi untuk cerita Anda</h1>
        <p className="max-w-md text-muted-foreground">
          Masuk dengan Google untuk mengelola room, playlist, dan riwayat.
        </p>
        <Button asChild>
          <Link href="/masuk">
            Masuk dengan Google
            <ArrowUpRight />
          </Link>
        </Button>
        <Link href="/" className="text-sm text-muted-foreground">
          Kembali ke Beranda
        </Link>
      </main>
    );
  return (
    <div className="min-h-[100dvh] lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/10 bg-card/50 p-6 lg:flex">
        <Brand />
        <p className="mb-4 mt-12 px-4 text-[11px] font-medium tracking-widest text-muted-foreground">
          RUANG PRIBADI
        </p>
        <Navigation />
        <div className="mt-auto rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-medium">Malam ini nonton apa?</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Satu room, banyak cerita. Undang teman-teman Anda.
          </p>
          <Button asChild size="sm" className="mt-4 w-full">
            <Link href="/buat-room">
              <Plus />
              Buat Room Baru
            </Link>
          </Button>
        </div>
        <Link
          href="/bantuan"
          className="mt-6 px-4 text-xs text-muted-foreground"
        >
          Butuh bantuan?
        </Link>
      </aside>
      <header className="flex h-20 items-center justify-between border-b border-white/10 px-4 md:px-8">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Buka navigasi dasbor"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle className="text-xl font-bold">Dasbor Anda</SheetTitle>
              <SheetDescription className="mb-6 mt-2 text-sm text-muted-foreground">
                Semua cerita tersimpan di sini.
              </SheetDescription>
              <Navigation mobile />
            </SheetContent>
          </Sheet>
          <span className="text-sm text-muted-foreground">
            Selamat datang kembali,{" "}
            <span className="text-foreground">{user.name.split(" ")[0]}</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild size="sm" className="hidden sm:flex">
            <Link href="/buat-room">
              <Plus />
              Buat Room Baru
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="Buka menu akun">
                <Avatar src={user.image} name={user.name} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profil">
                  <UserRound size={16} />
                  Profil & Pengaturan
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={logout}>
                <LogOut size={16} />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main id="konten" className="mx-auto max-w-7xl p-4 py-8 md:p-8">
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
