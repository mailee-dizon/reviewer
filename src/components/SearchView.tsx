// "use client" is needed because the search box and filter checkboxes react to typing
// and clicks. The results themselves are loaded on the server (see src/app/search/page.tsx).
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import EntertainmentCard from "@/components/EntertainmentCard";
import { ArrowIcon, CheckIcon, SearchIcon } from "@/components/Icons";
import {
  categoryInfo,
  homeCategories,
  type Category,
  type EntertainmentItem,
} from "@/data/entertainment";
import { genreFilters, matchesGenre } from "@/data/genres";

// How long to wait after the last key press before searching, in milliseconds.
const typingDelay = 400;

type SearchViewProps = {
  items: EntertainmentItem[]; // search results, or every item when not searching
  query: string; // what was searched for ("" when browsing)
};

export default function SearchView({ items, query }: SearchViewProps) {
  const router = useRouter();
  const [text, setText] = useState(query);
  const [isSearching, startSearching] = useTransition();
  // Empty lists mean "All": no media type or genre filter.
  const [types, setTypes] = useState<Category[]>([]);
  const [genres, setGenres] = useState<string[]>([]);

  // Puts the search in the address (e.g. /search?q=dune), which makes the server load
  // new results. The address can then be bookmarked or shared.
  function search(value: string) {
    const trimmed = value.trim();
    const href = trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search";
    startSearching(() => router.replace(href, { scroll: false }));
  }

  // Search a moment after the visitor stops typing, rather than on every key press.
  useEffect(() => {
    if (text.trim() === query) return;
    const timer = setTimeout(() => search(text), typingDelay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- search only depends on text
  }, [text, query]);

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
  }

  const selectedGenres = genreFilters.filter((filter) => genres.includes(filter.label));
  const shownTypes = types.length > 0 ? homeCategories.filter((type) => types.includes(type)) : homeCategories;

  // One section per media type, each holding the items that pass the genre filters.
  const sections = shownTypes
    .map((category) => ({
      category,
      items: items
        .filter((item) => item.category === category)
        .filter((item) => selectedGenres.length === 0 || selectedGenres.some((filter) => matchesGenre(item, filter))),
    }))
    .filter((section) => section.items.length > 0);
  const resultCount = sections.reduce((total, section) => total + section.items.length, 0);

  return (
    <>
      {/* Search box */}
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          search(text);
        }}
        className="mx-auto mb-20 max-w-[1060px]"
      >
        <label className="flex items-center gap-4 rounded-[20px] border border-periwinkle bg-paper px-6 py-5 shadow-[0_18px_40px_rgba(23,35,61,0.08)] transition focus-within:shadow-[0_18px_40px_rgba(119,118,169,0.22)] sm:px-7 sm:py-6">
          <span className="text-periwinkle">
            <SearchIcon size={24} />
          </span>
          <span className="sr-only">Search</span>
          <input
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Search movies, shows, books, and games"
            className="w-full bg-transparent text-lg text-navy outline-none placeholder:text-muted sm:text-xl"
          />
        </label>
      </form>

      <div className="grid gap-12 lg:grid-cols-[240px_1fr] lg:gap-[clamp(48px,6vw,104px)]">
        {/* Filters. On wide screens they stay in view and scroll on their own. */}
        <aside className="lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
          <div className="mb-8 flex items-baseline justify-between border-b border-line pb-6">
            <h2 className="text-[34px] leading-none">Filters</h2>
            <button
              type="button"
              onClick={() => {
                setTypes([]);
                setGenres([]);
              }}
              className="text-[15px] text-periwinkle transition hover:text-navy"
            >
              Reset
            </button>
          </div>

          <FilterGroup title="MEDIA TYPE">
            <Checkbox label="All" checked={types.length === 0} onChange={() => setTypes([])} />
            {homeCategories.map((category) => (
              <Checkbox
                key={category}
                label={categoryInfo[category].label}
                checked={types.includes(category)}
                onChange={() => setTypes(toggle(types, category))}
              />
            ))}
          </FilterGroup>

          <FilterGroup title="GENRE">
            {genreFilters.map((filter) => (
              <Checkbox
                key={filter.label}
                label={filter.label}
                checked={genres.includes(filter.label)}
                onChange={() => setGenres(toggle(genres, filter.label))}
              />
            ))}
          </FilterGroup>
        </aside>

        {/* Results */}
        <section aria-live="polite" className={`min-w-0 transition-opacity ${isSearching ? "opacity-50" : ""}`}>
          <div className="mb-14 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-3 text-[11px] font-semibold tracking-[0.17em] text-periwinkle">
                {query ? "SEARCH RESULTS" : "BROWSE ALL"}
              </p>
              <h2 className="text-[clamp(36px,4.5vw,56px)] leading-none tracking-tight">
                {query ? `Results for “${query}”` : "Explore something new"}
              </h2>
            </div>
            <p className="text-[15px] text-navy-soft">
              {isSearching ? "Searching…" : `${resultCount} ${resultCount === 1 ? "result" : "results"}`}
            </p>
          </div>

          {sections.length === 0 ? (
            <p className="max-w-[600px] font-serif text-xl leading-normal text-navy-soft">
              Nothing matches. Try a different search, or clear the filters.
            </p>
          ) : (
            sections.map((section) => (
              <div key={section.category} className="mb-16">
                <div className="mb-8 flex items-end justify-between gap-4 border-b border-line pb-5">
                  <h2 className="text-[clamp(28px,3vw,38px)] leading-tight">
                    {categoryInfo[section.category].label}
                  </h2>
                  <Link
                    href={categoryInfo[section.category].href}
                    className="flex items-center gap-1.5 whitespace-nowrap py-1 text-[15px] text-periwinkle transition-all hover:gap-2.5"
                  >
                    View all <ArrowIcon />
                  </Link>
                </div>
                {/* One row of cards that scrolls sideways, like the Home page. */}
                <div className="card-row flex snap-x snap-mandatory gap-[22px] overflow-x-auto px-0.5 pb-5 pt-0.5">
                  {section.items.map((item) => (
                    <div key={item.slug} className="w-[170px] flex-none snap-start sm:w-[210px]">
                      <EntertainmentCard item={item} large />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </>
  );
}

// A titled group of checkboxes. On small screens they sit side by side to save space.
function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="mb-12">
      <legend className="mb-6 text-[13px] font-semibold tracking-[0.14em] text-navy">{title}</legend>
      <div className="flex flex-wrap gap-x-6 gap-y-4 lg:flex-col lg:gap-5">{children}</div>
    </fieldset>
  );
}

// A checkbox drawn to match the design. The real checkbox is hidden but still
// works with the keyboard and screen readers.
function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-4 text-[17px]">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={`flex size-[22px] shrink-0 items-center justify-center rounded-[5px] border transition peer-focus-visible:ring-2 peer-focus-visible:ring-periwinkle ${
          checked ? "border-periwinkle bg-lavender-soft text-periwinkle" : "border-muted/60 bg-paper"
        }`}
      >
        {checked && <CheckIcon size={15} />}
      </span>
      <span className={checked ? "font-semibold text-navy" : "text-navy-soft"}>{label}</span>
    </label>
  );
}
