// Loads real book information from the Google Books API (https://developers.google.com/books).
// This code only runs on the server, so the API key is never sent to the browser.
// Put your key in a file called ".env.local" in the project folder:
//   GOOGLE_BOOKS_API_KEY=your-key-here
// To get a key, enable the "Books API" in the Google Cloud Console and create an API key.

import type { EntertainmentItem } from "@/data/entertainment";
import { shortenText } from "@/lib/text";

// Google Books has no "trending" or "top rated" list, so we pick the books ourselves by their
// Google Books ID, then sort them by rating. To find an ID, search for the book on
// books.google.com and open it: the ID is the "id=" part of the address,
// e.g. books.google.com/books?id=-Ff2DwAAQBAJ.
export const bookIds = [
  // Recent favorites
  "-Ff2DwAAQBAJ", // Project Hail Mary
  "E-OLEAAAQBAJ", // Fourth Wing
  "LML4EAAAQBAJ", // Tomorrow, and Tomorrow, and Tomorrow
  "RMjWzwEACAAJ", // James
  "7Q5jEAAAQBAJ", // Demon Copperhead
  "9UmNEAAAQBAJ", // Lessons in Chemistry
  "ZWRQEAAAQBAJ", // Babel
  "0Ua4EAAAQBAJ", // The Women

  // Recent hits
  "xIS9EAAAQBAJ", // Iron Flame
  "HaUj0AEACAAJ", // Yellowface
  "ifn3EAAAQBAJ", // Intermezzo
  "IdAmDwAAQBAJ", // The Seven Husbands of Evelyn Hugo
  "63fYDwAAQBAJ", // The Midnight Library
  "S7jrDwAAQBAJ", // Klara and the Sun
  "MUMIEAAAQBAJ", // Piranesi
  "GUMIEAAAQBAJ", // Circe
  "CGVDDwAAQBAJ", // Where the Crawdads Sing
  "x3tgDwAAQBAJ", // Normal People
  "tLdiDwAAQBAJ", // The Silent Patient
  "KmbkCgAAQBAJ", // It Ends with Us

  // Fantasy and sci-fi
  "OlCHcjX0RT4C", // The Hobbit
  "3YUrtAEACAAJ", // Harry Potter and the Sorcerer's Stone
  "B1hSG45JCX4C", // Dune
  "pb7NAgAACAAJ", // The Name of the Wind
  "LN_a49HEpmwC", // The Way of Kings
  "dlfOfxkm1PoC", // Mistborn: The Final Empire
  "E-kdBQAAQBAJ", // A Court of Thorns and Roses
  "oGGMDQAAQBAJ", // The Martian
  "Yz8Fnw0PlEQC", // The Hunger Games
  "FY_HWAcm10MC", // Ready Player One

  // Modern classics
  "opC3d3ltQ94C", // The Song of Achilles
  "sjDx3DlNveQC", // Gone Girl
  "ExbTCwAAQBAJ", // The Book Thief
  "MH48bnzN0LUC", // The Kite Runner
  "hoTU7NliHCwC", // The Road
  "qLfZf7f5_pkC", // Never Let Me Go
  "t1MDOGpyW9gC", // The Night Circus
  "2RIcAwAAQBAJ", // Station Eleven
  "H4tI9nzXkQ0C", // The Alchemist

  // All-time classics
  "0NEbHGREK7cC", // To Kill a Mockingbird
  "kotPYEqx7kMC", // 1984
  "iXn5U2IzVH0C", // The Great Gatsby
  "2O8sEAAAQBAJ", // Pride and Prejudice
  "T5IhvgAACAAJ", // The Catcher in the Rye
  "y3CyRurE7P4C", // Fahrenheit 451
  "_Up_EAAAQBAJ", // Brave New World
  "sfmp6gjZGP8C", // Beloved

  // Nonfiction
  "2ObWDgAAQBAJ", // Educated
  "V-8kEAAAQBAJ", // Becoming
  "zfuOEAAAQBAJ", // Sapiens
  "fFCjDQAAQBAJ", // Atomic Habits
];

// How many books appear in the Home page row.
const featuredCount = 8;

// Our addresses add "book-" in front of the Google Books ID, e.g. /item/book--Ff2DwAAQBAJ.
const slugPrefix = "book-";

// Shown when Google Books has no cover for a book.
const fallbackCover =
  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=700&q=85";

// The longest description we show, in characters. Some book blurbs are several paragraphs.
const maxDescriptionLength = 280;

// The parts of a Google Books response we use. Any field can be missing.
type GoogleBooksVolume = {
  id: string;
  error?: { message: string };
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string; // e.g. "2021-05-04" or just "2021"
    description?: string; // written in HTML, e.g. "<p><b>#1 BESTSELLER</b></p><p>A lone..."
    pageCount?: number;
    categories?: string[]; // e.g. ["Fiction / Science Fiction / General"]
    averageRating?: number; // already out of 5
    ratingsCount?: number;
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
    };
  };
};

// A book plus how many people rated it, so books with the same rating can be sorted
// by how many ratings they have.
type RatedBook = { item: EntertainmentItem; ratingsCount: number };

// Checks whether a slug is one of our book addresses, e.g. "book--Ff2DwAAQBAJ".
// Google Books IDs are always 12 letters, digits, dashes, or underscores.
export function isBookSlug(slug: string): boolean {
  return /^book-[\w-]{12}$/.test(slug);
}

// Picks a cover big enough for the detail page. Google's cover links use http and
// draw a "page curl" on the corner, so we switch to https and remove the curl.
function coverUrl(volume: GoogleBooksVolume): string {
  const links = volume.volumeInfo.imageLinks;
  const link = links?.medium ?? links?.small ?? links?.thumbnail ?? links?.smallThumbnail;
  if (!link) return fallbackCover;
  return link.replace("http://", "https://").replace("&edge=curl", "");
}

// Turns HTML into plain text, e.g. "<b>Tom &amp; Huck</b>" becomes "Tom & Huck".
function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Words that mean a paragraph is about the book's sales, awards, or edition rather than its story.
const promoWords =
  /bestsell|best books?\b|best fiction|winner|award|edition|now a major|copies sold|repackaged|illustrat|publisher description/i;

// Checks whether a paragraph is mostly capital letters, e.g. "NOW A MAJOR MOTION PICTURE".
function isShouting(text: string): boolean {
  const letters = text.replace(/[^a-z]/gi, "");
  const capitals = text.replace(/[^A-Z]/g, "");
  return capitals.length > letters.length / 2;
}

// Checks whether a line starts like an announcement, e.g. "ONE OF THE TEN BEST BOOKS: ...".
function startsShouting(text: string): boolean {
  return /^(?:[A-Z0-9#'’]+\s+){3}/.test(text);
}

// Checks whether a paragraph sounds like it describes the story itself.
function isStoryParagraph(text: string): boolean {
  const startsWithQuote = /^["'“‘]/.test(text);
  return text.length >= 60 && !startsWithQuote && !isShouting(text) && !promoWords.test(text);
}

// Picks the first paragraph of the description that tells the story, and shortens it to
// a sentence or two. Publishers often start with bold lines like "#1 NEW YORK TIMES
// BESTSELLER", review quotes, or award lists, so we leave those out.
function shortDescription(description: string | undefined): string {
  if (!description) return "";
  const withoutBold = description.replace(/<b>[\s\S]*?<\/b>/g, "");
  // Paragraphs are separated by <p> tags or by two line breaks in a row. Single line breaks
  // usually just wrap a sentence, but a line in capitals like "ONE OF THE TEN BEST BOOKS OF
  // THE YEAR: The New York Times" is an announcement, so we drop it.
  const paragraphs = withoutBold
    .split(/<\/?p>|<br\s*\/?>\s*(?:<[^>]+>\s*)*<br\s*\/?>/)
    .map((paragraph) =>
      paragraph
        .split(/<br\s*\/?>/)
        .map(plainText)
        .filter((line) => !isShouting(line) && !startsShouting(line))
        .join(" ")
        .trim(),
    );
  const story = paragraphs.find(isStoryParagraph) ?? paragraphs.find((text) => text.length >= 60);
  return shortenText(story ?? plainText(description), maxDescriptionLength);
}

// Builds a sentence like "Written by Andy Weir. Published by Ballantine Books. 496 pages."
// from whatever details Google Books has for the book.
function describeBook(volume: GoogleBooksVolume): string | undefined {
  const info = volume.volumeInfo;
  const parts: string[] = [];
  if (info.authors) parts.push(`Written by ${info.authors.join(", ")}.`);
  if (info.publisher) parts.push(`Published by ${info.publisher}.`);
  if (info.pageCount) parts.push(`${info.pageCount} pages.`);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

// Category parts that describe the audience or packaging rather than the kind of story.
const notGenres = [
  "General", "Women", "Family Life", "Friendship", "Cultural Heritage", "Religious",
  "Media Tie-In", "Performing Arts", "Film", "Places",
];

// Every useful part of the categories, e.g. ["Fiction / Science Fiction / Space Opera"]
// becomes ["Fiction", "Science Fiction", "Space Opera"]. Used by the Search page's filters.
function allGenres(categories: string[]): string[] {
  const parts = categories.flatMap((category) => category.split("/").map((part) => part.trim()));
  return [...new Set(parts)].filter((part) => !notGenres.includes(part));
}

// Picks a genre from categories like ["Fiction / Women", "Fiction / Historical / 20th Century"].
// The first part ("Fiction") is too broad, so we use the next useful part, e.g. "Historical".
// Fiction categories are checked first, since some novels are also filed under nonfiction.
function bookGenre(categories: string[]): string {
  const fiction = categories.filter((category) => category.toLowerCase().includes("fiction"));
  for (const category of fiction.length > 0 ? fiction : categories) {
    const specific = category.split("/").slice(1).map((part) => part.trim());
    const genre = specific.find((part) => !notGenres.includes(part));
    if (genre) return genre;
  }
  // No useful detail, so fall back to the broad part, e.g. "Fiction" (sometimes written "FICTION").
  const broad = categories[0].split("/")[0].trim();
  return isShouting(broad) ? broad[0] + broad.slice(1).toLowerCase() : broad;
}

// Fetches one book by its Google Books ID, with how many ratings it has.
// Returns undefined if it can't be loaded.
async function getRatedBook(id: string): Promise<RatedBook | undefined> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_BOOKS_API_KEY is not set, so no books can be loaded. See src/lib/googleBooks.ts.");
    return undefined;
  }

  const url = `https://www.googleapis.com/books/v1/volumes/${id}?key=${apiKey}`;

  try {
    // Saves the answer for a day, so we don't use up the daily request limit.
    const response = await fetch(url, { cache: "force-cache", next: { revalidate: 86400 } });
    const volume: GoogleBooksVolume = await response.json();

    if (volume.error) {
      console.warn(`Google Books could not load ${id}: ${volume.error.message}`);
      return undefined;
    }
    return toRatedBook(volume);
  } catch (error) {
    console.warn(`Could not reach Google Books for ${id}:`, error);
    return undefined;
  }
}

// Turns a Google Books volume into the shape the rest of the site uses.
function toRatedBook(volume: GoogleBooksVolume): RatedBook {
  const info = volume.volumeInfo;
  const item: EntertainmentItem = {
    slug: slugPrefix + volume.id,
    // Some titles include edition details, e.g. "Klara and the Sun: A GMA Book Club Pick",
    // "The Hunger Games (Hunger Games, Book One)", or "Pride and Prejudice - Jane Austen",
    // so we keep only the main title.
    title: info.title.split(/:| \(| - /)[0].trim(),
    year: info.publishedDate ? parseInt(info.publishedDate, 10) : 0,
    category: "book",
    rating: info.averageRating ?? 0,
    image: coverUrl(volume),
    description: shortDescription(info.description),
    genre: info.categories ? bookGenre(info.categories) : undefined,
    genres: info.categories ? allGenres(info.categories) : [],
    about: describeBook(volume),
    creator: info.authors ? info.authors.join(", ") : undefined,
  };
  return { item, ratingsCount: info.ratingsCount ?? 0 };
}

// Searches Google Books for books matching the words, e.g. "project hail mary",
// best matches first. Books without a cover are left out, since they are usually
// study guides or other odd editions. Returns an empty list if it can't be loaded.
export async function searchBooks(query: string): Promise<EntertainmentItem[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey) return [];

  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&printType=books&maxResults=20&key=${apiKey}`;
  try {
    const response = await fetch(url, { cache: "force-cache", next: { revalidate: 86400 } });
    const result: { items?: GoogleBooksVolume[]; error?: { message: string } } = await response.json();
    if (result.error) {
      console.warn(`Google Books could not search for "${query}": ${result.error.message}`);
      return [];
    }
    return (result.items ?? [])
      .filter((volume) => volume.volumeInfo.imageLinks)
      .map((volume) => toRatedBook(volume).item);
  } catch (error) {
    console.warn(`Could not reach Google Books to search for "${query}":`, error);
    return [];
  }
}

// Fetches one book by our address slug, e.g. "book--Ff2DwAAQBAJ".
// Returns undefined if it can't be loaded.
export async function getBook(slug: string): Promise<EntertainmentItem | undefined> {
  return (await getRatedBook(slug.slice(slugPrefix.length)))?.item;
}

// Fetches every book in our list, highest rated first. Books with the same rating are
// sorted by how many ratings they have; unrated books go last. Books that fail to load are skipped.
async function getBooksByRating(): Promise<EntertainmentItem[]> {
  const books = await Promise.all(bookIds.map(getRatedBook));
  return books
    .filter((book) => book !== undefined)
    .sort((a, b) => b.item.rating - a.item.rating || b.ratingsCount - a.ratingsCount)
    .map((book) => book.item);
}

// The highest rated books, for the Home page row.
export async function getFeaturedBooks(): Promise<EntertainmentItem[]> {
  return (await getBooksByRating()).slice(0, featuredCount);
}

// Every book, highest rated first, for the Books page.
export async function getAllBooks(): Promise<EntertainmentItem[]> {
  return getBooksByRating();
}
