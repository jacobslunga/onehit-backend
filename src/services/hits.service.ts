import { db } from "@/db";
import { hits } from "@/db/schema";
import { eq, lt } from "drizzle-orm";
import type { HitResponse, HitPoster } from "@/types/hit.types";
import type { SpotifyTrack } from "@/types/spotify.types";
import type { CreateHitInput, GetFeedInput } from "@/schemas/hits.schemas";

async function fetchSpotifyTrackMeta(
  spotifyTrackId: string,
  accessToken: string,
): Promise<SpotifyTrack> {
  const res = await fetch(
    `https://api.spotify.com/v1/tracks/${spotifyTrackId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  const data = await res.json();
  return {
    spotifyTrackId,
    trackName: data.name,
    artistName: data.artists[0].name,
    albumName: data.album.name,
    albumImageUrl: data.album.images[0].url,
    previewUrl: data.preview_url,
  };
}

async function fetchSpotifyUserProfile(
  spotifyUserId: string,
  accessToken: string,
): Promise<HitPoster> {
  const res = await fetch(`https://api.spotify.com/v1/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return {
    spotifyUserId,
    displayName: data.display_name ?? spotifyUserId,
    avatarUrl: data.images?.[0]?.url ?? null,
  };
}

export async function createHit(
  spotifyUserId: string,
  input: CreateHitInput,
  accessToken: string,
): Promise<HitResponse> {
  const [hit] = await db
    .insert(hits)
    .values({ spotifyUserId, ...input })
    .returning();

  const [track, poster] = await Promise.all([
    fetchSpotifyTrackMeta(hit.spotifyTrackId, accessToken),
    fetchSpotifyUserProfile(hit.spotifyUserId, accessToken),
  ]);

  return { ...hit, createdAt: hit.createdAt.toISOString(), track, poster };
}

export async function getHitById(
  hitId: string,
  accessToken: string,
): Promise<HitResponse | null> {
  const hit = await db.query.hits.findFirst({
    where: eq(hits.id, hitId),
  });

  if (!hit) return null;

  const [track, poster] = await Promise.all([
    fetchSpotifyTrackMeta(hit.spotifyTrackId, accessToken),
    fetchSpotifyUserProfile(hit.spotifyUserId, accessToken),
  ]);

  return { ...hit, createdAt: hit.createdAt.toISOString(), track, poster };
}

export async function getHitsFeed(
  accessToken: string,
  input: GetFeedInput,
): Promise<{ hits: HitResponse[]; nextCursor: string | null }> {
  const { cursor, limit } = input;

  const rows = await db.query.hits.findMany({
    where: cursor ? lt(hits.createdAt, new Date(cursor)) : undefined,
    orderBy: (hits, { desc }) => [desc(hits.createdAt)],
    limit: limit + 1,
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore
    ? page[page.length - 1].createdAt.toISOString()
    : null;

  const enriched = await Promise.all(
    page.map(async (hit) => {
      const [track, poster] = await Promise.all([
        fetchSpotifyTrackMeta(hit.spotifyTrackId, accessToken),
        fetchSpotifyUserProfile(hit.spotifyUserId, accessToken),
      ]);
      return { ...hit, createdAt: hit.createdAt.toISOString(), track, poster };
    }),
  );

  return { hits: enriched, nextCursor };
}
