import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  real,
  boolean,
  timestamp,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ==================== ENUM ====================
export const memberRoleEnum = pgEnum("member_role", [
  "owner",
  "moderator",
  "member",
]);
export const roomPrivacyEnum = pgEnum("room_privacy", [
  "public",
  "unlisted",
  "private",
]);
export const controlModeEnum = pgEnum("control_mode", [
  "owner_only",
  "moderators",
  "everyone",
]);
export const playbackStatusEnum = pgEnum("playback_status", [
  "playing",
  "paused",
]);
export const moderationActionEnum = pgEnum("moderation_action", [
  "mute",
  "unmute",
  "kick",
  "promote",
  "demote",
]);

// ==================== AUTH (Auth.js Adapter) ====================
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 80 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  image: text("image"),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(),
    provider: varchar("provider", { length: 50 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 50 }),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

// ==================== ROOM ====================
export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 8 }).notNull().unique(),
    name: varchar("name", { length: 60 }).notNull(),
    description: varchar("description", { length: 280 }),
    privacy: roomPrivacyEnum("privacy").default("unlisted").notNull(),
    passwordHash: text("password_hash"),
    controlMode: controlModeEnum("control_mode")
      .default("owner_only")
      .notNull(),
    maxMembers: integer("max_members").default(50).notNull(),
    ownerUserId: uuid("owner_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ownerGuestId: varchar("owner_guest_id", { length: 64 }),
    currentVideoId: varchar("current_video_id", { length: 20 }),
    playbackStatus: playbackStatusEnum("playback_status")
      .default("paused")
      .notNull(),
    playbackPosition: real("playback_position").default(0).notNull(),
    playbackUpdatedAt: timestamp("playback_updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("rooms_privacy_activity_idx").on(t.privacy, t.lastActivityAt),
    index("rooms_owner_user_idx").on(t.ownerUserId),
  ],
);

// ==================== ANGGOTA ROOM ====================
export const roomMembers = pgTable(
  "room_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    guestId: varchar("guest_id", { length: 64 }),
    displayName: varchar("display_name", { length: 24 }).notNull(),
    avatarUrl: text("avatar_url"),
    role: memberRoleEnum("role").default("member").notNull(),
    isMuted: boolean("is_muted").default(false).notNull(),
    blockedUntil: timestamp("blocked_until", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("room_members_room_guest_uidx").on(t.roomId, t.guestId),
    uniqueIndex("room_members_room_user_uidx").on(t.roomId, t.userId),
    index("room_members_room_idx").on(t.roomId),
  ],
);

// ==================== PLAYLIST ROOM ====================
export const playlistItems = pgTable(
  "playlist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    youtubeVideoId: varchar("youtube_video_id", { length: 20 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    channelTitle: varchar("channel_title", { length: 120 }),
    thumbnailUrl: text("thumbnail_url"),
    durationSec: integer("duration_sec").default(0).notNull(),
    position: integer("position").notNull(),
    addedByMemberId: uuid("added_by_member_id").references(
      () => roomMembers.id,
      {
        onDelete: "set null",
      },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("playlist_room_position_idx").on(t.roomId, t.position)],
);

// ==================== CHAT ====================
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").references(() => roomMembers.id, {
      onDelete: "set null",
    }),
    body: varchar("body", { length: 300 }).notNull(),
    isSystem: boolean("is_system").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("chat_room_created_idx").on(t.roomId, t.createdAt)],
);

// ==================== LOG MODERASI ====================
export const moderationLogs = pgTable(
  "moderation_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    actorMemberId: uuid("actor_member_id").references(() => roomMembers.id, {
      onDelete: "set null",
    }),
    targetMemberId: uuid("target_member_id").references(() => roomMembers.id, {
      onDelete: "set null",
    }),
    action: moderationActionEnum("action").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("moderation_room_idx").on(t.roomId)],
);

// ==================== DASHBOARD MEMBER ====================
export const savedRooms = pgTable(
  "saved_rooms",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    savedAt: timestamp("saved_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roomId] })],
);

export const userPlaylists = pgTable(
  "user_playlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("user_playlists_user_idx").on(t.userId)],
);

export const userPlaylistItems = pgTable(
  "user_playlist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playlistId: uuid("playlist_id")
      .notNull()
      .references(() => userPlaylists.id, { onDelete: "cascade" }),
    youtubeVideoId: varchar("youtube_video_id", { length: 20 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    thumbnailUrl: text("thumbnail_url"),
    position: integer("position").notNull(),
  },
  (t) => [
    index("user_playlist_items_playlist_idx").on(t.playlistId, t.position),
  ],
);

export const watchHistory = pgTable(
  "watch_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roomId: uuid("room_id").references(() => rooms.id, {
      onDelete: "set null",
    }),
    youtubeVideoId: varchar("youtube_video_id", { length: 20 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    thumbnailUrl: text("thumbnail_url"),
    watchedSeconds: integer("watched_seconds").default(0).notNull(),
    watchedAt: timestamp("watched_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("watch_history_user_idx").on(t.userId, t.watchedAt)],
);
