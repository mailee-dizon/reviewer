// Data for the website.
// Everything is real and loaded from APIs:
//   Movies and TV shows are trending on TMDB this week (see src/lib/tmdb.ts).
//   Books are a hand-picked list from Google Books, highest rated first (see src/lib/googleBooks.ts).
//   Video games are what IGDB users are playing right now (see src/lib/igdb.ts).

import { getAllBooks, getBook, getFeaturedBooks, isBookSlug, searchBooks } from "@/lib/googleBooks";
import { getAllGames, getFeaturedGames, getGame, isGameSlug, searchGames } from "@/lib/igdb";
import {
  getAllMovies,
  getAllShows,
  getFeaturedMovies,
  getFeaturedShows,
  getTmdbTitle,
  isTmdbSlug,
  searchMovies,
  searchShows,
} from "@/lib/tmdb";

// The four kinds of entertainment REWIND tracks.
export type Category = "movie" | "show" | "book" | "game";

// One entertainment item (a movie, show, book, or game).
export type EntertainmentItem = {
  slug: string; // used in the web address, e.g. /item/movie-693134, /item/show-1396, /item/book--Ff2DwAAQBAJ, /item/game-elden-ring
  title: string;
  year: number; // 0 if unknown
  category: Category;
  rating: number; // average rating out of 5 (0 if unrated)
  image: string;
  description: string;
  genre?: string; // the main genre, shown on the detail page, e.g. "Science Fiction"
  genres: string[]; // every genre and theme we know of, used by the Search page's filters
  creator?: string; // director, author, studio, etc.
  about?: string; // extra details, e.g. director and cast
};

// Display information for each category.
// "label" is used in the navigation bar and buttons ("View all movies").
// "sectionTitle" is the heading shown on the Home page.
// "tag" is the small label on top of each card.
// "href" is the page for that category.
export const categoryInfo: Record<
  Category,
  { label: string; sectionTitle: string; tag: string; href: string }
> = {
  movie: { label: "Movies", sectionTitle: "Movies", tag: "Movie", href: "/movies" },
  show: { label: "Shows", sectionTitle: "TV Shows", tag: "Show", href: "/shows" },
  book: { label: "Books", sectionTitle: "Books", tag: "Book", href: "/books" },
  game: { label: "Games", sectionTitle: "Video Games", tag: "Game", href: "/games" },
};

// The order the categories appear on the Home page.
export const homeCategories: Category[] = ["movie", "show", "book", "game"];

// Returns every item in one category, e.g. await getItemsByCategory("book").
// Items are loaded from APIs, so this is async and must be awaited.
export async function getItemsByCategory(category: Category): Promise<EntertainmentItem[]> {
  switch (category) {
    case "movie":
      return getFeaturedMovies();
    case "show":
      return getFeaturedShows();
    case "book":
      return getFeaturedBooks();
    case "game":
      return getFeaturedGames();
  }
}

// Finds one item by its slug. Returns undefined if no item matches.
// The start of the slug says where to load it from: "movie-" and "show-" from TMDB,
// "book-" from Google Books, and "game-" from IGDB.
export async function getItemBySlug(slug: string): Promise<EntertainmentItem | undefined> {
  if (isTmdbSlug(slug)) {
    return getTmdbTitle(slug);
  }
  if (isBookSlug(slug)) {
    return getBook(slug);
  }
  if (isGameSlug(slug)) {
    return getGame(slug);
  }
  return undefined;
}

// Every item from every category's full list, for browsing on the Search page.
export async function getAllItems(): Promise<EntertainmentItem[]> {
  const lists = await Promise.all([getAllMovies(), getAllShows(), getAllBooks(), getAllGames()]);
  return lists.flat();
}

// Searches every category at once, e.g. await searchItems("dune").
export async function searchItems(query: string): Promise<EntertainmentItem[]> {
  const lists = await Promise.all([
    searchMovies(query),
    searchShows(query),
    searchBooks(query),
    searchGames(query),
  ]);
  return lists.flat();
}
