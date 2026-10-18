"use client";
import { roomCommand, reportError } from "@/lib/realtime-client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { m as animated, useReducedMotion } from "framer-motion";
import { Send, Smile, MessageCircle, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { messageSchema } from "@watchsync/shared/validation";
import { useRoom } from "@/hooks/use-room";
import { useAppStore } from "@/stores/app-store";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const EmojiPicker = dynamic(() => import("./emoji-picker"), { ssr: false });
function SafeMessage({ body }: { body: string }) {
  return (
    <>
      {body.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="break-all text-indigo-300 underline"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
export function ChatPanel() {
  const { room, me, code } = useRoom();
  const [text, setText] = useState("");
  const [emoji, setEmoji] = useState(false);
  const timestamps = useRef<number[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const typing = useAppStore((s) => s.typing);
  const typingNames = room.members
    .filter((m) => m.id !== me.id && (typing[code]?.[m.id] ?? 0) > Date.now())
    .map((m) => m.displayName);
  useEffect(() => {
    if (me.isMuted) return;
    const timer = setTimeout(() => {
      void roomCommand(code, "chat:typing", !!text.trim()).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [code, text, me.isMuted]);
  useEffect(() => {
    end.current?.scrollIntoView({
      behavior: reduce ? "instant" : "smooth",
      block: "nearest",
    });
  }, [room.messages.length, reduce]);
  return (
    <div className="flex h-full min-h-[420px] flex-col">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <p className="text-xs font-medium">Obrolan dimulai di sini</p>
        <span className="text-[10px] text-muted-foreground">
          {room.messages.filter((m) => !m.isSystem).length} pesan
        </span>
      </div>
      <div
        role="log"
        aria-label="Pesan chat room"
        aria-live="polite"
        className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4"
      >
        {!room.messages.length && (
          <div className="py-12 text-center">
            <MessageCircle className="mx-auto mb-4 text-primary" />
            <p className="text-sm">Mulai obrolan pertama.</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Sapa teman-teman di room!
            </p>
          </div>
        )}
        {room.messages.map((message) => {
          const member = room.members.find((m) => m.id === message.memberId);
          return message.isSystem ? (
            <p
              className="text-center text-[10px] leading-5 text-muted-foreground"
              key={message.id}
            >
              {message.body}
            </p>
          ) : (
            <animated.div
              key={message.id}
              initial={reduce ? false : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-2.5"
            >
              <Avatar
                src={member?.avatarUrl ?? ""}
                name={member?.displayName ?? "Mantan anggota"}
                className="size-7"
              />
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-semibold ${member?.role === "owner" ? "text-amber-300" : member?.role === "moderator" ? "text-sky-300" : "text-foreground"}`}
                  >
                    {member?.displayName ?? "Mantan anggota"}
                    {member?.id === me.id ? " (kamu)" : ""}
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground">
                    {new Date(message.createdAt).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="break-words text-xs leading-6 text-slate-300">
                  <SafeMessage body={message.body} />
                </p>
              </div>
            </animated.div>
          );
        })}
        <div ref={end} />
      </div>
      <div className="border-t border-white/8 p-3">
        {me.isMuted ? (
          <p className="mb-3 flex gap-2 rounded-lg bg-destructive/10 p-3 text-xs leading-6 text-red-200">
            <VolumeX size={16} className="mt-1 shrink-0" />
            Kamu sedang dibisukan oleh moderator. Kamu tetap bisa menonton dan
            mendengarkan.
          </p>
        ) : null}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (me.isMuted) return;
            const parsed = messageSchema.safeParse(text);
            if (!parsed.success) {
              toast.error(parsed.error.errors[0].message);
              return;
            }
            const now = Date.now();
            timestamps.current = timestamps.current.filter(
              (t) => now - t < 10_000,
            );
            if (timestamps.current.length >= 5) {
              toast.error(
                "Pelan-pelan ya. Kamu bisa mengirim 5 pesan setiap 10 detik.",
              );
              return;
            }
            timestamps.current.push(now);
            try {
              await roomCommand(code, "chat:send", parsed.data);
            } catch (err) {
              reportError(err);
              return;
            }
            setText("");
            setEmoji(false);
          }}
        >
          <div className="relative flex items-center gap-1.5">
            <label className="sr-only" htmlFor="chat-message">
              Tulis pesan
            </label>
            <Input
              id="chat-message"
              placeholder={
                me.isMuted ? "Kamu sedang dibisukan" : "Tulis pesan..."
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={300}
              disabled={me.isMuted}
              className="h-10 pr-9 text-xs"
            />
            <div className="absolute right-12">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8"
                aria-label="Pilih emoji chat"
                disabled={me.isMuted}
                onClick={() => setEmoji(!emoji)}
              >
                <Smile />
              </Button>
            </div>
            <Button
              type="submit"
              size="icon"
              className="size-10"
              disabled={me.isMuted || !text.trim()}
              aria-label="Kirim pesan"
            >
              <Send />
            </Button>
            {emoji && (
              <EmojiPicker
                onClose={() => setEmoji(false)}
                onSelect={(e) => setText((t) => (t + e).slice(0, 300))}
              />
            )}
          </div>
          <div className="mt-2 flex justify-between text-[9px] text-muted-foreground">
            <span>
              {typingNames.length
                ? typingNames.slice(0, 2).join(", ") + " sedang mengetik…"
                : "Enter untuk mengirim"}
            </span>
            <span>{text.length}/300</span>
          </div>
        </form>
      </div>
    </div>
  );
}
