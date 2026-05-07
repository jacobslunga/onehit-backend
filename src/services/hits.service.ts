import { db } from "@/db";
import { hits } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { HitResponse, SpotifyTrackMeta } from "@/types/hit.types";
import type { CreateHitInput } from "@/schemas/hits.schemas";

async function fetchSpotifyTrackMeta(
  spotifyTrackId: string,
  accessToken: string,
): Promise<SpotifyTrackMeta> {
  const res = await fetch(
    `https://api.spotify.com/v1/tracks/${spotifyTrackId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  const data = await res.json();
  return {
    trackName: data.name,
    artistName: data.artists[0].name,
    albumName: data.album.name,
    albumImageUrl: data.album.images[0].url,
    previewUrl: data.preview_url,
  };
}

export async function createHit(spotifyUserId: string, input: CreateHitInput) {
  const [hit] = await db
    .insert(hits)
    .values({ spotifyUserId, ...input })
    .returning();
  return hit;
}

export async function getHitById(
  hitId: string,
  accessToken: string,
): Promise<HitResponse | null> {
  const hit = await db.query.hits.findFirst({
    where: eq(hits.id, hitId),
  });

  if (!hit) return null;

  const track = await fetchSpotifyTrackMeta(hit.spotifyTrackId, accessToken);

  return {
    ...hit,
    createdAt: hit.createdAt.toISOString(),
    track,
  };
}
