import { and, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, follows, hits } from "@/db/schema";
import { NotFoundError, ValidationError } from "@/lib/errors";

export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function getUserByUsername(spotifyUserId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.spotifyUserId, spotifyUserId))
    .limit(1);
  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function getCurrentUser(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      spotifyUserId: users.spotifyUserId,
      displayName: users.displayName,
      email: users.email,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
      hitCount: sql<number>`(select count(*)::int from ${hits} where ${hits.userId} = ${users.id})`,
      followerCount: sql<number>`(select count(*)::int from ${follows} where ${follows.followeeId} = ${users.id})`,
      followingCount: sql<number>`(select count(*)::int from ${follows} where ${follows.followerId} = ${users.id})`,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function getUserProfile(userId: string, currentUserId: string) {
  const [user] = await db
    .select({
      id: users.id,
      spotifyUserId: users.spotifyUserId,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
      hitCount: sql<number>`(select count(*)::int from ${hits} where ${hits.userId} = ${users.id})`,
      followerCount: sql<number>`(select count(*)::int from ${follows} where ${follows.followeeId} = ${users.id})`,
      followingCount: sql<number>`(select count(*)::int from ${follows} where ${follows.followerId} = ${users.id})`,
      followedByMe: sql<boolean>`exists(select 1 from ${follows} where ${follows.followerId} = ${currentUserId} and ${follows.followeeId} = ${users.id})`,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function followUser(followerId: string, followeeId: string) {
  if (followerId === followeeId) {
    throw new ValidationError("You cannot follow yourself");
  }

  await db
    .insert(follows)
    .values({ followerId, followeeId })
    .onConflictDoNothing();
}

export async function unfollowUser(followerId: string, followeeId: string) {
  await db
    .delete(follows)
    .where(
      and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)),
    );
}

export async function getFollowers(
  userId: string,
  limit = 20,
  cursor?: Date,
) {
  const items = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      followedAt: follows.createdAt,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(
      and(
        eq(follows.followeeId, userId),
        cursor ? sql`${follows.createdAt} < ${cursor}` : undefined,
      ),
    )
    .orderBy(sql`${follows.createdAt} desc`)
    .limit(limit + 1);

  const hasNextPage = items.length > limit;
  const results = hasNextPage ? items.slice(0, limit) : items;
  const nextCursor = hasNextPage
    ? results[results.length - 1].followedAt.toISOString()
    : null;

  return { items: results, nextCursor };
}

export async function getFollowing(
  userId: string,
  limit = 20,
  cursor?: Date,
) {
  const items = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      followedAt: follows.createdAt,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followeeId, users.id))
    .where(
      and(
        eq(follows.followerId, userId),
        cursor ? sql`${follows.createdAt} < ${cursor}` : undefined,
      ),
    )
    .orderBy(sql`${follows.createdAt} desc`)
    .limit(limit + 1);

  const hasNextPage = items.length > limit;
  const results = hasNextPage ? items.slice(0, limit) : items;
  const nextCursor = hasNextPage
    ? results[results.length - 1].followedAt.toISOString()
    : null;

  return { items: results, nextCursor };
}

export async function searchUsers(query: string, limit = 20) {
  return db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(ilike(users.displayName, `%${query}%`))
    .limit(limit);
}
