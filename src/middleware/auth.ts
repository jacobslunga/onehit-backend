import type { MiddlewareHandler } from "hono";
import { eq } from "drizzle-orm";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { refreshSpotifyToken } from "@/services/auth.service";
import { env } from "@/env";
import type { AppEnv } from "@/types/context";
import { UnauthorizedError } from "@/lib/errors";

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer "))
    throw new UnauthorizedError("Missing token");

  const sessionId = auth.slice(7);
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) throw new UnauthorizedError("Invalid session");

  let accessToken = session.accessToken;
  if (Date.now() > session.expiresAt - 60_000) {
    accessToken = await refreshSpotifyToken(session);
  }

  const sdk = SpotifyApi.withAccessToken(env.SPOTIFY_CLIENT_ID, {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: session.refreshToken,
  });

  c.set("userId", session.userId);
  c.set("sessionId", session.id);
  c.set("spotify", sdk);

  await next();
};
