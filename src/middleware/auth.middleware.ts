import { createMiddleware } from "hono/factory";

export type AuthContext = {
  Variables: {
    spotifyUserId: string;
    accessToken: string;
  };
};

export const requireAuth = createMiddleware<AuthContext>(async (c, next) => {
  const accessToken = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!accessToken) return c.json({ error: "unauthorized" }, 401);

  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return c.json({ error: "invalid token" }, 401);

  const me = (await res.json()) as { id: string };

  c.set("spotifyUserId", me.id);
  c.set("accessToken", accessToken);

  await next();
});
