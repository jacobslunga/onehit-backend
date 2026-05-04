import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  SPOTIFY_CLIENT_ID: z.string().min(1),
  SPOTIFY_CLIENT_SECRET: z.string().min(1),
  SPOTIFY_REDIRECT_URI: z.string().url(),
  APP_REDIRECT: z.string().min(1),
});

export const env = schema.parse(process.env);
