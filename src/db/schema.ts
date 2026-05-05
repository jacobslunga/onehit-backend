import {
  pgTable,
  uuid,
  text,
  timestamp,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const hits = pgTable(
  "hits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    spotifyUserId: text("spotify_user_id").notNull(),
    spotifyTrackId: text("spotify_track_id").notNull(),
    caption: text("caption"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("hits_user_idx").on(t.spotifyUserId),
    index("hits_created_idx").on(t.createdAt),
  ],
);

export const likes = pgTable(
  "likes",
  {
    spotifyUserId: text("spotify_user_id").notNull(),
    hitId: uuid("hit_id")
      .notNull()
      .references(() => hits.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.spotifyUserId, t.hitId] }),
    index("likes_hit_idx").on(t.hitId),
  ],
);

export const follows = pgTable(
  "follows",
  {
    followerSpotifyId: text("follower_spotify_id").notNull(),
    followeeSpotifyId: text("followee_spotify_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.followerSpotifyId, t.followeeSpotifyId] }),
    index("follows_followee_idx").on(t.followeeSpotifyId),
  ],
);

export const hitsRelations = relations(hits, ({ many }) => ({
  likes: many(likes),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  hit: one(hits, { fields: [likes.hitId], references: [hits.id] }),
}));
