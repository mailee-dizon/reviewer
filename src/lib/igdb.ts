// Loads real video game information from the IGDB API (https://api-docs.igdb.com).
// This code only runs on the server, so the keys are never sent to the browser.
// IGDB is run by Twitch, so you sign in with a Twitch app. Put its keys in a file called
// ".env.local" in the project folder:
//   TWITCH_CLIENT_ID=your-client-id
//   TWITCH_CLIENT_SECRET=your-client-secret
// To get them, register an application at https://dev.twitch.tv/console/apps
// (any name works; use http://localhost as the OAuth Redirect URL).

import type { EntertainmentItem } from "@/data/entertainment";
import { shortenText } from "@/lib/text";

// How many games appear in the Home page row, and on the Games page.
const featuredCount = 8;
const allCount = 48;

// IGDB measures popularity in several ways. Type 3 ("Playing") counts how many IGDB users
// say they are playing a game right now. (Type 1, page visits, is mostly adult games.)
const trendingPopularityType = 3;

// IGDB's theme ID for adult games. Trending lists include some, so we leave them out.
const eroticThemeId = 42;

// Our addresses add "game-" in front of the IGDB slug, e.g. /item/game-elden-ring,
// so they never get mixed up with movie or book addresses.
const slugPrefix = "game-";

// Shown when IGDB has no cover for a game.
const fallbackCover =
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=700&q=85";

// The longest description we show, in characters. Some game summaries are several paragraphs.
const maxDescriptionLength = 280;

// The most platforms we list, so old games with dozens of re-releases stay readable.
const maxPlatforms = 4;

// The fields we ask IGDB for. Dots load details from linked records, e.g. a genre's name.
const fields = [
  "id",
  "name",
  "slug",
  "summary",
  "first_release_date", // seconds since 1970
  "total_rating", // critic and user ratings combined, out of 100
  "cover.image_id",
  "genres.name", // the kind of gameplay, e.g. "Shooter" or "Role-playing (RPG)"
  "themes.name", // the kind of story, e.g. "Horror" or "Science fiction"
  "platforms.name",
  "involved_companies.developer",
  "involved_companies.company.name",
].join(",");

// The parts of an IGDB game we use. Any field can be missing.
type IgdbGame = {
  id: number;
  name: string;
  slug: string;
  summary?: string;
  first_release_date?: number;
  total_rating?: number;
  cover?: { image_id: string };
  genres?: { name: string }[];
  themes?: { name: string }[];
  platforms?: { name: string }[];
  involved_companies?: { developer: boolean; company: { name: string } }[];
};

// Sends a question to IGDB. Questions are written in IGDB's own query language and sent as
// the request body. Returns undefined if IGDB can't be reached or the keys are missing.
async function askIgdb<T>(endpoint: string, query: string): Promise<T[] | undefined> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.warn("TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET is not set, so no games can be loaded. See src/lib/igdb.ts.");
    return undefined;
  }

  try {
    const token = await getAccessToken(clientId, clientSecret);
    if (!token) return undefined;

    // Saves the answer for a day, so we stay well under IGDB's request limits.
    const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
      method: "POST",
      headers: { "Client-ID": clientId, Authorization: `Bearer ${token}` },
      body: query,
      cache: "force-cache",
      next: { revalidate: 86400 },
    });
    if (!response.ok) {
      console.warn(`IGDB could not answer (${endpoint}): ${response.status} ${await response.text()}`);
      return undefined;
    }
    return await response.json();
  } catch (error) {
    console.warn("Could not reach IGDB:", error);
    return undefined;
  }
}

// Checks whether a slug is one of our game addresses, e.g. "game-elden-ring".
export function isGameSlug(slug: string): boolean {
  return slug.startsWith(slugPrefix);
}

// Gets a Twitch access token, which IGDB needs with every request.
// Tokens last about two months, so we save one for a week and reuse it.
async function getAccessToken(clientId: string, clientSecret: string): Promise<string | undefined> {
  const url = `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`;
  const response = await fetch(url, { method: "POST", cache: "force-cache", next: { revalidate: 604800 } });
  const result: { access_token?: string; message?: string } = await response.json();
  if (!result.access_token) {
    console.warn(`Twitch would not give an IGDB access token: ${result.message}`);
  }
  return result.access_token;
}

// Builds a sentence like "Developed by FromSoftware. Available on PC, PlayStation 5,
// Xbox Series X|S." from whatever details IGDB has for the game.
function describeGame(game: IgdbGame): string | undefined {
  const parts: string[] = [];
  const developers = developerNames(game);
  if (developers) parts.push(`Developed by ${developers}.`);
  if (game.platforms) {
    const names = game.platforms.map((platform) => platform.name);
    const shown = names.slice(0, maxPlatforms).join(", ");
    const more = names.length - maxPlatforms;
    parts.push(more > 0 ? `Available on ${shown}, and ${more} more.` : `Available on ${shown}.`);
  }
  return parts.length > 0 ? parts.join(" ") : undefined;
}

// The studios that made the game, e.g. "FromSoftware". (Publishers are left out.)
function developerNames(game: IgdbGame): string | undefined {
  const developers = game.involved_companies?.filter((company) => company.developer);
  if (!developers || developers.length === 0) return undefined;
  return developers.map((developer) => developer.company.name).join(", ");
}

// Turns an IGDB game into the shape the rest of the site uses.
function toItem(game: IgdbGame): EntertainmentItem {
  return {
    slug: slugPrefix + game.slug,
    title: game.name,
    year: game.first_release_date ? new Date(game.first_release_date * 1000).getUTCFullYear() : 0,
    category: "game",
    // IGDB rates out of 100; the site uses stars out of 5.
    rating: game.total_rating ? Math.round(game.total_rating / 2) / 10 : 0,
    // "t_cover_big_2x" is IGDB's large cover size (528 × 748).
    image: game.cover
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big_2x/${game.cover.image_id}.jpg`
      : fallbackCover,
    description: game.summary ? shortenText(game.summary, maxDescriptionLength) : "",
    // IGDB lists several genres; we show the first one.
    genre: game.genres?.[0]?.name,
    // The Search page's genre filters match on both gameplay genres and story themes.
    genres: [...(game.genres ?? []), ...(game.themes ?? [])].map((genre) => genre.name),
    about: describeGame(game),
    creator: developerNames(game),
  };
}

// Fetches one game by our address slug, e.g. "game-elden-ring".
// Returns undefined if it can't be loaded.
export async function getGame(slug: string): Promise<EntertainmentItem | undefined> {
  const igdbSlug = slug.slice(slugPrefix.length);
  const games = await askIgdb<IgdbGame>("games", `fields ${fields}; where slug = "${igdbSlug}"; limit 1;`);
  return games && games.length > 0 ? toItem(games[0]) : undefined;
}

// Fetches the games trending on IGDB right now, most popular first.
// Adult games are left out, and so are games without a release date, since the cards need a year.
async function getTrendingGames(count: number): Promise<EntertainmentItem[]> {
  // First, ask which games are most popular. This only gives their IDs.
  // We ask for extra in case some get skipped.
  const popular = await askIgdb<{ game_id: number }>(
    "popularity_primitives",
    `fields game_id; where popularity_type = ${trendingPopularityType}; sort value desc; limit ${count * 2};`,
  );
  if (!popular || popular.length === 0) return [];

  // Then load the details of those games in one request.
  const ids = popular.map((entry) => entry.game_id);
  const games = await askIgdb<IgdbGame>("games", `fields ${fields}; where id = (${ids.join(",")}) & themes != (${eroticThemeId}); limit 500;`);
  if (!games) return [];

  // IGDB returns the games in its own order, so put them back in popularity order.
  return ids
    .map((id) => games.find((game) => game.id === id))
    .filter((game) => game !== undefined && game.first_release_date !== undefined)
    .slice(0, count)
    .map((game) => toItem(game!));
}

// Searches IGDB for games whose name matches, e.g. "zelda", best matches first.
// Adult games are left out.
export async function searchGames(query: string): Promise<EntertainmentItem[]> {
  // Double quotes would end IGDB's search text early, so we remove them.
  const text = query.replace(/"/g, "");
  const games = await askIgdb<IgdbGame>(
    "games",
    `search "${text}"; fields ${fields}; where themes != (${eroticThemeId}); limit 20;`,
  );
  return (games ?? []).map(toItem);
}

// The trending games shown in the Home page row.
export async function getFeaturedGames(): Promise<EntertainmentItem[]> {
  return getTrendingGames(featuredCount);
}

// More trending games, for the Games page.
export async function getAllGames(): Promise<EntertainmentItem[]> {
  return getTrendingGames(allCount);
}
