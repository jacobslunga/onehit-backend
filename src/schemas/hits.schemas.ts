import { z } from "zod";

export const createHitSchema = z.object({
  caption: z.string().min(4).optional(),
  spotifyTrackId: z.string(),
});

export const getHitSchema = z.object({
  id: z.uuid(),
});

export type CreateHitInput = z.infer<typeof createHitSchema>;
export type GetHitInput = z.infer<typeof getHitSchema>;
