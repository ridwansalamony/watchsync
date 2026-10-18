export type Role = "owner" | "moderator" | "member";
export type Privacy = "public" | "unlisted" | "private";
export type ControlMode = "owner_only" | "moderators" | "everyone";
export interface User {
  id: string;
  name: string;
  email: string;
  image: string;
}
export interface Member {
  id: string;
  displayName: string;
  avatarUrl: string;
  role: Role;
  isMuted: boolean;
  online: boolean;
  speaking?: boolean;
}
export interface Video {
  id: string;
  youtubeVideoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSec: number;
  position: number;
  addedByMemberId: string;
  createdAt?: string;
}
export interface Message {
  id: string;
  memberId: string | null;
  body: string;
  isSystem: boolean;
  createdAt: string;
}
export interface Room {
  id: string;
  code: string;
  name: string;
  description: string;
  privacy: Privacy;
  controlMode: ControlMode;
  hasPassword: boolean;
  maxMembers: number;
  ownerName: string;
  memberCount: number;
  image: string;
  category: string;
  members: Member[];
  videos: Video[];
  messages: Message[];
  currentVideoId: string | null;
  playbackStatus: "playing" | "paused";
  playbackPosition: number;
  invited: boolean;
  blockedUntil?: number;
}
export interface Playlist {
  id: string;
  name: string;
  videos: Video[];
  updatedAt: string;
}
export interface History {
  id: string;
  roomId: string;
  roomName: string;
  video: Video;
  watchedSeconds: number;
  watchedAt: string;
}
export const roleLabels: Record<Role, string> = {
  owner: "Owner",
  moderator: "Moderator",
  member: "Member",
};
export const privacyLabels: Record<Privacy, string> = {
  public: "Publik",
  unlisted: "Tautan saja",
  private: "Privat",
};
export function canControl(role: Role, mode: ControlMode) {
  return (
    role === "owner" ||
    (role === "moderator" && mode === "moderators") ||
    mode === "everyone"
  );
}
export function canAddVideo(role: Role, mode: ControlMode) {
  return role === "owner" || role === "moderator" || mode === "everyone";
}
export function canModerate(actor: Role, target: Role) {
  return (
    target !== "owner" &&
    (actor === "owner" || (actor === "moderator" && target === "member"))
  );
}
