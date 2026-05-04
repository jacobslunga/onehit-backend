import { Hono } from "hono";

const feedRouter = new Hono().basePath("/feed");

export default feedRouter;
