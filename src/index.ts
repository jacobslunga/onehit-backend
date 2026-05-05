import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { env } from "./env";
import { hostname } from "zod";

const app = new Hono();
app.use("*", logger());
app.use("*", cors());

const tempCodes = new Map<string, any>();

app.get("/health", (c) => c.json({ ok: true }));

app.get("/login", async (c) => {
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

app.get("/callback", async (c) => {
  const code = c.req.query("code");
  const error = c.req.query("error");
  if (error) return c.text(`Spotify error: ${error}`, 400);
  if (!code) return c.text("Missing code", 400);

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: env.SPOTIFY_REDIRECT_URI,
  });
  const basic = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) return c.text(`Token exchange failed: ${await res.text()}`, 500);

  const tokens = await res.json();

  const tempCode = crypto.randomUUID();
  tempCodes.set(tempCode, tokens);
  setTimeout(() => tempCodes.delete(tempCode), 60_000);

  return c.redirect(`onehit://auth?code=${tempCode}`);
});

app.post("/exchange", async (c) => {
  const { code } = await c.req.json();
  if (!code) return c.json({ error: "missing code" }, 400);

  const tokens = tempCodes.get(code);
  if (!tokens) return c.json({ error: "invalid or expired code" }, 400);

  tempCodes.delete(code);
  return c.json(tokens);
});

app.post("/refresh", async (c) => {
  const { refresh_token } = await c.req.json();
  if (!refresh_token) return c.json({ error: "missing refresh_token" }, 400);

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token,
  });
  const basic = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) return c.json({ error: await res.text() }, 500);

  const tokens = await res.json();
  return c.json(tokens);
});

export default {
  port: 3000,
  fetch: app.fetch,
};
