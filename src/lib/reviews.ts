// Reading and writing reviews and helpful votes in the Supabase database.
// Every function throws an Error if the database says no, so the page can show a message.
"use client";

import type { EntertainmentItem } from "@/data/entertainment";
import { supabase } from "@/lib/supabase";

// A review as the page uses it.
export type Review = {
  id: number;
  userId: string;
  authorName: string;
  rating: number; // 1 to 5 stars
  body: string; // can be empty: a rating on its own is fine
  isPublic: boolean; // false means only the author can see it
  createdAt: string;
  likedBy: string[]; // ids of the users who marked it helpful
};

// The shape the database sends back for the query in getReviews.
type ReviewRow = {
  id: number;
  user_id: string;
  rating: number;
  body: string | null;
  public: boolean;
  created_at: string;
  author: { display_name: string | null; username: string | null } | null;
  review_likes: { user_id: string }[];
};

// ----- Media -----
// Every movie, show, book, or game that someone reviews gets a row in "media".
// We match rows to our items by type + external_id (IMDb ID for movies, slug otherwise).

// Returns the item's media id, or null if nobody has reviewed it yet.
export async function findMediaId(item: EntertainmentItem): Promise<number | null> {
  const { data, error } = await supabase
    .from("media")
    .select("id")
    .eq("media_type", item.category)
    .eq("external_id", item.slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

// Returns the item's media id, adding the item to "media" first if needed.
// Only signed-in users can add media.
export async function getOrCreateMediaId(item: EntertainmentItem): Promise<number> {
  const existing = await findMediaId(item);
  if (existing !== null) return existing;

  const { error } = await supabase.from("media").upsert(
    {
      media_type: item.category,
      title: item.title,
      description: item.description || null,
      release_year: item.year,
      creator: item.creator ?? null,
      cover_url: item.image,
      external_id: item.slug,
    },
    // If someone else added it a moment ago, keep theirs instead of failing.
    { onConflict: "media_type,external_id", ignoreDuplicates: true },
  );
  if (error) throw new Error(error.message);

  const created = await findMediaId(item);
  if (created === null) throw new Error("Could not add this title to the database.");
  return created;
}

// ----- Reviews -----

// All reviews for one item that this visitor is allowed to see: everyone's public
// reviews, plus their own private ones (the database enforces this).
export async function getReviews(mediaId: number): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      // "author:profiles!reviews_user_id_fkey" means: follow reviews.user_id to profiles,
      // and call the result "author".
      "id, user_id, rating, body, public, created_at, author:profiles!reviews_user_id_fkey(display_name, username), review_likes(user_id)",
    )
    .eq("media_id", mediaId)
    .order("created_at", { ascending: false })
    .overrideTypes<ReviewRow[], { merge: false }>();
  if (error) throw new Error(error.message);

  return data.map((row) => ({
    id: row.id,
    userId: row.user_id,
    authorName: row.author?.display_name || row.author?.username || "REWIND member",
    rating: row.rating,
    body: row.body ?? "",
    isPublic: row.public,
    createdAt: row.created_at,
    likedBy: row.review_likes.map((like) => like.user_id),
  }));
}

type ReviewInput = {
  rating: number;
  body: string;
  isPublic: boolean;
};

// Adds the signed-in user's review, or updates it if they already reviewed this item.
export async function saveReview(item: EntertainmentItem, userId: string, input: ReviewInput) {
  const mediaId = await getOrCreateMediaId(item);
  const { error } = await supabase.from("reviews").upsert(
    {
      user_id: userId,
      media_id: mediaId,
      rating: input.rating,
      body: input.body || null,
      public: input.isPublic,
    },
    { onConflict: "user_id,media_id" },
  );
  if (error) throw new Error(error.message);
}

export async function deleteReview(reviewId: number) {
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (error) throw new Error(error.message);
}

// ----- Helpful votes (review_likes) -----

export async function likeReview(reviewId: number, userId: string) {
  const { error } = await supabase
    .from("review_likes")
    .insert({ review_id: reviewId, user_id: userId });
  if (error) throw new Error(error.message);
}

export async function unlikeReview(reviewId: number, userId: string) {
  const { error } = await supabase
    .from("review_likes")
    .delete()
    .eq("review_id", reviewId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

