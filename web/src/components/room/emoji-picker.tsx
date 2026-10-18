"use client";
const emojis = [
  "😀",
  "😂",
  "🥹",
  "😍",
  "😱",
  "🤔",
  "😎",
  "🥳",
  "😭",
  "🤣",
  "👏",
  "🙏",
  "👍",
  "❤️",
  "🔥",
  "🍿",
  "🎬",
  "✨",
  "👀",
  "💯",
  "🎉",
  "🙌",
  "😴",
  "🤩",
];
export default function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute bottom-full left-0 z-30 mb-3 w-64 rounded-xl border border-white/15 bg-card p-3 shadow-xl"
      role="group"
      aria-label="Pilih emoji"
    >
      <div className="mb-2 flex justify-between text-xs text-muted-foreground">
        <span>Tambahkan ekspresi</span>
        <button onClick={onClose} aria-label="Tutup pemilih emoji">
          Tutup
        </button>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            className="rounded-md p-2 text-xl hover:bg-white/10"
            aria-label={`Emoji ${emoji}`}
            onClick={() => onSelect(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
