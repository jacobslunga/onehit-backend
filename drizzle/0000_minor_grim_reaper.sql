CREATE TABLE "follows" (
	"follower_spotify_id" text NOT NULL,
	"followee_spotify_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "follows_follower_spotify_id_followee_spotify_id_pk" PRIMARY KEY("follower_spotify_id","followee_spotify_id")
);
--> statement-breakpoint
CREATE TABLE "hits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"spotify_user_id" text NOT NULL,
	"spotify_track_id" text NOT NULL,
	"caption" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"spotify_user_id" text NOT NULL,
	"hit_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "likes_spotify_user_id_hit_id_pk" PRIMARY KEY("spotify_user_id","hit_id")
);
--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_hit_id_hits_id_fk" FOREIGN KEY ("hit_id") REFERENCES "public"."hits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "follows_followee_idx" ON "follows" USING btree ("followee_spotify_id");--> statement-breakpoint
CREATE INDEX "hits_user_idx" ON "hits" USING btree ("spotify_user_id");--> statement-breakpoint
CREATE INDEX "hits_created_idx" ON "hits" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "likes_hit_idx" ON "likes" USING btree ("hit_id");