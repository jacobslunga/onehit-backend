import { Hono } from "hono";
import { requireAuth, type AuthContext } from "@/middleware/auth.middleware";
import { zValidator } from "@hono/zod-validator";
import { createHit, getHitById, getHitsFeed } from "@/services/hits.service";
import {
  createHitSchema,
  getHitSchema,
  getFeedSchema,
} from "@/schemas/hits.schemas";

const hitsRoutes = new Hono<AuthContext>().basePath("/hits");

hitsRoutes.use("*", requireAuth);

hitsRoutes.post("/", zValidator("json", createHitSchema), async (c) => {
  const spotifyUserId = c.get("spotifyUserId");
  const accessToken = c.get("accessToken");
  const input = c.req.valid("json");
  const hit = await createHit(spotifyUserId, input, accessToken);
  return c.json(hit, 201);
});

hitsRoutes.get("/feed", zValidator("query", getFeedSchema), async (c) => {
  const input = c.req.valid("query");
  const accessToken = c.get("accessToken");
  const feed = await getHitsFeed(accessToken, input);
  return c.json(feed, 200);
});

hitsRoutes.get("/:id", zValidator("param", getHitSchema), async (c) => {
  const { id } = c.req.valid("param");
  const accessToken = c.get("accessToken");
  const hit = await getHitById(id, accessToken);
  if (!hit) return c.json({ error: "Hit not found" }, 404);
  return c.json(hit, 200);
});

export default hitsRoutes;
