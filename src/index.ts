import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

import authRoutes from "@/routes/auth";
import hitsRoutes from "@/routes/hits.routes";
import spotifyRoutes from "@/routes/spotify.routes";

const app = new Hono();
app.use("*", logger());
app.use("*", cors());

app.get("/health", (c) => c.json({ ok: true }));

app.route("/", authRoutes);
app.route("/", hitsRoutes);
app.route("/", spotifyRoutes);

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};
