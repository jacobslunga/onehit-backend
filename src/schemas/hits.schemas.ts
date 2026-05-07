import { z } from "zod";

export const createHitSchema = z.object({
  caption: z.string().min(4).optional(),
  spotifyTrackId: z.string(),
});

export const getHitSchema = z.object({
  id: z.uuid(),
});

export const getFeedSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export type CreateHitInput = z.infer<typeof createHitSchema>;
export type GetHitInput = z.infer<typeof getHitSchema>;
export type GetFeedInput = z.infer<typeof getFeedSchema>;
