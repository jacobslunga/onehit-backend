import { Hono } from "hono";
import { requireAuth, type AuthContext } from "@/middleware/auth.middleware";
import { zValidator } from "@hono/zod-validator";
import { searchSpotifyTracks } from "@/services/spotify.service";
import { searchTracksSchema } from "@/schemas/spotify.schemas";

const spotifyRoutes = new Hono<AuthContext>().basePath("/spotify");
spotifyRoutes.use("*", requireAuth);

spotifyRoutes.get(
  "/search",
  zValidator("query", searchTracksSchema),
  async (c) => {
    const input = c.req.valid("query");
    const accessToken = c.get("accessToken");
    const tracks = await searchSpotifyTracks(input, accessToken);
    return c.json(tracks, 200);
  },
);

export default spotifyRoutes;
