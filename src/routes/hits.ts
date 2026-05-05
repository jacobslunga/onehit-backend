import { Hono } from "hono";
import { requireAuth, type AuthContext } from "@/middleware/auth.middleware";

const hitsRoutes = new Hono<AuthContext>().basePath("/hits");

hitsRoutes.use("*", requireAuth);

export default hitsRoutes;
