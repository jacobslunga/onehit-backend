import { Hono } from "hono";

const hitsRouter = new Hono().basePath("/hits");

export default hitsRouter;
