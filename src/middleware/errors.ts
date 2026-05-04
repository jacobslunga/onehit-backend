import type { ErrorHandler } from "hono";
import { AppError } from "@/lib/errors";

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: err.message }, err.status as 400);
  }
  console.error("unhandled error:", err);
  return c.json({ error: "internal server error" }, 500);
};
