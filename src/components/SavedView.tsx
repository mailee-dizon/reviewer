// "use client" is needed because the tabs react to clicks, and saved items are
// loaded for whoever is signed in.
"use client";

import { useState } from "react";
import ButtonLink from "@/components/ButtonLink";
import EntertainmentCard from "@/components/EntertainmentCard";
import FilterChip from "@/components/FilterChip";
import { categoryInfo, type Category } from "@/data/entertainment";
import { genreFilters, matchesGenre } from "@/data/genres";
import { savedStatuses, statusTitles, useLibrary } from "@/lib/library";

// The tabs, in the same order as the navigation bar.
const tabs: Category[] = ["book", "movie", "show", "game"];

// The Saved page: one tab per kind of item. Each tab shows that kind's three lists,
// e.g. "Currently watching", "Watched", and "Want to watch", most recently saved first.
// Genre buttons above the lists narrow them down; an empty choice means "All genres".
export default function SavedView() {
  const library = useLibrary();
  const [tab, setTab] = useState<Category>(tabs[0]);
  const [genres, setGenres] = useState<string[]>([]);

  if (library.loading) {
    return <p className="font-serif text-xl text-navy-soft">Loading your library…</p>;
  }

  if (!library.userId) {
    return (
      <div className="max-w-[600px]">
        <p className="mb-8 font-serif text-xl leading-normal text-navy-soft">
          Sign in to keep track of what you&apos;re watching, reading, and playing.
        </p>
        <ButtonLink href="/login?next=%2Fsaved">Sign in</ButtonLink>
      </div>
    );
  }

  // Newest first. The dates are in a format that sorts correctly as text.
  const entries = Object.values(library.entries).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  const allTabEntries = entries.filter((entry) => entry.item.category === tab);

  // Only offer genres that something in this tab has.
  const availableGenres = genreFilters.filter((filter) =>
    allTabEntries.some((entry) => matchesGenre(entry.item, filter)),
  );
  const selectedGenres = availableGenres.filter((filter) => genres.includes(filter.label));
  const tabEntries =
    selectedGenres.length === 0
      ? allTabEntries
      : allTabEntries.filter((entry) => selectedGenres.some((filter) => matchesGenre(entry.item, filter)));

  function toggleGenre(label: string) {
    setGenres(genres.includes(label) ? genres.filter((genre) => genre !== label) : [...genres, label]);
  }

  return (
    <>
      {library.error && (
        <p className="mb-8 rounded-xl bg-red-50 px-5 py-4 text-[15px] text-red-800">{library.error}</p>
      )}
      <div role="tablist" aria-label="Kinds of media" className="mb-12 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((category) => {
          const isActive = category === tab;
          const count = entries.filter((entry) => entry.item.category === category).length;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setTab(category);
                setGenres([]); // each tab has its own genres
              }}
              className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 pb-4 pt-2 text-[17px] transition ${
                isActive
                  ? "border-navy font-semibold text-navy"
                  : "border-transparent text-navy-soft hover:text-navy"
              }`}
            >
              {categoryInfo[category].label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  isActive ? "bg-lavender text-navy" : "bg-lavender-soft text-navy-soft"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" aria-label={categoryInfo[tab].label}>
        {availableGenres.length > 0 && (
          <div role="group" aria-label="Filter by genre" className="mb-12 flex flex-wrap gap-2.5">
            <FilterChip active={selectedGenres.length === 0} onClick={() => setGenres([])}>
              All genres
            </FilterChip>
            {availableGenres.map((filter) => (
              <FilterChip
                key={filter.label}
                active={genres.includes(filter.label)}
                onClick={() => toggleGenre(filter.label)}
              >
                {filter.label}
              </FilterChip>
            ))}
          </div>
        )}
        {savedStatuses.map((status) => {
          const listEntries = tabEntries.filter((entry) => entry.status === status);
          return (
            <section key={status} className="mb-14">
              <div className="mb-5 flex items-baseline gap-3 border-b border-line pb-3">
                <h2 className="text-[31px] leading-tight">{statusTitles[tab][status]}</h2>
                <span className="text-sm text-muted">{listEntries.length}</span>
              </div>
              {listEntries.length === 0 ? (
                <p className="pb-5 text-[15px] text-muted">
                  {selectedGenres.length > 0
                    ? "Nothing in this list matches those genres."
                    : `Nothing here yet. Use the Save button on any ${categoryInfo[tab].tag.toLowerCase()} to add it.`}
                </p>
              ) : (
                // One row of cards that scrolls sideways, like the Home page.
                <div className="card-row flex snap-x snap-mandatory gap-[22px] overflow-x-auto px-0.5 pb-5 pt-0.5">
                  {listEntries.map((entry) => (
                    <div key={entry.item.slug} className="w-[170px] flex-none snap-start sm:w-[210px]">
                      <EntertainmentCard item={entry.item} large />
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
