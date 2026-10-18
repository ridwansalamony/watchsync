import type { Video } from "@watchsync/shared/types";
import { durationSeconds } from "@watchsync/shared/video-policy";
interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { medium?: { url: string }; default?: { url: string } };
  };
  contentDetails: { duration: string; contentRating?: { ytRating?: string } };
  status: { embeddable: boolean; privacyStatus: string };
}
export async function youtubeVideos(ids: string[]): Promise<Video[]> {
  if (!ids.length) return [];
  if (ids.length > 50) {
    const batches: Video[][] = [];
    for (let i = 0; i < ids.length; i += 50)
      batches.push(await youtubeVideos(ids.slice(i, i + 50)));
    return batches.flat();
  }
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${ids.join(",")}&key=${encodeURIComponent(process.env.YOUTUBE_API_KEY!)}`,
    { cache: "no-store" },
  );
  if (!response.ok) throw new Error("YouTube belum dapat dihubungi.");
  const data = (await response.json()) as { items: YouTubeVideo[] };
  return data.items
    .filter(
      (v) =>
        v.status.embeddable &&
        v.status.privacyStatus === "public" &&
        v.contentDetails.contentRating?.ytRating !== "ytAgeRestricted" &&
        durationSeconds(v.contentDetails.duration) >= 0 &&
        durationSeconds(v.contentDetails.duration) <= 21600,
    )
    .map((v, position) => {
      return {
        id: v.id,
        youtubeVideoId: v.id,
        title: v.snippet.title,
        channelTitle: v.snippet.channelTitle,
        thumbnailUrl:
          v.snippet.thumbnails.medium?.url ??
          v.snippet.thumbnails.default?.url ??
          "",
        durationSec: durationSeconds(v.contentDetails.duration),
        position,
        addedByMemberId: "",
      };
    });
}
