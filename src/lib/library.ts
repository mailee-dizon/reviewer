// The signed-in user's saved items, each in one of three lists: what they're currently
// watching (or reading, or playing), what they've finished, and what they want to try.
// Saved in the "saved_items" table in Supabase (see supabase/setup.sql, section 5).
"use client";

import { useSyncExternalStore } from "react";
import type { Category, EntertainmentItem } from "@/data/entertainment";
import { getOrCreateMediaId } from "@/lib/reviews";
import { supabase } from "@/lib/supabase";

export type SavedStatus = "current" | "finished" | "want";

// A saved item, with the details the Saved page needs to show it.
export type SavedEntry = {
  item: EntertainmentItem;
  status: SavedStatus;
  savedAt: string; // when it was saved or last moved
};

// The order the lists appear in on the Saved page.
export const savedStatuses: SavedStatus[] = ["current", "finished", "want"];

// The list headings on the Saved page, for each kind of item.
export const statusTitles: Record<Category, Record<SavedStatus, string>> = {
  movie: { current: "Currently watching", finished: "Watched", want: "Want to watch" },
  show: { current: "Currently watching", finished: "Watched", want: "Want to watch" },
  book: { current: "Currently reading", finished: "Read", want: "Want to read" },
  game: { current: "Currently playing", finished: "Played", want: "Want to play" },
};

// The shorter names on buttons and cards, e.g. "Reading" for a book.
export const statusLabels: Record<Category, Record<SavedStatus, string>> = {
  movie: { current: "Watching", finished: "Watched", want: "Want to watch" },
  show: { current: "Watching", finished: "Watched", want: "Want to watch" },
  book: { current: "Reading", finished: "Read", want: "Want to read" },
  game: { current: "Playing", finished: "Played", want: "Want to play" },
};

// ----- The shared library -----
// Every Save button on the page and the Saved page share one copy of the library,
// loaded once per signed-in user, so they all update together. It watches for sign-ins
// and sign-outs itself, so each button doesn't need to.

export type Library = {
  userId: string | null; // null when nobody is signed in
  loading: boolean;
  error: string; // "" when everything worked
  entries: Record<string, SavedEntry>; // by item slug
};

const signedOut: Library = { userId: null, loading: false, error: "", entries: {} };
// Until Supabase says who is signed in, we're "loading", so pages don't flash "sign in".
const startingUp: Library = { ...signedOut, loading: true };
let library: Library = startingUp;
const listeners = new Set<() => void>();
let isWatchingSignIn = false;

function update(changes: Partial<Library>) {
  library = { ...library, ...changes };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  watchSignIn();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Loads the library when someone signs in, and clears it when they sign out.
function watchSignIn() {
  if (isWatchingSignIn) return;
  isWatchingSignIn = true;
  // Fires once straight away with the current session, then on every change.
  supabase.auth.onAuthStateChange((_event, session) => {
    const userId = session?.user.id ?? null;
    if (!userId) {
      if (library.userId !== null || library.loading) update(signedOut);
    } else if (userId !== library.userId) {
      // Supabase asks us not to wait on other database calls inside this listener.
      setTimeout(() => loadLibrary(userId), 0);
    }
  });
}

// The shape the database sends back for the query in loadLibrary.
type SavedRow = {
  status: SavedStatus;
  saved_at: string;
  genres: string[];
  media: {
    media_type: Category;
    title: string;
    description: string | null;
    release_year: number | null;
    creator: string | null;
    cover_url: string | null;
    external_id: string;
  } | null;
};

// Loads the user's saved items, with each title's details from the "media" table.
async function loadLibrary(userId: string) {
  update({ userId, loading: true, error: "", entries: {} });
  const { data, error } = await supabase
    .from("saved_items")
    .select("status, saved_at, genres, media(media_type, title, description, release_year, creator, cover_url, external_id)")
    .eq("user_id", userId)
    .overrideTypes<SavedRow[], { merge: false }>();

  // Ignore the answer if someone else signed in while we were waiting.
  if (library.userId !== userId) return;
  if (error) return update({ loading: false, error: error.message });

  const entries: Record<string, SavedEntry> = {};
  for (const row of data) {
    if (!row.media) continue;
    const item: EntertainmentItem = {
      slug: row.media.external_id,
      title: row.media.title,
      year: row.media.release_year ?? 0,
      category: row.media.media_type,
      rating: 0, // ratings change daily, so they aren't stored; cards hide a 0 rating
      image: row.media.cover_url ?? "",
      description: row.media.description ?? "",
      creator: row.media.creator ?? undefined,
      genres: row.genres,
    };
    entries[item.slug] = { item, status: row.status, savedAt: row.saved_at };
  }
  update({ loading: false, entries });
}

// A React hook that returns the signed-in user's library, and re-draws when it changes.
export function useLibrary(): Library {
  return useSyncExternalStore(subscribe, () => library, () => startingUp);
}

// Puts an item in one of the signed-in user's lists, or removes it when status is null.
// The change shows straight away; if the database says no, the library is reloaded
// and the error is shown.
export async function setSavedStatus(item: EntertainmentItem, status: SavedStatus | null) {
  const userId = library.userId;
  if (!userId) return;

  const entries = { ...library.entries };
  if (status) {
    entries[item.slug] = { item, status, savedAt: new Date().toISOString() };
  } else {
    delete entries[item.slug];
  }
  update({ entries, error: "" });

  try {
    const mediaId = await getOrCreateMediaId(item);
    const { error } = status
      ? await supabase
          .from("saved_items")
          .upsert(
            {
              user_id: userId,
              media_id: mediaId,
              status,
              saved_at: new Date().toISOString(),
              // Kept with the saved item so the Saved page can filter by genre.
              genres: item.genres,
            },
            { onConflict: "user_id,media_id" },
          )
      : await supabase.from("saved_items").delete().eq("user_id", userId).eq("media_id", mediaId);
    if (error) throw new Error(error.message);
  } catch (error) {
    await loadLibrary(userId);
    update({ error: `Couldn't save that change: ${(error as Error).message}` });
  }
}
