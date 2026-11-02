import type { Metadata } from "next";
import SearchView from "@/components/SearchView";
import { getAllItems, searchItems, searchItemsByCreator } from "@/data/entertainment";

export const metadata: Metadata = { title: "Search" };

type SearchPageProps = {
  // In this version of Next.js, searchParams arrive as a Promise, so we "await" them.
  searchParams: Promise<{ q?: string | string[]; by?: string | string[] }>;
};

// The Search page ("/search"). With a search in the address, e.g. /search?q=dune, it shows
// matching titles from every API; /search?q=nolan&by=creator shows what that person or
// company made. Without a search, it shows everything from the category pages to browse.
// The filters are handled in the browser by SearchView.
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, by } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const searchBy = by === "creator" ? "creator" : "title";
  const items = !query
    ? await getAllItems()
    : searchBy === "creator"
      ? await searchItemsByCreator(query)
      : await searchItems(query);

  return (
    <main className="mx-auto w-full max-w-[1680px] flex-1 px-6 pb-28 pt-16 sm:px-[clamp(24px,5vw,76px)] sm:pt-28">
      <div className="mb-12 text-center">
        <p className="mb-5 text-[11px] font-semibold tracking-[0.25em] text-periwinkle">
          FIND YOUR NEXT FAVORITE
        </p>
        <h1 className="text-[clamp(42px,6vw,78px)] leading-none tracking-[-0.03em]">
          What are you in the mood for?
        </h1>
      </div>

      <SearchView items={items} query={query} by={searchBy} />
    </main>
  );
}
