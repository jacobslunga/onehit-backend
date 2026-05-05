import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

import authRoutes from "@/routes/auth";

const app = new Hono();
app.use("*", logger());
app.use("*", cors());

app.get("/health", (c) => c.json({ ok: true }));

app.route("/", authRoutes);

export default {
  port: 3000,
  fetch: app.fetch,
};
