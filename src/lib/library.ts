// The visitor's saved items, each in one of three lists: what they're currently enjoying,
// what they've finished, and what they want to try. Saved in the browser (see browserStorage.ts).
"use client";

import type { Category, EntertainmentItem } from "@/data/entertainment";
import { useStored, writeStored } from "@/lib/browserStorage";

export type SavedStatus = "current" | "finished" | "want";

// A saved item. We keep a copy of the item's details, so the Saved page can show it
// without loading it from the APIs again.
export type SavedEntry = {
  item: EntertainmentItem;
  status: SavedStatus;
  savedAt: number; // when it was saved or last moved, in milliseconds since 1970
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

// Saved entries, by item slug. (Earlier versions saved only a list of slugs under
// "rewind:library"; those can't be shown without the item details, so we start fresh.)
const libraryKey = "rewind:saved";
const emptyLibrary: Record<string, SavedEntry> = {};

// A React hook that returns every saved entry, by slug, and re-draws when it changes.
export function useLibrary(): Record<string, SavedEntry> {
  return useStored(libraryKey, emptyLibrary);
}

// Puts an item in one of the lists, or removes it when status is null.
export function setSavedStatus(
  library: Record<string, SavedEntry>,
  item: EntertainmentItem,
  status: SavedStatus | null,
) {
  const updated = { ...library };
  if (status) {
    updated[item.slug] = { item, status, savedAt: Date.now() };
  } else {
    delete updated[item.slug];
  }
  writeStored(libraryKey, updated);
}
