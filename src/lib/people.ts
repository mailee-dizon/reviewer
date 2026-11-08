// Reading people's profiles, following and unfollowing, and editing your own profile,
// in the Supabase database (see supabase/setup.sql, section 6).
// Every function throws an Error if the database says no, so the page can show a message.
"use client";

import { supabase } from "@/lib/supabase";

// A person as the pages use them.
export type Profile = {
  id: string;
  username: string | null;
  displayName: string | null;
  listsPublic: boolean; // whether other people can see their saved lists
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  lists_public: boolean;
};

const profileColumns = "id, username, display_name, lists_public";

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    listsPublic: row.lists_public,
  };
}

// The name to show for someone: their display name, or their username, e.g. "Justin".
export function nameOf(profile: Profile): string {
  return profile.displayName || profile.username || "REWIND member";
}

// Up to two initials for someone's round badge, e.g. "Justin de Guzman" becomes "JD".
export function initialsOf(profile: Profile): string {
  const words = nameOf(profile).split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

// The address of someone's profile page, e.g. "/u/jdeguzman".
// People without a username use their id instead.
export function profileHref(profile: Pick<Profile, "id" | "username">): string {
  return `/u/${encodeURIComponent(profile.username ?? profile.id)}`;
}

// ----- Profiles -----

// Finds someone by the end of their profile address: a username, or an id for people
// without one. Capitals don't matter. Returns null if nobody matches.
export async function getProfile(usernameOrId: string): Promise<Profile | null> {
  const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usernameOrId);
  const query = supabase.from("profiles").select(profileColumns);
  const { data, error } = await (isId
    ? query.eq("id", usernameOrId)
    : query.ilike("username", escapeLike(usernameOrId))
  ).maybeSingle<ProfileRow>();
  if (error) throw new Error(error.message);
  return data ? toProfile(data) : null;
}

// Finds people whose username or display name contains the text, e.g. "just".
export async function searchProfiles(text: string): Promise<Profile[]> {
  // Only letters, numbers, spaces, and underscores are kept: other characters, like commas
  // and brackets, would confuse the filter below.
  const cleaned = text.replace(/[^\p{L}\p{N} _]/gu, "").trim();
  if (!cleaned) return [];
  const pattern = `%${cleaned}%`;
  const { data, error } = await supabase
    .from("profiles")
    .select(profileColumns)
    // The username contains the text, or the display name does (capitals don't matter).
    .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
    .order("username")
    .limit(30)
    .overrideTypes<ProfileRow[], { merge: false }>();
  if (error) throw new Error(error.message);
  return data.map(toProfile);
}

// In "ilike" patterns, % and _ are wildcards, so a username like "jo_e" needs them escaped.
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (character) => `\\${character}`);
}

type ProfileChanges = {
  username: string;
  displayName: string;
  listsPublic: boolean;
};

// Usernames are 3 to 20 lowercase letters, numbers, or underscores, so they work in addresses.
export const usernamePattern = /^[a-z0-9_]{3,20}$/;

// Saves changes to the signed-in user's own profile.
export async function updateProfile(userId: string, changes: ProfileChanges) {
  const { error } = await supabase
    .from("profiles")
    .update({
      username: changes.username,
      display_name: changes.displayName || null,
      lists_public: changes.listsPublic,
    })
    .eq("id", userId);
  if (error) {
    // "23505" is the database's code for "that would make a duplicate", here a taken username.
    if (error.code === "23505") throw new Error("That username is taken. Please choose another.");
    throw new Error(error.message);
  }
}

// ----- Following -----

// How many people follow someone, and how many they follow.
export async function getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
  const [followers, following] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  if (followers.error) throw new Error(followers.error.message);
  if (following.error) throw new Error(following.error.message);
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}

// Checks whether one person follows another.
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function follow(followerId: string, followingId: string) {
  const { error } = await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
  // Following someone twice (e.g. two tabs) isn't a problem, so ignore duplicates.
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function unfollow(followerId: string, followingId: string) {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) throw new Error(error.message);
}

// The people who follow someone, newest first.
export async function getFollowers(userId: string): Promise<Profile[]> {
  // "person:profiles!follows_follower_id_fkey" means: follow follows.follower_id to profiles,
  // and call the result "person".
  const { data, error } = await supabase
    .from("follows")
    .select(`person:profiles!follows_follower_id_fkey(${profileColumns})`)
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
    .overrideTypes<{ person: ProfileRow | null }[], { merge: false }>();
  if (error) throw new Error(error.message);
  return data.flatMap((row) => (row.person ? [toProfile(row.person)] : []));
}

// The people someone follows, newest first.
export async function getFollowing(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("follows")
    .select(`person:profiles!follows_following_id_fkey(${profileColumns})`)
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .overrideTypes<{ person: ProfileRow | null }[], { merge: false }>();
  if (error) throw new Error(error.message);
  return data.flatMap((row) => (row.person ? [toProfile(row.person)] : []));
}
