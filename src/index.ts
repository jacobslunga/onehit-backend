import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import auth from "@/routes/auth";
import hits from "@/routes/hits";
import users from "@/routes/users";
import feed from "@/routes/feed";
import { errorHandler } from "@/middleware/errors";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.route("/auth", auth);
app.route("/api/hits", hits);
app.route("/api/users", users);
app.route("/api/feed", feed);

app.onError(errorHandler);

app.get("/health", (c) => c.json({ ok: true }));

export default {
  port: 3000,
  fetch: app.fetch,
};
