// Data for the website.
// Movies are real and come from the OMDb API (see src/lib/omdb.ts).
// There is no database yet, so the sample shows, books, and games live here.
// Their titles, years, ratings, and images match our Figma prototype.

import { getFeaturedMovies, getMovie, isImdbId } from "@/lib/omdb";

// The four kinds of entertainment REWIND tracks.
export type Category = "movie" | "show" | "book" | "game";

// One entertainment item (a movie, show, book, or game).
export type EntertainmentItem = {
  slug: string; // used in the web address, e.g. /item/blue-hours (movies use their IMDb ID)
  title: string;
  year: number;
  category: Category;
  rating: number; // average rating out of 5
  image: string;
  description: string;
  genre?: string; // e.g. "Sci-Fi" (only movies have this for now)
  creator?: string; // director, author, studio, etc. (only movies have this for now)
  about?: string; // extra details, e.g. director and cast (only movies have this for now)
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

// Builds an Unsplash image link from a photo ID, so the list below stays short.
function unsplash(photoId: string): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=700&q=85`;
}

export const items: EntertainmentItem[] = [
  // ----- TV Shows -----
  {
    slug: "blue-hours",
    title: "Blue Hours",
    year: 2023,
    category: "show",
    rating: 4.9,
    image: unsplash("1677665393079-4a7a81ab25e8"),
    description:
      "Six lives intersect over six nights in a city that feels most alive just before dawn.",
  },
  {
    slug: "radio-city",
    title: "Radio City",
    year: 2022,
    category: "show",
    rating: 4.4,
    image: unsplash("1643106217254-7b0ea36ab111"),
    description:
      "A warm ensemble comedy about the idealists keeping a small late-night radio station on air.",
  },
  {
    slug: "the-quiet-case",
    title: "The Quiet Case",
    year: 2024,
    category: "show",
    rating: 4.7,
    image: unsplash("1630504082468-6ddf36acecfb"),
    description:
      "An observant archivist notices the one detail every detective in the city has overlooked.",
  },
  {
    slug: "someone-elses-summer",
    title: "Someone Else's Summer",
    year: 2021,
    category: "show",
    rating: 4.2,
    image: unsplash("1559199497-1255921114cf"),
    description:
      "A wistful story of missed chances, borrowed homes, and the summer that changed everything.",
  },

  // ----- Books -----
  {
    slug: "the-moss-library",
    title: "The Moss Library",
    year: 2024,
    category: "book",
    rating: 4.8,
    image: unsplash("1569402928543-87a35efc0606"),
    description:
      "A hidden library grows a new room for every story forgotten by the outside world.",
  },
  {
    slug: "a-field-guide-to-fog",
    title: "A Field Guide to Fog",
    year: 2023,
    category: "book",
    rating: 4.5,
    image: unsplash("1655769211458-0016edcb4508"),
    description:
      "Part mystery, part meditation: a naturalist searches a fogbound village for her vanished mentor.",
  },
  {
    slug: "where-trees-remember",
    title: "Where Trees Remember",
    year: 2022,
    category: "book",
    rating: 4.7,
    image: unsplash("1695890384429-0232035bcf42"),
    description:
      "A lyrical fable about an ancient forest that keeps the memories people can no longer bear.",
  },
  {
    slug: "the-green-hours",
    title: "The Green Hours",
    year: 2020,
    category: "book",
    rating: 4.3,
    image: unsplash("1628626131386-afa54333bc87"),
    description:
      "A rediscovered classic tracing one household through a single, transformative day.",
  },

  // ----- Video Games -----
  {
    slug: "everdell-beyond",
    title: "Everdell Beyond",
    year: 2024,
    category: "game",
    rating: 4.9,
    image: unsplash("1731937817165-1fed94fc03b2"),
    description:
      "Explore a painterly open world where every choice changes the songs people sing about you.",
  },
  {
    slug: "crown-of-mist",
    title: "Crown of Mist",
    year: 2023,
    category: "game",
    rating: 4.6,
    image: unsplash("1763198216883-7473e2c7eabb"),
    description:
      "Climb through a ruined kingdom and uncover the lost language hidden in its monuments.",
  },
  {
    slug: "stillwood",
    title: "Stillwood",
    year: 2022,
    category: "game",
    rating: 4.5,
    image: unsplash("1615021115776-b446ea7b90b7"),
    description:
      "A gentle puzzle mystery where the landscape shifts each time you look away.",
  },
  {
    slug: "river-kingdoms",
    title: "River Kingdoms",
    year: 2021,
    category: "game",
    rating: 4.4,
    image: unsplash("1711319551836-f7ca9764a898"),
    description:
      "Build, negotiate, and explore in a hand-painted world shaped by the rivers between nations.",
  },
];

// Returns every item in one category, e.g. await getItemsByCategory("book").
// Movies are loaded from OMDb, so this is async and must be awaited.
export async function getItemsByCategory(category: Category): Promise<EntertainmentItem[]> {
  if (category === "movie") {
    return getFeaturedMovies();
  }
  return items.filter((item) => item.category === category);
}

// Finds one item by its slug. Returns undefined if no item matches.
// A slug like "tt15239678" is an IMDb ID, so that movie is loaded from OMDb.
export async function getItemBySlug(slug: string): Promise<EntertainmentItem | undefined> {
  if (isImdbId(slug)) {
    return getMovie(slug);
  }
  return items.find((item) => item.slug === slug);
}
