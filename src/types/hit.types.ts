export interface SpotifyTrackMeta {
  trackName: string;
  artistName: string;
  albumName: string;
  albumImageUrl: string;
  previewUrl: string | null;
}

export interface HitResponse {
  id: string;
  spotifyUserId: string;
  spotifyTrackId: string;
  caption: string | null;
  createdAt: string;
  track: SpotifyTrackMeta;
}
