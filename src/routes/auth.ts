import { Hono } from "hono";

const authRoutes = new Hono().basePath("/auth");

export default authRoutes;
