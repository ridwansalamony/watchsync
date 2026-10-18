"use client";
import { invitationLink } from "@/app/actions/room";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Smile,
  Link2,
  Check,
  LogOut,
  MessageCircle,
  ListVideo,
  Users,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useRoom } from "@/hooks/use-room";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { YouTubePlayer } from "./youtube-player";
import { ChatPanel } from "./chat-panel";
import { PlaylistPanel } from "./playlist-panel";
import { MemberPanel } from "./member-panel";
import { Reveal } from "@/components/motion/reveal";
const MediaBar = dynamic(() => import("./media-bar"), { ssr: false });
const EmojiPicker = dynamic(() => import("./emoji-picker"), { ssr: false });
export function WatchRoom() {
  const { code, me, state } = useRoom();
  const router = useRouter();
  const [tab, setTab] = useState("chat");
  const [emoji, setEmoji] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exit, setExit] = useState(false);
  return (
    <div className="grid min-h-[calc(100dvh-80px)] lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="group min-w-0 p-3 pb-5 md:p-6">
        <div id="screen-stage" />
        <div className="group-has-[[data-screen-active=true]]:max-w-sm">
          <Reveal>
            <YouTubePlayer />
          </Reveal>
        </div>
        <div
          role="group"
          aria-label="Kontrol media room"
          className="glass fixed inset-x-2 bottom-[80px] z-30 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-card/95 px-2 py-3 backdrop-blur-md sm:px-4 lg:static lg:mt-5 lg:bg-white/5"
        >
          <div className="flex items-center gap-1 sm:gap-2">
            <div id="media-controls" />
            <div className="relative">
              <Tooltip label="Kirim emoji ke chat">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Kirim emoji ke chat"
                  disabled={me.isMuted}
                  onClick={() => setEmoji(!emoji)}
                >
                  <Smile />
                </Button>
              </Tooltip>
              {emoji && (
                <EmojiPicker
                  onClose={() => setEmoji(false)}
                  onSelect={(e) => {
                    if (!me.isMuted)
                      state.addMessage(code, {
                        id: crypto.randomUUID(),
                        memberId: me.id,
                        body: e,
                        isSystem: false,
                        createdAt: new Date().toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                      });
                    setEmoji(false);
                    setTab("chat");
                  }}
                />
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    await invitationLink(code),
                  );
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                  toast.success("Tautan undangan disalin.");
                } catch {
                  toast.error(
                    "Belum berhasil menyalin. Gunakan kode room di header.",
                  );
                }
              }}
            >
              {copied ? <Check /> : <Link2 />}
              {copied ? "Tersalin" : "Salin Tautan"}
            </Button>
            <Tooltip label="Keluar room">
              <Button
                variant="destructive"
                size="icon"
                aria-label="Keluar room"
                onClick={() => setExit(true)}
              >
                <LogOut />
              </Button>
            </Tooltip>
          </div>
        </div>
        <MediaBar />
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-white/8 bg-card/60 p-3 text-[11px] leading-6 text-muted-foreground">
          <Info size={15} className="mt-1 shrink-0 text-indigo-300" />
          <p>
            Video, playlist, dan chat tersinkron antaranggota. Hubungkan audio
            dan video untuk berbicara, menyalakan kamera, atau berbagi layar.
          </p>
        </div>
      </div>
      <aside
        aria-label="Panel room"
        className="min-w-0 border-t border-white/10 bg-card/40 pb-40 lg:border-l lg:border-t-0 lg:pb-0"
      >
        <Tabs
          value={tab}
          onValueChange={setTab}
          className="flex flex-col lg:sticky lg:top-0 lg:h-[calc(100dvh-80px)]"
        >
          <TabsList
            aria-label="Panel ruang nonton"
            className="fixed inset-x-0 bottom-0 z-30 rounded-none border-t border-white/10 bg-card px-3 py-2 lg:order-first lg:static lg:border-b lg:border-t-0 lg:bg-transparent lg:py-4"
          >
            <TabsTrigger value="chat" className="flex-col gap-1 lg:flex-row">
              <MessageCircle size={16} />
              <span className="text-[11px] lg:text-xs">Chat</span>
            </TabsTrigger>
            <TabsTrigger
              value="playlist"
              className="flex-col gap-1 lg:flex-row"
            >
              <ListVideo size={16} />
              <span className="text-[11px] lg:text-xs">Playlist</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex-col gap-1 lg:flex-row">
              <Users size={16} />
              <span className="text-[11px] lg:text-xs">Anggota</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="chat"
            className="h-[480px] min-h-0 flex-1 lg:h-auto"
          >
            <ChatPanel />
          </TabsContent>
          <TabsContent
            value="playlist"
            className="min-h-[420px] flex-1 overflow-y-auto"
          >
            <PlaylistPanel />
          </TabsContent>
          <TabsContent
            value="members"
            className="min-h-[420px] flex-1 overflow-y-auto"
          >
            <MemberPanel />
          </TabsContent>
        </Tabs>
      </aside>
      <ConfirmDialog
        open={exit}
        onOpenChange={setExit}
        title="Keluar dari room?"
        description="Kamu bisa bergabung kembali melalui tautan atau kode undangan."
        confirmLabel="Keluar Room"
        onConfirm={() => {
          state.updateMember(code, me.id, { online: false });
          router.push(state.user ? "/dashboard" : "/");
        }}
      />
    </div>
  );
}
