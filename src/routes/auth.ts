import { Hono } from "hono";
import { env } from "@/env";
import { tempCodes } from "@/lib/tempCodes";
import { spotifyTokenRequest, SpotifyTokenError } from "@/lib/spotify";

const authRoutes = new Hono();

authRoutes.get("/login", async (c) => {
  const scope = [
    "user-read-private",
    "user-read-email",
    "user-top-read",
    "user-read-recently-played",
    "user-library-read",
    "user-library-modify",
    "playlist-read-private",
    "playlist-modify-private",
  ].join(" ");

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: env.SPOTIFY_REDIRECT_URI,
    state,
  });

  return c.redirect("https://accounts.spotify.com/authorize?" + params);
});

authRoutes.get("/callback", async (c) => {
  const code = c.req.query("code");
  const error = c.req.query("error");
  if (error) return c.text(`Spotify error: ${error}`, 400);
  if (!code) return c.text("Missing code", 400);

  try {
    const tokens = await spotifyTokenRequest({
      grant_type: "authorization_code",
      code,
      redirect_uri: env.SPOTIFY_REDIRECT_URI,
    });

    const tempCode = crypto.randomUUID();
    tempCodes.set(tempCode, tokens);
    setTimeout(() => tempCodes.delete(tempCode), 60_000);

    return c.redirect(`onehit://auth?code=${tempCode}`);
  } catch (err) {
    if (err instanceof SpotifyTokenError) {
      return c.text(`Token exchange failed: ${err.message}`, 500);
    }
    throw err;
  }
});

authRoutes.post("/exchange", async (c) => {
  const { code } = await c.req.json();
  if (!code) return c.json({ error: "missing code" }, 400);

  const tokens = tempCodes.get(code);
  if (!tokens) return c.json({ error: "invalid or expired code" }, 400);

  tempCodes.delete(code);
  return c.json(tokens);
});

authRoutes.post("/refresh", async (c) => {
  const { refresh_token } = await c.req.json();
  if (!refresh_token) return c.json({ error: "missing refresh_token" }, 400);

  try {
    const tokens = await spotifyTokenRequest({
      grant_type: "refresh_token",
      refresh_token,
    });
    return c.json(tokens);
  } catch (err) {
    if (err instanceof SpotifyTokenError) {
      return c.json({ error: err.message }, 500);
    }
    throw err;
  }
});

export default authRoutes;
