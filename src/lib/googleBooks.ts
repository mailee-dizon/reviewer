// Loads real book information from the Google Books API (https://developers.google.com/books).
// This code only runs on the server, so the API key is never sent to the browser.
// Put your key in a file called ".env.local" in the project folder:
//   GOOGLE_BOOKS_API_KEY=your-key-here
// To get a key, enable the "Books API" in the Google Cloud Console and create an API key.

import type { EntertainmentItem } from "@/data/entertainment";
import { isCloseName, nameLetters, shortenText } from "@/lib/text";

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
  saleInfo?: { isEbook?: boolean };
  volumeInfo: {
    title?: string; // a few search results have no title at all
    authors?: string[];
    publisher?: string;
    publishedDate?: string; // e.g. "2021-05-04" or just "2021"
    description?: string; // written in HTML, e.g. "<p><b>#1 BESTSELLER</b></p><p>A lone..."
    pageCount?: number;
    categories?: string[]; // e.g. ["Fiction / Science Fiction / General"]
    averageRating?: number; // already out of 5
    ratingsCount?: number;
    language?: string; // e.g. "en"
    industryIdentifiers?: { type: string; identifier: string }[]; // e.g. ISBN_13
    canonicalVolumeLink?: string; // the book's page on Google Books
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
// Search results only include small thumbnails (128 pixels wide), so for those we ask
// Google for a bigger copy of the same image ("fife" sets the size).
function coverUrl(volume: GoogleBooksVolume): string {
  const links = volume.volumeInfo.imageLinks;
  const large = links?.medium ?? links?.small;
  const thumbnail = links?.thumbnail ?? links?.smallThumbnail;
  const link = large ?? (thumbnail ? `${thumbnail}&fife=w600-h900` : undefined);
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
  const volume = await getVolume(id);
  return volume ? toRatedBook(volume) : undefined;
}

// Fetches one volume (one edition of a book) as Google sends it.
async function getVolume(id: string): Promise<GoogleBooksVolume | undefined> {
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
    return volume;
  } catch (error) {
    console.warn(`Could not reach Google Books for ${id}:`, error);
    return undefined;
  }
}

// Some titles include edition details, e.g. "Klara and the Sun: A GMA Book Club Pick",
// "The Hunger Games (Hunger Games, Book One)", or "Pride and Prejudice - Jane Austen",
// so we keep only the main title. Editions of the same book end up with the same one.
function mainTitle(title: string): string {
  return title.split(/:| \(| - /)[0].trim();
}

// Small words that stay lowercase in titles, unless they come first.
const smallWords = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of", "on", "or", "the", "to", "with"]);

// Some editions have titles in capitals, e.g. "HARRY POTTER AND THE HALF-BLOOD PRINCE".
// Those become "Harry Potter and the Half-Blood Prince"; other titles are left alone.
function readableTitle(title: string): string {
  if (!isShouting(title)) return title;
  return title
    .toLowerCase()
    .split(" ")
    .map((word, index) =>
      index > 0 && smallWords.has(word)
        ? word
        : word.replace(/(^|-)(\p{L})/gu, (_, start: string, letter: string) => start + letter.toUpperCase()),
    )
    .join(" ");
}

// Turns a Google Books volume into the shape the rest of the site uses.
function toRatedBook(volume: GoogleBooksVolume): RatedBook {
  const info = volume.volumeInfo;
  const item: EntertainmentItem = {
    slug: slugPrefix + volume.id,
    title: readableTitle(mainTitle(info.title ?? "Untitled")),
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
// best matches first.
export async function searchBooks(query: string): Promise<EntertainmentItem[]> {
  return askForBooks(query, query);
}

// Searches Google Books for books written by the author whose name matches,
// e.g. "sally rooney" or "jk rowling", best matches first.
export async function searchBooksByAuthor(query: string): Promise<EntertainmentItem[]> {
  const books = await booksByAuthor(query);
  if (books.length > 0) return books;

  // Nothing found, so the name may be misspelled, e.g. "jk rowlling". Google's regular
  // search is forgiving about spelling, so look there for an author with a close name,
  // and search again with the name spelled their way.
  const guesses = await askForBooks(query, query);
  const author = guesses
    .flatMap((book) => book.creator?.split(", ") ?? [])
    .find((name) => isCloseName(name, query));
  return author ? booksByAuthor(author) : [];
}

// Finds books whose author's name contains every word of "name".
async function booksByAuthor(name: string): Promise<EntertainmentItem[]> {
  // Initials are joined into one word ("J. K. Rowling" becomes "jk rowling"), because
  // Google's author search can't match single letters.
  const words: string[] = [];
  let previousWasInitial = false;
  for (const part of name.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)) {
    const isInitial = part.length === 1;
    if (isInitial && previousWasInitial) words[words.length - 1] += part;
    else words.push(part);
    previousWasInitial = isInitial;
  }
  // "inauthor:sally inauthor:rooney" finds books whose author's name has both words.
  const books = await askForBooks(words.map((word) => `inauthor:${word}`).join(" "), name);
  // Google also finds books where the name is only in a publisher or study-guide credit,
  // so keep the ones where it's in the author's name. Comparing just the letters lets
  // "jk rowling" match "J. K. Rowling".
  return books.filter((book) => {
    const authors = nameLetters(book.creator ?? "");
    return words.every((word) => authors.includes(word));
  });
}

// Editions that aren't really the book itself, and blank books like journals.
const notTheBook =
  /sampler|collection set|box set|boxed set|study guide|summary of|\bjournal\b|notebook|planner|coloring book|practice book|sheet music|graph paper|ledger paper|lined paper|blank book/i;

// Asks Google Books for up to 20 books matching "q" (which can use Google's search words,
// like "inauthor:"), in English. Books without a cover are left out, since they are usually
// study guides or other odd editions, and so are repeat editions of the same title.
// "label" names the search in warnings. Returns an empty list if it can't be loaded.
async function askForBooks(q: string, label: string): Promise<EntertainmentItem[]> {
  const volumes = await searchVolumes(q, label, { englishOnly: true, max: 20 });
  const books = volumes
    .filter(
      (volume) =>
        volume.volumeInfo.title &&
        volume.volumeInfo.imageLinks &&
        !notTheBook.test(volume.volumeInfo.title) &&
        // langRestrict misses some translations, so check each book's language too.
        (volume.volumeInfo.language ?? "en") === "en",
    )
    .map(toRatedBook);
  return bestEditions(books);
}

// Asks Google Books for up to "max" volumes matching "q" (20 at most), best matches first,
// as Google sends them, skipping the first "start" results. "label" names the search in
// warnings. Returns an empty list if it can't be loaded.
async function searchVolumes(
  q: string,
  label: string,
  { englishOnly, max, start = 0 }: { englishOnly: boolean; max: number; start?: number },
): Promise<GoogleBooksVolume[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey) return [];

  const language = englishOnly ? "&langRestrict=en" : "";
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&printType=books${language}&maxResults=${max}&startIndex=${start}&key=${apiKey}`;
  try {
    const response = await fetch(url, { cache: "force-cache", next: { revalidate: 86400 } });
    const result: { items?: GoogleBooksVolume[]; error?: { message: string } } =
      await response.json();
    if (result.error) {
      console.warn(`Google Books could not search for "${label}": ${result.error.message}`);
      return [];
    }
    return result.items ?? [];
  } catch (error) {
    console.warn(`Could not reach Google Books to search for "${label}":`, error);
    return [];
  }
}

// Google often has several editions of a book, and our titles leave out edition details,
// so they end up with the same title. Keeps one of each, where the first edition appeared:
// the edition in our hand-picked list if it's there (so search finds the same copy people
// saved from the Books page), otherwise the one with the most ratings.
function bestEditions(books: RatedBook[]): EntertainmentItem[] {
  const editionScore = (book: RatedBook) =>
    (bookIds.includes(book.item.slug.slice(slugPrefix.length)) ? 1_000_000 : 0) + book.ratingsCount;

  const best = new Map<string, RatedBook>();
  for (const book of books) {
    const title = book.item.title.toLowerCase();
    const current = best.get(title);
    if (!current || editionScore(book) > editionScore(current)) best.set(title, book);
  }
  // A Map keeps the order titles were first added, which is Google's best-match order.
  return [...best.values()].map((book) => book.item);
}

// ----- Editions -----

// One edition of a book, for the list on the book's page.
export type BookEdition = {
  id: string;
  title: string; // the full title, e.g. "Fourth Wing (Special Edition)"
  image: string;
  format: "Ebook" | "Print";
  year: number; // 0 if unknown
  publisher?: string;
  pageCount?: number;
  language: string; // e.g. "English"
  isbn?: string;
  link?: string; // the edition's page on Google Books
  isThisEdition: boolean; // the edition shown on this page
};

// Language names, e.g. "fr" becomes "French".
const languageNames = new Intl.DisplayNames(["en"], { type: "language" });

// Finds the other editions of a book, by our address slug: the ones Google lists with the
// same main title and author, in any language. Google has no "same book" link between
// editions, so we match them ourselves. The edition on this page comes first, then English
// editions, newest first, then other languages. Returns [] if it can't be loaded.
export async function getEditions(slug: string): Promise<BookEdition[]> {
  const id = slug.slice(slugPrefix.length);
  const current = await getVolume(id);
  const title = current?.volumeInfo.title;
  const author = current?.volumeInfo.authors?.[0];
  const surname = author?.split(" ").pop();
  if (!current || !title || !author || !surname) return [];

  // "intitle:fourth intitle:wing inauthor:yarros". Punctuation, single letters (like the "s"
  // left over from "Sorcerer's"), and small words like "the" would make Google miss editions,
  // so they're left out of the search. The title check below still compares the whole title.
  const titleWords = mainTitle(title)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !smallWords.has(word));
  const q = [...titleWords.map((word) => `intitle:${word}`), `inauthor:${surname}`].join(" ");
  // Google sends at most 20 results at a time, and editions are spread across many pages,
  // so we ask for the first three pages at once.
  const pages = await Promise.all(
    [0, 20, 40].map((start) =>
      searchVolumes(q, `editions of ${title}`, { englishOnly: false, max: 20, start }),
    ),
  );
  const found = pages.flat().filter((volume, index, all) => all.findIndex((other) => other.id === volume.id) === index);

  const sameBook = (volume: GoogleBooksVolume) =>
    volume.volumeInfo.title !== undefined &&
    titleVariants(volume.volumeInfo.title).includes(editionTitle(title)) &&
    (volume.volumeInfo.authors ?? []).some((other) => sameName(other, author)) &&
    !notTheBook.test(volume.volumeInfo.title);
  const volumes = [current, ...found.filter((volume) => volume.id !== id && sameBook(volume))];

  const editions = volumes.map((volume) => toEdition(volume, volume.id === id)).sort(editionOrder);
  // Google sometimes lists the same edition twice; an ISBN belongs to exactly one edition.
  // This page's edition is first, so it's the copy that's kept.
  return editions.filter(
    (edition, index) => !edition.isbn || editions.findIndex((other) => other.isbn === edition.isbn) === index,
  );
}

// Subtitles that describe an edition rather than a different book, e.g. "A Novel",
// "Deluxe Edition", "Reese's Book Club", or "Movie Tie-In".
const editionSubtitle = /edition|^\s*a novel\s*$|book club|pick|tie-in|anniversary|bestseller|winner/i;

// The title used to decide whether two volumes are the same book. Stricter than mainTitle:
// "Dune: House Atreides" is a different book from "Dune", but "Project Hail Mary: A Novel"
// and "Fourth Wing (svensk utgåva)" are editions of the same one.
// A leading "The", "A", or "An" is ignored, since some editions leave it out.
function editionTitle(title: string): string {
  const withoutNotes = title.replace(/\s*\([^)]*\)/g, "").split(" - ")[0];
  const [main, ...subtitle] = withoutNotes.split(":");
  const kept = subtitle.length > 0 && !editionSubtitle.test(subtitle.join(":")) ? withoutNotes : main;
  return kept
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/^(the|a|an) /, "");
}

// Every title a volume goes by. Translations often name the original in brackets or after
// a slash, e.g. "Pelukis Bisu (The Silent Patient)" or "La paciente silenciosa / The Silent
// Patient", so those count as titles too.
function titleVariants(title: string): string[] {
  const inBrackets = [...title.matchAll(/\(([^)]*)\)/g)].map((match) => match[1]);
  const aroundSlashes = title.split(" / ");
  return [title, ...inBrackets, ...aroundSlashes].map(editionTitle);
}

// Checks whether two author names are the same person. Dots and spaces don't matter, so
// "J.K. Rowling" matches "J. K. Rowling", and a middle name can be missing, so "Aldous Huxley"
// matches "Aldous Leonard Huxley". "Brian Herbert" doesn't match "Frank Herbert".
function sameName(a: string, b: string): boolean {
  if (nameLetters(a) === nameLetters(b)) return true;
  const wordsOf = (name: string) => name.toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);
  const [shorter, longer] = [wordsOf(a), wordsOf(b)].sort((x, y) => x.length - y.length);
  const sameSurname = shorter.at(-1) === longer.at(-1);
  return shorter.length >= 2 && sameSurname && shorter.every((word) => longer.includes(word));
}

function toEdition(volume: GoogleBooksVolume, isThisEdition: boolean): BookEdition {
  const info = volume.volumeInfo;
  const code = info.language ?? "en";
  return {
    id: volume.id,
    title: info.title ?? "Untitled",
    image: coverUrl(volume),
    format: volume.saleInfo?.isEbook ? "Ebook" : "Print",
    year: info.publishedDate ? parseInt(info.publishedDate, 10) : 0,
    publisher: info.publisher,
    pageCount: info.pageCount || undefined, // Google sends 0 when it doesn't know
    language: languageNames.of(code) ?? code,
    isbn: info.industryIdentifiers?.find((identifier) => identifier.type === "ISBN_13")?.identifier,
    link: info.canonicalVolumeLink,
    isThisEdition,
  };
}

// This page's edition first, then English, then other languages by name; newest first within each.
function editionOrder(a: BookEdition, b: BookEdition): number {
  if (a.isThisEdition !== b.isThisEdition) return a.isThisEdition ? -1 : 1;
  const aEnglish = a.language === "English";
  const bEnglish = b.language === "English";
  if (aEnglish !== bEnglish) return aEnglish ? -1 : 1;
  return a.language.localeCompare(b.language) || b.year - a.year;
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
