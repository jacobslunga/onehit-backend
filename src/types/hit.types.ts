import type { SpotifyTrack } from "./spotify.types";

export interface HitPoster {
  spotifyUserId: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface HitResponse {
  id: string;
  spotifyUserId: string;
  spotifyTrackId: string;
  caption: string | null;
  createdAt: string;
  track: SpotifyTrack;
  poster: HitPoster;
}
