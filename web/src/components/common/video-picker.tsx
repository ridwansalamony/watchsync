"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Link2 } from "lucide-react";
import { toast } from "sonner";
import type { Video } from "@watchsync/shared/types";
import { parseYoutubeId } from "@watchsync/shared/validation";
import { duration } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
export function VideoPicker({
  open,
  onOpenChange,
  onAdd,
  defaultTab = "search",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: (v: Video) => boolean;
  defaultTab?: string;
}) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(query), 400);
    return () => clearTimeout(t);
  }, [query]);
  const [tab, setTab] = useState(defaultTab);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const {
    data = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["youtube", search],
    queryFn: async () => {
      const r = await fetch(
        "/api/youtube/search?q=" + encodeURIComponent(search),
      );
      if (!r.ok) throw new Error("Pencarian gagal.");
      return r.json() as Promise<Video[]>;
    },
    enabled: open && search.trim().length >= 2,
    staleTime: 600_000,
  });
  function add(v: Video) {
    if (
      onAdd({
        ...v,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      })
    ) {
      toast.success("Video ditambahkan ke playlist.");
      setError("");
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogTitle className="pr-7 text-xl font-bold">
          Temukan cerita berikutnya
        </DialogTitle>
        <DialogDescription className="mb-5 mt-3 text-sm text-muted-foreground">
          Cari video YouTube atau tambahkan dari tautan.
        </DialogDescription>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="search">
              <Search size={15} />
              Cari Video
            </TabsTrigger>
            <TabsTrigger value="url">
              <Link2 size={15} />
              Tambah dari URL
            </TabsTrigger>
          </TabsList>
          <TabsContent value="search" className="mt-4">
            <Command shouldFilter={false} label="Cari video YouTube">
              <CommandInput
                aria-label="Cari video YouTube"
                value={query}
                onValueChange={setQuery}
                placeholder="Cari judul atau nama channel..."
              />
              <CommandList
                label="Hasil pencarian video"
                className="max-h-80 overflow-y-auto py-2"
              >
                {isPending ? (
                  <div className="skeleton m-3 h-32 rounded-lg" />
                ) : isError ? (
                  <div className="p-6 text-center">
                    <p>Hasil belum termuat.</p>
                    <Button onClick={() => refetch()} className="mt-3">
                      Coba Lagi
                    </Button>
                  </div>
                ) : (
                  <>
                    <CommandEmpty className="p-8 text-center text-sm text-muted-foreground">
                      Tidak ada video yang cocok. Coba “Jakarta”, “website”,
                      atau “vlog”.
                    </CommandEmpty>
                    {data.map((v) => (
                      <CommandItem
                        key={v.id}
                        value={v.id}
                        onSelect={() => add(v)}
                      >
                        <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={v.thumbnailUrl}
                            alt=""
                            fill
                            sizes="100px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium leading-5">
                            {v.title}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {v.channelTitle}{" "}
                            <span className="font-mono">
                              {duration(v.durationSec)}
                            </span>
                          </p>
                        </div>
                        <Plus size={17} className="shrink-0 text-indigo-300" />
                      </CommandItem>
                    ))}
                  </>
                )}
              </CommandList>
            </Command>
          </TabsContent>
          <TabsContent value="url" className="mt-5">
            <form
              className="grid gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const id = parseYoutubeId(url);
                if (!id) {
                  setError("Tautan YouTube tidak valid.");
                  return;
                }
                try {
                  const r = await fetch("/api/youtube/video?id=" + id);
                  const found = await r.json();
                  if (!r.ok) {
                    setError(found.error);
                    return;
                  }
                  add(found);
                } catch {
                  setError("Metadata belum dapat dimuat.");
                }
              }}
            >
              <label htmlFor="video-url">Tautan video YouTube</label>
              <Input
                id="video-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-xs leading-6 text-muted-foreground">
                Mendukung watch, youtu.be, Shorts, dan embed. Contoh:{" "}
                <button
                  type="button"
                  className="text-indigo-300 underline"
                  onClick={() => setUrl("https://youtu.be/aqz-KE-bpKQ")}
                >
                  Gunakan video contoh
                </button>
                .
              </p>
              {error && (
                <p role="alert" className="text-sm text-red-300">
                  {error}
                </p>
              )}
              <Button type="submit">
                <Plus />
                Tambahkan Video
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
