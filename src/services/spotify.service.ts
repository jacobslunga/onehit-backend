import type { SpotifyTrack } from "@/types/spotify.types";
import type { SearchTracksInput } from "@/schemas/spotify.schemas";

export async function searchSpotifyTracks(
  input: SearchTracksInput,
  accessToken: string,
): Promise<SpotifyTrack[]> {
  const params = new URLSearchParams({
    q: input.q,
    type: "track",
    limit: input.limit.toString(),
  });

  const res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json();

  return data.tracks.items.map((item: any) => ({
    spotifyTrackId: item.id,
    trackName: item.name,
    artistName: item.artists[0].name,
    albumName: item.album.name,
    albumImageUrl: item.album.images[0].url,
    previewUrl: item.preview_url,
  }));
}
