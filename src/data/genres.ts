// The genres listed in the Search page's filters.
// Each API names genres differently (TMDB says "Science Fiction", IGDB says
// "Science fiction", Google Books says "Fiction / Science Fiction / General"),
// so each filter lists the words that count as a match.

import type { EntertainmentItem } from "@/data/entertainment";

export type GenreFilter = { label: string; matches: string[] };

export const genreFilters: GenreFilter[] = [
  { label: "Action", matches: ["action", "shooter", "fighting", "hack and slash"] },
  { label: "Adventure", matches: ["adventure"] },
  { label: "Comedy", matches: ["comedy", "humor", "humorous"] },
  { label: "Drama", matches: ["drama"] },
  { label: "Fantasy", matches: ["fantasy"] },
  { label: "Horror", matches: ["horror"] },
  { label: "Mystery", matches: ["mystery", "crime", "detective"] },
  { label: "Romance", matches: ["romance", "romantic"] },
  { label: "Sci-Fi", matches: ["science fiction", "sci-fi"] },
  { label: "Thriller", matches: ["thriller", "suspense"] },
  { label: "Animation", matches: ["animation"] },
  { label: "Documentary", matches: ["documentary"] },
  { label: "Family", matches: ["family", "kids", "juvenile"] },
  { label: "History", matches: ["history", "historical", "war"] },
  { label: "Nonfiction", matches: ["biography", "memoir", "self-help", "business", "social science", "psychology"] },
];

// Checks whether an item has a genre that matches the filter.
export function matchesGenre(item: EntertainmentItem, filter: GenreFilter): boolean {
  const itemGenres = item.genres.map((genre) => genre.toLowerCase());
  return filter.matches.some((word) => itemGenres.some((genre) => genre.includes(word)));
}
