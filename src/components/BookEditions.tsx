import Image from "next/image";
import { getEditions } from "@/lib/googleBooks";

// The "Editions" section on a book's page: every edition we could find of the same book
// (hardcover, ebook, translations...), loaded from Google Books. Shown only when there's
// more than one. Each edition links to its page on Google Books.

type BookEditionsProps = {
  slug: string; // the book's address slug, e.g. "book--Ff2DwAAQBAJ"
};

export default async function BookEditions({ slug }: BookEditionsProps) {
  const editions = await getEditions(slug);
  if (editions.length < 2) return null;

  return (
    <section className="mt-24">
      <p className="mb-3 text-[11px] font-semibold tracking-[0.17em] text-periwinkle">
        ALL VERSIONS OF THIS BOOK
      </p>
      <div className="mb-8 flex items-baseline gap-3 border-b border-line pb-4">
        <h2 className="text-[clamp(34px,4vw,48px)] leading-none tracking-tight">Editions</h2>
        <span className="text-sm text-muted">{editions.length}</span>
      </div>

      {/* One row that scrolls sideways, like the Home page. */}
      <div className="card-row flex snap-x snap-mandatory gap-[22px] overflow-x-auto px-0.5 pb-5 pt-0.5">
        {editions.map((edition) => {
          // Format, year, publisher, and pages, e.g. "Print · 2023 · Entangled · 640 pages".
          const facts = [
            edition.format,
            edition.year > 0 && edition.year,
            edition.publisher,
            edition.pageCount && `${edition.pageCount} pages`,
          ].filter(Boolean);
          return (
            <article key={edition.id} className="w-[150px] flex-none snap-start sm:w-[170px]">
              <div
                className={`relative mb-3 aspect-[4/5.5] w-full overflow-hidden rounded-[11px] bg-lavender shadow-[0_5px_15px_rgba(23,35,61,0.1)] ${
                  edition.isThisEdition ? "ring-2 ring-periwinkle ring-offset-2 ring-offset-cream" : ""
                }`}
              >
                <Image src={edition.image} alt={`${edition.title} cover`} fill sizes="170px" className="object-cover" />
                {edition.isThisEdition && (
                  <span className="absolute left-2 top-2 rounded-full bg-paper/90 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-navy">
                    This edition
                  </span>
                )}
              </div>
              <h3 className="mb-1 line-clamp-2 text-[15px] leading-snug" title={edition.title}>
                {edition.title}
              </h3>
              <p className="text-xs leading-relaxed text-muted">{facts.join(" · ")}</p>
              {edition.language !== "English" && (
                <p className="text-xs leading-relaxed text-muted">{edition.language}</p>
              )}
              {edition.isbn && <p className="text-xs leading-relaxed text-muted">ISBN {edition.isbn}</p>}
              {edition.link && (
                <a
                  href={edition.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs text-periwinkle underline-offset-4 hover:underline"
                >
                  View on Google Books ↗
                </a>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
