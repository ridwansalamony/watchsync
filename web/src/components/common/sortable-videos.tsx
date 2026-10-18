"use client";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Play } from "lucide-react";
import type { Video } from "@watchsync/shared/types";
import { Button } from "@/components/ui/button";
import { duration } from "@/lib/utils";
function Item({
  video,
  editable,
  onRemove,
  onPlay,
  current,
  contributors,
}: {
  video: Video;
  editable: boolean;
  onRemove: (id: string) => void;
  onPlay?: (id: string) => void;
  current?: boolean;
  contributors?: Record<string, string>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id, disabled: !editable });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : undefined,
        position: "relative",
      }}
      className={`flex items-center gap-2 rounded-lg border p-2.5 ${current ? "border-primary/50 bg-primary/8" : "border-white/8 bg-card"} ${isDragging ? "opacity-60" : ""}`}
    >
      {editable && (
        <button
          {...attributes}
          {...listeners}
          aria-roledescription="video yang dapat dipindahkan"
          className="touch-none rounded p-1 text-muted-foreground hover:text-foreground"
          aria-label={`Ubah urutan ${video.title}`}
        >
          <GripVertical size={17} />
        </button>
      )}
      <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-md">
        <Image
          src={video.thumbnailUrl}
          alt=""
          fill
          sizes="100px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-xs font-medium leading-5">
          {video.title}
        </p>
        <p className="mt-1 truncate text-[10px] text-muted-foreground">
          {video.channelTitle}{" "}
          <span className="font-mono">{duration(video.durationSec)}</span>
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {contributors
            ? `Oleh ${contributors[video.addedByMemberId] ?? "anggota"} · ${video.createdAt ? new Date(video.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "20.00"}`
            : current
              ? "Sedang dipilih"
              : "Ditambahkan ke antrean"}
        </p>
      </div>
      {onPlay && (
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Putar ${video.title}`}
          onClick={() => onPlay(video.id)}
        >
          <Play size={14} />
        </Button>
      )}
      {editable && (
        <Button
          size="icon"
          variant="ghost"
          className="size-7 shrink-0 text-muted-foreground hover:text-red-300"
          aria-label={`Hapus ${video.title}`}
          onClick={() => onRemove(video.id)}
        >
          <Trash2 size={14} />
        </Button>
      )}
    </div>
  );
}
export function SortableVideos({
  videos,
  onReorder,
  onRemove,
  editable = true,
  onPlay,
  currentVideoId,
  contributors,
}: {
  videos: Video[];
  onReorder: (videos: Video[]) => void;
  onRemove: (id: string) => void;
  editable?: boolean;
  onPlay?: (id: string) => void;
  currentVideoId?: string | null;
  contributors?: Record<string, string>;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  function end(e: DragEndEvent) {
    if (!editable || !e.over || e.active.id === e.over.id) return;
    const from = videos.findIndex((v) => v.id === e.active.id),
      to = videos.findIndex((v) => v.id === e.over!.id);
    onReorder(
      arrayMove(videos, from, to).map((v, position) => ({ ...v, position })),
    );
  }
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={end}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) =>
            `Video ${videos.find((v) => v.id === active.id)?.title ?? ""} dipilih.`,
          onDragOver: ({ over }) =>
            over
              ? `Posisi tujuan ${videos.findIndex((v) => v.id === over.id) + 1}.`
              : "Video berada di luar daftar.",
          onDragEnd: ({ over }) =>
            over
              ? `Video diletakkan pada posisi ${videos.findIndex((v) => v.id === over.id) + 1}.`
              : "Pemindahan selesai.",
          onDragCancel: () => "Pemindahan video dibatalkan.",
        },
        screenReaderInstructions: {
          draggable:
            "Tekan spasi untuk memilih video, panah untuk memindahkan, dan spasi untuk meletakkan. Escape untuk membatalkan.",
        },
      }}
    >
      <SortableContext
        items={videos.map((v) => v.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid gap-2">
          {videos.map((v) => (
            <Item
              key={v.id}
              video={v}
              editable={editable}
              onRemove={onRemove}
              onPlay={onPlay}
              current={v.id === currentVideoId}
              contributors={contributors}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
