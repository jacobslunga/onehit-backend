import { z } from "zod";

export const searchTracksSchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export type SearchTracksInput = z.infer<typeof searchTracksSchema>;
