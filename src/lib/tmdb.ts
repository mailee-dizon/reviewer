// Loads real movie and TV show information from the TMDB API (https://developer.themoviedb.org).
// This code only runs on the server, so the API key is never sent to the browser.
// Put your key in a file called ".env.local" in the project folder:
//   TMDB_API_KEY=your-key-here
// To get one, make a free account on themoviedb.org, then go to Settings → API and copy
// the "API Key" (the short one, not the long "Read Access Token").
// This product uses the TMDB API but is not endorsed or certified by TMDB.

import type { EntertainmentItem } from "@/data/entertainment";
import { shortenText } from "@/lib/text";

// TMDB calls TV shows "tv". Our addresses add "movie-" or "show-" in front of the TMDB ID,
// e.g. /item/movie-693134, because a movie and a show can share the same number.
type MediaType = "movie" | "tv";
const slugPrefixes = { movie: "movie-", tv: "show-" } as const;

// How many movies or shows appear in each Home page row, and on the Movies and Shows pages.
// TMDB sends trending titles 20 at a time ("pages"), so 40 means two requests.
const featuredCount = 8;
const allCount = 40;

// The longest description we show, in characters.
const maxDescriptionLength = 280;

// How many actors we list on the detail page.
const maxActors = 3;

// TMDB gives image paths like "/abc123.jpg"; this is where they live.
// "w500" is the image width in pixels.
const imageBase = "https://image.tmdb.org/t/p/w500";

// Shown when TMDB has no poster for a title.
const fallbackPoster =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=85";

// The parts of a TMDB movie or show we use. Movies have "title" and "release_date";
// shows have "name" and "first_air_date". Any field can be missing.
type TmdbTitle = {
  id: number;
  adult?: boolean;
  title?: string;
  name?: string;
  release_date?: string; // e.g. "2024-02-27"
  first_air_date?: string;
  overview?: string;
  poster_path?: string | null;
  vote_average?: number; // out of 10
  genre_ids?: number[]; // lists give genre numbers; see genreNames below

  // These only come with the full details of one title, not in lists.
  genres?: { name: string }[];
  runtime?: number; // movies, in minutes
  number_of_seasons?: number; // shows
  created_by?: { name: string }[]; // shows
  credits?: {
    cast: { name: string }[];
    crew: { name: string; job: string }[];
  };
};

// Asks TMDB for something, e.g. "trending/movie/week". Returns undefined if it can't be loaded.
async function askTmdb<T>(path: string, params = ""): Promise<T | undefined> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.warn("TMDB_API_KEY is not set, so no movies or shows can be loaded. See src/lib/tmdb.ts.");
    return undefined;
  }

  try {
    // Saves the answer for a day, so trending lists update daily without extra requests.
    const response = await fetch(`https://api.themoviedb.org/3/${path}?api_key=${apiKey}${params}`, {
      cache: "force-cache",
      next: { revalidate: 86400 },
    });
    if (!response.ok) {
      console.warn(`TMDB could not load ${path}: ${response.status} ${await response.text()}`);
      return undefined;
    }
    return await response.json();
  } catch (error) {
    console.warn(`Could not reach TMDB for ${path}:`, error);
    return undefined;
  }
}

// Lists only give genre numbers (e.g. 878), so we load TMDB's table of genre names
// (e.g. 878 = "Science Fiction") and look them up. Returns an empty table if it can't be loaded.
async function getGenreTable(type: MediaType): Promise<Map<number, string>> {
  const result = await askTmdb<{ genres: { id: number; name: string }[] }>(`genre/${type}/list`);
  return new Map(result?.genres.map((genre) => [genre.id, genre.name]) ?? []);
}

// Builds a sentence like "Directed by Denis Villeneuve. Starring Timothée Chalamet,
// Zendaya, Rebecca Ferguson. 166 minutes." from whatever details TMDB has for a movie.
function describeMovie(movie: TmdbTitle): string | undefined {
  const parts: string[] = [];
  const director = directorName(movie);
  if (director) parts.push(`Directed by ${director}.`);
  const actors = actorNames(movie);
  if (actors) parts.push(`Starring ${actors}.`);
  if (movie.runtime) parts.push(`${movie.runtime} minutes.`);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

// Builds a sentence like "Created by Vince Gilligan. Starring Bryan Cranston, Aaron Paul.
// 5 seasons." from whatever details TMDB has for a show.
function describeShow(show: TmdbTitle): string | undefined {
  const parts: string[] = [];
  const creators = creatorNames(show);
  if (creators) parts.push(`Created by ${creators}.`);
  const actors = actorNames(show);
  if (actors) parts.push(`Starring ${actors}.`);
  if (show.number_of_seasons) {
    parts.push(show.number_of_seasons === 1 ? "1 season." : `${show.number_of_seasons} seasons.`);
  }
  return parts.length > 0 ? parts.join(" ") : undefined;
}

function directorName(movie: TmdbTitle): string | undefined {
  return movie.credits?.crew.find((person) => person.job === "Director")?.name;
}

function creatorNames(show: TmdbTitle): string | undefined {
  if (!show.created_by || show.created_by.length === 0) return undefined;
  return show.created_by.map((person) => person.name).join(", ");
}

function actorNames(title: TmdbTitle): string | undefined {
  const cast = title.credits?.cast.slice(0, maxActors);
  if (!cast || cast.length === 0) return undefined;
  return cast.map((person) => person.name).join(", ");
}

// Turns a TMDB movie or show into the shape the rest of the site uses.
// Lists don't include credits, so those only appear on detail pages.
function toItem(title: TmdbTitle, type: MediaType, genreTable?: Map<number, string>): EntertainmentItem {
  const date = type === "movie" ? title.release_date : title.first_air_date;
  const genres =
    title.genres?.map((genre) => genre.name) ??
    (title.genre_ids ?? []).flatMap((id) => genreTable?.get(id) ?? []);
  return {
    slug: slugPrefixes[type] + title.id,
    title: (type === "movie" ? title.title : title.name) ?? "Untitled",
    // Shows use the year they started.
    year: date ? parseInt(date, 10) : 0,
    category: type === "movie" ? "movie" : "show",
    // TMDB rates out of 10; the site uses stars out of 5.
    rating: title.vote_average ? Math.round(title.vote_average * 5) / 10 : 0,
    image: title.poster_path ? imageBase + title.poster_path : fallbackPoster,
    description: title.overview ? shortenText(title.overview, maxDescriptionLength) : "",
    genre: genres[0],
    genres,
    about: type === "movie" ? describeMovie(title) : describeShow(title),
    creator: type === "movie" ? directorName(title) : creatorNames(title),
  };
}

// Fetches the movies or shows trending on TMDB this week, most popular first.
// Adult titles are left out, and so are titles with no release date, since the cards need a year.
// The trending order can shift between page requests, so a title can appear on two pages;
// we keep only its first appearance.
async function getTrending(type: MediaType, count: number): Promise<EntertainmentItem[]> {
  const pageCount = Math.ceil(count / 20);
  const [genreTable, ...pages] = await Promise.all([
    getGenreTable(type),
    ...Array.from({ length: pageCount }, (_, index) =>
      askTmdb<{ results: TmdbTitle[] }>(`trending/${type}/week`, `&page=${index + 1}`),
    ),
  ]);
  return toItems(pages.flatMap((page) => page?.results ?? []), type, genreTable).slice(0, count);
}

// Turns a TMDB list into items, without repeats, adult titles, or titles with no release date.
function toItems(titles: TmdbTitle[], type: MediaType, genreTable: Map<number, string>): EntertainmentItem[] {
  return titles
    .filter((title, index, all) => all.findIndex((other) => other.id === title.id) === index)
    .filter((title) => !title.adult && (type === "movie" ? title.release_date : title.first_air_date))
    .map((title) => toItem(title, type, genreTable));
}

// Searches TMDB for movies or shows whose title matches, best matches first.
async function search(type: MediaType, query: string): Promise<EntertainmentItem[]> {
  const [genreTable, result] = await Promise.all([
    getGenreTable(type),
    askTmdb<{ results: TmdbTitle[] }>(`search/${type}`, `&query=${encodeURIComponent(query)}`),
  ]);
  return toItems(result?.results ?? [], type, genreTable);
}

// Searches for movies by title, e.g. "dune".
export async function searchMovies(query: string): Promise<EntertainmentItem[]> {
  return search("movie", query);
}

// Searches for shows by title, e.g. "the bear".
export async function searchShows(query: string): Promise<EntertainmentItem[]> {
  return search("tv", query);
}

// Checks whether a slug is one of our movie or show addresses, e.g. "movie-693134".
export function isTmdbSlug(slug: string): boolean {
  return /^(movie|show)-\d+$/.test(slug);
}

// Fetches one movie or show, with its genres and cast, by our address slug.
// Returns undefined if it can't be loaded.
export async function getTmdbTitle(slug: string): Promise<EntertainmentItem | undefined> {
  const type: MediaType = slug.startsWith(slugPrefixes.movie) ? "movie" : "tv";
  const id = slug.slice(slugPrefixes[type].length);
  const title = await askTmdb<TmdbTitle>(`${type}/${id}`, "&append_to_response=credits");
  return title ? toItem(title, type) : undefined;
}

// The trending movies shown in the Home page row.
export async function getFeaturedMovies(): Promise<EntertainmentItem[]> {
  return getTrending("movie", featuredCount);
}

// More trending movies, for the Movies page.
export async function getAllMovies(): Promise<EntertainmentItem[]> {
  return getTrending("movie", allCount);
}

// The trending shows shown in the Home page row.
export async function getFeaturedShows(): Promise<EntertainmentItem[]> {
  return getTrending("tv", featuredCount);
}

// More trending shows, for the Shows page.
export async function getAllShows(): Promise<EntertainmentItem[]> {
  return getTrending("tv", allCount);
}
