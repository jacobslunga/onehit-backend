import { Hono } from "hono";

const feedRoutes = new Hono().basePath("/feed");

export default feedRoutes;
