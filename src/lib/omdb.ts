// Loads real movie information from the OMDb API (https://www.omdbapi.com).
// This code only runs on the server, so the API key is never sent to the browser.
// Put your key in a file called ".env.local" in the project folder:
//   OMDB_API_KEY=your-key-here

import type { EntertainmentItem } from "@/data/entertainment";

// OMDb has no "trending" list, so we pick the movies ourselves by their IMDb ID.
// To find an ID, open the movie on imdb.com: it's the "tt..." part of the address.
// The first few are featured on the Home page; the Movies page shows all of them.
export const movieIds = [
  // Featured: recent favorites
  "tt15239678", // Dune: Part Two
  "tt15398776", // Oppenheimer
  "tt9362722", // Spider-Man: Across the Spider-Verse
  "tt6710474", // Everything Everywhere All at Once
  "tt1517268", // Barbie
  "tt5537002", // Killers of the Flower Moon
  "tt14230458", // Poor Things
  "tt13238346", // Past Lives

  // Recent hits
  "tt1745960", // Top Gun: Maverick
  "tt10366206", // John Wick: Chapter 4
  "tt1160419", // Dune
  "tt8579674", // 1917
  "tt6751668", // Parasite
  "tt7286456", // Joker
  "tt4154796", // Avengers: Endgame
  "tt5052448", // Get Out
  "tt3783958", // La La Land
  "tt1392190", // Mad Max: Fury Road
  "tt2582802", // Whiplash

  // Animated
  "tt0245429", // Spirited Away
  "tt2380307", // Coco
  "tt2096673", // Inside Out
  "tt1049413", // Up
  "tt0114709", // Toy Story
  "tt0317219", // Cars

  // Modern classics
  "tt0468569", // The Dark Knight
  "tt1375666", // Inception
  "tt0816692", // Interstellar
  "tt0482571", // The Prestige
  "tt1853728", // Django Unchained
  "tt0361748", // Inglourious Basterds
  "tt0993846", // The Wolf of Wall Street
  "tt0407887", // The Departed
  "tt0172495", // Gladiator
  "tt0120737", // The Lord of the Rings: The Fellowship of the Ring
  "tt0167260", // The Lord of the Rings: The Return of the King

  // All-time classics
  "tt0111161", // The Shawshank Redemption
  "tt0068646", // The Godfather
  "tt0110912", // Pulp Fiction
  "tt0109830", // Forrest Gump
  "tt0133093", // The Matrix
  "tt0137523", // Fight Club
  "tt0120338", // Titanic
  "tt0099685", // GoodFellas
  "tt0102926", // The Silence of the Lambs
  "tt0088763", // Back to the Future
  "tt0080684", // Star Wars: Episode V - The Empire Strikes Back
  "tt0076759", // Star Wars: Episode IV - A New Hope
];

// How many movies appear in the Home page row.
const featuredCount = 8;

// Shown when OMDb has no poster for a movie.
const fallbackPoster =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=85";

// The parts of an OMDb response we use. OMDb writes "N/A" when it has no value.
type OmdbMovie = {
  Response: "True" | "False";
  Error?: string;
  imdbID: string;
  Title: string;
  Year: string;
  Plot: string;
  Poster: string;
  Genre: string; // e.g. "Action, Adventure, Drama"
  Director: string;
  Actors: string; // e.g. "Timothée Chalamet, Zendaya, Rebecca Ferguson"
  Runtime: string; // e.g. "166 min"
  imdbRating: string;
};

// Checks whether a slug looks like an IMDb ID, e.g. "tt15239678".
export function isImdbId(slug: string): boolean {
  return /^tt\d+$/.test(slug);
}

// Builds a sentence like "Directed by Denis Villeneuve. Starring Timothée Chalamet,
// Zendaya. 166 minutes." from whatever details OMDb has for the movie.
function describeMovie(movie: OmdbMovie): string | undefined {
  const parts: string[] = [];
  if (movie.Director !== "N/A") parts.push(`Directed by ${movie.Director}.`);
  if (movie.Actors !== "N/A") parts.push(`Starring ${movie.Actors}.`);
  if (movie.Runtime !== "N/A") parts.push(`${movie.Runtime.replace("min", "minutes")}.`);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

// Fetches one movie by IMDb ID. Returns undefined if it can't be loaded.
export async function getMovie(imdbId: string): Promise<EntertainmentItem | undefined> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) {
    console.warn("OMDB_API_KEY is not set, so no movies can be loaded. See src/lib/omdb.ts.");
    return undefined;
  }

  const url = `https://www.omdbapi.com/?apikey=${apiKey}&i=${imdbId}&plot=short`;

  try {
    // Saves the answer for a day, so we don't use up the free daily request limit.
    const response = await fetch(url, { next: { revalidate: 86400 } });
    const movie: OmdbMovie = await response.json();

    if (movie.Response === "False") {
      console.warn(`OMDb could not find ${imdbId}: ${movie.Error}`);
      return undefined;
    }

    return {
      slug: movie.imdbID,
      title: movie.Title,
      year: parseInt(movie.Year, 10),
      category: "movie",
      // IMDb rates out of 10; the site uses stars out of 5.
      rating: movie.imdbRating === "N/A" ? 0 : Math.round(parseFloat(movie.imdbRating) * 5) / 10,
      image: movie.Poster === "N/A" ? fallbackPoster : movie.Poster,
      description: movie.Plot === "N/A" ? "" : movie.Plot,
      // OMDb lists several genres; we show the first one.
      genre: movie.Genre === "N/A" ? undefined : movie.Genre.split(",")[0].trim(),
      about: describeMovie(movie),
      creator: movie.Director === "N/A" ? undefined : movie.Director,
    };
  } catch (error) {
    console.warn(`Could not reach OMDb for ${imdbId}:`, error);
    return undefined;
  }
}

// Fetches a list of movies at the same time. Movies that fail to load are skipped.
async function getMovies(ids: string[]): Promise<EntertainmentItem[]> {
  const movies = await Promise.all(ids.map(getMovie));
  return movies.filter((movie) => movie !== undefined);
}

// The movies shown in the Home page row.
export async function getFeaturedMovies(): Promise<EntertainmentItem[]> {
  return getMovies(movieIds.slice(0, featuredCount));
}

// Every movie, for the Movies page.
export async function getAllMovies(): Promise<EntertainmentItem[]> {
  return getMovies(movieIds);
}

