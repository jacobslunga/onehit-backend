import { env } from "@/env";

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

export async function spotifyTokenRequest(
  body: Record<string, string>,
): Promise<SpotifyTokenResponse> {
  const basic = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new SpotifyTokenError(errorText, res.status);
  }

  return res.json() as Promise<SpotifyTokenResponse>;
}

export class SpotifyTokenError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "SpotifyTokenError";
  }
}

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}
