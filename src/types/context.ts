import type { SpotifyApi } from "@spotify/web-api-ts-sdk";

export type AppVariables = {
  userId: string;
  sessionId: string;
  spotify: SpotifyApi;
};

export type AppEnv = {
  Variables: AppVariables;
};
