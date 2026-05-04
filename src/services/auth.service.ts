import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { env } from "@/env";
import { UnauthorizedError } from "@/lib/errors";

type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
};

type SpotifyProfile = {
  id: string;
  display_name: string | null;
  email: string;
  images: { url: string }[];
};

export function buildAuthorizeUrl(state: string) {
  const scopes = [
    "user-read-private",
    "user-read-email",
    "playlist-read-private",
    "user-library-read",
  ].join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri: env.SPOTIFY_REDIRECT_URI,
    state,
  });

  return `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<SpotifyTokenResponse> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(
        `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`,
      )}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: env.SPOTIFY_REDIRECT_URI,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify token exchange failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<SpotifyTokenResponse>;
}

export async function fetchSpotifyProfile(
  accessToken: string,
): Promise<SpotifyProfile> {
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok)
    throw new Error(`Failed to fetch Spotify profile: ${res.status}`);
  return res.json() as Promise<SpotifyProfile>;
}

export async function upsertUserFromSpotify(profile: SpotifyProfile) {
  const avatarUrl = profile.images[0]?.url ?? null;

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.spotifyUserId, profile.id))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        displayName: profile.display_name,
        email: profile.email,
        avatarUrl,
      })
      .where(eq(users.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(users)
    .values({
      spotifyUserId: profile.id,
      displayName: profile.display_name,
      email: profile.email,
      avatarUrl,
    })
    .returning();
  return created;
}

export async function createSession(input: {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}) {
  const [session] = await db
    .insert(sessions)
    .values({
      userId: input.userId,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      expiresAt: Date.now() + input.expiresIn * 1000,
    })
    .returning();
  return session;
}

export async function refreshSpotifyToken(session: {
  id: string;
  refreshToken: string;
}): Promise<string> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(
        `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`,
      )}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
    }),
  });

  if (!res.ok) {
    throw new UnauthorizedError("Failed to refresh Spotify token");
  }

  const data = (await res.json()) as SpotifyTokenResponse;

  await db
    .update(sessions)
    .set({
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      ...(data.refresh_token && { refreshToken: data.refresh_token }),
    })
    .where(eq(sessions.id, session.id));

  return data.access_token;
}

export async function deleteSession(sessionId: string) {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}
